"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const db = window.kmcFirebase?.db;
    const instructorName = document.getElementById("instructor-title");
    const instructorKoreanName = document.getElementById("instructor-korean-name");
    const koreanMessage = document.getElementById("teacher-message-ko");
    const englishMessage = document.getElementById("teacher-message-en");
    const membersGrid = document.getElementById("members-grid");

    const fallback = {
        instructorName: "Susanna Hong",
        instructorKoreanName: "홍수잔나",
        teacherMessageKo: "미국 웨스트민스터(Westminster)를 기반으로 활동하는 '한얼 사물놀이'는 홍수잔나(Susanna Hong) 선생님의 지도 아래 한국 전통 예술을 배우고 알리는 청소년 공연팀입니다.\n\n초등학생부터 고등학생까지의 학생들이 함께하며, 단순한 연주를 넘어 한국 문화에 대한 이해와 자긍심을 키워가고 있습니다.\n\n한얼은 꽹과리, 장구, 북, 징이 어우러지는 전통 사물놀이를 중심으로 역동적인 난타, 화려한 오고무, 삼고모 등 다양한 타악 레퍼토리를 선보입니다.\n\nSouth Coast Plaza, Lunar New Year Parade, 지역 축제 등 캘리포니아 곳곳의 무대에서 한국의 아름다움을 알려온 한얼은 공연뿐만 아니라 지역사회를 위한 봉사 활동에도 꾸준히 참여하고 있습니다.\n\n열정과 흥이 넘치는 공연으로 현지 커뮤니티에 한국의 소리를 전하며, 전통의 뿌리 위에 현대적인 감각을 더해 한국 전통 음악이 오늘날에도 살아 숨 쉬는 예술임을 보여주는 청소년 문화 공동체입니다.",
        teacherMessageEn: "Hanul Samulnori, based in Westminster, is a youth performance team that learns and promotes Korean traditional arts under the guidance of instructor Susanna Hong.\n\nStudents from elementary through high school participate, developing a deeper understanding of and pride in Korean culture through performance.\n\nThe team presents traditional samulnori alongside dynamic Nanta, colorful Ogomu, Samgomo, and other percussion repertoire. Through ensemble playing, students learn to listen to one another and create harmony together.\n\nHanul has shared Korean culture at South Coast Plaza, Lunar New Year parades, local festivals, and community events throughout California. The team also participates in volunteer activities that serve the local community.\n\nThrough performances filled with energy and excitement, Hanul brings the sound of Korea to the community while showing that Korean traditional music remains a living art for today’s generation.",
        members: [
            ["Joshua Kim",14,"~9 years"],["Lena Kim",14,"~9 years"],["Ellen Kim",12,"~8 years"],
            ["Rachel Lee",14,"~3 years"],["Jiwoo Yun",13,"~4 years"],["Claire Baek",15,"~2 years"],
            ["Gabrielle Park",15,"~2 years"],["Jaeah Kim",12,"~2 years"],["Kathleen Ahn",13,"~2 years"],
            ["Zoey Kim",11,"~4 years"],["Mason Lee",14,"~2 years"],["Daniel Kim",14,"~3 years"],
            ["Godfrey Kim",13,"~2 years"],["Theodore Kim",16,"~2 years"],["Phillip Kang",11,"~2 years"],
            ["Lucas Baek",12,"~2 years"],["Eillot Park",12,"~2 years"],["Jayden Kim",12,"~2 years"],
            ["Issac Choi",12,"—"],["Jangmin Kee",14,"~2 years"],["Cohen Lee",10,"~1 year"]
        ].map(([name, age, service], order) => ({ name, age, service, order }))
    };

    const renderParagraphs = (container, text) => {
        container.replaceChildren();
        String(text || "")
            .split(/\n\s*\n/)
            .map(paragraph => paragraph.trim())
            .filter(Boolean)
            .forEach(paragraph => {
                const p = document.createElement("p");
                p.textContent = paragraph;
                container.appendChild(p);
            });
    };

    const renderTeam = data => {
        instructorName.textContent = data.instructorName || fallback.instructorName;
        instructorKoreanName.textContent = data.instructorKoreanName || "";
        instructorKoreanName.hidden = !instructorKoreanName.textContent;
        renderMessage(koreanMessage, data.teacherMessageKoHtml, data.teacherMessageKo);
        renderMessage(englishMessage, data.teacherMessageEnHtml, data.teacherMessageEn);

        const members = Array.isArray(data.members) ? [...data.members] : [];
        members.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        membersGrid.replaceChildren();

        members.forEach(member => {
            const article = document.createElement("article");
            article.className = "member-card reveal visible";

            const details = document.createElement("div");
            details.className = "member-details";

            const name = document.createElement("h3");
            name.textContent = member.name || "Member";

            const age = document.createElement("p");
            age.textContent = `Age: ${member.age ?? "—"}`;

            const service = document.createElement("p");
            service.textContent = `Service: ${member.service || "—"}`;

            details.append(name, age, service);
            article.appendChild(details);
            membersGrid.appendChild(article);
        });
    };

    renderTeam(fallback);

    if (!db) {
        console.warn("Team page is using fallback content because Firestore is unavailable.");
        return;
    }

    db.collection("siteContent").doc("team").get()
        .then(snapshot => {
            if (snapshot.exists) renderTeam({ ...fallback, ...snapshot.data() });
        })
        .catch(error => {
            console.error("Unable to load team information from Firestore:", error);
        });
});
