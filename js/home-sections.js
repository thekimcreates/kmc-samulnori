"use strict";

(() => {
    const DEFAULT_SECTIONS = [
        { id: "arrangements", type: "template", template: "arrangements", order: 0 },
        { id: "performances", type: "template", template: "performances", order: 1 },
        { id: "team", type: "template", template: "team", order: 2 }
    ];

    const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A"]);

    function sanitizeHtml(html) {
        const template = document.createElement("template");
        template.innerHTML = String(html || "");

        const clean = node => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    if (!ALLOWED_TAGS.has(child.tagName)) {
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

                    clean(child);
                } else if (child.nodeType !== Node.TEXT_NODE) {
                    child.remove();
                }
            });
        };

        clean(template.content);
        return template.innerHTML;
    }

    function normalizeSections(value) {
        const supplied = Array.isArray(value) ? value.filter(Boolean) : [];
        const byId = new Map(supplied.map(section => [section.id, section]));
        const result = [];

        DEFAULT_SECTIONS.forEach(defaultSection => {
            result.push({ ...defaultSection, ...(byId.get(defaultSection.id) || {}) });
            byId.delete(defaultSection.id);
        });

        byId.forEach(section => {
            if (section.type === "text" && section.id) result.push(section);
        });

        return result
            .filter(section => section.hidden !== true)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    }

    document.addEventListener("DOMContentLoaded", () => {
        const root = document.getElementById("home-sections-root");
        if (!root) return;

        const templateNodes = new Map();

        function getTemplateNode(templateName) {
            if (templateNodes.has(templateName)) return templateNodes.get(templateName);
            const source = document.getElementById(`home-section-template-${templateName}`);
            const node = source?.content?.firstElementChild?.cloneNode(true);
            if (node) {
                node.dataset.homeSectionId = templateName;
                templateNodes.set(templateName, node);
            }
            return node || null;
        }

        function createTextSection(section) {
            const element = document.createElement("section");
            element.className = "home-text-section section";
            element.dataset.homeSectionId = section.id;

            const container = document.createElement("div");
            container.className = "section-container home-text-section-container";

            const header = document.createElement("div");
            header.className = "section-header reveal visible";

            const heading = document.createElement("h2");
            heading.textContent = section.heading || "";
            header.appendChild(heading);

            const body = document.createElement("div");
            body.className = "home-custom-rich-text reveal visible";
            body.innerHTML = sanitizeHtml(section.bodyHtml || "");

            container.append(header, body);
            element.appendChild(container);
            return element;
        }

        function render(sections) {
            const fragment = document.createDocumentFragment();
            normalizeSections(sections).forEach(section => {
                const node = section.type === "text"
                    ? createTextSection(section)
                    : getTemplateNode(section.template || section.id);
                if (node) fragment.appendChild(node);
            });
            root.replaceChildren(fragment);
            window.dispatchEvent(new CustomEvent("kmc:home-sections-rendered"));
        }

        // Render the existing homepage immediately so dependent scripts can populate it.
        render(DEFAULT_SECTIONS);

        const db = window.kmcFirebase?.db;
        if (!db) return;

        db.collection("siteContent").doc("homeSections").get()
            .then(snapshot => {
                if (snapshot.exists) render(snapshot.data()?.sections);
            })
            .catch(error => console.error("Unable to load homepage sections:", error));
    });
})();
