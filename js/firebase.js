"use strict";
const firebaseConfig = {
  apiKey: "AIzaSyClVxcqLellscu9ZOCuU0kW8odixzxAy9E",
  authDomain: "kmc-samulnori.firebaseapp.com",
  projectId: "kmc-samulnori",
  storageBucket: "kmc-samulnori.firebasestorage.app",
  messagingSenderId: "699194804568",
  appId: "1:699194804568:web:ce1f50a1a728c78d52bd2d"
};
const firebaseIsConfigured = !Object.values(firebaseConfig).some(v => String(v).includes("PASTE_YOUR"));
if (firebaseIsConfigured) {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  window.kmcFirebase = { auth: firebase.auth(), db: firebase.firestore() };
} else {
  console.warn("Add your Firebase web config in js/firebase.js");
  window.kmcFirebase = { auth: null, db: null };
}
