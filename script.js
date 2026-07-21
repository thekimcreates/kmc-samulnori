/* =====================================================
   KMC SAMULNORI
   Homepage v2 JavaScript
===================================================== */



// =========================
// HERO IMAGE SLIDESHOW
// =========================


const slides = document.querySelectorAll(".hero-slide");


let currentSlide = 0;



function changeSlide(){


    if(slides.length === 0) return;


    slides[currentSlide].classList.remove("active");


    currentSlide++;


    if(currentSlide >= slides.length){

        currentSlide = 0;

    }


    slides[currentSlide].classList.add("active");


}



setInterval(changeSlide,5000);








// =========================
// SCROLL REVEAL
// =========================


const revealElements =
document.querySelectorAll(".reveal");



const revealObserver =
new IntersectionObserver(


(entries)=>{


entries.forEach(entry=>{


if(entry.isIntersecting){


entry.target.classList.add("active");


revealObserver.unobserve(entry.target);


}


});


},


{
threshold:.15
}


);



revealElements.forEach(element=>{


revealObserver.observe(element);


});








// =========================
// NAVIGATION EFFECT
// =========================


const navbar =
document.querySelector(".navbar");



window.addEventListener("scroll",()=>{


if(!navbar) return;



if(window.scrollY > 50){


navbar.style.background =
"rgba(0,0,0,.75)";


}


else{


navbar.style.background =
"rgba(255,255,255,.08)";


}


});








// =========================
// MOBILE MENU
// =========================


const menuButton =
document.querySelector(".menu-toggle");


const navLinks =
document.querySelector(".nav-links");



if(menuButton){


menuButton.addEventListener("click",()=>{


navLinks.classList.toggle("open");


});


}







// Close mobile menu after selection


document.querySelectorAll(".nav-links a")
.forEach(link=>{


link.addEventListener("click",()=>{


navLinks.classList.remove("open");


});


});








// =========================
// IMAGE LAZY LOADING
// =========================


document.querySelectorAll("img")
.forEach(image=>{


image.loading="lazy";


});








// =========================
// PAGE LOAD
// =========================


window.addEventListener("load",()=>{


document.body.classList.add("loaded");


});
