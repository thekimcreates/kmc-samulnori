"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("arrangements-list");
    const detailRoot = document.getElementById("arrangement-detail-root");
    const backdrop = document.getElementById("arrangement-backdrop");
    if (!list || !detailRoot || !backdrop) return;

    const fallback = window.KMC_ARRANGEMENT_DEFAULTS || { arrangements: [], instruments: [] };
    const db = window.kmcFirebase?.db;
    const requestedId = decodeURIComponent(location.hash.slice(1));

    let activeCard = null;
    let activePanel = null;
    let activeId = "";
    let scrollY = 0;
    let pendingData = null;
    let hasAutoOpened = false;
    let ignoreBackdropUntil = 0;

    const escapeId = value => String(value || "arrangement").replace(/[^a-zA-Z0-9_-]/g, "-");
    const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A"]);

    const sanitizeHtml = html => {
        const template = document.createElement("template");
        template.innerHTML = String(html || "");

        const walk = node => [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowedTags.has(child.tagName)) {
                    child.replaceWith(...child.childNodes);
                    return;
                }

                const href = child.tagName === "A" ? child.getAttribute("href") || "" : "";
                [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));

                if (child.tagName === "A" && (/^https?:\/\//i.test(href) || /^mailto:/i.test(href))) {
                    child.setAttribute("href", href);
                    child.setAttribute("target", "_blank");
                    child.setAttribute("rel", "noopener noreferrer");
                }

                walk(child);
            } else if (child.nodeType !== Node.TEXT_NODE) {
                child.remove();
            }
        });

        walk(template.content);
        return template.innerHTML;
    };

    function render(data) {
        if (activePanel) {
            pendingData = data;
            return;
        }

        list.replaceChildren();
        detailRoot.replaceChildren();

        const instruments = new Map((data.instruments || []).map(item => [item.id, item]));
        const arrangements = [...(data.arrangements || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        arrangements.forEach((arrangement, index) => {
            const id = escapeId(arrangement.id);
            const card = document.createElement("button");
            card.className = "arrangement-card arrangement-page-card reveal visible";
            card.type = "button";
            card.dataset.arrangement = id;
            card.setAttribute("aria-haspopup", "dialog");
            card.setAttribute("aria-controls", `arrangement-${id}`);
            card.setAttribute("aria-expanded", "false");
            card.innerHTML = `<img src="${arrangement.photoUrl || ""}" alt="${arrangement.name || "Arrangement"}" loading="${index ? "lazy" : "eager"}" decoding="async"><span class="card-content"><span class="arrangement-title"></span><span class="arrangement-korean"></span></span><span class="arrangement-card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6"></path></svg></span>`;
            card.querySelector(".arrangement-title").textContent = arrangement.name || "Arrangement";
            card.querySelector(".arrangement-korean").textContent = arrangement.koreanName || "";
            list.appendChild(card);

            const panel = document.createElement("section");
            panel.className = "arrangement-detail";
            panel.id = `arrangement-${id}`;
            panel.dataset.arrangementPanel = id;
            panel.setAttribute("role", "dialog");
            panel.setAttribute("aria-modal", "true");
            panel.setAttribute("aria-hidden", "true");
            panel.tabIndex = -1;

            const instrumentRows = [...(arrangement.instruments || [])]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(selection => {
                    const instrument = instruments.get(selection.instrumentId);
                    if (!instrument) return "";

                    const article = document.createElement("article");
                    article.className = "instrument-row";
                    article.innerHTML = `<div class="instrument-image"><img loading="lazy" decoding="async"></div><div class="instrument-copy"><h4></h4><p></p></div>`;

                    const image = article.querySelector("img");
                    image.src = instrument.photoUrl || "";
                    image.alt = `${instrument.name || "Instrument"} ${instrument.koreanName || ""}`.trim();

                    const heading = article.querySelector("h4");
                    heading.append(document.createTextNode(instrument.name || "Instrument"));
                    if (instrument.koreanName) {
                        const span = document.createElement("span");
                        span.textContent = instrument.koreanName;
                        heading.append(" ", span);
                    }

                    const description = article.querySelector("p");
                    if (selection.descriptionHtml) description.innerHTML = sanitizeHtml(selection.descriptionHtml);
                    else description.textContent = selection.description || "Description coming soon.";

                    return article.outerHTML;
                })
                .join("");

            panel.innerHTML = `<div class="arrangement-detail-shell"><button class="arrangement-close" type="button" aria-label="Close details"><span></span><span></span></button><div class="arrangement-detail-scroll"><header class="arrangement-detail-hero"><img alt=""><div class="arrangement-detail-overlay"><h2></h2><p></p></div><span class="arrangement-detail-arrow" aria-hidden="true">↓</span></header><div class="arrangement-detail-content"><h3>Instruments Used</h3><div class="instrument-list">${instrumentRows}</div></div></div></div>`;
            panel.querySelector(".arrangement-detail-hero img").src = arrangement.photoUrl || "";
            panel.querySelector(".arrangement-detail-hero img").alt = arrangement.name || "Arrangement";
            panel.querySelector("h2").textContent = arrangement.name || "Arrangement";
            panel.querySelector(".arrangement-detail-overlay p").textContent = arrangement.koreanName || "";
            detailRoot.appendChild(panel);
        });

        if (!hasAutoOpened && requestedId) {
            const card = [...list.querySelectorAll("[data-arrangement]")]
                .find(item => item.dataset.arrangement === requestedId);
            if (card) {
                hasAutoOpened = true;
                requestAnimationFrame(() => open(card, true));
            }
        }
    }

    function open(card, fromDeepLink = false) {
        const id = card.dataset.arrangement;
        const panel = detailRoot.querySelector(`[data-arrangement-panel="${CSS.escape(id)}"]`);
        if (!panel || activePanel === panel) return;

        activeCard = card;
        activePanel = panel;
        activeId = id;
        scrollY = window.scrollY;
        ignoreBackdropUntil = performance.now() + (fromDeepLink ? 900 : 250);

        document.body.classList.add("arrangement-open");
        Object.assign(document.body.style, {
            position: "fixed",
            top: `-${scrollY}px`,
            left: "0",
            right: "0",
            width: "100%"
        });

        card.setAttribute("aria-expanded", "true");
        backdrop.classList.add("is-active");
        backdrop.setAttribute("aria-hidden", "false");
        panel.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => panel.classList.add("is-open"));

        history.replaceState(null, "", `${location.pathname}${location.search}#${encodeURIComponent(id)}`);
        setTimeout(() => panel.querySelector(".arrangement-close")?.focus({ preventScroll: true }), 100);
    }

    function close() {
        if (!activePanel) return;

        activePanel.classList.remove("is-open");
        activePanel.setAttribute("aria-hidden", "true");
        activeCard?.setAttribute("aria-expanded", "false");
        backdrop.classList.remove("is-active");
        backdrop.setAttribute("aria-hidden", "true");

        document.body.classList.remove("arrangement-open");
        Object.assign(document.body.style, { position: "", top: "", left: "", right: "", width: "" });
        window.scrollTo(0, scrollY);
        history.replaceState(null, "", location.pathname + location.search);

        activeCard = null;
        activePanel = null;
        activeId = "";

        if (pendingData) {
            const nextData = pendingData;
            pendingData = null;
            render(nextData);
        }
    }

    list.addEventListener("click", event => {
        const card = event.target.closest("[data-arrangement]");
        if (card) open(card);
    });

    detailRoot.addEventListener("click", event => {
        if (event.target.closest(".arrangement-close")) close();
    });

    backdrop.addEventListener("click", () => {
        if (performance.now() < ignoreBackdropUntil) return;
        close();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") close();
    });

    // Paint the built-in content immediately. If a deep link is present, it opens
    // before Firestore finishes. A later Firestore render is postponed until the
    // open detail is closed, preventing the open-then-close race condition.
    render(fallback);

    if (db) {
        db.collection("siteContent").doc("arrangements").get()
            .then(snapshot => {
                if (!snapshot.exists) return;
                render({ ...fallback, ...snapshot.data() });
            })
            .catch(error => console.error("Unable to load arrangements from Firestore:", error));
    }
});
