"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const {auth,db,storage}=window.kmcFirebase||{};
  const defaults=window.KMC_ARRANGEMENT_DEFAULTS || {arrangements:[],instruments:[]};
  const docRef=db?.collection("siteContent").doc("arrangements");
  const q=id=>document.getElementById(id);
  const loading=q("arrangements-loading"), main=q("arrangements-admin"), email=q("admin-user-email"), logout=q("admin-logout");
  const list=q("arrangement-admin-list"), pageStatus=q("arrangement-page-status");
  const editor=q("arrangement-editor-modal"), instrumentModal=q("instrument-modal");
  let state=structuredClone(defaults), removeArrangementPhoto=false;

  const slug=value=>String(value||"item").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||`item-${Date.now()}`;
  const status=(el,msg,type="")=>{el.textContent=msg;el.className=`login-status${type?` is-${type}`:""}`};
  const openModal=modal=>{modal.hidden=false;modal.setAttribute("aria-hidden","false");requestAnimationFrame(()=>modal.classList.add("is-open"));document.body.style.overflow="hidden"};
  const closeModal=modal=>{modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");setTimeout(()=>modal.hidden=true,250);document.body.style.overflow=""};
  const instrumentById=id=>state.instruments.find(x=>x.id===id);
  const displayUrl=url=>String(url||"").startsWith("assets/")?`../${url}`:url;
  const saveState=async()=>docRef.set({...state,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:auth.currentUser?.uid||null});
  const upload=async(file,folder,id,oldPath="")=>{if(!file)return null;if(file.size>10*1024*1024)throw new Error("Photos must be 10 MB or smaller.");if(oldPath)await storage.ref(oldPath).delete().catch(()=>{});const path=`${folder}/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;const snap=await storage.ref(path).put(file,{contentType:file.type});return{photoUrl:await snap.ref.getDownloadURL(),photoPath:path}};
  const preview=(img,wrap,url)=>{if(url){img.src=displayUrl(url);wrap.hidden=false}else{img.removeAttribute("src");wrap.hidden=true}};

  function renderList(){
    list.replaceChildren();
    [...state.arrangements].sort((a,b)=>(a.order??0)-(b.order??0)).forEach(item=>{
      const card=document.createElement("article");card.className="performance-admin-card";
      card.innerHTML=`<div class="arrangement-admin-card-main"><img class="arrangement-admin-thumb" alt=""><div><h3></h3><p></p></div></div><div class="performance-admin-actions"><button class="admin-secondary-button admin-small-button" data-edit type="button">Edit</button><button class="admin-danger-button admin-small-button" data-delete type="button">Delete</button></div>`;
      card.querySelector("img").src=displayUrl(item.photoUrl);card.querySelector("img").alt=item.name||"Arrangement";card.querySelector("h3").textContent=`${item.name||"Arrangement"} ${item.koreanName||""}`.trim();card.querySelector("p").textContent=`${(item.instruments||[]).length} instrument${(item.instruments||[]).length===1?"":"s"}`;
      card.querySelector("[data-edit]").onclick=()=>editArrangement(item.id);
      card.querySelector("[data-delete]").onclick=async()=>{if(!confirm(`Delete ${item.name}?`))return; if(item.photoPath)await storage.ref(item.photoPath).delete().catch(()=>{}); state.arrangements=state.arrangements.filter(x=>x.id!==item.id);state.arrangements.forEach((x,i)=>x.order=i);await saveState();renderList();status(pageStatus,"Arrangement deleted.","success")};
      list.appendChild(card);
    });
  }

  function renderInstrumentChecklist(selected=[]){
    const checklist=q("instrument-checklist");checklist.replaceChildren();
    state.instruments.forEach(inst=>{const label=document.createElement("label");label.innerHTML=`<input type="checkbox"><span></span>`;const input=label.querySelector("input");input.value=inst.id;input.checked=selected.some(x=>x.instrumentId===inst.id);label.querySelector("span").textContent=`${inst.name} ${inst.koreanName||""}`.trim();input.onchange=renderSelectedInstruments;checklist.appendChild(label)});
  }
  function renderSelectedInstruments(){
    const box=q("selected-instruments"), existing=new Map([...box.querySelectorAll("[data-instrument-id]")].map(row=>[row.dataset.instrumentId,row.querySelector("textarea").value]));box.replaceChildren();
    [...q("instrument-checklist").querySelectorAll("input:checked")].forEach((input,index)=>{const inst=instrumentById(input.value);if(!inst)return;const row=document.createElement("article");row.className="selected-instrument-card";row.dataset.instrumentId=inst.id;row.innerHTML=`<img alt=""><div class="selected-instrument-copy"><h3></h3><label>Description for this arrangement<textarea rows="4" placeholder="Describe how this instrument is used in this arrangement."></textarea></label></div>`;row.querySelector("img").src=displayUrl(inst.photoUrl);row.querySelector("img").alt=inst.name||"Instrument";row.querySelector("h3").textContent=`${inst.name} ${inst.koreanName||""}`.trim();row.querySelector("textarea").value=existing.get(inst.id)||"";box.appendChild(row)});
  }
  function editArrangement(id=null){
    const item=state.arrangements.find(x=>x.id===id)||{id:"",name:"",koreanName:"",photoUrl:"",photoPath:"",instruments:[]};removeArrangementPhoto=false;
    q("arrangement-editor-title").textContent=id?"Edit Arrangement":"Add Arrangement";q("arrangement-id").value=item.id;q("arrangement-name").value=item.name;q("arrangement-korean").value=item.koreanName||"";q("arrangement-photo-existing").value=item.photoUrl||"";q("arrangement-photo-path").value=item.photoPath||"";q("arrangement-photo").value="";preview(q("arrangement-photo-preview"),q("arrangement-photo-preview-wrap"),item.photoUrl);renderInstrumentChecklist(item.instruments||[]);renderSelectedInstruments();
    [...q("selected-instruments").children].forEach(row=>{const match=(item.instruments||[]).find(x=>x.instrumentId===row.dataset.instrumentId);row.querySelector("textarea").value=match?.description||""});status(q("arrangement-form-status"),"");openModal(editor);
  }

  q("arrangement-form").onsubmit=async e=>{e.preventDefault();const oldId=q("arrangement-id").value;const old=state.arrangements.find(x=>x.id===oldId);let id=oldId||slug(q("arrangement-name").value);if(!oldId&&state.arrangements.some(x=>x.id===id))id+=`-${Date.now()}`;let photoUrl=removeArrangementPhoto?"":q("arrangement-photo-existing").value,photoPath=removeArrangementPhoto?"":q("arrangement-photo-path").value;
    try{const uploaded=await upload(q("arrangement-photo").files[0],"arrangement-photos",id,photoPath);if(uploaded)({photoUrl,photoPath}=uploaded);if(!photoUrl)throw new Error("Please upload an arrangement photo.");const instruments=[...q("selected-instruments").children].map((row,order)=>({instrumentId:row.dataset.instrumentId,description:row.querySelector("textarea").value.trim(),order}));const record={id,name:q("arrangement-name").value.trim(),koreanName:q("arrangement-korean").value.trim(),photoUrl,photoPath,order:old?.order??state.arrangements.length,instruments};if(old)state.arrangements=state.arrangements.map(x=>x.id===oldId?record:x);else state.arrangements.push(record);await saveState();renderList();closeModal(editor);status(pageStatus,"Arrangement saved.","success")}catch(err){console.error(err);status(q("arrangement-form-status"),err.message||"Unable to save.","error")}
  };

  function renderInstrumentLibrary(){const out=q("instrument-admin-list");out.replaceChildren();state.instruments.forEach(inst=>{const row=document.createElement("article");row.className="instrument-library-card";row.innerHTML=`<img alt=""><div><h3></h3><p>Used by <span></span> arrangement(s)</p></div><div class="performance-admin-actions"><button data-edit class="admin-secondary-button admin-small-button" type="button">Edit</button><button data-delete class="admin-danger-button admin-small-button" type="button">Delete</button></div>`;row.querySelector("img").src=displayUrl(inst.photoUrl);row.querySelector("img").alt=inst.name;row.querySelector("h3").textContent=`${inst.name} ${inst.koreanName||""}`.trim();row.querySelector("span").textContent=state.arrangements.filter(a=>(a.instruments||[]).some(x=>x.instrumentId===inst.id)).length;row.querySelector("[data-edit]").onclick=()=>fillInstrumentForm(inst);row.querySelector("[data-delete]").onclick=async()=>{if(state.arrangements.some(a=>(a.instruments||[]).some(x=>x.instrumentId===inst.id)))return status(q("instrument-status"),"Remove this instrument from all arrangements before deleting it.","error");if(!confirm(`Delete ${inst.name}?`))return;if(inst.photoPath)await storage.ref(inst.photoPath).delete().catch(()=>{});state.instruments=state.instruments.filter(x=>x.id!==inst.id);await saveState();renderInstrumentLibrary()};out.appendChild(row)})}
  function fillInstrumentForm(inst={id:"",name:"",koreanName:"",photoUrl:"",photoPath:""}){q("instrument-id").value=inst.id;q("instrument-name").value=inst.name;q("instrument-korean").value=inst.koreanName||"";q("instrument-photo-existing").value=inst.photoUrl||"";q("instrument-photo-path").value=inst.photoPath||"";q("instrument-photo").value="";preview(q("instrument-photo-preview"),q("instrument-photo-preview-wrap"),inst.photoUrl)}
  q("instrument-form").onsubmit=async e=>{e.preventDefault();const oldId=q("instrument-id").value;let id=oldId||slug(q("instrument-name").value);if(!oldId&&state.instruments.some(x=>x.id===id))id+=`-${Date.now()}`;try{let photoUrl=q("instrument-photo-existing").value,photoPath=q("instrument-photo-path").value;const uploaded=await upload(q("instrument-photo").files[0],"instrument-photos",id,photoPath);if(uploaded)({photoUrl,photoPath}=uploaded);if(!photoUrl)throw new Error("Please upload an instrument photo.");const record={id,name:q("instrument-name").value.trim(),koreanName:q("instrument-korean").value.trim(),photoUrl,photoPath};state.instruments=oldId?state.instruments.map(x=>x.id===oldId?record:x):[...state.instruments,record];await saveState();fillInstrumentForm();renderInstrumentLibrary();status(q("instrument-status"),"Instrument saved.","success")}catch(err){status(q("instrument-status"),err.message||"Unable to save.","error")}};

  q("add-arrangement").onclick=()=>editArrangement();q("manage-instruments").onclick=()=>{fillInstrumentForm();renderInstrumentLibrary();openModal(instrumentModal)};q("remove-arrangement-photo").onclick=()=>{removeArrangementPhoto=true;q("arrangement-photo-existing").value="";preview(q("arrangement-photo-preview"),q("arrangement-photo-preview-wrap"),"")};q("arrangement-photo").onchange=()=>{const file=q("arrangement-photo").files[0];if(file)preview(q("arrangement-photo-preview"),q("arrangement-photo-preview-wrap"),URL.createObjectURL(file))};q("instrument-photo").onchange=()=>{const file=q("instrument-photo").files[0];if(file)preview(q("instrument-photo-preview"),q("instrument-photo-preview-wrap"),URL.createObjectURL(file))};document.querySelectorAll("[data-close-modal]").forEach(b=>b.onclick=()=>closeModal(editor));document.querySelectorAll("[data-close-instrument-modal]").forEach(b=>b.onclick=()=>closeModal(instrumentModal));

  if(!auth||!db||!storage){loading.textContent="Firebase could not be initialized.";return}
  auth.onAuthStateChanged(async user=>{if(!user)return location.replace("login.html");try{const admin=await db.collection("admins").doc(user.uid).get();if(!admin.exists||admin.data()?.active!==true){await auth.signOut();return location.replace("login.html")}email.textContent=user.email||"Administrator";const snap=await docRef.get();state=snap.exists?{...structuredClone(defaults),...snap.data()}:structuredClone(defaults);if(!snap.exists)await saveState();renderList();loading.hidden=true;main.hidden=false}catch(err){console.error(err);loading.textContent="Unable to load the arrangements editor. Check Firestore rules."}});
  logout.onclick=async()=>{await auth.signOut();location.replace("login.html")};
});
