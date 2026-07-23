"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const db = window.kmcFirebase?.db;
    const grid = document.getElementById("performances-grid");
    const emptyState = document.getElementById("performance-empty");
    const count = document.getElementById("performance-count");
    const yearFilter = document.getElementById("performance-year");
    const arrangementFilter = document.getElementById("performance-arrangement-filter");
    const arrangementOptions = document.getElementById("performance-filter-options");
    const clearFiltersButton = document.getElementById("performance-filter-clear");

    const detail = document.getElementById("performance-detail");
    const detailShell = detail?.querySelector(".performance-detail-shell");
    const detailClose = document.getElementById("performance-detail-close");
    const detailHero = document.getElementById("performance-detail-hero");
    const detailTitle = document.getElementById("performance-detail-title");
    const detailLocation = document.getElementById("performance-detail-location");
    const detailArrangements = document.getElementById("performance-detail-arrangements");
    const detailFacts = document.getElementById("performance-detail-facts");
    const linksSection = document.getElementById("performance-links-section");
    const detailLinks = document.getElementById("performance-detail-links");

    let records = [];
    let activeRecord = null;
    let lastFocusedElement = null;
    let closeTimer = null;
    const selectedArrangements = new Set();

    if (!grid) return;

    function safeImageUrl(value) {
        return String(value || "").replaceAll('"', "%22");
    }

    function formatDate(value) {
        if (!value) return "Date TBD";
        const date = new Date(`${value}T12:00:00`);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(date);
    }

    function formatTime(record) {
        if (record.timeTbd) return "Time TBD";
        if (!record.time) return "Time unavailable";

        const [hour, minute] = record.time.split(":").map(Number);
        const date = new Date(2000, 0, 1, hour, minute);

        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit"
        }).format(date);
    }

    function getLocation(record) {
        if (record.locationTbd) return "Location TBD";
        return record.locationName || record.location || "Location unavailable";
    }

    function getArrangements(record) {
        if (record.arrangementsTbd) return "Arrangements TBD";
        const items = Array.isArray(record.arrangements) ? record.arrangements : [];
        return items.length ? items.join(" · ") : "Arrangement details coming soon";
    }

    function createArrowIcon() {
        const span = document.createElement("span");
        span.className = "performance-card-arrow";
        span.setAttribute("aria-hidden", "true");
        span.innerHTML = `
            <svg viewBox="0 0 24 24" focusable="false">
                <path d="M8 16L16 8"></path>
                <path d="M9 8h7v7"></path>
            </svg>
        `;
        return span;
    }

    function createCard(record, index) {
        const button = document.createElement("button");
        button.className = "performance-card performance-public-card reveal visible";
        button.type = "button";
        button.dataset.performanceId = record.id;
        button.style.transitionDelay = `${Math.min(index * 55, 275)}ms`;

        if (record.highlightPhotoUrl) {
            button.style.setProperty(
                "--performance-image",
                `url("${safeImageUrl(record.highlightPhotoUrl)}")`
            );
            button.classList.add("has-highlight-photo");
        }

        const location = getLocation(record);
        button.setAttribute(
            "aria-label",
            `Open details for the ${formatDate(record.date)} performance at ${location}`
        );

        const content = document.createElement("span");
        content.className = "performance-card-content";

        const dateTime = document.createElement("span");
        dateTime.className = "performance-date-time";
        dateTime.textContent = `${formatDate(record.date)} • ${formatTime(record)}`;

        const locationHeading = document.createElement("span");
        locationHeading.className = "performance-location";
        locationHeading.textContent = location;

        const arrangements = document.createElement("span");
        arrangements.className = "performance-meta";
        arrangements.textContent = getArrangements(record).replaceAll(" · ", " • ");

        content.append(dateTime, locationHeading, arrangements);
        button.append(content);
        button.addEventListener("click", () => openDetail(record, button));

        return button;
    }

    function createFact(label, value) {
        const article = document.createElement("article");
        article.className = "performance-fact";

        const labelElement = document.createElement("p");
        labelElement.className = "performance-fact-label";
        labelElement.textContent = label;

        const valueElement = document.createElement("p");
        valueElement.className = "performance-fact-value";
        valueElement.textContent = value;

        article.append(labelElement, valueElement);
        return article;
    }

    function createExternalLink(link) {
        const anchor = document.createElement("a");
        anchor.className = "performance-external-link";
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";

        const label = document.createElement("span");
        label.textContent = link.label || "Open Gallery";

        const icon = document.createElement("span");
        icon.className = "performance-external-link-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `
            <svg viewBox="0 0 24 24" focusable="false">
                <path d="M8 16L16 8"></path>
                <path d="M9 8h7v7"></path>
            </svg>
        `;

        anchor.append(label, icon);
        return anchor;
    }

    function openDetail(record, trigger) {
        if (!detail) return;

        window.clearTimeout(closeTimer);
        activeRecord = record;
        lastFocusedElement = trigger || document.activeElement;

        detailTitle.textContent = formatDate(record.date);
        detailLocation.textContent = getLocation(record);
        detailArrangements.textContent = getArrangements(record);

        detailFacts.replaceChildren(
            createFact("Date", formatDate(record.date)),
            createFact("Time", formatTime(record)),
            createFact("Location", getLocation(record)),
            createFact("Arrangements", getArrangements(record))
        );

        const links = Array.isArray(record.externalLinks)
            ? record.externalLinks.filter((link) => link?.url)
            : [];

        detailLinks.replaceChildren(...links.map(createExternalLink));
        linksSection.hidden = links.length === 0;

        if (record.highlightPhotoUrl) {
            detailHero.style.setProperty(
                "--detail-image",
                `url("${safeImageUrl(record.highlightPhotoUrl)}")`
            );
        } else {
            detailHero.style.removeProperty("--detail-image");
        }

        detail.hidden = false;
        detail.setAttribute("aria-hidden", "false");
        document.body.classList.add("performance-detail-open");

        requestAnimationFrame(() => {
            detail.classList.remove("is-closing");
            detail.classList.add("is-open");
            detailClose.focus({ preventScroll: true });
        });

        history.replaceState(null, "", `#${record.id}`);
    }

    function closeDetail({ restoreHash = true } = {}) {
        if (!detail || detail.hidden) return;

        detail.classList.remove("is-open");
        detail.classList.add("is-closing");
        document.body.classList.remove("performance-detail-open");

        closeTimer = window.setTimeout(() => {
            detail.hidden = true;
            detail.classList.remove("is-closing");
            detail.setAttribute("aria-hidden", "true");
            activeRecord = null;

            if (restoreHash && location.hash) {
                history.replaceState(null, "", location.pathname + location.search);
            }

            lastFocusedElement?.focus?.({ preventScroll: true });
        }, 300);
    }

    function trapDetailFocus(event) {
        if (!detailShell || detail.hidden) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeDetail();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = [...detailShell.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter((element) => element.offsetParent !== null);

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function normalizeArrangement(value) {
        return String(value || "").trim().toLocaleLowerCase();
    }

    function getRecordArrangements(record) {
        return Array.isArray(record.arrangements)
            ? record.arrangements.map((item) => String(item || "").trim()).filter(Boolean)
            : [];
    }

    function createArrangementFilterOption(arrangement) {
        const label = document.createElement("label");
        label.className = "performance-filter-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = arrangement;

        const text = document.createElement("span");
        text.textContent = arrangement;

        input.addEventListener("change", () => {
            const key = normalizeArrangement(arrangement);

            if (input.checked) {
                selectedArrangements.add(key);
            } else {
                selectedArrangements.delete(key);
            }

            label.classList.toggle("is-selected", input.checked);
            clearFiltersButton.hidden = selectedArrangements.size === 0;
            render();
        });

        label.append(input, text);
        return label;
    }

    function populateArrangementFilter() {
        const arrangements = [...new Set(
            records.flatMap(getRecordArrangements)
        )].sort((a, b) => a.localeCompare(b));

        arrangementOptions.replaceChildren(
            ...arrangements.map(createArrangementFilterOption)
        );

        arrangementFilter.disabled = arrangements.length === 0;
    }

    function recordMatchesArrangementFilter(record) {
        if (selectedArrangements.size === 0) return true;

        const recordArrangements = getRecordArrangements(record)
            .map(normalizeArrangement);

        return recordArrangements.some((arrangement) =>
            selectedArrangements.has(arrangement)
        );
    }

    function updateCount(visibleCount) {
        const total = records.length;

        if (!total) {
            count.textContent = "No performances published";
            return;
        }

        count.textContent = visibleCount === total
            ? `${total} ${total === 1 ? "performance" : "performances"}`
            : `${visibleCount} of ${total} performances`;
    }

    function render() {
        const selectedYear = yearFilter.value;
        const visible = records.filter((record) => {
            const matchesYear = selectedYear === "all" ||
                String(record.date || "").startsWith(selectedYear);

            return matchesYear && recordMatchesArrangementFilter(record);
        });

        grid.replaceChildren(...visible.map(createCard));
        grid.setAttribute("aria-busy", "false");
        emptyState.hidden = visible.length !== 0;
        grid.hidden = visible.length === 0;
        updateCount(visible.length);

        requestAnimationFrame(() => {
            grid.querySelectorAll(".reveal").forEach((element) => {
                element.classList.add("visible");
            });
        });
    }

    function populateYearFilter() {
        const years = [...new Set(
            records
                .map((record) => String(record.date || "").slice(0, 4))
                .filter((year) => /^\d{4}$/.test(year))
        )].sort((a, b) => Number(b) - Number(a));

        yearFilter.replaceChildren(new Option("All years", "all"));
        years.forEach((year) => yearFilter.add(new Option(year, year)));
        yearFilter.disabled = years.length === 0;
    }

    function showLoadError() {
        const error = document.createElement("div");
        error.className = "performance-load-error";

        const heading = document.createElement("h2");
        heading.textContent = "Performances are temporarily unavailable";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Please refresh the page and try again.";

        error.append(heading, paragraph);
        grid.replaceChildren(error);
        grid.setAttribute("aria-busy", "false");
        count.textContent = "Unable to load performances";
    }

    function openHashRecord() {
        const id = location.hash.slice(1);
        if (!id) return;

        const record = records.find((item) => item.id === id);
        if (record) openDetail(record, null);
    }

    detailClose?.addEventListener("click", () => closeDetail());
    detail?.querySelector(".performance-detail-backdrop")?.addEventListener("click", () => closeDetail());
    detail?.addEventListener("keydown", trapDetailFocus);
    yearFilter.addEventListener("change", render);
    clearFiltersButton?.addEventListener("click", () => {
        selectedArrangements.clear();
        arrangementOptions.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            input.checked = false;
            input.closest(".performance-filter-option")?.classList.remove("is-selected");
        });
        clearFiltersButton.hidden = true;
        render();
    });

    if (!db) {
        showLoadError();
        return;
    }

    db.collection("performances")
        .orderBy("date", "desc")
        .get()
        .then((snapshot) => {
            records = snapshot.docs.map((documentSnapshot) => ({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            }));

            populateYearFilter();
            populateArrangementFilter();
            render();
            openHashRecord();
        })
        .catch((error) => {
            console.error("Unable to load performances:", error);
            showLoadError();
        });
});
