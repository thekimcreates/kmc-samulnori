import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const firebaseConfig = {

  apiKey: "AIzaSyClVxcqLellscu9ZOCuU0kW8odixzxAy9E",

  authDomain: "kmc-samulnori.firebaseapp.com",

  projectId: "kmc-samulnori",

  storageBucket: "kmc-samulnori.firebasestorage.app",

  messagingSenderId: "699194804568",

  appId: "1:699194804568:web:62c1939655fa75a652bd2d"

};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);
