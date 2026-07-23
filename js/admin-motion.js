"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const header = document.querySelector(".admin-site-header");
    const revealSelectors = [
        ".admin-dashboard-header",
        ".admin-login-card",
        ".admin-panel",
        ".dashboard-card",
        ".performance-admin-card",
        ".team-admin-card",
        ".admin-security-note",
        ".admin-public-footer"
    ];

    document.documentElement.classList.add("admin-motion-ready");

    if (header) {
        requestAnimationFrame(() => {
            header.classList.add("admin-header-visible");
        });
    }

    function prepareRevealElements(root = document) {
        const elements = root.matches?.(revealSelectors.join(","))
            ? [root]
            : [...root.querySelectorAll?.(revealSelectors.join(",")) || []];

        elements.forEach((element, index) => {
            if (element.dataset.adminRevealPrepared === "true") return;

            element.dataset.adminReveal = "";
            element.dataset.adminRevealPrepared = "true";
            element.style.setProperty(
                "--admin-reveal-delay",
                `${Math.min(index * 55, 275)}ms`
            );

            if (reduceMotion) {
                element.classList.add("admin-reveal-visible");
                return;
            }

            revealObserver.observe(element);
        });
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("admin-reveal-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -24px"
    });

    prepareRevealElements();

    const dynamicLists = document.querySelectorAll(
        "#performance-list, .admin-dashboard-grid, .team-admin-list"
    );

    dynamicLists.forEach((list) => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    node.classList.add("admin-new-record");
                    prepareRevealElements(node);
                });
            });
        });

        observer.observe(list, {
            childList: true
        });
    });

    /*
     * Enhances the existing popup without changing its form, map,
     * Firebase, or Google Places behavior.
     */
    const modalObserver = new MutationObserver(() => {
        const modal = document.querySelector(".performance-modal");
        if (!modal || modal.dataset.motionEnhanced === "true") return;

        modal.dataset.motionEnhanced = "true";

        const closeButton = modal.querySelector(".performance-modal-close");
        const originalClose = closeButton?.onclick;

        if (closeButton) {
            closeButton.addEventListener("click", () => {
                modal.classList.add("is-closing");
                window.setTimeout(() => {
                    modal.classList.remove("is-closing");
                }, 340);
            }, {
                capture: true
            });
        }

        modal.addEventListener("transitionend", (event) => {
            if (
                event.target.classList.contains("performance-modal-dialog") &&
                !modal.classList.contains("is-open")
            ) {
                modal.classList.remove("is-closing");
            }
        });

        void originalClose;
    });

    modalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});
