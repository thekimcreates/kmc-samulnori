"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const auth = window.kmcFirebase?.auth;
    const db = window.kmcFirebase?.db;
    const storage = window.kmcFirebase?.storage;
    const optimizer = window.kmcImageOptimizer;
    const tools = window.kmcAdminTools;
    const input = document.getElementById("home-hero-upload");
    const uploadButton = document.getElementById("home-hero-upload-button");
    const list = document.getElementById("home-hero-admin-list");
    const statusElement = document.getElementById("home-hero-status");
    const progress = document.getElementById("home-hero-upload-progress");
    const progressText = document.getElementById("home-hero-upload-progress-text");

    if (!input || !uploadButton || !list || !auth || !db || !storage || !optimizer || !tools) return;

    const DEFAULT_HERO_IMAGES = Array.from({ length: 5 }, (_, index) => ({
        id: `default-${index + 1}`,
        url: `assets/hero/hero${index + 1}.webp`,
        path: "",
        order: index,
        builtIn: true
    }));

    let images = [];
    let isBusy = false;
    let dragState = null;

    const setStatus = (message, type = "") => {
        statusElement.textContent = message;
        statusElement.className = `login-status${type ? ` ${type}` : ""}`;
    };

    const normalize = value => (Array.isArray(value) ? value : [])
        .filter(item => item && item.id && item.url)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((item, order) => ({ ...item, order }));

    async function saveImages(activity = null) {
        images = normalize(images);
        await db.collection("siteContent").doc("homeSections").set({ heroImages: images }, { merge: true });
        if (activity) await tools.logActivity?.(db, auth, activity.action, "hero image", activity.id || "", activity.label || "Homepage hero");
    }

    function syncFromDom() {
        const byId = new Map(images.map(item => [item.id, item]));
        images = [...list.querySelectorAll(".home-hero-admin-card")]
            .map((card, order) => {
                const item = byId.get(card.dataset.imageId);
                return item ? { ...item, order } : null;
            })
            .filter(Boolean);
    }

    function render() {
        list.replaceChildren();
        images = normalize(images);
        if (!images.length) {
            const empty = document.createElement("p");
            empty.className = "activity-empty";
            empty.textContent = "No hero images are currently published.";
            list.appendChild(empty);
            return;
        }

        images.forEach((item, index) => {
            const card = document.createElement("article");
            card.className = "home-hero-admin-card";
            card.dataset.imageId = item.id;

            const handle = document.createElement("button");
            handle.type = "button";
            handle.className = "home-section-drag-handle home-hero-drag-handle";
            handle.setAttribute("aria-label", `Reorder hero image ${index + 1}`);
            handle.innerHTML = "<span></span><span></span><span></span>";
            handle.addEventListener("pointerdown", beginDrag);

            const image = document.createElement("img");
            image.src = /^(?:https?:|data:|blob:)/i.test(item.url) ? item.url : `../${item.url.replace(/^\.\//, "")}`;
            image.alt = `Hero image ${index + 1}`;
            image.loading = "lazy";
            image.decoding = "async";

            const copy = document.createElement("div");
            copy.className = "home-hero-admin-copy";
            const title = document.createElement("h3");
            title.textContent = `Hero Image ${index + 1}`;
            const details = document.createElement("p");
            details.textContent = item.width && item.height ? `${item.width} × ${item.height} WebP` : "Homepage carousel image";
            copy.append(title, details);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "admin-danger-button admin-small-button";
            remove.textContent = "Delete";
            remove.addEventListener("click", () => removeImage(item));

            card.append(handle, image, copy, remove);
            list.appendChild(card);
        });
    }

    function updateDragPosition(clientY) {
        if (!dragState) return;
        dragState.preview.style.transform = `translate3d(${dragState.left}px, ${clientY - dragState.offsetY}px, 0)`;

        const cards = [...list.querySelectorAll(".home-hero-admin-card:not(.is-home-hero-sort-source)")];
        const next = cards.find(card => {
            const rect = card.getBoundingClientRect();
            return clientY < rect.top + rect.height / 2;
        });
        if (next) list.insertBefore(dragState.placeholder, next);
        else list.appendChild(dragState.placeholder);

        const edge = 90;
        const speed = clientY < edge ? -Math.ceil((edge - clientY) / 7) :
            clientY > window.innerHeight - edge ? Math.ceil((clientY - (window.innerHeight - edge)) / 7) : 0;
        dragState.scrollSpeed = Math.max(-18, Math.min(18, speed));
    }

    function runAutoScroll() {
        if (!dragState) return;
        if (dragState.scrollSpeed) {
            window.scrollBy(0, dragState.scrollSpeed);
            updateDragPosition(dragState.lastClientY);
        }
        dragState.animationFrame = requestAnimationFrame(runAutoScroll);
    }

    function beginDrag(event) {
        if (isBusy || dragState || (event.pointerType === "mouse" && event.button !== 0)) return;
        const card = event.currentTarget.closest(".home-hero-admin-card");
        if (!card) return;
        event.preventDefault();

        const rect = card.getBoundingClientRect();
        const placeholder = document.createElement("div");
        placeholder.className = "home-section-sort-placeholder home-hero-sort-placeholder";
        placeholder.style.height = `${rect.height}px`;
        card.before(placeholder);

        const preview = card.cloneNode(true);
        preview.classList.add("home-section-drag-preview", "home-hero-drag-preview");
        preview.style.width = `${rect.width}px`;
        preview.style.height = `${rect.height}px`;
        document.body.appendChild(preview);

        card.classList.add("is-home-hero-sort-source");
        document.body.classList.add("home-section-sorting");
        dragState = {
            pointerId: event.pointerId,
            card,
            placeholder,
            preview,
            left: rect.left,
            offsetY: event.clientY - rect.top,
            lastClientY: event.clientY,
            scrollSpeed: 0,
            animationFrame: 0
        };
        updateDragPosition(event.clientY);
        dragState.animationFrame = requestAnimationFrame(runAutoScroll);
        document.addEventListener("pointermove", moveDrag, { capture: true, passive: false });
        document.addEventListener("pointerup", finishDrag, true);
        document.addEventListener("pointercancel", cancelDrag, true);
    }

    function moveDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        event.preventDefault();
        dragState.lastClientY = event.clientY;
        updateDragPosition(event.clientY);
    }

    async function finishDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const state = dragState;
        cleanupDrag();
        state.placeholder.replaceWith(state.card);
        state.card.classList.remove("is-home-hero-sort-source");
        syncFromDom();
        render();
        try {
            await saveImages({ action: "Reordered", label: "Homepage hero images" });
            setStatus("Hero image order saved.", "success");
        } catch (error) {
            console.error(error);
            setStatus("The hero image order could not be saved. Reload the page to restore the saved order.", "error");
        }
    }

    function cancelDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const state = dragState;
        cleanupDrag();
        state.placeholder.replaceWith(state.card);
        state.card.classList.remove("is-home-hero-sort-source");
    }

    function cleanupDrag() {
        if (!dragState) return;
        cancelAnimationFrame(dragState.animationFrame);
        dragState.preview.remove();
        document.body.classList.remove("home-section-sorting");
        document.removeEventListener("pointermove", moveDrag, true);
        document.removeEventListener("pointerup", finishDrag, true);
        document.removeEventListener("pointercancel", cancelDrag, true);
        dragState = null;
    }

    async function removeImage(item) {
        if (isBusy) return;
        const confirmed = await tools.confirmAction({
            title: "Delete hero image?",
            message: "This image will be removed from the homepage carousel. You can undo this for a few seconds.",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        const originalIndex = images.findIndex(image => image.id === item.id);
        images = images.filter(image => image.id !== item.id);
        try {
            await saveImages({ action: "Deleted", id: item.id, label: "Homepage hero image" });
            render();
            setStatus("");
            tools.showUndo("Hero image deleted.", async () => {
                images.splice(Math.min(originalIndex, images.length), 0, item);
                await saveImages({ action: "Restored", id: item.id, label: "Homepage hero image" });
                render();
                setStatus("Hero image restored.", "success");
            }, {
                duration: 8000,
                onExpire: async () => {
                    if (item.path) {
                        try { await storage.ref(item.path).delete(); }
                        catch (error) { console.warn("Deleted hero file could not be removed from Storage:", error); }
                    }
                }
            });
        } catch (error) {
            images.splice(Math.min(originalIndex, images.length), 0, item);
            render();
            console.error(error);
            setStatus("The hero image could not be deleted.", "error");
        }
    }

    uploadButton.addEventListener("click", () => {
        if (!isBusy) input.click();
    });

    input.addEventListener("change", async () => {
        const files = [...input.files];
        input.value = "";
        if (!files.length || isBusy) return;

        isBusy = true;
        progress.hidden = false;
        input.disabled = true;
        uploadButton.disabled = true;
        uploadButton.setAttribute("aria-busy", "true");
        setStatus("");
        const uploadedItems = [];

        try {
            for (let index = 0; index < files.length; index += 1) {
                const file = files[index];
                progressText.textContent = `Optimizing image ${index + 1} of ${files.length}…`;
                const result = await optimizer.optimize(file, {
                    maxWidth: 2560,
                    maxHeight: 1600,
                    quality: 0.82,
                    requireWebP: true
                });
                const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
                const path = `home/hero/${id}.webp`;
                progressText.textContent = `Uploading image ${index + 1} of ${files.length}…`;
                const snapshot = await storage.ref(path).put(result.blob, {
                    contentType: "image/webp",
                    cacheControl: "public,max-age=31536000,immutable",
                    customMetadata: {
                        originalName: file.name,
                        optimized: "true",
                        metadataStripped: "true"
                    }
                });
                const url = await snapshot.ref.getDownloadURL();
                const item = {
                    id, url, path,
                    order: images.length + uploadedItems.length,
                    width: result.width,
                    height: result.height,
                    optimizedBytes: result.optimizedBytes,
                    originalBytes: result.originalBytes,
                    contentType: "image/webp"
                };
                images.push(item);
                uploadedItems.push(item);
                render();
            }
            await saveImages({ action: "Uploaded", label: `${uploadedItems.length} homepage hero image${uploadedItems.length === 1 ? "" : "s"}` });
            setStatus(`${uploadedItems.length} hero image${uploadedItems.length === 1 ? "" : "s"} uploaded, stripped, resized, compressed, and converted to WebP.`, "success");
        } catch (error) {
            console.error(error);
            for (const item of uploadedItems) {
                images = images.filter(image => image.id !== item.id);
                if (item.path) storage.ref(item.path).delete().catch(() => {});
            }
            render();
            setStatus(error?.message || "The hero images could not be uploaded.", "error");
        } finally {
            isBusy = false;
            progress.hidden = true;
            input.disabled = false;
            uploadButton.disabled = false;
            uploadButton.removeAttribute("aria-busy");
        }
    });

    auth.onAuthStateChanged(async user => {
        if (!user) return;
        try {
            const snapshot = await db.collection("siteContent").doc("homeSections").get();
            images = normalize(snapshot.data()?.heroImages);
            if (!images.length) images = normalize(DEFAULT_HERO_IMAGES);
            render();
        } catch (error) {
            console.error(error);
            setStatus("Hero images could not be loaded.", "error");
        }
    });
});
