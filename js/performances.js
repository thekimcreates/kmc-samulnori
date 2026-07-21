import { db } 
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



const close =
document.getElementById(
"closeModal"
);



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



snapshot.forEach(
(doc)=>{


const data =
doc.data();



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
rgba(0,0,0,.8)
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



card.onclick=()=>{

openPerformance(data);

};



container.appendChild(card);


});


}



function openPerformance(data){



modal.classList.remove(
"hidden"
);



document.getElementById(
"modalHighlight"
).src =
data.highlight;



document.getElementById(
"modalArrangement"
).innerHTML =
data.arrangement;



document.getElementById(
"modalDate"
).innerHTML =
data.date;



document.getElementById(
"modalLocation"
).innerHTML =
data.location;




const photos =
document.getElementById(
"modalPhotos"
);



photos.innerHTML="";



data.photos?.forEach(
(photo)=>{


const img =
document.createElement(
"img"
);


img.src=photo;


photos.appendChild(img);


});


}



close.onclick=()=>{

modal.classList.add(
"hidden"
);

}



loadPerformances();
