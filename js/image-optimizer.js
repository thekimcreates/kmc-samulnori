"use strict";

(() => {
  const DEFAULTS = Object.freeze({
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
    maxInputBytes: 25 * 1024 * 1024
  });

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    const units = ["KB", "MB", "GB"];
    let size = value / 1024;
    let unit = units[0];
    for (let index = 1; index < units.length && size >= 1024; index += 1) {
      size /= 1024;
      unit = units[index];
    }
    return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${unit}`;
  }

  function safeBaseName(name) {
    return String(name || "image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve({ image, url });
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("This image could not be read. Try a JPEG, PNG, or WebP file."));
      };
      image.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not optimize this image."));
      }, type, quality);
    });
  }

  async function optimize(file, options = {}) {
    if (!(file instanceof Blob)) throw new Error("Select an image file.");
    if (!String(file.type || "").startsWith("image/")) throw new Error("Select an image file.");

    const settings = { ...DEFAULTS, ...options };
    if (file.size > settings.maxInputBytes) {
      throw new Error(`The original image must be ${formatBytes(settings.maxInputBytes)} or smaller.`);
    }

    const { image, url } = await loadImage(file);
    try {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) throw new Error("The image dimensions could not be detected.");

      const scale = Math.min(1, settings.maxWidth / sourceWidth, settings.maxHeight / sourceHeight);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Image optimization is not supported by this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);

      let blob;
      let extension = "webp";
      try {
        blob = await canvasToBlob(canvas, "image/webp", settings.quality);
        if (blob.type !== "image/webp") throw new Error("WebP unavailable");
      } catch (_) {
        blob = await canvasToBlob(canvas, "image/jpeg", settings.quality);
        extension = "jpg";
      }

      const reduction = file.size > 0 ? Math.max(0, Math.round((1 - blob.size / file.size) * 100)) : 0;
      return {
        blob,
        fileName: `${safeBaseName(file.name)}-${width}x${height}.${extension}`,
        contentType: blob.type || (extension === "webp" ? "image/webp" : "image/jpeg"),
        originalBytes: file.size,
        optimizedBytes: blob.size,
        sourceWidth,
        sourceHeight,
        width,
        height,
        reduction
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function summary(result) {
    if (!result) return "";
    return `Optimized ${formatBytes(result.originalBytes)} → ${formatBytes(result.optimizedBytes)} (${result.reduction}% smaller, ${result.width}×${result.height}).`;
  }

  window.kmcImageOptimizer = Object.freeze({ optimize, formatBytes, summary });
})();
