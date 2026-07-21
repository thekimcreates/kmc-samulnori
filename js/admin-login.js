// admin-login.js


import {

auth

}

from "./firebase.js";



import {

signInWithEmailAndPassword

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";








const emailInput =

document.getElementById(

"email"

);



const passwordInput =

document.getElementById(

"password"

);



const loginButton =

document.getElementById(

"loginButton"

);



const errorMessage =

document.getElementById(

"error"

);








loginButton.onclick = async ()=>{



const email =

emailInput.value;



const password =

passwordInput.value;





try{



await signInWithEmailAndPassword(

auth,

email,

password

);





window.location.href =

"dashboard.html";





}

catch(error){



console.error(error);



errorMessage.textContent =

"Incorrect email or password.";



}



};
