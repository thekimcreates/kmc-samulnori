"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const { auth, db, storage } = window.kmcFirebase || {};
  const main = document.getElementById("image-migration-main");
  const loading = document.getElementById("image-migration-loading");
  const email = document.getElementById("admin-user-email");
  const logout = document.getElementById("admin-logout");
  const button = document.getElementById("start-image-migration");
  const status = document.getElementById("image-migration-status");
  const progress = document.getElementById("image-migration-progress");
  let running = false;

  const addLine = (text, isError = false) => {
    const item = document.createElement("p");
    item.className = isError ? "activity-empty" : "activity-item";
    item.textContent = text;
    progress.prepend(item);
  };

  const isWebP = item => /\.webp(?:$|\?)/i.test(item?.photoPath || item?.highlightPhotoPath || item?.photoUrl || item?.highlightPhotoUrl || "");
  const safeName = value => String(value || "image").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "image";

  async function migrateImage({ url, oldPath, destination, maxWidth, maxHeight }) {
    if (!url || isWebP({ photoUrl: url, photoPath: oldPath })) return null;
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const original = await response.blob();
    const file = new File([original], `${safeName(destination)}.${(original.type.split("/")[1] || "jpg")}`, { type: original.type || "image/jpeg" });
    const optimized = await window.kmcImageOptimizer.optimize(file, { maxWidth, maxHeight, quality: 0.82, maxInputBytes: 40 * 1024 * 1024 });
    if (optimized.contentType !== "image/webp") throw new Error("This browser could not create WebP. Use current Safari or Chrome.");
    const path = `${destination}-${Date.now()}.webp`;
    const snapshot = await storage.ref(path).put(optimized.blob, { contentType: "image/webp", customMetadata: { migratedToWebP: "true", originalBytes: String(optimized.originalBytes), optimizedBytes: String(optimized.optimizedBytes) } });
    const newUrl = await snapshot.ref.getDownloadURL();
    return { url: newUrl, path, optimized, oldPath };
  }

  async function removeOld(path) {
    if (!path || /\.webp$/i.test(path)) return;
    try { await storage.ref(path).delete(); } catch (error) {
      if (error?.code !== "storage/object-not-found") console.warn("Old image cleanup failed:", path, error);
    }
  }

  async function migrateArrangements() {
    const ref = db.collection("siteContent").doc("arrangements");
    const snapshot = await ref.get();
    if (!snapshot.exists) return 0;
    const data = snapshot.data() || {};
    const arrangements = Array.isArray(data.arrangements) ? structuredClone(data.arrangements) : [];
    const instruments = Array.isArray(data.instruments) ? structuredClone(data.instruments) : [];
    let changed = 0;
    const oldPaths = [];

    for (const item of arrangements) {
      if (!item.photoUrl || isWebP(item)) continue;
      status.textContent = `Converting arrangement: ${item.name || item.id}`;
      const result = await migrateImage({ url: item.photoUrl, oldPath: item.photoPath, destination: `arrangements/${safeName(item.id || item.name)}/cover`, maxWidth: 1600, maxHeight: 1200 });
      if (!result) continue;
      item.photoUrl = result.url; item.photoPath = result.path; changed += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      addLine(`${item.name || "Arrangement"}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }

    for (const item of instruments) {
      if (!item.photoUrl || isWebP(item)) continue;
      status.textContent = `Converting instrument: ${item.name || item.id}`;
      const result = await migrateImage({ url: item.photoUrl, oldPath: item.photoPath, destination: `instruments/${safeName(item.id || item.name)}/photo`, maxWidth: 900, maxHeight: 900 });
      if (!result) continue;
      item.photoUrl = result.url; item.photoPath = result.path; changed += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      addLine(`${item.name || "Instrument"}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }

    if (changed) {
      await ref.set({ ...data, arrangements, instruments, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await Promise.all(oldPaths.map(removeOld));
    }
    return changed;
  }

  async function migratePerformances() {
    const snapshot = await db.collection("performances").get();
    let changed = 0;
    for (const doc of snapshot.docs) {
      const item = doc.data() || {};
      if (!item.highlightPhotoUrl || isWebP(item)) continue;
      status.textContent = `Converting performance: ${item.locationName || item.date || doc.id}`;
      const result = await migrateImage({ url: item.highlightPhotoUrl, oldPath: item.highlightPhotoPath, destination: `performances/${doc.id}/highlight`, maxWidth: 1800, maxHeight: 1350 });
      if (!result) continue;
      await doc.ref.update({ highlightPhotoUrl: result.url, highlightPhotoPath: result.path, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      await removeOld(result.oldPath);
      changed += 1;
      addLine(`${item.locationName || "Performance"}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }
    return changed;
  }

  button?.addEventListener("click", async () => {
    if (running) return;
    running = true; button.disabled = true; progress.replaceChildren();
    try {
      status.textContent = "Scanning Firebase images…";
      const arrangementCount = await migrateArrangements();
      const performanceCount = await migratePerformances();
      const total = arrangementCount + performanceCount;
      status.textContent = total ? `Finished. Converted ${total} image${total === 1 ? "" : "s"} to WebP.` : "Finished. Every Firebase image is already WebP.";
    } catch (error) {
      console.error(error);
      status.textContent = `Migration stopped: ${error.message || "Unknown error"}`;
      addLine("No database record is changed until its replacement image uploads successfully.", true);
    } finally { running = false; button.disabled = false; }
  });

  logout?.addEventListener("click", () => auth.signOut().then(() => location.replace("login.html")));
  if (!auth || !db || !storage || !window.kmcImageOptimizer) {
    loading.textContent = "Firebase or image optimization failed to load.";
    return;
  }
  auth.onAuthStateChanged(async user => {
    if (!user) return location.replace("login.html");
    try {
      const admin = await db.collection("admins").doc(user.uid).get();
      if (!admin.exists || admin.data()?.active !== true) return location.replace("login.html");
      email.textContent = user.email || "Administrator";
      loading.hidden = true; main.hidden = false;
    } catch (error) { loading.textContent = `Administrator verification failed: ${error.message}`; }
  });
});
