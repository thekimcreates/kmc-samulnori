"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("arrangements-list");
    const detailRoot = document.getElementById("arrangement-detail-root");
    const backdrop = document.getElementById("arrangement-backdrop");
    if (!list || !detailRoot || !backdrop) return;

    const fallback = window.KMC_ARRANGEMENT_DEFAULTS || { arrangements: [], instruments: [] };
    const db = window.kmcFirebase?.db;
    let activeCard = null;
    let activePanel = null;
    let scrollY = 0;
    let hashOpened = false;

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
    }

    function open(card) {
        const panel = detailRoot.querySelector(`[data-arrangement-panel="${CSS.escape(card.dataset.arrangement)}"]`);
        if (!panel) return;

        activeCard = card;
        activePanel = panel;
        scrollY = window.scrollY;
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
        history.replaceState(null, "", `${location.pathname}${location.search}#${encodeURIComponent(card.dataset.arrangement)}`);
        setTimeout(() => panel.querySelector(".arrangement-close")?.focus({ preventScroll: true }), 100);
    }

    function render(data) {
        const instruments = new Map((data.instruments || []).map(item => [item.id, item]));
        const arrangements = [...(data.arrangements || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const cards = document.createDocumentFragment();
        const panels = document.createDocumentFragment();

        arrangements.forEach((arrangement, index) => {
            const id = escapeId(arrangement.id);
            const card = document.createElement("button");
            card.className = "arrangement-card arrangement-page-card reveal visible";
            card.type = "button";
            card.dataset.arrangement = id;
            card.setAttribute("aria-haspopup", "dialog");
            card.setAttribute("aria-controls", `arrangement-${id}`);
            card.setAttribute("aria-expanded", "false");
            card.innerHTML = `<img src="${arrangement.photoUrl || ""}" alt="${arrangement.name || "Arrangement"}" loading="${index ? "lazy" : "eager"}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ''}><span class="card-content"><span class="arrangement-title"></span><span class="arrangement-korean"></span></span><span class="arrangement-card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6"></path></svg></span>`;
            card.querySelector(".arrangement-title").textContent = arrangement.name || "Arrangement";
            card.querySelector(".arrangement-korean").textContent = arrangement.koreanName || "";
            cards.appendChild(card);

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

            panel.innerHTML = `<div class="arrangement-detail-shell"><button class="arrangement-close" type="button" aria-label="Close details"><span></span><span></span></button><div class="arrangement-detail-scroll"><header class="arrangement-detail-hero"><img alt="" decoding="async"><div class="arrangement-detail-overlay"><h2></h2><p></p></div><span class="arrangement-detail-arrow" aria-hidden="true">↓</span></header><div class="arrangement-detail-content"><h3>Instruments Used</h3><div class="instrument-list">${instrumentRows}</div></div></div></div>`;
            const heroImage = panel.querySelector(".arrangement-detail-hero img");
            heroImage.src = arrangement.photoUrl || "";
            heroImage.alt = arrangement.name || "Arrangement";
            panel.querySelector("h2").textContent = arrangement.name || "Arrangement";
            panel.querySelector(".arrangement-detail-overlay p").textContent = arrangement.koreanName || "";
            panels.appendChild(panel);
        });

        if (activePanel) close();
        list.replaceChildren(cards);
        detailRoot.replaceChildren(panels);
        list.setAttribute("aria-busy", "false");

        if (!hashOpened) {
            const hash = decodeURIComponent(location.hash.slice(1));
            const hashCard = [...list.querySelectorAll("[data-arrangement]")]
                .find(card => card.dataset.arrangement === hash);
            if (hashCard) {
                hashOpened = true;
                setTimeout(() => open(hashCard), 80);
            }
        }
    }

    list.setAttribute("aria-busy", "true");
    render(fallback);

    list.addEventListener("click", event => {
        const card = event.target.closest("[data-arrangement]");
        if (card) open(card);
    });
    detailRoot.addEventListener("click", event => {
        if (event.target.closest(".arrangement-close")) close();
    });
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") close();
    });

    if (!db) return;

    db.collection("siteContent").doc("arrangements").get()
        .then(snapshot => {
            if (snapshot.exists) render({ ...fallback, ...snapshot.data() });
        })
        .catch(error => {
            console.error("Unable to load arrangements from Firestore:", error);
        });
});
