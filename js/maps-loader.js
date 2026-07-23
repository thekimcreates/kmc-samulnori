"use strict";

(() => {
    const apiKey = window.KMC_CONFIG?.googleMapsApiKey;

    if (!apiKey) {
        console.error("Google Maps API key is missing from js/config.js.");
        return;
    }

    function startPerformanceMaps() {
        if (typeof window.initializeKmcPerformanceMap !== "function") {
            window.setTimeout(startPerformanceMaps, 100);
            return;
        }

        window.initializeKmcPerformanceMap();
    }

    if (window.google?.maps?.importLibrary) {
        startPerformanceMaps();
        return;
    }

    if (document.querySelector("script[data-kmc-google-maps]")) {
        return;
    }

    const script = document.createElement("script");
    const parameters = new URLSearchParams({
        key: apiKey,
        v: "weekly",
        loading: "async"
    });

    script.src =
        `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
    script.async = true;
    script.dataset.kmcGoogleMaps = "true";

    script.addEventListener("load", startPerformanceMaps, {
        once: true
    });

    script.addEventListener("error", () => {
        console.error(
            "Google Maps failed to load. Verify the API key, billing, " +
            "website restrictions, Maps JavaScript API, and Places API (New)."
        );
    }, {
        once: true
    });

    document.head.appendChild(script);
})();
