"use strict";

(() => {
    const firebaseServices = window.kmcFirebase || {};
    const auth = firebaseServices.auth;
    const db = firebaseServices.db;

    const loading = document.getElementById("team-loading");
    const main = document.getElementById("team-admin");
    const email = document.getElementById("admin-user-email");
    const logout = document.getElementById("admin-logout");

    const redirectToLogin = () => {
        window.location.replace("login.html");
    };

    if (!auth || !db) {
        redirectToLogin();
        return;
    }

    auth.onAuthStateChanged(async user => {
        if (!user) {
            redirectToLogin();
            return;
        }

        try {
            const adminRecord = await db.collection("admins").doc(user.uid).get();
            if (!adminRecord.exists) {
                await auth.signOut();
                redirectToLogin();
                return;
            }

            if (email) email.textContent = user.email || "Administrator";
            if (loading) loading.hidden = true;
            if (main) main.hidden = false;
        } catch (error) {
            console.error("Unable to verify administrator access:", error);
            redirectToLogin();
        }
    });

    if (logout) {
        logout.addEventListener("click", async () => {
            logout.disabled = true;
            try {
                await auth.signOut();
                redirectToLogin();
            } catch (error) {
                console.error("Unable to sign out:", error);
                logout.disabled = false;
            }
        });
    }
})();
