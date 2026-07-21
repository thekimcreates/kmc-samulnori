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



const form =
document.getElementById(
"performanceForm"
);



async function uploadFile(file,path){


const storageRef =
ref(
storage,
path + "/" + file.name
);


await uploadBytes(
storageRef,
file
);


return await getDownloadURL(
storageRef
);


}



form.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const date =
document.getElementById("date").value;


const location =
document.getElementById("location").value;


const arrangement =
document.getElementById("arrangement").value;



// Upload highlight image

const highlightFile =
document.getElementById(
"highlightFile"
).files[0];



const highlightURL =
await uploadFile(
highlightFile,
"performances/highlights"
);



// Upload gallery photos

const photoFiles =
[
...document.getElementById(
"photoFiles"
).files
];


const photoURLs=[];



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



// Upload performance document

await addDoc(

collection(
db,
"performances"
),

{

date,

location,

arrangement,

highlight:
highlightURL,

photos:
photoURLs,

created:
serverTimestamp()

}

);



alert(
"Performance Published!"
);



form.reset();


});
