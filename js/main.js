// main.js


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








// =========================
// HERO SLIDESHOW
// =========================



const heroImages =

document.querySelectorAll(

".hero-image"

);



let currentHero = 0;





function changeHero(){


heroImages[currentHero]
.classList.remove(

"active"

);




currentHero++;



if(
currentHero >= heroImages.length
){

currentHero = 0;

}




heroImages[currentHero]
.classList.add(

"active"

);



}






setInterval(

changeHero,

5000

);









// =========================
// HOMEPAGE PERFORMANCE PREVIEW
// =========================



const performanceContainer =

document.getElementById(

"homePerformances"

);







async function loadHomePerformances(){



if(!performanceContainer)

return;






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


limit(3)

);







const snapshot =

await getDocs(

performanceQuery

);






snapshot.forEach(

(doc)=>{


const performance =

doc.data();



createPerformancePreview(

performance

);



});



}








function createPerformancePreview(data){



const card =

document.createElement(

"div"

);



card.className =

"home-performance-card";





card.style.backgroundImage =

`

linear-gradient(

rgba(0,0,0,.3),

rgba(0,0,0,.85)

),

url(${data.highlight})

`;





card.innerHTML =


`

<div>


<h3>

${data.arrangement}

</h3>



<p>

${data.location}

</p>



<p>

${data.date}

</p>


</div>

`;






performanceContainer.appendChild(

card

);



}







loadHomePerformances();
