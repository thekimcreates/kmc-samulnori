"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const form=document.getElementById("admin-login-form"), email=document.getElementById("admin-email"), password=document.getElementById("admin-password"), toggle=document.getElementById("password-toggle"), submit=document.getElementById("admin-login-submit"), status=document.getElementById("login-status");
  const {auth,db}=window.kmcFirebase||{};
  const message=(text,type="")=>{status.textContent=text;status.className="login-status"+(type?` is-${type}`:"");};
  const loading=(on)=>{submit.disabled=on;submit.querySelector("span").textContent=on?"Verifying…":"Sign In";};
  const authorized=async user=>{const doc=await db.collection("admins").doc(user.uid).get();return doc.exists&&doc.data().active===true;};
  const friendly=e=>({"auth/invalid-email":"Enter a valid email address.","auth/too-many-requests":"Too many attempts. Try again later.","auth/network-request-failed":"Network error. Check your connection.","auth/invalid-credential":"The email or password is incorrect.","auth/user-not-found":"The email or password is incorrect.","auth/wrong-password":"The email or password is incorrect."}[e.code]||"Unable to sign in. Please try again.");
  toggle.addEventListener("click",()=>{const hidden=password.type==="password";password.type=hidden?"text":"password";toggle.textContent=hidden?"Hide":"Show";});
  if(!auth||!db){message("Firebase is not configured yet. Add your project values in js/firebase.js.","error");submit.disabled=true;return;}
  auth.onAuthStateChanged(async user=>{if(user&&await authorized(user))location.replace("dashboard.html");});
  form.addEventListener("submit",async e=>{e.preventDefault();message("");if(!email.value.trim()||!password.value){message("Enter your email and password.","error");return;}loading(true);try{const result=await auth.signInWithEmailAndPassword(email.value.trim(),password.value);if(!(await authorized(result.user))){await auth.signOut();message("This account does not have administrator access.","error");return;}message("Access verified. Opening the dashboard…","success");location.replace("dashboard.html");}catch(err){console.error(err);message(friendly(err),"error");}finally{loading(false);}});
});
