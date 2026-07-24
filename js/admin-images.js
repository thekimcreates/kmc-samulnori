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

  const isWebP = item => /\.webp(?:$|\?)/i.test(
    item?.photoPath || item?.highlightPhotoPath || item?.photoUrl || item?.highlightPhotoUrl || ""
  );

  const safeName = value => String(value || "image")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "") || "image";

  function pathFromDownloadUrl(url) {
    try {
      const parsed = new URL(url);
      const marker = "/o/";
      const index = parsed.pathname.indexOf(marker);
      if (index === -1) return "";
      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch (_) {
      return "";
    }
  }

  async function getFreshSourceUrl(url, oldPath) {
    const possiblePath = oldPath || pathFromDownloadUrl(url);

    if (possiblePath) {
      try {
        return {
          url: await storage.ref(possiblePath).getDownloadURL(),
          path: possiblePath
        };
      } catch (error) {
        if (error?.code === "storage/object-not-found") {
          const missing = new Error("Source image no longer exists in Firebase Storage.");
          missing.code = "source-missing";
          throw missing;
        }
        console.warn("Could not refresh the Firebase download URL; trying the saved URL.", error);
      }
    }

    return { url, path: possiblePath };
  }

  async function downloadSourceBlob(url, oldPath) {
    const source = await getFreshSourceUrl(url, oldPath);
    let response;

    try {
      response = await fetch(source.url, { mode: "cors", cache: "no-store" });
    } catch (error) {
      const failed = new Error(`Source image could not be downloaded: ${error.message || "network error"}`);
      failed.code = "source-download-failed";
      throw failed;
    }

    if (!response.ok) {
      const failed = new Error(
        response.status === 404
          ? "Source image was not found (404)."
          : `Source image download failed (${response.status}).`
      );
      failed.code = response.status === 404 ? "source-missing" : "source-download-failed";
      throw failed;
    }

    return {
      blob: await response.blob(),
      resolvedPath: source.path
    };
  }

  async function migrateImage({ url, oldPath, destination, maxWidth, maxHeight }) {
    if (!url || isWebP({ photoUrl: url, photoPath: oldPath })) return null;

    const source = await downloadSourceBlob(url, oldPath);
    const original = source.blob;
    const subtype = (original.type.split("/")[1] || "jpg").replace(/[^a-z0-9]+/gi, "");
    const file = new File(
      [original],
      `${safeName(destination)}.${subtype || "jpg"}`,
      { type: original.type || "image/jpeg" }
    );

    const optimized = await window.kmcImageOptimizer.optimize(file, {
      maxWidth,
      maxHeight,
      quality: 0.82,
      maxInputBytes: 40 * 1024 * 1024
    });

    if (optimized.contentType !== "image/webp") {
      throw new Error("This browser could not create WebP. Use current Safari or Chrome.");
    }

    const path = `${destination}-${Date.now()}.webp`;
    const snapshot = await storage.ref(path).put(optimized.blob, {
      contentType: "image/webp",
      customMetadata: {
        migratedToWebP: "true",
        originalBytes: String(optimized.originalBytes),
        optimizedBytes: String(optimized.optimizedBytes)
      }
    });

    const newUrl = await snapshot.ref.getDownloadURL();
    return {
      url: newUrl,
      path,
      optimized,
      oldPath: source.resolvedPath || oldPath || ""
    };
  }

  async function removeOld(path) {
    if (!path || /\.webp$/i.test(path)) return;
    try {
      await storage.ref(path).delete();
    } catch (error) {
      if (error?.code !== "storage/object-not-found") {
        console.warn("Old image cleanup failed:", path, error);
      }
    }
  }

  async function tryMigrate(label, options) {
    try {
      return await migrateImage(options);
    } catch (error) {
      if (error?.code === "source-missing" || error?.code === "source-download-failed") {
        addLine(`${label}: skipped — ${error.message}`, true);
        return null;
      }
      throw error;
    }
  }

  async function migrateArrangements() {
    const ref = db.collection("siteContent").doc("arrangements");
    const snapshot = await ref.get();
    if (!snapshot.exists) return { converted: 0, skipped: 0 };

    const data = snapshot.data() || {};
    const arrangements = Array.isArray(data.arrangements) ? structuredClone(data.arrangements) : [];
    const instruments = Array.isArray(data.instruments) ? structuredClone(data.instruments) : [];
    let converted = 0;
    let skipped = 0;
    const oldPaths = [];

    for (const item of arrangements) {
      if (!item.photoUrl || isWebP(item)) continue;
      const label = item.name || item.id || "Arrangement";
      status.textContent = `Converting arrangement: ${label}`;
      const result = await tryMigrate(label, {
        url: item.photoUrl,
        oldPath: item.photoPath,
        destination: `arrangements/${safeName(item.id || item.name)}/cover`,
        maxWidth: 1600,
        maxHeight: 1200
      });

      if (!result) {
        skipped += 1;
        continue;
      }

      item.photoUrl = result.url;
      item.photoPath = result.path;
      converted += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      addLine(`${label}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }

    for (const item of instruments) {
      if (!item.photoUrl || isWebP(item)) continue;
      const label = item.name || item.id || "Instrument";
      status.textContent = `Converting instrument: ${label}`;
      const result = await tryMigrate(label, {
        url: item.photoUrl,
        oldPath: item.photoPath,
        destination: `instruments/${safeName(item.id || item.name)}/photo`,
        maxWidth: 900,
        maxHeight: 900
      });

      if (!result) {
        skipped += 1;
        continue;
      }

      item.photoUrl = result.url;
      item.photoPath = result.path;
      converted += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      addLine(`${label}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }

    if (converted) {
      await ref.set({
        ...data,
        arrangements,
        instruments,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await Promise.all(oldPaths.map(removeOld));
    }

    return { converted, skipped };
  }

  async function migratePerformances() {
    const snapshot = await db.collection("performances").get();
    let converted = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const item = doc.data() || {};
      if (!item.highlightPhotoUrl || isWebP(item)) continue;

      const label = item.locationName || item.date || doc.id;
      status.textContent = `Converting performance: ${label}`;
      const result = await tryMigrate(label, {
        url: item.highlightPhotoUrl,
        oldPath: item.highlightPhotoPath,
        destination: `performances/${doc.id}/highlight`,
        maxWidth: 1800,
        maxHeight: 1350
      });

      if (!result) {
        skipped += 1;
        continue;
      }

      await doc.ref.update({
        highlightPhotoUrl: result.url,
        highlightPhotoPath: result.path,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await removeOld(result.oldPath);
      converted += 1;
      addLine(`${label}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
    }

    return { converted, skipped };
  }

  button?.addEventListener("click", async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    progress.replaceChildren();

    try {
      status.textContent = "Scanning Firebase images…";
      const arrangements = await migrateArrangements();
      const performances = await migratePerformances();
      const converted = arrangements.converted + performances.converted;
      const skipped = arrangements.skipped + performances.skipped;

      if (converted || skipped) {
        status.textContent = `Finished. Converted ${converted} image${converted === 1 ? "" : "s"}` +
          (skipped ? ` and skipped ${skipped} missing or inaccessible image${skipped === 1 ? "" : "s"}.` : ".");
      } else {
        status.textContent = "Finished. Every available Firebase image is already WebP.";
      }
    } catch (error) {
      console.error(error);
      status.textContent = `Migration stopped: ${error.message || "Unknown error"}`;
      addLine("Images converted before this error remain safely updated.", true);
    } finally {
      running = false;
      button.disabled = false;
    }
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
      loading.hidden = true;
      main.hidden = false;
    } catch (error) {
      loading.textContent = `Administrator verification failed: ${error.message}`;
    }
  });
});
