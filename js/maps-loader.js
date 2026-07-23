"use strict";

(() => {
    const callbackName = "initializeKmcPerformanceMap";
    const apiKey = window.KMC_CONFIG?.googleMapsApiKey;

    if (!apiKey) {
        console.error("Google Maps API key is missing from js/config.js.");
        return;
    }

    if (window.google?.maps) {
        if (typeof window[callbackName] === "function") {
            window[callbackName]();
        }
        return;
    }

    if (document.querySelector('script[data-kmc-google-maps]')) {
        return;
    }

    const script = document.createElement("script");
    const parameters = new URLSearchParams({
        key: apiKey,
        libraries: "places",
        callback: callbackName,
        loading: "async"
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.kmcGoogleMaps = "true";
    script.onerror = () => {
        console.error("Google Maps failed to load. Check the API key restrictions and enabled APIs.");
    };

    document.head.appendChild(script);
})();
