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

let menuScrollPosition = 0;

function isMenuOpen() {
    return (
        mobileMenu &&
        mobileMenu.classList.contains("open")
    );
}


function lockPageScroll() {
    menuScrollPosition = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${menuScrollPosition}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
}


function unlockPageScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    window.scrollTo(0, menuScrollPosition);
}


function openMenu() {
    if (!mobileMenu || !menuButton) return;
    if (isMenuOpen()) return;

    mobileMenu.classList.add("open");
    menuButton.classList.add("active");

    menuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    menuButton.setAttribute(
        "aria-label",
        "Close navigation menu"
    );

    mobileMenu.setAttribute(
        "aria-hidden",
        "false"
    );

    lockPageScroll();

    const firstMenuLink =
        mobileMenu.querySelector("a");

    if (firstMenuLink) {
        window.setTimeout(() => {
            firstMenuLink.focus({
                preventScroll: true
            });
        }, 150);
    }
}


function closeMenu(restoreFocus = false) {
    if (!mobileMenu || !menuButton) return;
    if (!isMenuOpen()) return;

    mobileMenu.classList.remove("open");
    menuButton.classList.remove("active");

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.setAttribute(
        "aria-label",
        "Open navigation menu"
    );

    mobileMenu.setAttribute(
        "aria-hidden",
        "true"
    );

    unlockPageScroll();

    if (restoreFocus) {
        menuButton.focus({
            preventScroll: true
        });
    }
}


function toggleMenu() {
    if (isMenuOpen()) {
        closeMenu();
    } else {
        openMenu();
    }
}


function keepFocusInsideMenu(event) {
    if (
        event.key !== "Tab" ||
        !isMenuOpen()
    ) {
        return;
    }

    const focusableElements = [
        menuButton,
        ...mobileMenu.querySelectorAll("a")
    ];

    const firstElement =
        focusableElements[0];

    const lastElement =
        focusableElements[
            focusableElements.length - 1
        ];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    }

    if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }
}


if (menuButton && mobileMenu) {
    /*
    Add accessibility attributes in JavaScript
    so the HTML remains simple.
    */

    menuButton.setAttribute(
        "aria-controls",
        "mobile-menu"
    );

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    mobileMenu.setAttribute(
        "aria-hidden",
        "true"
    );


    /*
    Open or close from the hamburger button.
    */

    menuButton.addEventListener(
        "click",
        event => {
            event.stopPropagation();
            toggleMenu();
        }
    );


    /*
    Close after selecting any navigation link.
    */

    mobileMenu
        .querySelectorAll("a")
        .forEach(link => {
            link.addEventListener(
                "click",
                () => {
                    closeMenu();
                }
            );
        });


    /*
    Close when the empty menu background is tapped.
    A click directly on a link will still follow it.
    */

    mobileMenu.addEventListener(
        "click",
        event => {
            if (event.target === mobileMenu) {
                closeMenu(true);
            }
        }
    );


    /*
    Escape closes the menu.
    Tab remains trapped inside while open.
    */

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                isMenuOpen()
            ) {
                event.preventDefault();
                closeMenu(true);
                return;
            }

            keepFocusInsideMenu(event);
        }
    );


    /*
    Automatically reset the mobile menu when
    switching back to the desktop layout.
    */

    window.addEventListener(
        "resize",
        () => {
            if (
                window.innerWidth > 900 &&
                isMenuOpen()
            ) {
                closeMenu();
            }
        },
        { passive: true }
    );


    /*
    Close the menu if browser history navigation
    restores the page from cache.
    */

    window.addEventListener(
        "pageshow",
        () => {
            if (isMenuOpen()) {
                closeMenu();
            }
        }
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
