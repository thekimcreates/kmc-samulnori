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
            storage: null,
            persistenceReady: Promise.resolve(false),
            persistenceEnabled: false
        };
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    const auth = typeof firebase.auth === "function" ? firebase.auth() : null;
    const db = typeof firebase.firestore === "function" ? firebase.firestore() : null;
    const storage = typeof firebase.storage === "function" ? firebase.storage() : null;

    const ua = navigator.userAgent || "";
    const isMacOSSafari =
        /Macintosh|Mac OS X/.test(ua) &&
        /Safari\//.test(ua) &&
        !/(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS)\//.test(ua);
    const isAdminPage = /\/admin(?:\/|$)/.test(window.location.pathname);
    const shouldEnablePersistence = !isAdminPage && !isMacOSSafari;

    const persistenceReady = shouldEnablePersistence && db && typeof db.enablePersistence === "function"
        ? db.enablePersistence({ synchronizeTabs: true }).then(() => true).catch((error) => {
            if (error?.code === "failed-precondition") {
                console.info("Firestore persistence is already controlled by another open tab.");
            } else if (error?.code === "unimplemented") {
                console.info("This browser does not support Firestore offline persistence.");
            } else {
                console.warn("Firestore offline persistence could not be enabled:", error);
            }
            return false;
        })
        : Promise.resolve(false);

    if (isMacOSSafari) {
        console.info("KMC: Firestore IndexedDB persistence is disabled on macOS Safari to guarantee fresh server data.");
    }

    window.kmcFirebase = {
        auth,
        db,
        storage,
        persistenceReady,
        persistenceEnabled: shouldEnablePersistence,
        isMacOSSafari
    };
})();
