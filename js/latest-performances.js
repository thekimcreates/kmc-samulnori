"use strict";

(() => {
    const state = {
        performances: null,
        arrangements: [],
        loadingPromise: null
    };

    function formatDate(value) {
        if (!value) return "Date unavailable";
        const date = new Date(`${value}T12:00:00`);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(date);
    }

    function formatTime(performance) {
        if (performance.timeTbd) return "Time TBD";
        if (!performance.time) return "";

        const [hour, minute] = String(performance.time).split(":").map(Number);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(performance.time);

        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit"
        }).format(new Date(2000, 0, 1, hour, minute));
    }

    function arrangementLabel(arrangement) {
        return `${arrangement?.name || "Arrangement"} ${arrangement?.koreanName || ""}`.trim();
    }

    function getArrangementLabels(performance) {
        const ids = Array.isArray(performance.arrangementIds) ? performance.arrangementIds : [];
        const resolved = ids
            .map(id => state.arrangements.find(item => item.id === id))
            .filter(Boolean)
            .map(arrangementLabel);

        if (resolved.length) return resolved;
        return Array.isArray(performance.arrangements)
            ? performance.arrangements.filter(Boolean)
            : [];
    }

    function showMessage(container, message) {
        const paragraph = document.createElement("p");
        paragraph.className = "performance-message";
        paragraph.textContent = message;
        container.replaceChildren(paragraph);
    }

    function createPerformanceCard(record) {
        const performance = record.data;
        const arrangements = getArrangementLabels(performance);
        const article = document.createElement("article");
        article.className = "performance-card reveal visible";

        if (performance.highlightPhotoUrl) {
            const safeUrl = String(performance.highlightPhotoUrl).replaceAll('"', "%22");
            article.style.setProperty("--performance-image", `url("${safeUrl}")`);
            article.classList.add("has-highlight-photo");
        }

        const locationText = performance.locationTbd
            ? "Location TBD"
            : performance.locationName || performance.location || "Location unavailable";

        const link = document.createElement("a");
        link.className = "performance-card-link";
        link.href = `performances.html#${encodeURIComponent(record.id)}`;
        link.setAttribute("aria-label", `View the ${formatDate(performance.date)} performance at ${locationText}`);

        const content = document.createElement("div");
        content.className = "performance-card-content";

        const dateTime = document.createElement("p");
        dateTime.className = "performance-date-time";
        dateTime.textContent = [formatDate(performance.date), formatTime(performance)]
            .filter(Boolean)
            .join(" • ");

        const location = document.createElement("h3");
        location.className = "performance-location";
        location.textContent = locationText;

        const details = document.createElement("p");
        details.className = "performance-meta";
        details.textContent = performance.arrangementsTbd
            ? "Arrangements TBD"
            : arrangements.length
                ? arrangements.join(" • ")
                : "Arrangement details coming soon";

        content.append(dateTime, location, details);
        article.append(link, content);
        return article;
    }

    function render() {
        const container = document.getElementById("latest-performances");
        if (!container) return;

        if (!state.performances) {
            container.setAttribute("aria-busy", "true");
            return;
        }

        container.removeAttribute("aria-busy");
        if (!state.performances.length) {
            showMessage(container, "No performances have been published yet.");
            return;
        }

        container.replaceChildren(...state.performances.map(createPerformanceCard));
    }

    function load() {
        if (state.loadingPromise) return state.loadingPromise;

        const db = window.kmcFirebase?.db;
        if (!db) {
            const container = document.getElementById("latest-performances");
            if (container) showMessage(container, "Latest performances are temporarily unavailable.");
            return Promise.resolve();
        }

        state.loadingPromise = Promise.all([
            db.collection("performances").orderBy("date", "desc").limit(2).get(),
            db.collection("siteContent").doc("arrangements").get()
        ])
            .then(([performanceSnapshot, arrangementSnapshot]) => {
                const arrangementData = arrangementSnapshot.exists ? arrangementSnapshot.data() : {};
                state.arrangements = Array.isArray(arrangementData.arrangements)
                    ? arrangementData.arrangements
                    : [];
                state.performances = performanceSnapshot.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data()
                }));
                render();
            })
            .catch(error => {
                console.error("Unable to load latest performances:", error);
                const container = document.getElementById("latest-performances");
                if (container) showMessage(container, "Latest performances could not be loaded.");
            });

        return state.loadingPromise;
    }

    document.addEventListener("DOMContentLoaded", () => {
        render();
        load();
    });

    // The homepage section manager can replace the entire Performances section
    // after Firebase finishes loading. Re-render cached cards into the new node.
    window.addEventListener("kmc:home-sections-rendered", () => {
        render();
        load();
    });
})();
