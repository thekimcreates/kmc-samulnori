"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const { auth, db, storage } = window.kmcFirebase || {};
  const defaults = window.KMC_ARRANGEMENT_DEFAULTS || { arrangements: [], instruments: [] };
  const docRef = db?.collection("siteContent").doc("arrangements");
  const q = id => document.getElementById(id);
  const loading = q("arrangements-loading");
  const main = q("arrangements-admin");
  const email = q("admin-user-email");
  const logout = q("admin-logout");
  const list = q("arrangement-admin-list");
  const pageStatus = q("arrangement-page-status");
  const editor = q("arrangement-editor-modal");
  const instrumentModal = q("instrument-modal");
  let state = structuredClone(defaults);
  let removeArrangementPhoto = false;
  let draggedArrangementId = null;

  const slug = value => String(value || "item").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `item-${Date.now()}`;
  const status = (el, msg, type = "") => { el.textContent = msg; el.className = `login-status${type ? ` is-${type}` : ""}`; };
  const displayUrl = url => String(url || "").startsWith("assets/") ? `../${url}` : url;
  const instrumentById = id => state.instruments.find(item => item.id === id);
  const saveState = async () => docRef.set({ ...state, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  const openModal = modal => { modal.hidden = false; modal.setAttribute("aria-hidden", "false"); requestAnimationFrame(() => modal.classList.add("is-open")); document.body.style.overflow = "hidden"; };
  const closeModal = modal => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); setTimeout(() => { modal.hidden = true; }, 250); document.body.style.overflow = ""; };
  const preview = (img, wrap, url) => { if (url) { img.src = displayUrl(url); wrap.hidden = false; } else { img.removeAttribute("src"); wrap.hidden = true; } };
  const upload = async (file, folder, id, oldPath = "") => {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error("Photos must be 10 MB or smaller.");
    if (oldPath) await storage.ref(oldPath).delete().catch(() => {});
    const path = `${folder}/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const snapshot = await storage.ref(path).put(file, { contentType: file.type });
    return { photoUrl: await snapshot.ref.getDownloadURL(), photoPath: path };
  };

  function normalizeArrangementOrder() {
    state.arrangements.forEach((item, index) => { item.order = index; });
  }

  async function persistArrangementOrder() {
    normalizeArrangementOrder();
    try {
      await saveState();
      status(pageStatus, "Arrangement order saved.", "success");
    } catch (error) {
      console.error(error);
      status(pageStatus, "Unable to save arrangement order.", "error");
    }
  }

  function renderList() {
    state.arrangements.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    list.replaceChildren();
    state.arrangements.forEach(item => {
      const card = document.createElement("article");
      card.className = "performance-admin-card sortable-admin-card";
      card.dataset.arrangementId = item.id;
      card.innerHTML = `<button class="admin-drag-handle" type="button" aria-label="Drag ${item.name || "arrangement"} to reorder" title="Drag to reorder">⋮⋮</button><div class="arrangement-admin-card-main"><img class="arrangement-admin-thumb" alt=""><div><h3></h3><p></p></div></div><div class="performance-admin-actions"><button class="admin-secondary-button admin-small-button" data-edit type="button">Edit</button><button class="admin-danger-button admin-small-button" data-delete type="button">Delete</button></div>`;
      card.querySelector("img").src = displayUrl(item.photoUrl);
      card.querySelector("img").alt = item.name || "Arrangement";
      card.querySelector("h3").textContent = `${item.name || "Arrangement"} ${item.koreanName || ""}`.trim();
      card.querySelector("p").textContent = `${(item.instruments || []).length} instrument${(item.instruments || []).length === 1 ? "" : "s"}`;
      card.querySelector("[data-edit]").onclick = () => editArrangement(item.id);
      card.querySelector("[data-delete]").onclick = async () => {
        if (!confirm(`Delete ${item.name}?`)) return;
        if (item.photoPath) await storage.ref(item.photoPath).delete().catch(() => {});
        state.arrangements = state.arrangements.filter(entry => entry.id !== item.id);
        normalizeArrangementOrder();
        await saveState();
        renderList();
        status(pageStatus, "Arrangement deleted.", "success");
      };
      list.appendChild(card);
    });
    enableArrangementSorting();
  }

  function enableArrangementSorting() {
    const handles = [...list.querySelectorAll(".admin-drag-handle")];
    handles.forEach(handle => {
      handle.addEventListener("pointerdown", beginArrangementDrag);
      handle.addEventListener("keydown", event => {
        if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const card = handle.closest(".sortable-admin-card");
        const sibling = event.key === "ArrowUp" ? card.previousElementSibling : card.nextElementSibling;
        if (!sibling) return;
        if (event.key === "ArrowUp") list.insertBefore(card, sibling);
        else list.insertBefore(sibling, card);
        syncArrangementStateFromDom();
        persistArrangementOrder();
        handle.focus();
      });
    });
  }

  function syncArrangementStateFromDom() {
    const byId = new Map(state.arrangements.map(item => [item.id, item]));
    state.arrangements = [...list.querySelectorAll(".sortable-admin-card")]
      .map(card => byId.get(card.dataset.arrangementId))
      .filter(Boolean);
    normalizeArrangementOrder();
  }

  function beginArrangementDrag(event) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    const handle = event.currentTarget;
    const card = handle.closest(".sortable-admin-card");
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "arrangement-sort-placeholder";
    placeholder.style.height = `${rect.height}px`;
    card.after(placeholder);

    card.classList.add("is-pointer-dragging");
    card.style.width = `${rect.width}px`;
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    document.body.classList.add("admin-sorting-active");
    handle.setPointerCapture?.(event.pointerId);

    const offsetY = event.clientY - rect.top;
    const move = moveEvent => {
      const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, moveEvent.clientY - offsetY));
      card.style.top = `${top}px`;
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest?.(".sortable-admin-card, .arrangement-sort-placeholder");
      if (!target || target === card || target === placeholder || target.parentElement !== list) return;
      const targetRect = target.getBoundingClientRect();
      if (moveEvent.clientY < targetRect.top + targetRect.height / 2) list.insertBefore(placeholder, target);
      else target.after(placeholder);
      const edge = 90;
      if (moveEvent.clientY < edge) window.scrollBy(0, -12);
      else if (moveEvent.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
    };

    const finish = async () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      placeholder.replaceWith(card);
      card.classList.remove("is-pointer-dragging");
      card.removeAttribute("style");
      document.body.classList.remove("admin-sorting-active");
      syncArrangementStateFromDom();
      await persistArrangementOrder();
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish, { once: true });
    handle.addEventListener("pointercancel", finish, { once: true });
  }

  function renderInstrumentChecklist(selected = []) {
    const checklist = q("instrument-checklist");
    checklist.replaceChildren();
    state.instruments.forEach(inst => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox"><span></span>`;
      const input = label.querySelector("input");
      input.value = inst.id;
      input.checked = selected.some(entry => entry.instrumentId === inst.id);
      label.querySelector("span").textContent = `${inst.name} ${inst.koreanName || ""}`.trim();
      input.onchange = renderSelectedInstruments;
      checklist.appendChild(label);
    });
  }

  function renderSelectedInstruments() {
    const box = q("selected-instruments");
    const existing = new Map([...box.querySelectorAll("[data-instrument-id]")].map(row => [row.dataset.instrumentId, row.querySelector("textarea").value]));
    box.replaceChildren();
    [...q("instrument-checklist").querySelectorAll("input:checked")].forEach(input => {
      const inst = instrumentById(input.value);
      if (!inst) return;
      const row = document.createElement("article");
      row.className = "selected-instrument-card";
      row.dataset.instrumentId = inst.id;
      row.innerHTML = `<img alt=""><div class="selected-instrument-copy"><h3></h3><label>Description for this arrangement<textarea rows="4" placeholder="Describe how this instrument is used in this arrangement."></textarea></label></div>`;
      row.querySelector("img").src = displayUrl(inst.photoUrl);
      row.querySelector("img").alt = inst.name || "Instrument";
      row.querySelector("h3").textContent = `${inst.name} ${inst.koreanName || ""}`.trim();
      row.querySelector("textarea").value = existing.get(inst.id) || "";
      box.appendChild(row);
    });
  }

  function editArrangement(id = null) {
    const item = state.arrangements.find(entry => entry.id === id) || { id: "", name: "", koreanName: "", photoUrl: "", photoPath: "", instruments: [] };
    removeArrangementPhoto = false;
    q("arrangement-editor-title").textContent = id ? "Edit Arrangement" : "Add Arrangement";
    q("arrangement-id").value = item.id;
    q("arrangement-name").value = item.name;
    q("arrangement-korean").value = item.koreanName || "";
    q("arrangement-photo-existing").value = item.photoUrl || "";
    q("arrangement-photo-path").value = item.photoPath || "";
    q("arrangement-photo").value = "";
    preview(q("arrangement-photo-preview"), q("arrangement-photo-preview-wrap"), item.photoUrl);
    renderInstrumentChecklist(item.instruments || []);
    renderSelectedInstruments();
    [...q("selected-instruments").children].forEach(row => {
      const match = (item.instruments || []).find(entry => entry.instrumentId === row.dataset.instrumentId);
      row.querySelector("textarea").value = match?.description || "";
    });
    status(q("arrangement-form-status"), "");
    openModal(editor);
  }

  q("arrangement-form").onsubmit = async event => {
    event.preventDefault();
    const oldId = q("arrangement-id").value;
    const old = state.arrangements.find(item => item.id === oldId);
    let id = oldId || slug(q("arrangement-name").value);
    if (!oldId && state.arrangements.some(item => item.id === id)) id += `-${Date.now()}`;
    let photoUrl = removeArrangementPhoto ? "" : q("arrangement-photo-existing").value;
    let photoPath = removeArrangementPhoto ? "" : q("arrangement-photo-path").value;
    try {
      const uploaded = await upload(q("arrangement-photo").files[0], "arrangement-photos", id, photoPath);
      if (uploaded) ({ photoUrl, photoPath } = uploaded);
      if (!photoUrl) throw new Error("Please upload an arrangement photo.");
      const instruments = [...q("selected-instruments").children].map((row, order) => ({ instrumentId: row.dataset.instrumentId, description: row.querySelector("textarea").value.trim(), order }));
      const record = { id, name: q("arrangement-name").value.trim(), koreanName: q("arrangement-korean").value.trim(), photoUrl, photoPath, order: old?.order ?? state.arrangements.length, instruments };
      state.arrangements = old ? state.arrangements.map(item => item.id === oldId ? record : item) : [...state.arrangements, record];
      normalizeArrangementOrder();
      await saveState();
      renderList();
      closeModal(editor);
      status(pageStatus, "Arrangement saved.", "success");
    } catch (error) {
      console.error(error);
      status(q("arrangement-form-status"), error.message || "Unable to save.", "error");
    }
  };

  function resetAddInstrumentForm() {
    q("instrument-id").value = "";
    q("instrument-name").value = "";
    q("instrument-korean").value = "";
    q("instrument-photo-existing").value = "";
    q("instrument-photo-path").value = "";
    q("instrument-photo").value = "";
    preview(q("instrument-photo-preview"), q("instrument-photo-preview-wrap"), "");
  }

  async function saveInstrument({ oldId = "", name, koreanName, file, existingUrl = "", existingPath = "" }) {
    let id = oldId || slug(name);
    if (!oldId && state.instruments.some(item => item.id === id)) id += `-${Date.now()}`;
    let photoUrl = existingUrl;
    let photoPath = existingPath;
    const uploaded = await upload(file, "instrument-photos", id, photoPath);
    if (uploaded) ({ photoUrl, photoPath } = uploaded);
    if (!photoUrl) throw new Error("Please upload an instrument photo.");
    const record = { id, name: name.trim(), koreanName: koreanName.trim(), photoUrl, photoPath };
    state.instruments = oldId ? state.instruments.map(item => item.id === oldId ? record : item) : [...state.instruments, record];
    await saveState();
  }

  function renderInstrumentLibrary(expandedId = "") {
    const out = q("instrument-admin-list");
    out.replaceChildren();
    state.instruments.forEach(inst => {
      const row = document.createElement("article");
      row.className = `instrument-library-card${expandedId === inst.id ? " is-expanded" : ""}`;
      row.innerHTML = `<div class="instrument-library-summary"><img alt=""><div><h3></h3><p>Used by <span></span> arrangement(s)</p></div><div class="performance-admin-actions"><button data-edit class="admin-secondary-button admin-small-button" type="button">Edit</button><button data-delete class="admin-danger-button admin-small-button" type="button">Delete</button></div></div><form class="instrument-inline-editor" ${expandedId === inst.id ? "" : "hidden"}><div class="team-editor-grid"><div class="admin-field"><label>English name</label><input data-name required></div><div class="admin-field"><label>Korean name</label><input data-korean></div></div><div class="admin-field"><label>Instrument photo</label><input data-photo type="file" accept="image/jpeg,image/png,image/webp"></div><div class="performance-form-actions"><button class="admin-submit" type="submit">Save Changes</button><button data-cancel class="admin-secondary-button" type="button">Cancel</button></div></form>`;
      row.querySelector("img").src = displayUrl(inst.photoUrl);
      row.querySelector("img").alt = inst.name;
      row.querySelector("h3").textContent = `${inst.name} ${inst.koreanName || ""}`.trim();
      row.querySelector("span").textContent = state.arrangements.filter(arrangement => (arrangement.instruments || []).some(entry => entry.instrumentId === inst.id)).length;
      row.querySelector("[data-edit]").onclick = () => renderInstrumentLibrary(expandedId === inst.id ? "" : inst.id);
      row.querySelector("[data-delete]").onclick = async () => {
        if (state.arrangements.some(arrangement => (arrangement.instruments || []).some(entry => entry.instrumentId === inst.id))) return status(q("instrument-status"), "Remove this instrument from all arrangements before deleting it.", "error");
        if (!confirm(`Delete ${inst.name}?`)) return;
        if (inst.photoPath) await storage.ref(inst.photoPath).delete().catch(() => {});
        state.instruments = state.instruments.filter(item => item.id !== inst.id);
        await saveState();
        renderInstrumentLibrary();
      };
      const form = row.querySelector("form");
      form.querySelector("[data-name]").value = inst.name;
      form.querySelector("[data-korean]").value = inst.koreanName || "";
      form.querySelector("[data-cancel]").onclick = () => renderInstrumentLibrary();
      form.onsubmit = async event => {
        event.preventDefault();
        try {
          await saveInstrument({ oldId: inst.id, name: form.querySelector("[data-name]").value, koreanName: form.querySelector("[data-korean]").value, file: form.querySelector("[data-photo]").files[0], existingUrl: inst.photoUrl, existingPath: inst.photoPath });
          renderInstrumentLibrary();
          status(q("instrument-status"), "Instrument saved.", "success");
        } catch (error) {
          status(q("instrument-status"), error.message || "Unable to save.", "error");
        }
      };
      out.appendChild(row);
    });
  }

  q("instrument-form").onsubmit = async event => {
    event.preventDefault();
    try {
      await saveInstrument({ name: q("instrument-name").value, koreanName: q("instrument-korean").value, file: q("instrument-photo").files[0] });
      q("instrument-form").hidden = true;
      resetAddInstrumentForm();
      renderInstrumentLibrary();
      status(q("instrument-status"), "Instrument added.", "success");
    } catch (error) {
      status(q("instrument-status"), error.message || "Unable to save.", "error");
    }
  };

  q("add-instrument").onclick = () => {
    resetAddInstrumentForm();
    q("instrument-form").hidden = false;
    q("instrument-name").focus();
    q("instrument-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  q("cancel-instrument-add").onclick = () => { q("instrument-form").hidden = true; resetAddInstrumentForm(); };
  q("add-arrangement").onclick = () => editArrangement();
  q("manage-instruments").onclick = () => { q("instrument-form").hidden = true; resetAddInstrumentForm(); renderInstrumentLibrary(); openModal(instrumentModal); };
  q("remove-arrangement-photo").onclick = () => { removeArrangementPhoto = true; q("arrangement-photo-existing").value = ""; preview(q("arrangement-photo-preview"), q("arrangement-photo-preview-wrap"), ""); };
  q("arrangement-photo").onchange = () => { const file = q("arrangement-photo").files[0]; if (file) preview(q("arrangement-photo-preview"), q("arrangement-photo-preview-wrap"), URL.createObjectURL(file)); };
  q("instrument-photo").onchange = () => { const file = q("instrument-photo").files[0]; if (file) preview(q("instrument-photo-preview"), q("instrument-photo-preview-wrap"), URL.createObjectURL(file)); };
  document.querySelectorAll("[data-close-modal]").forEach(button => { button.onclick = () => closeModal(editor); });
  document.querySelectorAll("[data-close-instrument-modal]").forEach(button => { button.onclick = () => closeModal(instrumentModal); });
  logout.onclick = async () => { await auth.signOut(); location.replace("login.html"); };

  if (!auth || !db || !storage) { loading.textContent = "Firebase could not be initialized."; return; }
  auth.onAuthStateChanged(async user => {
    if (!user) return location.replace("login.html");
    try {
      const admin = await db.collection("admins").doc(user.uid).get();
      if (!admin.exists || admin.data()?.active !== true) { await auth.signOut(); return location.replace("login.html"); }
      email.textContent = user.email || "Administrator";
      const snapshot = await docRef.get();
      if (snapshot.exists) state = { arrangements: [], instruments: [], ...snapshot.data() };
      else await saveState();
      state.arrangements.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      normalizeArrangementOrder();
      renderList();
      loading.hidden = true;
      main.hidden = false;
    } catch (error) {
      console.error(error);
      loading.textContent = "Unable to load arrangements. Check Firebase rules and try again.";
    }
  });
});
