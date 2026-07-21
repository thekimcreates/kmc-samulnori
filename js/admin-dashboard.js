// admin-dashboard.js



import {

auth,
db

}

from "./firebase.js";



import {

onAuthStateChanged,

signOut

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";



import {

collection,

getDocs,

query,

orderBy,

deleteDoc,

doc

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";








const welcome =

document.getElementById(

"welcome"

);



const list =

document.getElementById(

"performanceList"

);






onAuthStateChanged(

auth,

(user)=>{



if(user){


welcome.textContent =

"Logged in as: " + user.email;



loadPerformances();



}

else{


window.location.href="login.html";


}



});









// ADD PERFORMANCE


document

.getElementById(

"addPerformance"

)

.onclick = ()=>{


window.location.href=

"performance-add.html";


};








// MANAGE TEAM


document

.getElementById(

"manageTeam"

)

.onclick = ()=>{


alert(

"Team management coming next."

);


};









// LOGOUT


document

.getElementById(

"logout"

)

.onclick = async ()=>{


await signOut(auth);


window.location.href=

"login.html";


};









async function loadPerformances(){



const q =

query(

collection(

db,

"performances"

),


orderBy(

"created",

"desc"

)

);




const snapshot =

await getDocs(q);




list.innerHTML="";






snapshot.forEach(

(item)=>{



const data = item.data();





const box =

document.createElement(

"div"

);



box.innerHTML =

`

<h3>

${data.date}

</h3>


<p>

${data.location}

</p>


<p>

${data.arrangement}

</p>


<button class="delete">

Delete

</button>

`;







box.querySelector(

".delete"

)

.onclick = async ()=>{



await deleteDoc(

doc(

db,

"performances",

item.id

)

);



box.remove();



};






list.appendChild(box);



});



}
