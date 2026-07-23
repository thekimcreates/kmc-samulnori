"use strict";

/*
 * KMC Samulnori deployment configuration
 *
 * This file is loaded before firebase.js and maps-loader.js.
 * Browser API keys are visible to visitors, so restrict the Google Maps
 * key by website/referrer and API in Google Cloud Console.
 */
window.KMC_CONFIG = Object.freeze({
    googleMapsApiKey: "AIzaSyD-MVpD9Qvsag1sJKHblNsBdQXZDXPTbMI",

    firebase: Object.freeze({
        apiKey: "AIzaSyClVxcqLellscu9ZOCuU0kW8odixzxAy9E",
        authDomain: "kmc-samulnori.firebaseapp.com",
        projectId: "kmc-samulnori",
        storageBucket: "kmc-samulnori.firebasestorage.app",
        messagingSenderId: "699194804568",
        appId: "1:699194804568:web:ce1f50a1a728c78d52bd2d"
    })
});
