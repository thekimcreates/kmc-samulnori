// performances.js


import {

db

}

from "./firebase.js";



import {

collection,

getDocs,

query,

orderBy

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";








const container =

document.getElementById(

"performanceContainer"

);



const modal =

document.getElementById(

"performanceModal"

);



const closeButton =

document.getElementById(

"closeModal"

);








// =========================
// LOAD PERFORMANCES
// =========================



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






container.innerHTML="";








snapshot.forEach(

(doc)=>{



const data =

doc.data();




createPerformanceCard(

data

);



});





}









// =========================
// CREATE CARD
// =========================



function createPerformanceCard(data){



const card =

document.createElement(

"div"

);



card.className =

"performance-card";





card.style.backgroundImage =

`

linear-gradient(

rgba(0,0,0,.15),

rgba(0,0,0,.8)

),

url(${data.highlight})

`;






card.innerHTML =


`

<div class="performance-overlay">


<div class="performance-text">


<h2>

${data.arrangement}

</h2>



<p>

${data.location}

</p>



<p>

${data.date}

</p>


</div>


</div>

`;







card.onclick = ()=>{


openPerformance(

data

);



};







container.appendChild(

card

);



}









// =========================
// OPEN PERFORMANCE
// =========================



function openPerformance(data){



modal.classList.remove(

"hidden"

);





document.getElementById(

"modalHighlight"

).src =

data.highlight || "";




document.getElementById(

"modalDate"

).textContent =

data.date;




document.getElementById(

"modalLocation"

).textContent =

"Location: " + data.location;



document.getElementById(

"modalArrangement"

).textContent =

"Arrangement: " + data.arrangement;









const photoBox =

document.getElementById(

"modalPhotos"

);



photoBox.innerHTML="";







if(data.photos){



data.photos.forEach(

(photo)=>{



const img =

document.createElement(

"img"

);



img.src = photo;



photoBox.appendChild(

img

);



});



}









const videoBox =

document.getElementById(

"modalVideos"

);



videoBox.innerHTML="";







if(data.videos){



data.videos.forEach(

(video)=>{



const wrapper =

document.createElement(

"div"

);



wrapper.className =

"video-container";





const element =

document.createElement(

"video"

);



element.src = video;



element.controls = true;



element.preload = "metadata";







const duration =

document.createElement(

"span"

);



duration.className =

"video-duration";



duration.textContent =

"--:--";








element.onloadedmetadata = ()=>{



const minutes =

Math.floor(

element.duration / 60

);



const seconds =

Math.floor(

element.duration % 60

)

.toString()

.padStart(

2,

"0"

);



duration.textContent =

`${minutes}:${seconds}`;



};







wrapper.appendChild(

element

);



wrapper.appendChild(

duration

);



videoBox.appendChild(

wrapper

);



});



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









loadPerformances();
