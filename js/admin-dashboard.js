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









// CHECK LOGIN


onAuthStateChanged(

auth,

(user)=>{


if(user){


welcome.textContent =

"Logged in as: " + user.email;



loadPerformances();



}

else{


window.location.href =

"login.html";


}



});









// ADD PERFORMANCE BUTTON


document

.getElementById(

"addPerformance"

)

.onclick = ()=>{


window.location.href =

"performance-add.html";


};









// TEAM BUTTON


document

.getElementById(

"manageTeam"

)

.onclick = ()=>{


window.location.href =

"../team.html";


};









// LOGOUT


document

.getElementById(

"logout"

)

.onclick = async ()=>{


await signOut(auth);



window.location.href =

"login.html";


};









// LOAD PERFORMANCE LIST


async function loadPerformances(){



const performanceQuery =

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

await getDocs(

performanceQuery

);






list.innerHTML = "";






snapshot.forEach(

(item)=>{



const data =

item.data();





const card =

document.createElement(

"div"

);



card.className =

"admin-performance-card";







card.innerHTML =

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



<button class="edit">

Edit

</button>


<button class="delete">

Delete

</button>

`;








// EDIT


card

.querySelector(

".edit"

)

.onclick = ()=>{


window.location.href =

"performance-add.html?id=" + item.id;


};









// DELETE


card

.querySelector(

".delete"

)

.onclick = async ()=>{



const confirmDelete =

confirm(

"Delete this performance?"

);



if(confirmDelete){



await deleteDoc(

doc(

db,

"performances",

item.id

)

);



card.remove();



}



};







list.appendChild(card);



});



}
