"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const auth = window.kmcFirebase?.auth;
    const db = window.kmcFirebase?.db;
    const storage = window.kmcFirebase?.storage;
    const optimizer = window.kmcImageOptimizer;
    const tools = window.kmcAdminTools;
    const input = document.getElementById("home-hero-upload");
    const list = document.getElementById("home-hero-admin-list");
    const statusElement = document.getElementById("home-hero-status");
    const progress = document.getElementById("home-hero-upload-progress");
    const progressText = document.getElementById("home-hero-upload-progress-text");

    if (!input || !list || !auth || !db || !storage || !optimizer || !tools) return;

    const DEFAULT_HERO_IMAGES = Array.from({ length: 5 }, (_, index) => ({
        id: `default-${index + 1}`,
        url: `assets/hero/hero${index + 1}.webp`,
        path: "",
        order: index,
        builtIn: true
    }));

    let images = [];
    let currentUser = null;
    let isBusy = false;

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
            .map((card, order) => ({ ...byId.get(card.dataset.imageId), order }))
            .filter(Boolean);
    }

    function render() {
        list.replaceChildren();
        images = normalize(images);
        if (!images.length) {
            const empty = document.createElement("p");
            empty.className = "activity-empty";
            empty.textContent = "No custom hero images yet. The five built-in hero images remain visible until the first upload.";
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
            details.textContent = item.width && item.height
                ? `${item.width} × ${item.height} ${(item.format || "optimized").toUpperCase()}`
                : "Homepage carousel image";
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

    function beginDrag(event) {
        if (isBusy || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.preventDefault();
        const card = event.currentTarget.closest(".home-hero-admin-card");
        if (!card) return;
        const pointerId = event.pointerId;
        const rect = card.getBoundingClientRect();
        const placeholder = document.createElement("div");
        placeholder.className = "home-section-sort-placeholder";
        placeholder.style.height = `${rect.height}px`;
        card.before(placeholder);
        card.classList.add("is-home-hero-sort-source");
        document.body.classList.add("home-section-sorting");
        let finished = false;

        const move = moveEvent => {
            if (moveEvent.pointerId !== pointerId) return;
            moveEvent.preventDefault();
            const candidates = [...list.querySelectorAll(".home-hero-admin-card:not(.is-home-hero-sort-source)")];
            const next = candidates.find(candidate => {
                const candidateRect = candidate.getBoundingClientRect();
                return moveEvent.clientY < candidateRect.top + candidateRect.height / 2;
            });
            if (next) list.insertBefore(placeholder, next);
            else list.appendChild(placeholder);
        };

        const finish = async finishEvent => {
            if (finished || (finishEvent?.pointerId != null && finishEvent.pointerId !== pointerId)) return;
            finished = true;
            document.removeEventListener("pointermove", move, true);
            document.removeEventListener("pointerup", finish, true);
            document.removeEventListener("pointercancel", finish, true);
            placeholder.replaceWith(card);
            card.classList.remove("is-home-hero-sort-source");
            document.body.classList.remove("home-section-sorting");
            syncFromDom();
            try {
                await saveImages({ action: "Reordered", label: "Homepage hero images" });
                render();
                setStatus("Hero image order saved.", "success");
            } catch (error) {
                console.error(error);
                setStatus("The hero image order could not be saved.", "error");
            }
        };

        document.addEventListener("pointermove", move, { capture: true, passive: false });
        document.addEventListener("pointerup", finish, true);
        document.addEventListener("pointercancel", finish, true);
    }

    async function removeImage(item) {
        const confirmed = await tools.confirmAction({
            title: "Delete hero image?",
            message: "This image will be removed from the homepage carousel.",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        const previous = [...images];
        images = images.filter(image => image.id !== item.id);
        try {
            await saveImages({ action: "Deleted", id: item.id, label: "Homepage hero image" });
            render();
            setStatus("Hero image deleted.", "success");
            if (item.path) storage.ref(item.path).delete().catch(error => console.warn("Old hero file could not be removed:", error));
        } catch (error) {
            images = previous;
            render();
            console.error(error);
            setStatus("The hero image could not be deleted.", "error");
        }
    }

    input.addEventListener("change", async () => {
        const files = [...input.files];
        input.value = "";
        if (!files.length || isBusy) return;
        isBusy = true;
        progress.hidden = false;
        input.disabled = true;
        setStatus("");
        let uploaded = 0;

        try {
            for (let index = 0; index < files.length; index += 1) {
                const file = files[index];
                progressText.textContent = `Optimizing image ${index + 1} of ${files.length}…`;
                const result = await optimizer.optimize(file, { maxWidth: 1920, maxHeight: 1440, quality: 0.82 });
                const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
                const extension = result.extension === "jpg" ? "jpg" : "webp";
                const path = `home/hero/${id}.${extension}`;
                progressText.textContent = `Uploading image ${index + 1} of ${files.length}…`;
                const snapshot = await storage.ref(path).put(result.blob, {
                    contentType: result.contentType,
                    customMetadata: { originalName: file.name, optimized: "true" }
                });
                const url = await snapshot.ref.getDownloadURL();
                images.push({
                    id,
                    url,
                    path,
                    order: images.length,
                    width: result.width,
                    height: result.height,
                    format: result.extension,
                    contentType: result.contentType,
                    optimizedBytes: result.optimizedBytes
                });
                uploaded += 1;
            }
            await saveImages({ action: "Uploaded", label: `${uploaded} homepage hero image${uploaded === 1 ? "" : "s"}` });
            render();
            setStatus(`${uploaded} hero image${uploaded === 1 ? "" : "s"} uploaded and optimized.`, "success");
        } catch (error) {
            console.error(error);
            setStatus(error?.message || "The hero images could not be uploaded.", "error");
        } finally {
            isBusy = false;
            progress.hidden = true;
            input.disabled = false;
        }
    });

    auth.onAuthStateChanged(async user => {
        if (!user) return;
        currentUser = user;
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
