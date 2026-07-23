"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    const list = document.getElementById("arrangements-list");
    const detailRoot = document.getElementById("arrangement-detail-root");
    const backdrop = document.getElementById("arrangement-backdrop");
    if (!list || !detailRoot || !backdrop) return;

    const fallback = window.KMC_ARRANGEMENT_DEFAULTS || { arrangements: [], instruments: [] };
    const db = window.kmcFirebase?.db;
    let data = fallback;
    try {
        if (db) {
            const snapshot = await db.collection("siteContent").doc("arrangements").get();
            if (snapshot.exists) data = { ...fallback, ...snapshot.data() };
        }
    } catch (error) {
        console.error("Unable to load arrangements from Firestore:", error);
    }

    const instruments = new Map((data.instruments || []).map(item => [item.id, item]));
    const arrangements = [...(data.arrangements || [])].sort((a,b)=>(a.order ?? 0)-(b.order ?? 0));

    const escapeId = value => String(value || "arrangement").replace(/[^a-zA-Z0-9_-]/g, "-");
    arrangements.forEach((arrangement, index) => {
        const id = escapeId(arrangement.id);
        const card = document.createElement("button");
        card.className = "arrangement-card arrangement-page-card reveal visible";
        card.type = "button";
        card.dataset.arrangement = id;
        card.setAttribute("aria-haspopup", "dialog");
        card.setAttribute("aria-controls", `arrangement-${id}`);
        card.setAttribute("aria-expanded", "false");
        card.innerHTML = `<img src="${arrangement.photoUrl || ''}" alt="${arrangement.name || 'Arrangement'}" loading="${index ? 'lazy' : 'eager'}"><span class="card-content"><span class="arrangement-title"></span><span class="arrangement-korean"></span></span><span class="arrangement-card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6"></path></svg></span>`;
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
        const instrumentRows = [...(arrangement.instruments || [])].sort((a,b)=>(a.order ?? 0)-(b.order ?? 0)).map(selection => {
            const instrument = instruments.get(selection.instrumentId);
            if (!instrument) return "";
            const article = document.createElement("article");
            article.className = "instrument-row";
            article.innerHTML = `<div class="instrument-image"><img loading="lazy"></div><div class="instrument-copy"><h4></h4><p></p></div>`;
            const image = article.querySelector("img"); image.src = instrument.photoUrl || ""; image.alt = `${instrument.name || 'Instrument'} ${instrument.koreanName || ''}`.trim();
            const h4 = article.querySelector("h4"); h4.append(document.createTextNode(instrument.name || "Instrument"));
            if (instrument.koreanName) { const span=document.createElement("span"); span.textContent=instrument.koreanName; h4.append(" ",span); }
            article.querySelector("p").textContent = selection.description || "Description coming soon.";
            return article.outerHTML;
        }).join("");
        panel.innerHTML = `<div class="arrangement-detail-shell"><button class="arrangement-close" type="button" aria-label="Close details"><span></span><span></span></button><div class="arrangement-detail-scroll"><header class="arrangement-detail-hero"><img alt=""><div class="arrangement-detail-overlay"><h2></h2><p></p></div><span class="arrangement-detail-arrow" aria-hidden="true">↓</span></header><div class="arrangement-detail-content"><h3>Instruments Used</h3><div class="instrument-list">${instrumentRows}</div></div></div></div>`;
        panel.querySelector(".arrangement-detail-hero img").src = arrangement.photoUrl || "";
        panel.querySelector(".arrangement-detail-hero img").alt = arrangement.name || "Arrangement";
        panel.querySelector("h2").textContent = arrangement.name || "Arrangement";
        panel.querySelector(".arrangement-detail-overlay p").textContent = arrangement.koreanName || "";
        detailRoot.appendChild(panel);
    });

    let activeCard=null, activePanel=null, scrollY=0;
    const open = card => {
        const panel=detailRoot.querySelector(`[data-arrangement-panel="${CSS.escape(card.dataset.arrangement)}"]`); if(!panel)return;
        activeCard=card; activePanel=panel; scrollY=window.scrollY;
        document.body.classList.add("arrangement-open"); Object.assign(document.body.style,{position:"fixed",top:`-${scrollY}px`,left:"0",right:"0",width:"100%"});
        card.setAttribute("aria-expanded","true"); backdrop.classList.add("is-active"); backdrop.setAttribute("aria-hidden","false"); panel.setAttribute("aria-hidden","false"); requestAnimationFrame(()=>panel.classList.add("is-open"));
        history.replaceState(null,"",`${location.pathname}${location.search}#${encodeURIComponent(card.dataset.arrangement)}`);
        setTimeout(()=>panel.querySelector(".arrangement-close")?.focus({preventScroll:true}),100);
    };
    const close = () => {
        if(!activePanel)return; activePanel.classList.remove("is-open"); activePanel.setAttribute("aria-hidden","true"); activeCard?.setAttribute("aria-expanded","false"); backdrop.classList.remove("is-active"); backdrop.setAttribute("aria-hidden","true");
        document.body.classList.remove("arrangement-open"); Object.assign(document.body.style,{position:"",top:"",left:"",right:"",width:""}); window.scrollTo(0,scrollY); history.replaceState(null,"",location.pathname+location.search); activeCard=null; activePanel=null;
    };
    list.addEventListener("click", e=>{const card=e.target.closest("[data-arrangement]"); if(card)open(card)});
    detailRoot.addEventListener("click", e=>{if(e.target.closest(".arrangement-close"))close()});
    backdrop.addEventListener("click",close); document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
    const hash=decodeURIComponent(location.hash.slice(1)); const hashCard=[...list.querySelectorAll("[data-arrangement]")].find(c=>c.dataset.arrangement===hash); if(hashCard)setTimeout(()=>open(hashCard),120);
});
