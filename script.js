/* =====================================================
   KMC SAMULNORI
   Interactive Experience
===================================================== */



// =========================
// SCROLL REVEAL ANIMATION
// =========================


const revealElements = document.querySelectorAll(".reveal");


const revealObserver = new IntersectionObserver(

(entries)=>{


entries.forEach(entry=>{


if(entry.isIntersecting){


entry.target.classList.add("active");


revealObserver.unobserve(entry.target);


}


});


},


{
    threshold:0.15
}

);



revealElements.forEach(element=>{


revealObserver.observe(element);


});







// =========================
// NAVIGATION EFFECT
// =========================


const navbar = document.querySelector(".navbar");


window.addEventListener("scroll",()=>{


if(window.scrollY > 60){


navbar.style.background =
"rgba(0,0,0,0.75)";


navbar.style.padding =
"10px 30px";


}


else{


navbar.style.background =
"rgba(255,255,255,0.08)";


navbar.style.padding =
"14px 30px";


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







// =========================
// CLOSE MENU AFTER CLICK
// =========================


document.querySelectorAll(".nav-links a")
.forEach(link=>{


link.addEventListener("click",()=>{


navLinks.classList.remove("open");


});


});







// =========================
// HERO PARALLAX
// =========================


const hero =
document.querySelector(".hero");



window.addEventListener("scroll",()=>{


if(!hero) return;



const scroll =
window.scrollY;



if(scroll < window.innerHeight){


hero.style.backgroundPosition =
`center ${scroll * .35}px`;


}



});








// =========================
// BUTTON RIPPLE
// =========================


document.querySelectorAll(".primary-btn")
.forEach(button=>{


button.addEventListener("click",(event)=>{


const ripple =
document.createElement("span");



const rect =
button.getBoundingClientRect();



ripple.style.left =
`${event.clientX - rect.left}px`;



ripple.style.top =
`${event.clientY - rect.top}px`;



ripple.className =
"ripple";



button.appendChild(ripple);



setTimeout(()=>{


ripple.remove();


},600);



});


});








// =========================
// ACTIVE NAV LINK
// =========================


const sections =
document.querySelectorAll("section[id]");


const navItems =
document.querySelectorAll(".nav-links a");



window.addEventListener("scroll",()=>{


let current="";



sections.forEach(section=>{


const sectionTop =
section.offsetTop - 150;



if(window.scrollY >= sectionTop){


current =
section.getAttribute("id");


}


});



navItems.forEach(link=>{


link.style.color="";



if(link.getAttribute("href")
===
"#"+current){


link.style.color="#ffffff";


}


});


});








// =========================
// IMAGE LAZY LOADING
// =========================


const images =
document.querySelectorAll("img");



images.forEach(img=>{


img.loading="lazy";


});








// =========================
// PAGE LOAD EFFECT
// =========================


window.addEventListener("load",()=>{


document.body.classList.add("loaded");


});
