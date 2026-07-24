"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".hero-slider");
    const previousButton = document.getElementById("hero-previous");
    const nextButton = document.getElementById("hero-next");
    const dotsHost = document.getElementById("hero-carousel-dots");
    const db = window.kmcFirebase?.db;
    const AUTOPLAY_DELAY = 5000;

    if (!slider || !previousButton || !nextButton || !dotsHost) return;

    let slides = [];
    let dots = [];
    let currentIndex = 0;
    let autoplayTimer = 0;

    const fallbackImages = [...slider.querySelectorAll(".hero-slide")]
        .map(slide => {
            const match = slide.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
            return match?.[1] || "";
        })
        .filter(Boolean)
        .map((url, order) => ({ id: `default-${order + 1}`, url, order }));

    function normalizedImages(value) {
        return (Array.isArray(value) ? value : [])
            .filter(item => item && typeof item.url === "string" && item.url.trim())
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    }

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

    function showSlide(index) {
        if (!slides.length) return;
        currentIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === currentIndex));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === currentIndex));
    }

    function buildCarousel(images) {
        slider.replaceChildren();
        dotsHost.replaceChildren();
        slides = [];
        dots = [];
        currentIndex = 0;

        images.forEach((item, index) => {
            const slide = document.createElement("div");
            slide.className = `hero-slide${index === 0 ? " active" : ""}`;
            slide.style.backgroundImage = `url("${String(item.url).replace(/"/g, "%22")}")`;
            slide.setAttribute("role", "img");
            slide.setAttribute("aria-label", `KMC Samulnori hero image ${index + 1} of ${images.length}`);
            slider.appendChild(slide);
            slides.push(slide);

            const dot = document.createElement("span");
            dot.className = `hero-carousel-dot${index === 0 ? " active" : ""}`;
            dotsHost.appendChild(dot);
            dots.push(dot);
        });

        const hasMultiple = slides.length > 1;
        previousButton.hidden = !hasMultiple;
        nextButton.hidden = !hasMultiple;
        dotsHost.hidden = !hasMultiple;
        scheduleAutoplay();
    }

    function manualMove(offset) {
        showSlide(currentIndex + offset);
        scheduleAutoplay();
    }

    previousButton.addEventListener("click", () => manualMove(-1));
    nextButton.addEventListener("click", () => manualMove(1));
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
