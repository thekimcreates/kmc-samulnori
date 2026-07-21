import { db } from "./firebase.js";


import {
collection,
addDoc,
serverTimestamp

} from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



const form =
document.getElementById(
"performanceForm"
);



form.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const performance = {


date:
document.getElementById("date").value,


location:
document.getElementById("location").value,


arrangement:
document.getElementById("arrangement").value,


highlight:
document.getElementById("highlight").value,


created:
serverTimestamp()


};



try{


await addDoc(

collection(
db,
"performances"
),

performance

);



alert(
"Performance Added!"
);



form.reset();



}


catch(error){


console.error(error);


alert(
"Error adding performance"
);


}



});
