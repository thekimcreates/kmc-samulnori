"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".hero-slider");
    const previousButton = document.getElementById("hero-previous");
    const nextButton = document.getElementById("hero-next");
    const dotsHost = document.getElementById("hero-carousel-dots");
    const dataApi = window.KMCHomeData;
    const imageLoader = window.KMCImageLoader;
    const AUTOPLAY_DELAY = 5000;
    const TRANSITION_LOCK = 650;
    if (!slider || !previousButton || !nextButton || !dotsHost) return;

    let slides = [];
    let dots = [];
    let currentIndex = 0;
    let autoplayTimer = 0;
    let transitionTimer = 0;
    let transitioning = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let currentSignature = "";

    function responsiveLocalUrl(url) {
        const value = String(url || "");
        const match = value.match(/^(.*\/hero[1-5])\.webp(?:\?.*)?$/i);
        if (!match) return value;
        const viewport = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
        if (viewport <= 700) return `${match[1]}-900.webp`;
        if (viewport <= 1400) return `${match[1]}-1600.webp`;
        return value;
    }

    const fallbackImages = [...slider.querySelectorAll(".hero-slide")]
        .map((slide, order) => ({
            id: `default-${order + 1}`,
            url: slide.dataset.imageUrl || "",
            order
        }))
        .filter(item => item.url);

    const normalizeImages = value => (Array.isArray(value) ? value : [])
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

    function sourceFor(slide) {
        return responsiveLocalUrl(slide?.dataset.imageUrl || "");
    }

    function loadSlide(index) {
        if (!slides.length) return;
        const slide = slides[(index + slides.length) % slides.length];
        if (!slide || slide.dataset.imageLoaded === "true") return;
        const source = sourceFor(slide);
        if (!source) return;
        slide.style.backgroundImage = `url("${source.replace(/"/g, "%22")}")`;
        slide.dataset.imageLoaded = "true";
    }

    function preload(index) {
        if (slides.length < 2) return;
        const slide = slides[(index + slides.length) % slides.length];
        const source = sourceFor(slide);
        if (!source) return;
        imageLoader?.preload(source);
    }

    function showSlide(index) {
        if (!slides.length) return;
        currentIndex = (index + slides.length) % slides.length;
        loadSlide(currentIndex);
        slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === currentIndex));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === currentIndex));
        preload(currentIndex + 1);
    }

    function manualMove(offset) {
        if (transitioning || slides.length <= 1) return;
        transitioning = true;
        previousButton.disabled = true;
        nextButton.disabled = true;
        showSlide(currentIndex + offset);
        scheduleAutoplay();
        window.clearTimeout(transitionTimer);
        transitionTimer = window.setTimeout(() => {
            transitioning = false;
            previousButton.disabled = false;
            nextButton.disabled = false;
        }, TRANSITION_LOCK);
    }

    function buildCarousel(images) {
        const normalized = normalizeImages(images);
        if (!normalized.length) return;
        const signature = JSON.stringify(normalized.map(item => [item.id, item.url, item.order]));
        if (signature === currentSignature) return;
        currentSignature = signature;

        const previousUrl = slides[currentIndex]?.dataset.imageUrl;
        slider.replaceChildren();
        dotsHost.replaceChildren();
        slides = [];
        dots = [];

        normalized.forEach((item, index) => {
            const slide = document.createElement("div");
            slide.className = "hero-slide";
            slide.dataset.imageUrl = item.url;
            slide.setAttribute("role", "img");
            slide.setAttribute("aria-label", `KMC Samulnori hero image ${index + 1} of ${normalized.length}`);
            slider.appendChild(slide);
            slides.push(slide);

            const dot = document.createElement("span");
            dot.className = "hero-carousel-dot";
            dotsHost.appendChild(dot);
            dots.push(dot);
        });

        const retainedIndex = Math.max(0, slides.findIndex(slide => slide.dataset.imageUrl === previousUrl));
        currentIndex = retainedIndex;
        showSlide(currentIndex);
        previousButton.hidden = slides.length <= 1;
        nextButton.hidden = slides.length <= 1;
        dotsHost.hidden = slides.length <= 1;
        transitioning = false;
        previousButton.disabled = false;
        nextButton.disabled = false;
        scheduleAutoplay();
    }

    previousButton.addEventListener("click", () => manualMove(-1));
    nextButton.addEventListener("click", () => manualMove(1));
    document.addEventListener("keydown", event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
        if (event.key === "ArrowLeft") manualMove(-1);
        if (event.key === "ArrowRight") manualMove(1);
    });
    slider.addEventListener("touchstart", event => {
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });
    slider.addEventListener("touchend", event => {
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        const deltaY = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) manualMove(deltaX > 0 ? -1 : 1);
    }, { passive: true });
    document.addEventListener("visibilitychange", () => document.hidden ? stopAutoplay() : scheduleAutoplay());

    const cached = dataApi?.cachedValue("home-content");
    buildCarousel(normalizeImages(cached?.heroImages).length ? cached.heroImages : fallbackImages);

    dataApi?.getHomeContent()
        .then(content => {
            const images = normalizeImages(content?.heroImages);
            if (images.length) buildCarousel(images);
        })
        .catch(error => console.warn("Hero images could not be refreshed:", error));
});
