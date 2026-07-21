// arrangements.js


import { db } from "./firebase.js";


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







// =========================
// ARRANGEMENT DATA
// =========================



const arrangements = [


{

name:

"Samulnori 사물놀이",


image:

"assets/arrangements/samulnori.jpg",


instruments:

"Janggu, Buk, Jing, Kkwaenggwari",


description:

"Samulnori is a traditional Korean percussion performance featuring four instruments that create powerful and energetic rhythms."


},



{

name:

"Nongak 농악",


image:

"assets/arrangements/nongak.jpg",


instruments:

"Percussion instruments, dance, and movement",


description:

"Nongak combines music, movement, and community celebration through dynamic outdoor performances."


},



{

name:

"Ogomu 오고무",


image:

"assets/arrangements/ogomu.jpg",


instruments:

"Five-drum arrangement performed with sticks and coordinated movement",


description:

"Ogomu is a visually powerful drum performance emphasizing precision, rhythm, and choreography."


},



{

name:

"Nanta 난타",


image:

"assets/arrangements/nanta.jpg",


instruments:

"Kitchen percussion objects and drums",


description:

"Nanta combines Korean percussion with modern theatrical performance and storytelling."


},



{

name:

"Sogo 소고춤",


image:

"assets/arrangements/sogo.jpg",


instruments:

"Sogo small hand drum",


description:

"Sogo dance combines rhythmic patterns with movement, creating a colorful and energetic performance."


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





card.style.backgroundImage =

`

linear-gradient(

rgba(0,0,0,.2),

rgba(0,0,0,.85)

),

url(${arrangement.image})

`;






card.innerHTML =


`

<div class="arrangement-overlay">


<h2>

${arrangement.name}

</h2>



<div class="expand-arrow">

↓


</div>


</div>

`;






card.onclick = ()=>{


openArrangement(

arrangement

);


};






container.appendChild(card);



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

arrangement.name;






document.getElementById(

"arrangementInstruments"

).textContent =

arrangement.instruments;






document.getElementById(

"arrangementDescription"

).textContent =

arrangement.description;





// Get latest performance


const latest =

await getLatestPerformance(

arrangement.name

);



document.getElementById(

"arrangementPerformance"

).textContent =


latest;



}









// =========================
// FIND MOST RECENT PERFORMANCE
// =========================


async function getLatestPerformance(name){



try{



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


limit(10)

);





const snapshot =

await getDocs(

performanceQuery

);







for(

const doc of snapshot.docs

){



const data =

doc.data();





if(

data.arrangement === name

){



return `${data.date} - ${data.location}`;



}



}






return "No performance recorded yet.";





}

catch(error){



console.error(error);



return "No performance recorded yet.";



}



}








// =========================
// CLOSE MODAL
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
