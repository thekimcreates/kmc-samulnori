"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const firebaseServices = window.kmcFirebase || {};
    const auth = firebaseServices.auth;
    const db = firebaseServices.db;

    const page = document.getElementById("admin-dashboard");
    const loading = document.getElementById("dashboard-loading");
    const email = document.getElementById("admin-user-email");
    const logout = document.getElementById("admin-logout");

    let redirecting = false;

    function redirectToLogin() {
        if (redirecting) return;
        redirecting = true;
        window.location.replace("login.html");
    }

    function showVerificationError(error) {
        console.error("Unable to verify administrator access:", error);

        if (loading) {
            loading.hidden = false;
            loading.innerHTML =
                'Unable to verify administrator access. ' +
                '<button type="button" id="admin-verification-retry">' +
                'Try Again</button>';
        }

        const retry = document.getElementById("admin-verification-retry");
        if (retry) {
            retry.addEventListener("click", () => {
                window.location.reload();
            }, { once: true });
        }
    }

    async function readAdminRecord(user, attempts = 3) {
        let lastError;

        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            try {
                return await db.collection("admins").doc(user.uid).get();
            } catch (error) {
                lastError = error;

                if (attempt < attempts) {
                    await new Promise(resolve => {
                        window.setTimeout(resolve, attempt * 500);
                    });
                }
            }
        }

        throw lastError;
    }

    if (!auth || !db) {
        showVerificationError(
            new Error("Firebase Auth or Firestore did not initialize.")
        );
        return;
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
        unsubscribe();

        if (!user) {
            redirectToLogin();
            return;
        }

        try {
            const adminRecord = await readAdminRecord(user);
            const adminData = adminRecord.exists
                ? adminRecord.data()
                : null;

            if (!adminRecord.exists || adminData?.active !== true) {
                await auth.signOut();
                redirectToLogin();
                return;
            }

            if (email) {
                email.textContent = user.email || "Administrator";
            }

            if (loading) {
                loading.hidden = true;
            }

            if (page) {
                page.hidden = false;
            }
        } catch (error) {
            /*
             * A temporary Firestore/network/rules error must not sign the user
             * out. The previous version did that, causing the login/dashboard
             * redirect loop.
             */
            showVerificationError(error);
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
});
