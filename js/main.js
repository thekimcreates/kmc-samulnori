/*
========================================

KMC SAMULNORI
Version 3.0

Main JavaScript

========================================
*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================
       ELEMENT REFERENCES
    ====================================== */

    const navbar = document.getElementById("navbar");

    const menuButton = document.getElementById("menu-toggle");

    const mobileMenu = document.getElementById("mobile-menu");

    const heroSlides = document.querySelectorAll(".hero-slide");

    const revealElements = document.querySelectorAll(".reveal");

    const images = document.querySelectorAll("img");





    /* ======================================
       NAVBAR
    ====================================== */

    function updateNavbar() {

        if (!navbar) return;

        if (window.scrollY > 40) {

            navbar.classList.add("scrolled");

        } else {

            navbar.classList.remove("scrolled");

        }

    }

    updateNavbar();

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );





    /* ======================================
       MOBILE MENU
    ====================================== */

    function openMenu() {

        if (!mobileMenu || !menuButton) return;

        mobileMenu.classList.add("open");

        menuButton.classList.add("active");

        document.body.style.overflow = "hidden";

    }



    function closeMenu() {

        if (!mobileMenu || !menuButton) return;

        mobileMenu.classList.remove("open");

        menuButton.classList.remove("active");

        document.body.style.overflow = "";

    }



    function toggleMenu() {

        if (!mobileMenu) return;

        if (mobileMenu.classList.contains("open")) {

            closeMenu();

        } else {

            openMenu();

        }

    }



    if (menuButton && mobileMenu) {

        menuButton.addEventListener(
            "click",
            toggleMenu
        );



        mobileMenu
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            });



        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    closeMenu();

                }

            }
        );



        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth > 900
                ) {

                    closeMenu();

                }

            }
        );



        document.addEventListener(
            "click",
            event => {

                if (
                    !mobileMenu.classList.contains("open")
                ) return;



                const clickedMenu =
                    mobileMenu.contains(
                        event.target
                    );

                const clickedButton =
                    menuButton.contains(
                        event.target
                    );

                if (
                    !clickedMenu &&
                    !clickedButton
                ) {

                    closeMenu();

                }

            }
        );

    }





    /* ======================================
       HERO SLIDESHOW
    ====================================== */

    let currentSlide = 0;

    function showSlide(index) {

        heroSlides.forEach(slide => {

            slide.classList.remove("active");

        });

        if (heroSlides[index]) {

            heroSlides[index].classList.add("active");

        }

    }
    function nextSlide() {

        if (heroSlides.length <= 1) return;

        currentSlide =
            (currentSlide + 1) %
            heroSlides.length;

        showSlide(currentSlide);

    }



    if (heroSlides.length > 0) {

        showSlide(0);

        setInterval(
            nextSlide,
            5000
        );

    }





    /* ======================================
       SCROLL REVEAL
    ====================================== */

    if (revealElements.length > 0) {

        const revealObserver =
            new IntersectionObserver(

                entries => {

                    entries.forEach(entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            revealObserver.unobserve(
                                entry.target
                            );

                        }

                    });

                },

                {
                    threshold: 0.15,
                    rootMargin: "0px 0px -50px 0px"
                }

            );



        revealElements.forEach(element => {

            revealObserver.observe(
                element
            );

        });

    }





    /* ======================================
       IMAGE LOADING
    ====================================== */

    images.forEach(image => {

        function markLoaded() {

            image.classList.add(
                "loaded"
            );

        }



        if (image.complete) {

            markLoaded();

        } else {

            image.addEventListener(
                "load",
                markLoaded
            );

        }

    });





    /* ======================================
       SMOOTH SCROLL LINKS
    ====================================== */

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const target =
                        document.querySelector(
                            link.getAttribute("href")
                        );

                    if (!target) return;

                    event.preventDefault();

                    target.scrollIntoView({

                        behavior:
                            "smooth",

                        block:
                            "start"

                    });

                }
            );

        });





    /* ======================================
       HERO PARALLAX
    ====================================== */

    const hero =
        document.querySelector(
            ".hero"
        );

    if (hero) {

        window.addEventListener(
            "scroll",

            () => {

                const offset =
                    window.scrollY * 0.25;

                hero.style.backgroundPositionY =
                    `${offset}px`;

            },

            {
                passive: true
            }

        );

    }
    /* ======================================
       DEVICE THEME
    ====================================== */

    const themeQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    function updateTheme() {

        document.documentElement.dataset.theme =
            themeQuery.matches
                ? "dark"
                : "light";

    }

    updateTheme();

    if (themeQuery.addEventListener) {

        themeQuery.addEventListener(
            "change",
            updateTheme
        );

    } else {

        // Safari fallback
        themeQuery.addListener(
            updateTheme
        );

    }





    /* ======================================
       PAGE FADE IN
    ====================================== */

    document.body.classList.add(
        "page-loaded"
    );





    /* ======================================
       FUTURE FIREBASE HOOK
    ====================================== */

    window.KMC = {

        version: "3.0",

        closeMenu,

        openMenu,

        updateNavbar

    };





    /* ======================================
       DEBUG (Development Only)
    ====================================== */

    console.log(
        "%cKMC Samulnori Website",
        "color:#8B0000;font-size:16px;font-weight:bold;"
    );

    console.log(
        "Version 3.0 Loaded Successfully"
    );

});
