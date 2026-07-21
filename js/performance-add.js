// performance-add.js


import {

db

}

from "./firebase.js";



import {

collection,

addDoc,

serverTimestamp

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";









const submitButton =

document.getElementById(

"submitPerformance"

);



const message =

document.getElementById(

"message"

);








submitButton.onclick = async ()=>{



const date =

document.getElementById(

"date"

).value;




const location =

document.getElementById(

"location"

).value;




const arrangement =

document.getElementById(

"arrangement"

).value;





const highlight =

document.getElementById(

"highlight"

).value;





const photos =

document.getElementById(

"photos"

).value

.split(",")

.map(

item=>item.trim()

)

.filter(Boolean);





const videos =

document.getElementById(

"videos"

).value

.split(",")

.map(

item=>item.trim()

)

.filter(Boolean);








try{



await addDoc(

collection(

db,

"performances"

),


{


date,

location,

arrangement,

highlight,


photos,


videos,


created:

serverTimestamp()


}

);





message.textContent =

"Performance added successfully!";






}



catch(error){



console.error(error);



message.textContent =

"Error adding performance.";





}



};
