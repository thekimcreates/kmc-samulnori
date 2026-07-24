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

  const safeName = value => String(value || "image")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "") || "image";

  const isHttpUrl = value => /^https?:\/\//i.test(String(value || ""));
  const isFirebaseUrl = value => /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i.test(String(value || ""));
  const isLocalAsset = value => {
    const text = String(value || "");
    return Boolean(text) && !isHttpUrl(text) && !/^gs:\/\//i.test(text) && !/^data:/i.test(text) && !/^blob:/i.test(text);
  };

  const isWebP = item => /\.webp(?:$|[?#])/i.test(
    item?.photoUrl || item?.highlightPhotoUrl || item?.photoPath || item?.highlightPhotoPath || ""
  );

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

  function isStoragePath(path) {
    const text = String(path || "").replace(/^\/+/, "");
    return Boolean(text) &&
      !isHttpUrl(text) &&
      !text.startsWith("assets/") &&
      !text.startsWith("../assets/") &&
      !text.startsWith("./assets/");
  }

  function siteRootUrl() {
    return new URL("../", window.location.href);
  }

  function absoluteSiteAsset(path) {
    const clean = String(path || "")
      .replace(/^https?:\/\/[^/]+\//i, "")
      .replace(/^\.\.\//, "")
      .replace(/^\.\//, "")
      .replace(/^\//, "");
    return new URL(clean, siteRootUrl()).href;
  }

  function slugFromName(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "") || "image";
  }

  const arrangementAssetMap = {
    samulnori: "assets/arrangements/samulnori.webp",
    nongak: "assets/arrangements/nongak.webp",
    ogomu: "assets/arrangements/ogomu.webp",
    nanta: "assets/arrangements/nanta.webp",
    sogodance: "assets/arrangements/sogo.webp",
    sogo: "assets/arrangements/sogo.webp"
  };

  const instrumentAssetMap = {
    kkwaenggwari: "assets/instruments/kkwaenggwari.webp",
    jing: "assets/instruments/jing.webp",
    janggu: "assets/instruments/janggu.webp",
    buk: "assets/instruments/buk.webp",
    sogo: "assets/instruments/sogo.webp",
    fivebuk: "assets/instruments/fivebuk.webp",
    obuk: "assets/instruments/fivebuk.webp",
    sangmo: "assets/instruments/sangmo.webp"
  };

  async function urlExists(url) {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (response.ok) return true;
      if (response.status !== 405) return false;
    } catch (_) {
      // Some hosts do not support HEAD. Try a normal request below.
    }

    try {
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      return response.ok;
    } catch (_) {
      return false;
    }
  }

  async function localWebPReplacement(item, kind) {
    const current = String(item.photoUrl || item.highlightPhotoUrl || "");
    const keyCandidates = [item.id, item.name, item.nameEnglish, item.title]
      .map(slugFromName)
      .filter(Boolean);

    let candidate = "";
    if (isLocalAsset(current)) {
      const normalized = current
        .replace(/^\.\.\//, "")
        .replace(/^\.\//, "")
        .replace(/^\//, "");
      if (/\.(?:jpe?g|png)(?:$|[?#])/i.test(normalized)) {
        candidate = normalized.replace(/\.(?:jpe?g|png)(?=$|[?#])/i, ".webp");
      } else if (/\.webp(?:$|[?#])/i.test(normalized)) {
        candidate = normalized;
      }
    }

    const map = kind === "arrangement" ? arrangementAssetMap : instrumentAssetMap;
    if (!candidate) {
      for (const key of keyCandidates) {
        if (map[key]) {
          candidate = map[key];
          break;
        }
      }
    }

    if (!candidate) return null;
    const url = absoluteSiteAsset(candidate);
    return (await urlExists(url)) ? { url, path: "", remapped: true } : null;
  }

  function xhrBlob(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "blob";
      xhr.timeout = 45000;
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
          resolve(xhr.response);
          return;
        }
        const error = new Error(xhr.status === 404
          ? "Source image was not found (404)."
          : `Source image download failed (${xhr.status || "unknown status"}).`);
        error.code = xhr.status === 404 ? "source-missing" : "source-download-failed";
        reject(error);
      };
      xhr.onerror = () => {
        const error = new Error("Source image could not be downloaded by this browser.");
        error.code = "source-download-failed";
        reject(error);
      };
      xhr.ontimeout = () => {
        const error = new Error("Source image download timed out.");
        error.code = "source-download-failed";
        reject(error);
      };
      xhr.send();
    });
  }

  async function downloadSourceBlob(url, oldPath) {
    let resolvedPath = isStoragePath(oldPath) ? oldPath : "";
    if (!resolvedPath && isFirebaseUrl(url)) resolvedPath = pathFromDownloadUrl(url);

    let downloadUrl = url;
    if (resolvedPath) {
      try {
        downloadUrl = await storage.ref(resolvedPath).getDownloadURL();
      } catch (error) {
        if (error?.code === "storage/object-not-found") {
          const missing = new Error("Source image no longer exists in Firebase Storage.");
          missing.code = "source-missing";
          throw missing;
        }
        console.warn("Could not refresh Storage URL; trying the saved URL.", error);
      }
    }

    try {
      return { blob: await xhrBlob(downloadUrl), resolvedPath };
    } catch (xhrError) {
      try {
        const response = await fetch(downloadUrl, { cache: "no-store", credentials: "omit" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { blob: await response.blob(), resolvedPath };
      } catch (_) {
        throw xhrError;
      }
    }
  }

  async function migrateImage({ item, kind, url, oldPath, destination, maxWidth, maxHeight }) {
    if (!url || isWebP({ photoUrl: url, photoPath: oldPath })) return null;

    const localReplacement = await localWebPReplacement(item, kind);
    if (localReplacement) return localReplacement;

    const source = await downloadSourceBlob(url, oldPath);
    const original = source.blob;
    const subtype = (original.type.split("/")[1] || "jpg").replace(/[^a-z0-9]+/gi, "");
    const file = new File([original], `${safeName(destination)}.${subtype || "jpg"}`, {
      type: original.type || "image/jpeg"
    });

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

    return {
      url: await snapshot.ref.getDownloadURL(),
      path,
      optimized,
      oldPath: source.resolvedPath || "",
      remapped: false
    };
  }

  async function removeOld(path) {
    if (!isStoragePath(path) || /\.webp$/i.test(path)) return;
    try {
      await storage.ref(path).delete();
    } catch (error) {
      if (error?.code !== "storage/object-not-found") console.warn("Old image cleanup failed:", path, error);
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

  function describeResult(label, result) {
    if (result.remapped) {
      addLine(`${label}: linked to the converted local WebP asset.`);
    } else {
      addLine(`${label}: ${window.kmcImageOptimizer.summary(result.optimized)}`);
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
        item,
        kind: "arrangement",
        url: item.photoUrl,
        oldPath: item.photoPath,
        destination: `arrangements/${safeName(item.id || item.name)}/cover`,
        maxWidth: 1600,
        maxHeight: 1200
      });
      if (!result) { skipped += 1; continue; }
      item.photoUrl = result.url;
      item.photoPath = result.path;
      converted += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      describeResult(label, result);
    }

    for (const item of instruments) {
      if (!item.photoUrl || isWebP(item)) continue;
      const label = item.name || item.id || "Instrument";
      status.textContent = `Converting instrument: ${label}`;
      const result = await tryMigrate(label, {
        item,
        kind: "instrument",
        url: item.photoUrl,
        oldPath: item.photoPath,
        destination: `instruments/${safeName(item.id || item.name)}/photo`,
        maxWidth: 900,
        maxHeight: 900
      });
      if (!result) { skipped += 1; continue; }
      item.photoUrl = result.url;
      item.photoPath = result.path;
      converted += 1;
      if (result.oldPath) oldPaths.push(result.oldPath);
      describeResult(label, result);
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
        item,
        kind: "performance",
        url: item.highlightPhotoUrl,
        oldPath: item.highlightPhotoPath,
        destination: `performances/${doc.id}/highlight`,
        maxWidth: 1800,
        maxHeight: 1350
      });
      if (!result) { skipped += 1; continue; }

      await doc.ref.update({
        highlightPhotoUrl: result.url,
        highlightPhotoPath: result.path,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await removeOld(result.oldPath);
      converted += 1;
      describeResult(label, result);
    }

    return { converted, skipped };
  }

  button?.addEventListener("click", async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    progress.replaceChildren();

    try {
      status.textContent = "Scanning Firebase image records…";
      const arrangements = await migrateArrangements();
      const performances = await migratePerformances();
      const converted = arrangements.converted + performances.converted;
      const skipped = arrangements.skipped + performances.skipped;

      if (converted || skipped) {
        status.textContent = `Finished. Updated ${converted} image record${converted === 1 ? "" : "s"}` +
          (skipped ? ` and skipped ${skipped} inaccessible image${skipped === 1 ? "" : "s"}.` : ".");
      } else {
        status.textContent = "Finished. Every available image record already points to WebP.";
      }
    } catch (error) {
      console.error(error);
      status.textContent = `Migration stopped: ${error.message || "Unknown error"}`;
      addLine("Images updated before this error remain safely saved.", true);
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
