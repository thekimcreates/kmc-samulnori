"use strict";

(() => {
    const config = window.KMC_CONFIG?.firebase;

    const isConfigured =
        config &&
        Object.values(config).every((value) => {
            const text = String(value || "");
            return text && !text.includes("YOUR_") && !text.includes("PASTE_YOUR");
        });

    if (!isConfigured || typeof firebase === "undefined") {
        console.warn("KMC Firebase configuration is missing or Firebase failed to load.");
        window.kmcFirebase = {
            auth: null,
            db: null,
            storage: null
        };
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    window.kmcFirebase = {
        auth: typeof firebase.auth === "function" ? firebase.auth() : null,
        db: typeof firebase.firestore === "function" ? firebase.firestore() : null,
        storage: typeof firebase.storage === "function" ? firebase.storage() : null
    };
})();
