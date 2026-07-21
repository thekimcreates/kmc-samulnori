// main.js


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









// =========================
// HERO SLIDESHOW
// =========================



const heroImages = [


"assets/hero/hero1.jpg",


"assets/hero/hero2.jpg",


"assets/hero/hero3.jpg",


"assets/hero/hero4.jpg",


"assets/hero/hero5.jpg"



];





let heroIndex = 0;



const heroBackground =

document.getElementById(

"heroBackground"

);






function changeHero(){



heroBackground.style.backgroundImage =

`

url(${heroImages[heroIndex]})

`;



heroIndex++;




if(heroIndex >= heroImages.length){

heroIndex = 0;

}



}







changeHero();



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






performanceContainer.innerHTML="";








snapshot.forEach(

(doc)=>{



const data =

doc.data();







const card =

document.createElement(

"div"

);



card.className =

"home-performance";







card.style.backgroundImage =

`

linear-gradient(

rgba(0,0,0,.25),

rgba(0,0,0,.85)

),

url(${data.highlight})

`;







card.innerHTML =

`

<div>


<h3>

${data.date}

</h3>


<p>

${data.location}

</p>


<p>

${data.arrangement}

</p>


</div>

`;







performanceContainer.appendChild(

card

);



});



}







loadHomePerformances();
