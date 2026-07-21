// performance-add.js

import { db, storage } from "./firebase.js";


import {

collection,
addDoc,
serverTimestamp

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {

ref,
uploadBytes,
getDownloadURL

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";




// Upload a file to Firebase Storage

async function uploadFile(file, folder){


const fileRef = ref(

storage,

`${folder}/${Date.now()}-${file.name}`

);



await uploadBytes(

fileRef,

file

);



return await getDownloadURL(

fileRef

);


}





const form =
document.getElementById(
"performanceForm"
);





form.addEventListener(

"submit",

async(event)=>{


event.preventDefault();




try{



// Basic information

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





// -----------------------------
// Upload Highlight Image
// -----------------------------


const highlightFile =
document.getElementById(
"highlightFile"
).files[0];



let highlightURL = "";



if(highlightFile){


highlightURL =
await uploadFile(

highlightFile,

"performances/highlights"

);


}





// -----------------------------
// Upload Gallery Photos
// -----------------------------


const photoFiles = [

...

document.getElementById(
"photoFiles"
).files

];



const photoURLs = [];



for(
const photo of photoFiles
){


const url =
await uploadFile(

photo,

"performances/photos"

);



photoURLs.push(url);


}





// -----------------------------
// Add Video Information
// -----------------------------


const videos = [];



const videoURL =
document.getElementById(
"videoURL"
).value;



if(videoURL){


videos.push({


title:

document.getElementById(
"videoTitle"
).value,



thumbnail:

document.getElementById(
"videoThumbnail"
).value,



url:

videoURL,



length:

document.getElementById(
"videoLength"
).value



});


}





// -----------------------------
// Save Performance
// -----------------------------


await addDoc(

collection(

db,

"performances"

),

{


date:


date,



location:


location,



arrangement:


arrangement,



highlight:


highlightURL,



photos:


photoURLs,



videos:


videos,



created:


serverTimestamp()


}


);




alert(
"Performance Published Successfully!"
);



form.reset();



}



catch(error){


console.error(

"Error adding performance:",

error

);



alert(

"Failed to publish performance."

);


}



});
