/*
========================================

KMC SAMULNORI
Version 2.0
Main JavaScript

========================================
*/


document.addEventListener(
    "DOMContentLoaded",
    () => {



        /* ======================================
           NAVBAR SCROLL EFFECT
        ====================================== */


        const navbar = document.getElementById(
            "navbar"
        );


        function handleNavbarScroll() {


            if (!navbar) return;


            if (window.scrollY > 50) {


                navbar.classList.add(
                    "scrolled"
                );


            } else {


                navbar.classList.remove(
                    "scrolled"
                );


            }


        }


        window.addEventListener(
            "scroll",
            handleNavbarScroll
        );


        handleNavbarScroll();









        /* ======================================
           MOBILE MENU
        ====================================== */
menuButton.addEventListener("click", () => {

    const isOpen = mobileMenu.classList.toggle("open");

    menuButton.classList.toggle("active", isOpen);

});

mobileLinks.forEach(link => {

    link.addEventListener("click", () => {

        mobileMenu.classList.remove("open");
        menuButton.classList.remove("active");

    });

});




        /* ======================================
           HERO SLIDESHOW
        ====================================== */


        const slides =
            document.querySelectorAll(
                ".hero-slide"
            );



        let currentSlide = 0;



        function changeSlide() {


            if (
                slides.length <= 1
            ) return;



            slides[
                currentSlide
            ].classList.remove(
                "active"
            );



            currentSlide =
                (
                    currentSlide + 1
                )
                %
                slides.length;



            slides[
                currentSlide
            ].classList.add(
                "active"
            );


        }




        if (
            slides.length > 0
        ) {


            setInterval(
                changeSlide,
                5000
            );


        }









        /* ======================================
           SCROLL REVEAL
        ====================================== */


        const revealElements =
            document.querySelectorAll(
                ".reveal"
            );



        const observer =
            new IntersectionObserver(
                entries => {


                    entries.forEach(
                        entry => {


                            if (
                                entry.isIntersecting
                            ) {


                                entry.target.classList.add(
                                    "visible"
                                );


                                observer.unobserve(
                                    entry.target
                                );


                            }


                        }
                    );


                },
                {
                    threshold: 0.15
                }
            );



        revealElements.forEach(
            element => {


                observer.observe(
                    element
                );


            }
        );









        /* ======================================
           IMAGE LOADING OPTIMIZATION
        ====================================== */


        const images =
            document.querySelectorAll(
                "img"
            );



        images.forEach(
            image => {


                image.addEventListener(
                    "load",
                    () => {


                        image.classList.add(
                            "loaded"
                        );


                    }
                );


            }
        );








        /* ======================================
           DEVICE THEME SUPPORT
        ====================================== */


        const themeQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );



        function updateTheme() {


            document.documentElement.dataset.theme =
                themeQuery.matches
                    ? "dark"
                    : "light";


        }



        updateTheme();



        themeQuery.addEventListener(
            "change",
            updateTheme
        );



    }

);
