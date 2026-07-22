/*
========================================

KMC SAMULNORI
Arrangements Page JavaScript
Version 1.1

========================================
*/

"use strict";

(function () {

    function initializeArrangements() {

        const cards = Array.from(
            document.querySelectorAll(".arrangement-page-card[data-arrangement]")
        );

        const panels = Array.from(
            document.querySelectorAll(".arrangement-detail[data-arrangement-panel]")
        );

        const backdrop = document.getElementById("arrangement-backdrop");

        if (!cards.length || !panels.length || !backdrop) {
            console.error(
                "Arrangements page could not initialize. Check the arrangement cards, detail panels, and backdrop IDs/classes."
            );
            return;
        }

        let activeCard = null;
        let activePanel = null;
        let previousScrollY = 0;
        let closeTimer = null;

        function findPanel(card) {
            const name = card.getAttribute("data-arrangement");

            return panels.find(panel => {
                return panel.getAttribute("data-arrangement-panel") === name;
            }) || null;
        }

        function getFocusableElements(container) {
            return Array.from(
                container.querySelectorAll(
                    "a[href], button:not([disabled]), input:not([disabled]), " +
                    "select:not([disabled]), textarea:not([disabled]), " +
                    "[tabindex]:not([tabindex='-1'])"
                )
            ).filter(element => {
                return element.offsetParent !== null;
            });
        }

        function lockPage() {
            previousScrollY = window.scrollY || window.pageYOffset;

            document.body.classList.add("arrangement-open");
            document.body.style.position = "fixed";
            document.body.style.top = `-${previousScrollY}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.width = "100%";
        }

        function unlockPage() {
            document.body.classList.remove("arrangement-open");
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";

            window.scrollTo(0, previousScrollY);
        }

        function resetPanel(panel) {
            const scrollArea = panel.querySelector(".arrangement-detail-scroll");

            if (scrollArea) {
                scrollArea.scrollTop = 0;
            }
        }

        function openPanel(card) {
            const panel = findPanel(card);

            if (!panel || panel === activePanel) {
                return;
            }

            if (closeTimer !== null) {
                window.clearTimeout(closeTimer);
                closeTimer = null;
            }

            if (activePanel) {
                closePanel(false);
            }

            activeCard = card;
            activePanel = panel;

            resetPanel(panel);
            card.setAttribute("aria-expanded", "true");

            lockPage();

            backdrop.setAttribute("aria-hidden", "false");
            backdrop.classList.add("is-active");

            panel.setAttribute("aria-hidden", "false");

            /* Force Safari to register the visible starting state. */
            void panel.offsetWidth;

            panel.classList.add("is-open");

            const closeButton = panel.querySelector(".arrangement-close");

            window.setTimeout(() => {
                if (activePanel !== panel) return;

                if (closeButton) {
                    closeButton.focus({ preventScroll: true });
                } else {
                    panel.focus({ preventScroll: true });
                }
            }, 120);
        }

        function closePanel(restoreFocus = true) {
            if (!activePanel) {
                return;
            }

            const panel = activePanel;
            const card = activeCard;

            activePanel = null;
            activeCard = null;

            panel.classList.remove("is-open");
            panel.setAttribute("aria-hidden", "true");

            backdrop.classList.remove("is-active");
            backdrop.setAttribute("aria-hidden", "true");

            if (card) {
                card.setAttribute("aria-expanded", "false");
            }

            unlockPage();

            closeTimer = window.setTimeout(() => {
                resetPanel(panel);
                closeTimer = null;
            }, 700);

            if (restoreFocus && card) {
                window.setTimeout(() => {
                    card.focus({ preventScroll: true });
                }, 50);
            }
        }

        function trapFocus(event) {
            if (event.key !== "Tab" || !activePanel) {
                return;
            }

            const focusable = getFocusableElements(activePanel);

            if (!focusable.length) {
                event.preventDefault();
                activePanel.focus({ preventScroll: true });
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus({ preventScroll: true });
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus({ preventScroll: true });
            }
        }

        cards.forEach(card => {
            card.addEventListener("click", event => {
                event.preventDefault();
                openPanel(card);
            });
        });

        panels.forEach(panel => {
            const closeButton = panel.querySelector(".arrangement-close");

            if (closeButton) {
                closeButton.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();
                    closePanel(true);
                });
            }

            panel.addEventListener("click", event => {
                if (event.target === panel) {
                    closePanel(true);
                }
            });
        });

        backdrop.addEventListener("click", () => {
            closePanel(true);
        });

        document.addEventListener("keydown", event => {
            if (!activePanel) return;

            if (event.key === "Escape") {
                event.preventDefault();
                closePanel(true);
                return;
            }

            trapFocus(event);
        });

        window.addEventListener("pageshow", () => {
            panels.forEach(panel => {
                panel.classList.remove("is-open");
                panel.setAttribute("aria-hidden", "true");
                resetPanel(panel);
            });

            cards.forEach(card => {
                card.setAttribute("aria-expanded", "false");
            });

            backdrop.classList.remove("is-active");
            backdrop.setAttribute("aria-hidden", "true");

            activeCard = null;
            activePanel = null;

            document.body.classList.remove("arrangement-open");
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeArrangements);
    } else {
        initializeArrangements();
    }

})();
