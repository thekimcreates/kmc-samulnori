// performance-add.js


import {

db,
storage

}

from "./firebase.js";



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








async function uploadFile(file,path){


const fileRef =

ref(

storage,

path

);



await uploadBytes(

fileRef,

file

);



return await getDownloadURL(

fileRef

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
