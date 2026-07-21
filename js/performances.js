// performances.js


import { db } from "./firebase.js";


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





const performanceModal =

document.getElementById(

"performanceModal"

);



const closeModal =

document.getElementById(

"closeModal"

);





const videoViewer =

document.getElementById(

"videoViewer"

);



const videoFrame =

document.getElementById(

"videoFrame"

);



const closeVideo =

document.getElementById(

"closeVideo"

);









// =========================
// LOAD PERFORMANCES
// =========================



async function loadPerformances(){



const performancesQuery =

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

performancesQuery

);





snapshot.forEach(

(document)=>{



const data =

document.data();




createPerformanceCard(

data

);



});


}








// =========================
// CREATE PERFORMANCE CARD
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

rgba(0,0,0,.2),

rgba(0,0,0,.85)

),

url(${data.highlight})

`;





card.innerHTML =

`

<div class="performance-info">


<h2>

${data.arrangement}

</h2>



<p>

${data.location}

</p>



<p>

${data.date} ↗

</p>


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



performanceModal.classList.remove(

"hidden"

);





document.getElementById(

"modalHighlight"

).src =

data.highlight;






document.getElementById(

"modalArrangement"

).textContent =

data.arrangement;






document.getElementById(

"modalDate"

).textContent =

data.date;






document.getElementById(

"modalLocation"

).textContent =

data.location;






// LOAD PHOTOS



const photosContainer =

document.getElementById(

"modalPhotos"

);



photosContainer.innerHTML = "";





if(data.photos){



data.photos.forEach(

(photo)=>{


const image =

document.createElement(

"img"

);



image.src = photo;



photosContainer.appendChild(

image

);



});


}








// LOAD VIDEOS



const videosContainer =

document.getElementById(

"modalVideos"

);



videosContainer.innerHTML = "";





if(data.videos){



data.videos.forEach(

(video)=>{



const videoCard =

document.createElement(

"div"

);



videoCard.className =

"video-card";






videoCard.innerHTML =

`

<img src="${video.thumbnail}">


<div class="video-duration">

${video.length}

</div>

`;






videoCard.onclick = ()=>{


openVideo(

video.url

);


};






videosContainer.appendChild(

videoCard

);



});


}



}










// =========================
// VIDEO VIEWER
// =========================



function openVideo(url){



videoFrame.src = url;



videoViewer.classList.remove(

"hidden"

);



}






closeVideo.onclick = ()=>{


videoViewer.classList.add(

"hidden"

);



videoFrame.src = "";



};









// =========================
// CLOSE PERFORMANCE
// =========================



closeModal.onclick = ()=>{


performanceModal.classList.add(

"hidden"

);


};









// CLOSE WHEN CLICKING OUTSIDE



performanceModal.onclick = (event)=>{


if(event.target === performanceModal){


performanceModal.classList.add(

"hidden"

);


}


};








videoViewer.onclick = (event)=>{


if(event.target === videoViewer){


videoViewer.classList.add(

"hidden"

);



videoFrame.src = "";



}


};








// START


loadPerformances();
