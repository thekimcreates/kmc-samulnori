"use strict";

let kmcPerformanceMap = null;
let kmcPerformanceMarker = null;
let kmcPerformanceAutocomplete = null;

window.initializeKmcPerformanceMap = function initializeKmcPerformanceMap() {
    const mapElement = document.getElementById("performance-location-map");
    const locationInput = document.getElementById("performance-location");
    if (!mapElement || !locationInput || !window.google?.maps?.places) return;

    kmcPerformanceMap = new google.maps.Map(mapElement, {
        center: { lat: 34.0522, lng: -118.2437 },
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    kmcPerformanceMarker = new google.maps.Marker({ map: kmcPerformanceMap });
    kmcPerformanceAutocomplete = new google.maps.places.Autocomplete(locationInput, {
        fields: ["formatted_address", "geometry", "name", "place_id"]
    });

    kmcPerformanceAutocomplete.addListener("place_changed", () => {
        const place = kmcPerformanceAutocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const displayName = place.name && place.formatted_address
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address || place.name || locationInput.value;

        locationInput.value = displayName;
        document.getElementById("performance-location-place-id").value = place.place_id || "";
        document.getElementById("performance-location-lat").value = String(lat);
        document.getElementById("performance-location-lng").value = String(lng);

        kmcPerformanceMap.setCenter({ lat, lng });
        kmcPerformanceMap.setZoom(16);
        kmcPerformanceMarker.setPosition({ lat, lng });
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const { auth, db, storage } = window.kmcFirebase || {};
    const get = (id) => document.getElementById(id);

    const page = get("performances-admin");
    const loading = get("performances-loading");
    const email = get("admin-user-email");
    const logout = get("admin-logout");
    const form = get("performance-form");
    const formTitle = get("performance-form-title");
    const idInput = get("performance-id");
    const dateInput = get("performance-date");
    const timeInput = get("performance-time");
    const timezoneInput = get("performance-timezone");
    const timeTbd = get("performance-time-tbd");
    const locationInput = get("performance-location");
    const locationTbd = get("performance-location-tbd");
    const arrangementsTbd = get("performance-arrangements-tbd");
    const customArrangementsInput = get("performance-custom-arrangements");
    const membersTbd = get("performance-members-tbd");
    const membersList = get("performance-members-list");
    const highlightInput = get("performance-highlight");
    const highlightTbd = get("performance-highlight-tbd");
    const highlightExisting = get("performance-highlight-existing");
    const highlightPreviewWrap = get("performance-highlight-preview-wrap");
    const highlightPreview = get("performance-highlight-preview");
    const highlightRemove = get("performance-highlight-remove");
    const linksTbd = get("performance-links-tbd");
    const linksList = get("performance-links-list");
    const addLinkButton = get("performance-link-add");
    const submitButton = get("performance-submit");
    const cancelButton = get("performance-cancel");
    const status = get("performance-status");
    const list = get("performance-list");
    const empty = get("performance-empty");
    const count = get("performance-count");

    let unsubscribePerformances = null;
    let performanceRecords = [];
    let memberRecords = [];
    let previewObjectUrl = "";
    let removeExistingHighlight = false;

    const returnToLogin = () => location.replace("login.html");
    if (!auth || !db || !storage) {
        returnToLogin();
        return;
    }

    function setStatus(message = "", type = "") {
        status.textContent = message;
        status.className = "login-status";
        if (type) status.classList.add(`is-${type}`);
    }

    function setGroupDisabled(containerId, disabled) {
        const container = get(containerId);
        if (!container) return;
        container.classList.toggle("fieldset-disabled", disabled);
        container.querySelectorAll("input, select, button").forEach((field) => {
            field.disabled = disabled;
        });
    }

    function syncTbdStates() {
        timeInput.disabled = timeTbd.checked;
        timezoneInput.disabled = timeTbd.checked;
        setGroupDisabled("performance-location-fields", locationTbd.checked);
        setGroupDisabled("performance-arrangement-fields", arrangementsTbd.checked);
        setGroupDisabled("performance-member-fields", membersTbd.checked);
        setGroupDisabled("performance-highlight-fields", highlightTbd.checked);
        setGroupDisabled("performance-links-fields", linksTbd.checked);
    }

    function selectedValues(name) {
        return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
    }

    function customArrangements() {
        return customArrangementsInput.value
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
    }

    function externalLinks() {
        return [...linksList.querySelectorAll(".external-link-row")].map((row) => ({
            label: row.querySelector('[data-field="label"]').value.trim(),
            url: row.querySelector('[data-field="url"]').value.trim()
        })).filter((link) => link.label || link.url);
    }

    function addExternalLink(link = {}) {
        const row = document.createElement("div");
        row.className = "external-link-row";
        row.innerHTML = `
            <input data-field="label" type="text" maxlength="80" placeholder="Link name" value="${escapeAttribute(link.label || "")}">
            <input data-field="url" type="url" maxlength="500" placeholder="https://..." value="${escapeAttribute(link.url || "")}">
            <button class="admin-danger-button admin-small-button" type="button">Remove</button>
        `;
        row.querySelector("button").addEventListener("click", () => row.remove());
        linksList.appendChild(row);
    }

    function escapeAttribute(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function renderMembers(selected = []) {
        membersList.replaceChildren();
        if (!memberRecords.length) {
            const message = document.createElement("p");
            message.className = "admin-help-text";
            message.textContent = "No member records were found. Add member documents to the Firestore members collection.";
            membersList.appendChild(message);
            return;
        }

        memberRecords.forEach((member) => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "members";
            checkbox.value = member.name;
            checkbox.checked = selected.includes(member.name);
            const span = document.createElement("span");
            span.textContent = member.name;
            label.append(checkbox, span);
            membersList.appendChild(label);
        });
    }

    async function loadMembers() {
        try {
            const snapshot = await db.collection("members").orderBy("name", "asc").get();
            memberRecords = snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name || "Unnamed member" }));
        } catch (error) {
            console.error("Unable to load members:", error);
            memberRecords = [];
        }
        renderMembers();
    }

    function clearPreview() {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = "";
        highlightPreview.removeAttribute("src");
        highlightPreviewWrap.hidden = true;
    }

    function showPreview(src) {
        highlightPreview.src = src;
        highlightPreviewWrap.hidden = false;
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        highlightExisting.value = "";
        get("performance-location-place-id").value = "";
        get("performance-location-lat").value = "";
        get("performance-location-lng").value = "";
        removeExistingHighlight = false;
        clearPreview();
        linksList.replaceChildren();
        addExternalLink();
        renderMembers();
        formTitle.textContent = "Add Performance";
        submitButton.textContent = "Add Performance";
        cancelButton.hidden = true;
        setStatus();
        syncTbdStates();
    }

    function formatDate(dateValue) {
        if (!dateValue) return "Date unavailable";
        const date = new Date(`${dateValue}T12:00:00`);
        if (Number.isNaN(date.getTime())) return dateValue;
        return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
    }

    function formatTime(record) {
        if (record.timeTbd) return "Time TBD";
        if (!record.time) return "Time unavailable";
        const [hour, minute] = record.time.split(":").map(Number);
        const date = new Date(2000, 0, 1, hour, minute);
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
    }

    function createPerformanceCard(record) {
        const article = document.createElement("article");
        article.className = "performance-admin-card";

        const main = document.createElement("div");
        main.className = "performance-admin-card-main";

        if (record.highlightPhotoUrl) {
            const image = document.createElement("img");
            image.className = "performance-admin-photo";
            image.src = record.highlightPhotoUrl;
            image.alt = "";
            main.appendChild(image);
        }

        const content = document.createElement("div");
        content.className = "performance-admin-card-content";
        const date = document.createElement("p");
        date.className = "performance-admin-date";
        date.textContent = `${formatDate(record.date)} · ${formatTime(record)}`;
        const location = document.createElement("h3");
        location.textContent = record.locationTbd ? "Location TBD" : record.location;
        const arrangements = document.createElement("p");
        arrangements.className = "performance-admin-arrangements";
        arrangements.textContent = record.arrangementsTbd ? "Arrangements TBD" : record.arrangements.join(" · ");
        content.append(date, location, arrangements);
        main.appendChild(content);

        const actions = document.createElement("div");
        actions.className = "performance-card-actions";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "admin-secondary-button admin-small-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => beginEdit(record));
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "admin-danger-button admin-small-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePerformance(record));
        actions.append(editButton, deleteButton);
        article.append(main, actions);
        return article;
    }

    function renderPerformances() {
        list.replaceChildren();
        count.textContent = String(performanceRecords.length);
        empty.hidden = performanceRecords.length !== 0;
        performanceRecords.forEach((record) => list.appendChild(createPerformanceCard(record)));
    }

    function beginEdit(record) {
        resetForm();
        idInput.value = record.id;
        dateInput.value = record.date;
        timeInput.value = record.time || "";
        timezoneInput.value = record.timezone || "America/Los_Angeles";
        timeTbd.checked = Boolean(record.timeTbd);
        locationTbd.checked = Boolean(record.locationTbd);
        locationInput.value = record.location || "";
        get("performance-location-place-id").value = record.locationPlaceId || "";
        get("performance-location-lat").value = record.locationLat ?? "";
        get("performance-location-lng").value = record.locationLng ?? "";
        arrangementsTbd.checked = Boolean(record.arrangementsTbd);
        membersTbd.checked = Boolean(record.membersTbd);
        highlightTbd.checked = Boolean(record.highlightTbd);
        linksTbd.checked = Boolean(record.linksTbd);

        form.querySelectorAll('input[name="arrangements"]').forEach((input) => {
            input.checked = record.arrangements.includes(input.value);
        });
        customArrangementsInput.value = (record.customArrangements || []).join(", ");
        renderMembers(record.members || []);

        highlightExisting.value = record.highlightPhotoUrl || "";
        if (record.highlightPhotoUrl) showPreview(record.highlightPhotoUrl);

        linksList.replaceChildren();
        (record.externalLinks?.length ? record.externalLinks : [{}]).forEach(addExternalLink);

        if (kmcPerformanceMap && record.locationLat && record.locationLng) {
            const position = { lat: Number(record.locationLat), lng: Number(record.locationLng) };
            kmcPerformanceMap.setCenter(position);
            kmcPerformanceMap.setZoom(16);
            kmcPerformanceMarker.setPosition(position);
        }

        syncTbdStates();
        formTitle.textContent = "Edit Performance";
        submitButton.textContent = "Save Changes";
        cancelButton.hidden = false;
        setStatus();
        dateInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function deletePerformance(record) {
        if (!window.confirm(`Delete the ${formatDate(record.date)} performance?`)) return;
        try {
            await db.collection("performances").doc(record.id).delete();
            if (record.highlightPhotoPath) {
                await storage.ref(record.highlightPhotoPath).delete().catch(() => {});
            }
            if (idInput.value === record.id) resetForm();
        } catch (error) {
            console.error("Unable to delete performance:", error);
            setStatus("The performance could not be deleted.", "error");
        }
    }

    function subscribeToPerformances() {
        unsubscribePerformances = db.collection("performances").orderBy("date", "desc").onSnapshot((snapshot) => {
            performanceRecords = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
            renderPerformances();
        }, (error) => {
            console.error("Unable to load performances:", error);
            empty.hidden = false;
            empty.textContent = "Performances could not be loaded.";
        });
    }

    async function uploadHighlight(documentId, existingPath = "") {
        const file = highlightInput.files[0];
        if (!file) return null;
        if (!file.type.startsWith("image/")) throw new Error("Select an image file.");
        if (file.size > 10 * 1024 * 1024) throw new Error("The highlight photo must be 10 MB or smaller.");

        if (existingPath) await storage.ref(existingPath).delete().catch(() => {});
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `performance-highlights/${documentId}/${Date.now()}-${safeName}`;
        const snapshot = await storage.ref(path).put(file, { contentType: file.type });
        return { url: await snapshot.ref.getDownloadURL(), path };
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) return returnToLogin();
        try {
            const adminDocument = await db.collection("admins").doc(user.uid).get();
            if (!adminDocument.exists || adminDocument.data().active !== true) {
                await auth.signOut();
                return returnToLogin();
            }
            email.textContent = user.email || "Administrator";
            await loadMembers();
            loading.hidden = true;
            page.hidden = false;
            subscribeToPerformances();
            resetForm();
        } catch (error) {
            console.error("Unable to verify administrator:", error);
            await auth.signOut();
            returnToLogin();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const documentId = idInput.value;
        const fixedArrangements = selectedValues("arrangements");
        const custom = customArrangements();
        const arrangements = [...new Set([...fixedArrangements, ...custom])];
        const members = selectedValues("members");
        const links = externalLinks();

        if (!dateInput.value) return setStatus("Enter a date.", "error");
        if (!timeTbd.checked && !timeInput.value) return setStatus("Enter a time or select Time is TBD.", "error");
        if (!locationTbd.checked && !locationInput.value.trim()) return setStatus("Choose a location or select Location is TBD.", "error");
        if (!arrangementsTbd.checked && arrangements.length === 0) return setStatus("Select or enter an arrangement, or choose TBD.", "error");
        if (!membersTbd.checked && members.length === 0) return setStatus("Select attending members or choose TBD.", "error");
        if (!highlightTbd.checked && !highlightInput.files[0] && !highlightExisting.value) return setStatus("Upload a highlight photo or choose TBD.", "error");
        if (!linksTbd.checked && links.some((link) => !link.label || !link.url)) return setStatus("Each external link needs both a name and URL.", "error");

        submitButton.disabled = true;
        cancelButton.disabled = true;
        setStatus(documentId ? "Saving changes…" : "Adding performance…");

        try {
            const reference = documentId
                ? db.collection("performances").doc(documentId)
                : db.collection("performances").doc();
            const oldRecord = performanceRecords.find((record) => record.id === documentId) || {};

            let highlightPhotoUrl = highlightTbd.checked ? "" : highlightExisting.value;
            let highlightPhotoPath = highlightTbd.checked ? "" : oldRecord.highlightPhotoPath || "";

            if (highlightTbd.checked || removeExistingHighlight) {
                if (oldRecord.highlightPhotoPath) await storage.ref(oldRecord.highlightPhotoPath).delete().catch(() => {});
                highlightPhotoUrl = "";
                highlightPhotoPath = "";
            }

            if (!highlightTbd.checked && highlightInput.files[0]) {
                const uploaded = await uploadHighlight(reference.id, oldRecord.highlightPhotoPath || "");
                highlightPhotoUrl = uploaded.url;
                highlightPhotoPath = uploaded.path;
            }

            const data = {
                date: dateInput.value,
                time: timeTbd.checked ? "" : timeInput.value,
                timeTbd: timeTbd.checked,
                timezone: timeTbd.checked ? "" : timezoneInput.value,
                location: locationTbd.checked ? "" : locationInput.value.trim(),
                locationTbd: locationTbd.checked,
                locationPlaceId: locationTbd.checked ? "" : get("performance-location-place-id").value,
                locationLat: locationTbd.checked ? null : Number(get("performance-location-lat").value) || null,
                locationLng: locationTbd.checked ? null : Number(get("performance-location-lng").value) || null,
                arrangements: arrangementsTbd.checked ? [] : arrangements,
                customArrangements: arrangementsTbd.checked ? [] : custom,
                arrangementsTbd: arrangementsTbd.checked,
                members: membersTbd.checked ? [] : members,
                membersTbd: membersTbd.checked,
                highlightPhotoUrl,
                highlightPhotoPath,
                highlightTbd: highlightTbd.checked,
                externalLinks: linksTbd.checked ? [] : links,
                linksTbd: linksTbd.checked,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (documentId) {
                await reference.update(data);
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await reference.set(data);
            }

            resetForm();
            setStatus(documentId ? "Performance updated successfully." : "Performance added successfully.", "success");
        } catch (error) {
            console.error("Unable to save performance:", error);
            setStatus(error.message || "The performance could not be saved.", "error");
        } finally {
            submitButton.disabled = false;
            cancelButton.disabled = false;
        }
    });

    [timeTbd, locationTbd, arrangementsTbd, membersTbd, highlightTbd, linksTbd]
        .forEach((checkbox) => checkbox.addEventListener("change", syncTbdStates));

    highlightInput.addEventListener("change", () => {
        const file = highlightInput.files[0];
        if (!file) return;
        clearPreview();
        previewObjectUrl = URL.createObjectURL(file);
        showPreview(previewObjectUrl);
        removeExistingHighlight = false;
    });

    highlightRemove.addEventListener("click", () => {
        highlightInput.value = "";
        highlightExisting.value = "";
        removeExistingHighlight = true;
        clearPreview();
    });

    addLinkButton.addEventListener("click", () => addExternalLink());
    cancelButton.addEventListener("click", resetForm);
    logout.addEventListener("click", async () => {
        logout.disabled = true;
        if (unsubscribePerformances) unsubscribePerformances();
        await auth.signOut();
        returnToLogin();
    });
    window.addEventListener("beforeunload", () => {
        if (unsubscribePerformances) unsubscribePerformances();
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    });
});
