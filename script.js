/* ==========================================
   KMC SAMULNORI
   Interactive Experience
========================================== */



// ==========================================
// SCROLL REVEAL ANIMATION
// ==========================================


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
});



revealElements.forEach(element=>{

    revealObserver.observe(element);

});






// ==========================================
// NAVIGATION GLASS EFFECT
// ==========================================


const navbar = document.querySelector(".navbar");


window.addEventListener("scroll",()=>{


    if(window.scrollY > 50){

        navbar.style.background =
        "rgba(0,0,0,.75)";


        navbar.style.padding =
        "10px 28px";


    }

    else{


        navbar.style.background =
        "rgba(255,255,255,.08)";


        navbar.style.padding =
        "14px 28px";


    }


});






// ==========================================
// MOBILE MENU
// ==========================================


const menuButton =
document.querySelector(".menu-toggle");


const navLinks =
document.querySelector(".nav-links");



menuButton.addEventListener("click",()=>{


    navLinks.classList.toggle("open");


});






// ==========================================
// CLOSE MOBILE MENU AFTER CLICK
// ==========================================


document.querySelectorAll(".nav-links a")
.forEach(link=>{


    link.addEventListener("click",()=>{

        navLinks.classList.remove("open");

    });


});







// ==========================================
// HERO PARALLAX
// ==========================================


const hero =
document.querySelector(".hero");



window.addEventListener("scroll",()=>{


    let offset =
    window.scrollY;


    if(offset < window.innerHeight){


        hero.style.backgroundPosition =
        `center ${offset * .35}px`;


    }


});







// ==========================================
// BUTTON RIPPLE EFFECT
// ==========================================


document.querySelectorAll(".primary-btn")
.forEach(button=>{


button.addEventListener("click",(e)=>{


    const ripple =
    document.createElement("span");


    ripple.className="ripple";


    button.appendChild(ripple);



    setTimeout(()=>{

        ripple.remove();

    },600);



});


});






// ==========================================
// PAGE LOAD FADE
// ==========================================


window.addEventListener("load",()=>{


document.body.classList.add("loaded");


});
