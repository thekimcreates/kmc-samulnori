// admin-dashboard.js



import {

auth

}

from "./firebase.js";



import {

onAuthStateChanged,

signOut

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";








const welcome =

document.getElementById(

"welcome"

);



const logoutButton =

document.getElementById(

"logout"

);



const addPerformanceButton =

document.getElementById(

"addPerformance"

);








onAuthStateChanged(

auth,

(user)=>{



if(user){



welcome.textContent =

"Logged in as: " + user.email;



}



else{



window.location.href =

"login.html";



}



});








addPerformanceButton.onclick = ()=>{


window.location.href =

"performance-add.html";


};









logoutButton.onclick = async ()=>{


await signOut(auth);



window.location.href =

"login.html";



};
