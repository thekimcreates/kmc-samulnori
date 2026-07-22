"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyClVxcqLellscu9ZOCuU0kW8odixzxAy9E",
  authDomain: "kmc-samulnori.firebaseapp.com",
  projectId: "kmc-samulnori",
  storageBucket: "kmc-samulnori.firebasestorage.app",
  messagingSenderId: "699194804568",
  appId: "1:699194804568:web:ce1f50a1a728c78d52bd2d"
};

const firebaseIsConfigured = !Object.values(firebaseConfig).some(
  value => String(value).includes("PASTE_YOUR")
);

if (firebaseIsConfigured && typeof firebase !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = typeof firebase.auth === "function"
    ? firebase.auth()
    : null;

  const db = typeof firebase.firestore === "function"
    ? firebase.firestore()
    : null;

  const storage = typeof firebase.storage === "function"
    ? firebase.storage()
    : null;

  window.kmcFirebase = {
    auth,
    db,
    storage
  };
} else {
  console.warn("Add your Firebase web config in js/firebase.js");

  window.kmcFirebase = {
    auth: null,
    db: null,
    storage: null
  };
}
