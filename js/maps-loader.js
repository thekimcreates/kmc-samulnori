"use strict";

(() => {
    const apiKey = window.KMC_CONFIG?.googleMapsApiKey;
    let initialized = false;

    function initializeMapFeature() {
        if (initialized) return;

        if (typeof window.initializeKmcPerformanceMap !== "function") {
            window.setTimeout(initializeMapFeature, 100);
            return;
        }

        initialized = true;
        window.initializeKmcPerformanceMap();
    }

    if (!apiKey) {
        console.error(
            "Google Maps API key is missing from js/config.js."
        );
        return;
    }

    if (window.google?.maps?.places) {
        initializeMapFeature();
        return;
    }

    const existingScript =
        document.querySelector("script[data-kmc-google-maps]");

    if (existingScript) {
        existingScript.addEventListener("load", initializeMapFeature, {
            once: true
        });
        return;
    }

    const script = document.createElement("script");
    const parameters = new URLSearchParams({
        key: apiKey,
        libraries: "places",
        v: "weekly"
    });

    script.src =
        `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.kmcGoogleMaps = "true";

    script.addEventListener("load", initializeMapFeature, {
        once: true
    });

    script.addEventListener("error", () => {
        console.error(
            "Google Maps failed to load. Check the API key's website " +
            "restrictions and enabled APIs in Google Cloud Console."
        );
    }, {
        once: true
    });

    document.head.appendChild(script);
})();
