"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const { auth, db } = window.kmcFirebase || {};
    const loading = document.getElementById("team-loading");
    const main = document.getElementById("team-admin");
    const email = document.getElementById("admin-user-email");
    const logout = document.getElementById("admin-logout");
    const form = document.getElementById("team-form");
    const status = document.getElementById("team-status");
    const saveButton = document.getElementById("save-team");
    const memberList = document.getElementById("member-editor-list");
    const memberTemplate = document.getElementById("member-editor-template");
    const addMemberButton = document.getElementById("add-member");

    const teamDocument = db?.collection("siteContent").doc("team");

    const defaults = {
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
        ].map(([name, age, service]) => ({ name, age, service }))
    };

    let redirecting = false;
    const redirectToLogin = () => {
        if (redirecting) return;
        redirecting = true;
        window.location.replace("login.html");
    };

    const setStatus = (message, type = "") => {
        status.textContent = message;
        status.className = `login-status${type ? ` is-${type}` : ""}`;
    };

    const renumberMembers = () => {
        [...memberList.children].forEach((card, index) => {
            card.querySelector(".member-number").textContent = String(index + 1);
        });
    };

    let draggedMemberCard = null;

    const addMemberEditor = (member = { name: "", age: "", service: "" }, shouldFocus = false) => {
        const card = memberTemplate.content.firstElementChild.cloneNode(true);
        card.querySelector(".member-name").value = member.name || "";
        card.querySelector(".member-age").value = member.age ?? "";
        card.querySelector(".member-service").value = member.service || "";
        card.querySelector(".remove-member").addEventListener("click", () => {
            card.remove();
            renumberMembers();
        });
        card.addEventListener("dragstart", event => {
            draggedMemberCard = card;
            card.classList.add("is-dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", "member");
        });
        card.addEventListener("dragend", () => {
            draggedMemberCard = null;
            card.classList.remove("is-dragging");
            memberList.querySelectorAll(".is-drag-over").forEach(item => item.classList.remove("is-drag-over"));
        });
        card.addEventListener("dragover", event => {
            event.preventDefault();
            if (draggedMemberCard && draggedMemberCard !== card) card.classList.add("is-drag-over");
        });
        card.addEventListener("dragleave", () => card.classList.remove("is-drag-over"));
        card.addEventListener("drop", event => {
            event.preventDefault();
            card.classList.remove("is-drag-over");
            if (!draggedMemberCard || draggedMemberCard === card) return;
            const cards = [...memberList.children];
            const fromIndex = cards.indexOf(draggedMemberCard);
            const toIndex = cards.indexOf(card);
            if (fromIndex < toIndex) card.after(draggedMemberCard);
            else card.before(draggedMemberCard);
            renumberMembers();
        });
        memberList.appendChild(card);
        renumberMembers();
        if (shouldFocus) {
            requestAnimationFrame(() => {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                window.setTimeout(() => {
                    card.querySelector(".member-name").focus({ preventScroll: true });
                }, 350);
            });
        }
    };

    const populateForm = data => {
        document.getElementById("instructor-name").value = data.instructorName || "";
        document.getElementById("instructor-korean-name").value = data.instructorKoreanName || "";
        document.getElementById("teacher-message-ko").value = data.teacherMessageKo || "";
        document.getElementById("teacher-message-en").value = data.teacherMessageEn || "";
        memberList.replaceChildren();
        (Array.isArray(data.members) ? data.members : []).forEach(addMemberEditor);
    };

    const readAdminRecord = async user => db.collection("admins").doc(user.uid).get();

    if (!auth || !db) {
        loading.textContent = "Firebase could not be initialized.";
        return;
    }

    auth.onAuthStateChanged(async user => {
        if (!user) return redirectToLogin();

        try {
            const adminRecord = await readAdminRecord(user);
            if (!adminRecord.exists || adminRecord.data()?.active !== true) {
                await auth.signOut();
                return redirectToLogin();
            }

            email.textContent = user.email || "Administrator";
            const snapshot = await teamDocument.get();
            populateForm(snapshot.exists ? { ...defaults, ...snapshot.data() } : defaults);
            loading.hidden = true;
            main.hidden = false;
        } catch (error) {
            console.error("Unable to load team editor:", error);
            loading.textContent = "Unable to load the team editor. Check Firestore rules and try again.";
        }
    });

    addMemberButton.addEventListener("click", () => addMemberEditor(undefined, true));

    form.addEventListener("submit", async event => {
        event.preventDefault();
        setStatus("");

        const memberCards = [...memberList.querySelectorAll(".member-editor-card")];
        const members = memberCards.map((card, index) => ({
            name: card.querySelector(".member-name").value.trim(),
            age: Number(card.querySelector(".member-age").value),
            service: card.querySelector(".member-service").value.trim(),
            order: index
        }));

        if (members.some(member => !member.name || !Number.isFinite(member.age))) {
            setStatus("Every member needs a name and age.", "error");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving…";

        try {
            await teamDocument.set({
                instructorName: document.getElementById("instructor-name").value.trim(),
                instructorKoreanName: document.getElementById("instructor-korean-name").value.trim(),
                teacherMessageKo: document.getElementById("teacher-message-ko").value.trim(),
                teacherMessageEn: document.getElementById("teacher-message-en").value.trim(),
                members,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: auth.currentUser?.uid || null
            }, { merge: true });
            setStatus("Team page saved successfully.", "success");
        } catch (error) {
            console.error("Unable to save team page:", error);
            setStatus("Unable to save. Check your Firestore rules and connection.", "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Team Page";
        }
    });

    logout.addEventListener("click", async () => {
        logout.disabled = true;
        try {
            await auth.signOut();
            redirectToLogin();
        } catch (error) {
            console.error("Unable to sign out:", error);
            logout.disabled = false;
        }
    });
});
