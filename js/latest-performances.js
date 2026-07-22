"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("latest-performances");
    const db = window.kmcFirebase?.db;
    if (!container) return;

    function showMessage(message) {
        const paragraph = document.createElement("p");
        paragraph.className = "performance-message";
        paragraph.textContent = message;
        container.replaceChildren(paragraph);
    }

    function formatDate(value) {
        if (!value) return "Date unavailable";
        const date = new Date(`${value}T12:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
    }

    function formatTime(performance) {
        if (performance.timeTbd) return "Time TBD";
        if (!performance.time) return "";
        const [hour, minute] = performance.time.split(":").map(Number);
        const date = new Date(2000, 0, 1, hour, minute);
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
    }

    function createPerformanceCard(documentSnapshot) {
        const performance = documentSnapshot.data();
        const arrangements = Array.isArray(performance.arrangements) ? performance.arrangements : [];
        const article = document.createElement("article");
        article.className = "performance-card reveal visible";

        if (performance.highlightPhotoUrl) {
            article.style.setProperty("--performance-image", `url("${performance.highlightPhotoUrl.replaceAll('"', '%22')}")`);
            article.classList.add("has-highlight-photo");
        }

        const link = document.createElement("a");
        link.className = "performance-card-link";
        link.href = `performances.html#${documentSnapshot.id}`;
        const locationText = performance.locationTbd ? "Location TBD" : performance.location || "Location unavailable";
        link.setAttribute("aria-label", `View the ${formatDate(performance.date)} performance at ${locationText}`);

        const content = document.createElement("div");
        content.className = "performance-card-content";
        const location = document.createElement("h3");
        location.className = "performance-location";
        location.textContent = locationText;

        const details = document.createElement("p");
        details.className = "performance-meta";
        const arrangementText = performance.arrangementsTbd
            ? "Arrangements TBD"
            : arrangements.length ? arrangements.join(", ") : "Arrangement details coming soon";
        const timeText = formatTime(performance);
        details.textContent = [formatDate(performance.date), timeText, arrangementText].filter(Boolean).join(" • ");

        content.append(location, details);
        article.append(link, content);
        return article;
    }

    if (!db) return showMessage("Latest performances are temporarily unavailable.");

    db.collection("performances").orderBy("date", "desc").limit(2).get()
        .then((snapshot) => {
            if (snapshot.empty) return showMessage("No performances have been published yet.");
            container.replaceChildren(...snapshot.docs.map(createPerformanceCard));
        })
        .catch((error) => {
            console.error("Unable to load latest performances:", error);
            showMessage("Latest performances could not be loaded.");
        });
});
