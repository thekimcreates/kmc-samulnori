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

        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(date);
    }

    function createPerformanceCard(documentSnapshot) {
        const performance = documentSnapshot.data();
        const arrangements = Array.isArray(performance.arrangements)
            ? performance.arrangements
            : [];

        const article = document.createElement("article");
        article.className = "performance-card reveal visible";

        const link = document.createElement("a");
        link.className = "performance-card-link";
        link.href = "performances.html";
        link.setAttribute(
            "aria-label",
            `View the ${formatDate(performance.date)} performance at ${performance.location || "KMC Samulnori"}`
        );

        const content = document.createElement("div");
        content.className = "performance-card-content";

        const location = document.createElement("h3");
        location.className = "performance-location";
        location.textContent = performance.location || "Location unavailable";

        const details = document.createElement("p");
        details.className = "performance-meta";

        const arrangementText = arrangements.length
            ? arrangements.join(", ")
            : "Arrangement details coming soon";

        details.textContent = `${formatDate(performance.date)} • ${arrangementText}`;

        content.append(location, details);
        article.append(link, content);
        return article;
    }

    if (!db) {
        showMessage("Latest performances are temporarily unavailable.");
        return;
    }

    db.collection("performances")
        .orderBy("date", "desc")
        .limit(2)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                showMessage("No performances have been published yet.");
                return;
            }

            const cards = snapshot.docs.map(createPerformanceCard);
            container.replaceChildren(...cards);
        })
        .catch((error) => {
            console.error("Unable to load latest performances:", error);
            showMessage("Latest performances could not be loaded.");
        });
});
