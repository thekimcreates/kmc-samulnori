"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const { auth, db } = window.kmcFirebase || {};

    const page = document.getElementById("performances-admin");
    const loading = document.getElementById("performances-loading");
    const email = document.getElementById("admin-user-email");
    const logout = document.getElementById("admin-logout");
    const form = document.getElementById("performance-form");
    const formTitle = document.getElementById("performance-form-title");
    const idInput = document.getElementById("performance-id");
    const dateInput = document.getElementById("performance-date");
    const locationInput = document.getElementById("performance-location");
    const submitButton = document.getElementById("performance-submit");
    const cancelButton = document.getElementById("performance-cancel");
    const status = document.getElementById("performance-status");
    const list = document.getElementById("performance-list");
    const empty = document.getElementById("performance-empty");
    const count = document.getElementById("performance-count");

    let unsubscribePerformances = null;
    let performanceRecords = [];

    const returnToLogin = () => location.replace("login.html");

    if (!auth || !db) {
        returnToLogin();
        return;
    }

    function setStatus(message = "", type = "") {
        status.textContent = message;
        status.className = "login-status";
        if (type) status.classList.add(`is-${type}`);
    }

    function selectedArrangements() {
        return [...form.querySelectorAll('input[name="arrangements"]:checked')]
            .map((input) => input.value);
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        formTitle.textContent = "Add Performance";
        submitButton.textContent = "Add Performance";
        cancelButton.hidden = true;
        setStatus();
    }

    function formatDate(dateValue) {
        if (!dateValue) return "Date unavailable";
        const date = new Date(`${dateValue}T12:00:00`);
        if (Number.isNaN(date.getTime())) return dateValue;
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(date);
    }

    function createPerformanceCard(record) {
        const article = document.createElement("article");
        article.className = "performance-admin-card";

        const content = document.createElement("div");
        content.className = "performance-admin-card-content";

        const date = document.createElement("p");
        date.className = "performance-admin-date";
        date.textContent = formatDate(record.date);

        const location = document.createElement("h3");
        location.textContent = record.location;

        const arrangements = document.createElement("p");
        arrangements.className = "performance-admin-arrangements";
        arrangements.textContent = record.arrangements.join(" · ");

        content.append(date, location, arrangements);

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
        article.append(content, actions);
        return article;
    }

    function renderPerformances() {
        list.replaceChildren();
        count.textContent = String(performanceRecords.length);
        empty.hidden = performanceRecords.length !== 0;

        performanceRecords.forEach((record) => {
            list.appendChild(createPerformanceCard(record));
        });
    }

    function beginEdit(record) {
        idInput.value = record.id;
        dateInput.value = record.date;
        locationInput.value = record.location;

        form.querySelectorAll('input[name="arrangements"]').forEach((input) => {
            input.checked = record.arrangements.includes(input.value);
        });

        formTitle.textContent = "Edit Performance";
        submitButton.textContent = "Save Changes";
        cancelButton.hidden = false;
        setStatus();
        dateInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function deletePerformance(record) {
        const confirmed = window.confirm(
            `Delete the ${formatDate(record.date)} performance at ${record.location}?`
        );

        if (!confirmed) return;

        try {
            await db.collection("performances").doc(record.id).delete();
            if (idInput.value === record.id) resetForm();
        } catch (error) {
            console.error("Unable to delete performance:", error);
            setStatus("The performance could not be deleted. Please try again.", "error");
        }
    }

    function subscribeToPerformances() {
        unsubscribePerformances = db.collection("performances")
            .orderBy("date", "desc")
            .onSnapshot((snapshot) => {
                performanceRecords = snapshot.docs.map((document) => {
                    const data = document.data();
                    return {
                        id: document.id,
                        date: data.date || "",
                        location: data.location || "Location unavailable",
                        arrangements: Array.isArray(data.arrangements) ? data.arrangements : []
                    };
                });
                renderPerformances();
            }, (error) => {
                console.error("Unable to load performances:", error);
                empty.hidden = false;
                empty.textContent = "Performances could not be loaded.";
            });
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            returnToLogin();
            return;
        }

        try {
            const adminDocument = await db.collection("admins").doc(user.uid).get();
            if (!adminDocument.exists || adminDocument.data().active !== true) {
                await auth.signOut();
                returnToLogin();
                return;
            }

            email.textContent = user.email || "Administrator";
            loading.hidden = true;
            page.hidden = false;
            subscribeToPerformances();
        } catch (error) {
            console.error("Unable to verify administrator:", error);
            await auth.signOut();
            returnToLogin();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const date = dateInput.value;
        const location = locationInput.value.trim();
        const arrangements = selectedArrangements();
        const documentId = idInput.value;

        if (!date || !location) {
            setStatus("Enter a date and location.", "error");
            return;
        }

        if (arrangements.length === 0) {
            setStatus("Select at least one arrangement.", "error");
            return;
        }

        submitButton.disabled = true;
        cancelButton.disabled = true;
        setStatus(documentId ? "Saving changes…" : "Adding performance…");

        try {
            const data = {
                date,
                location,
                arrangements,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (documentId) {
                await db.collection("performances").doc(documentId).update(data);
                resetForm();
                setStatus("Performance updated successfully.", "success");
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("performances").add(data);
                resetForm();
                setStatus("Performance added successfully.", "success");
            }
        } catch (error) {
            console.error("Unable to save performance:", error);
            setStatus("The performance could not be saved. Please try again.", "error");
        } finally {
            submitButton.disabled = false;
            cancelButton.disabled = false;
        }
    });

    cancelButton.addEventListener("click", resetForm);

    logout.addEventListener("click", async () => {
        logout.disabled = true;
        if (unsubscribePerformances) unsubscribePerformances();
        await auth.signOut();
        returnToLogin();
    });

    window.addEventListener("beforeunload", () => {
        if (unsubscribePerformances) unsubscribePerformances();
    });
});
