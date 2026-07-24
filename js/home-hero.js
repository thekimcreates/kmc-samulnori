"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".hero-slider");
    const controls = document.getElementById("hero-carousel-controls");
    const previousButton = document.getElementById("hero-previous");
    const nextButton = document.getElementById("hero-next");
    const dotsHost = document.getElementById("hero-carousel-dots");
    const db = window.kmcFirebase?.db;
    const AUTOPLAY_DELAY = 5000;
    const TRANSITION_LOCK = 650;

    if (!slider || !controls || !previousButton || !nextButton || !dotsHost) return;

    let slides = [];
    let dots = [];
    let currentIndex = 0;
    let autoplayTimer = 0;
    let transitionTimer = 0;
    let transitioning = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const fallbackImages = [...slider.querySelectorAll(".hero-slide")]
        .map(slide => {
            const match = slide.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
            return match?.[1] || "";
        })
        .filter(Boolean)
        .map((url, order) => ({ id: `default-${order + 1}`, url, order }));

    const normalizedImages = value => (Array.isArray(value) ? value : [])
        .filter(item => item && typeof item.url === "string" && item.url.trim())
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    function stopAutoplay() {
        window.clearTimeout(autoplayTimer);
        autoplayTimer = 0;
    }

    function scheduleAutoplay() {
        stopAutoplay();
        if (slides.length <= 1 || document.hidden) return;
        autoplayTimer = window.setTimeout(() => {
            showSlide(currentIndex + 1);
            scheduleAutoplay();
        }, AUTOPLAY_DELAY);
    }

    function preloadAround(index) {
        if (slides.length < 2) return;
        [index + 1, index - 1].forEach(candidate => {
            const slide = slides[(candidate + slides.length) % slides.length];
            const source = slide?.dataset.imageUrl;
            if (source) {
                const image = new Image();
                image.src = source;
            }
        });
    }

    function showSlide(index) {
        if (!slides.length) return;
        currentIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === currentIndex));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === currentIndex));
        preloadAround(currentIndex);
    }

    function setTransitionLock() {
        transitioning = true;
        previousButton.disabled = true;
        nextButton.disabled = true;
        window.clearTimeout(transitionTimer);
        transitionTimer = window.setTimeout(() => {
            transitioning = false;
            previousButton.disabled = false;
            nextButton.disabled = false;
        }, TRANSITION_LOCK);
    }

    function manualMove(offset) {
        if (transitioning || slides.length <= 1) return;
        setTransitionLock();
        showSlide(currentIndex + offset);
        scheduleAutoplay();
    }

    function buildCarousel(images) {
        slider.replaceChildren();
        dotsHost.replaceChildren();
        slides = [];
        dots = [];
        currentIndex = 0;

        images.forEach((item, index) => {
            const safeUrl = String(item.url).replace(/"/g, "%22");
            const slide = document.createElement("div");
            slide.className = `hero-slide${index === 0 ? " active" : ""}`;
            slide.style.backgroundImage = `url("${safeUrl}")`;
            slide.dataset.imageUrl = item.url;
            slide.setAttribute("role", "img");
            slide.setAttribute("aria-label", `KMC Samulnori hero image ${index + 1} of ${images.length}`);
            slider.appendChild(slide);
            slides.push(slide);

            const dot = document.createElement("span");
            dot.className = `hero-carousel-dot${index === 0 ? " active" : ""}`;
            dotsHost.appendChild(dot);
            dots.push(dot);
        });

        controls.hidden = slides.length <= 1;
        transitioning = false;
        previousButton.disabled = false;
        nextButton.disabled = false;
        preloadAround(0);
        scheduleAutoplay();
    }

    previousButton.addEventListener("click", () => manualMove(-1));
    nextButton.addEventListener("click", () => manualMove(1));

    document.addEventListener("keydown", event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (event.key === "ArrowLeft") manualMove(-1);
        if (event.key === "ArrowRight") manualMove(1);
    });

    slider.addEventListener("touchstart", event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });

    slider.addEventListener("touchend", event => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
            manualMove(deltaX > 0 ? -1 : 1);
        }
    }, { passive: true });

    document.addEventListener("visibilitychange", () => document.hidden ? stopAutoplay() : scheduleAutoplay());

    buildCarousel(fallbackImages);

    if (db) {
        db.collection("siteContent").doc("homeSections").get()
            .then(snapshot => {
                const firebaseImages = normalizedImages(snapshot.data()?.heroImages);
                if (firebaseImages.length) buildCarousel(firebaseImages);
            })
            .catch(error => console.warn("Hero images could not be loaded from Firebase:", error));
    }
});
