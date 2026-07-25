"use strict";

(() => {
    const observed = new WeakSet();
    const pending = new WeakMap();
    const supportsObserver = "IntersectionObserver" in window;

    function escapeCssUrl(value) {
        return String(value || "").replace(/"/g, "%22");
    }

    function applyBackground(element) {
        const url = element?.dataset?.kmcBackground;
        if (!element || !url || element.dataset.kmcBackgroundLoaded === "true") return;
        element.style.setProperty(
            element.dataset.kmcBackgroundProperty || "--performance-image",
            `url("${escapeCssUrl(url)}")`
        );
        element.dataset.kmcBackgroundLoaded = "true";
        element.classList.add("kmc-background-loaded");
        pending.get(element)?.unobserve(element);
        pending.delete(element);
    }

    const observer = supportsObserver ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) applyBackground(entry.target);
        });
    }, {
        rootMargin: "500px 0px",
        threshold: 0.01
    }) : null;

    function observeBackground(element, url, propertyName = "--performance-image") {
        if (!element || !url) return;
        element.dataset.kmcBackground = url;
        element.dataset.kmcBackgroundProperty = propertyName;
        if (!observer) {
            applyBackground(element);
            return;
        }
        if (!observed.has(element)) {
            observed.add(element);
            pending.set(element, observer);
            observer.observe(element);
        }
    }

    function loadBackgroundNow(element, url, propertyName = "--performance-image") {
        if (!element || !url) return;
        element.dataset.kmcBackground = url;
        element.dataset.kmcBackgroundProperty = propertyName;
        applyBackground(element);
    }

    function preload(url) {
        if (!url) return;
        const image = new Image();
        image.decoding = "async";
        image.src = url;
    }

    window.KMCImageLoader = Object.freeze({
        observeBackground,
        loadBackgroundNow,
        preload
    });
})();
