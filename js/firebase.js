"use strict";
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};
const firebaseIsConfigured = !Object.values(firebaseConfig).some(v => String(v).includes("PASTE_YOUR"));
if (firebaseIsConfigured) {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  window.kmcFirebase = { auth: firebase.auth(), db: firebase.firestore() };
} else {
  console.warn("Add your Firebase web config in js/firebase.js");
  window.kmcFirebase = { auth: null, db: null };
}
