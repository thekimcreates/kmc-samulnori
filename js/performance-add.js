// performance-add.js


import {

db,
storage

}

from "./firebase.js";



import {

collection,

addDoc,

doc,

getDoc,

updateDoc,

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







const message =

document.getElementById(

"message"

);






const params =

new URLSearchParams(

window.location.search

);



const performanceID =

params.get(

"id"

);








// =============================
// UPLOAD FILE FUNCTION
// =============================


async function uploadFile(file, folder){



const fileRef =

ref(

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








// =============================
// LOAD EXISTING PERFORMANCE
// =============================


async function loadPerformance(){



if(!performanceID)

return;






const performanceRef =

doc(

db,

"performances",

performanceID

);



const snapshot =

await getDoc(

performanceRef

);






if(snapshot.exists()){



const data =

snapshot.data();




document.getElementById(

"performanceID"

).value = performanceID;



document.getElementById(

"date"

).value = data.date || "";



document.getElementById(

"location"

).value = data.location || "";



document.getElementById(

"arrangement"

).value = data.arrangement || "";



document.querySelector(

"h1"

).textContent =

"Edit Performance";



}



}






loadPerformance();









// =============================
// SAVE PERFORMANCE
// =============================


document

.getElementById(

"submitPerformance"

)

.onclick = async ()=>{



try{



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






const highlightFile =

document.getElementById(

"highlightFile"

)

.files[0];





const photoFiles =

Array.from(

document.getElementById(

"photoFiles"

).files

);





const videoFiles =

Array.from(

document.getElementById(

"videoFiles"

).files

);








let highlight = "";



let photos = [];



let videos = [];








// Upload highlight


if(highlightFile){



highlight = await uploadFile(

highlightFile,

"performances/highlights"

);



}







// Upload photos


for(

const photo of photoFiles

){



const url =

await uploadFile(

photo,

"performances/photos"

);



photos.push(url);



}








// Upload videos


for(

const video of videoFiles

){



const url =

await uploadFile(

video,

"performances/videos"

);



videos.push(url);



}









const performanceData = {



date,

location,

arrangement,

created:

serverTimestamp()

};






if(highlight){

performanceData.highlight = highlight;

}



if(photos.length){

performanceData.photos = photos;

}



if(videos.length){

performanceData.videos = videos;

}










// EDIT MODE


if(performanceID){



await updateDoc(

doc(

db,

"performances",

performanceID

),

performanceData

);



message.textContent =

"Performance updated successfully!";



}






// NEW MODE


else{



await addDoc(

collection(

db,

"performances"

),

performanceData

);



message.textContent =

"Performance added successfully!";



}









}

catch(error){



console.error(error);



message.textContent =

"Error saving performance.";





}



};
);


}








document

.getElementById(

"submitPerformance"

)

.onclick = async ()=>{





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





const highlightFile =

document.getElementById(

"highlightFile"

).files[0];





const photoFiles =

[

...document.getElementById(

"photoFiles"

).files

];





const videoFiles =

[

...document.getElementById(

"videoFiles"

).files

];









try{



let highlight = "";



if(highlightFile){



highlight = await uploadFile(

highlightFile,

"performances/highlights/"+highlightFile.name

);



}





const photos = [];



for(const photo of photoFiles){


const url = await uploadFile(

photo,

"performances/photos/"+photo.name

);



photos.push(url);


}






const videos = [];



for(const video of videoFiles){


const url = await uploadFile(

video,

"performances/videos/"+video.name

);



videos.push(url);


}








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





alert(

"Performance added!"

);





}


catch(error){



console.error(error);



alert(

"Upload failed."

);



}



};
