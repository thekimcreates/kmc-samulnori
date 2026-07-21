// arrangements.js


import {

db

}

from "./firebase.js";



import {

collection,

getDocs,

query,

orderBy,

limit

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";








const container =

document.getElementById(

"arrangementContainer"

);



const modal =

document.getElementById(

"arrangementModal"

);



const closeButton =

document.getElementById(

"closeArrangement"

);








const arrangements = [


{

title:

"Samulnori 사물놀이",

image:

"assets/arrangements/samulnori.jpg",

instruments:

"Kkwaenggwari, Jing, Janggu, Buk",

description:

"A traditional Korean percussion ensemble featuring four instruments working together to create powerful rhythms and energy."

},



{

title:

"Nongak 농악",

image:

"assets/arrangements/nongak.jpg",

instruments:

"Samul instruments, dance, flags, and movement",

description:

"A Korean farming music tradition combining percussion, dance, and community celebration."

},



{

title:

"Ogomu 오고무",

image:

"assets/arrangements/ogomu.jpg",

instruments:

"Five-sided drum performance",

description:

"A visually powerful drum performance featuring dancers playing multiple drums with synchronized movements."

},



{

title:

"Nanta 난타",

image:

"assets/arrangements/nanta.jpg",

instruments:

"Kitchen percussion, drums, and rhythmic objects",

description:

"A modern performance combining Korean percussion with energetic theatrical movement."

},



{

title:

"Sogo 소고춤",

image:

"assets/arrangements/sogo.jpg",

instruments:

"Sogo small hand drum",

description:

"A traditional Korean dance featuring the sogo drum and graceful movements."

}



];









// =========================
// CREATE CARDS
// =========================


arrangements.forEach(

(arrangement)=>{



const card =

document.createElement(

"div"

);



card.className =

"arrangement-card";






card.innerHTML =

`

<img src="${arrangement.image}">



<h2>

${arrangement.title}

</h2>



<div class="expand-arrow">

⌄

</div>

`;







card.onclick = ()=>{


openArrangement(

arrangement

);



};







container.appendChild(

card

);



});









// =========================
// OPEN ARRANGEMENT
// =========================



async function openArrangement(arrangement){



modal.classList.remove(

"hidden"

);







document.getElementById(

"arrangementImage"

).src =

arrangement.image;





document.getElementById(

"arrangementTitle"

).textContent =

arrangement.title;





document.getElementById(

"arrangementDescription"

).textContent =

arrangement.description;





document.getElementById(

"arrangementInstruments"

).textContent =

arrangement.instruments;








const latest =

await getLatestPerformance(

arrangement.title

);







document.getElementById(

"arrangementPerformance"

).textContent =



latest

?

`${latest.date} - ${latest.location}`

:

"No performances recorded yet.";





}









// =========================
// GET MOST RECENT PERFORMANCE
// =========================



async function getLatestPerformance(arrangementName){



const performanceQuery =

query(

collection(

db,

"performances"

),


orderBy(

"created",

"desc"

),


limit(20)

);






const snapshot =

await getDocs(

performanceQuery

);






let result = null;






snapshot.forEach(

(doc)=>{



const data =

doc.data();





if(

!result &&

data.arrangement === arrangementName

){



result = data;



}



});





return result;



}









// =========================
// CLOSE
// =========================



closeButton.onclick = ()=>{



modal.classList.add(

"hidden"

);



};








modal.onclick = (event)=>{



if(

event.target === modal

){



modal.classList.add(

"hidden"

);



}



};
