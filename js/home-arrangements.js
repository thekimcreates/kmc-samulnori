"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const grid=document.getElementById("home-arrangement-grid"); if(!grid)return;
  const fallback=window.KMC_ARRANGEMENT_DEFAULTS || {arrangements:[]}; let data=fallback;
  try { const db=window.kmcFirebase?.db; if(db){const snap=await db.collection("siteContent").doc("arrangements").get(); if(snap.exists)data={...fallback,...snap.data()};} } catch(e){console.error("Unable to load home arrangements:",e)}
  grid.replaceChildren(); [...(data.arrangements||[])].sort((a,b)=>(a.order??0)-(b.order??0)).forEach(item=>{
    const a=document.createElement("a"); a.className="arrangement-card reveal arrangement-card-link visible"; a.href=`arrangements.html#${encodeURIComponent(item.id)}`; a.setAttribute("aria-label",`View ${item.name || 'arrangement'} details`);
    const img=document.createElement("img"); img.src=item.photoUrl||""; img.alt=item.name||"Arrangement"; img.loading="lazy";
    const content=document.createElement("div"); content.className="card-content"; const h3=document.createElement("h3"); h3.textContent=item.name||"Arrangement"; const p=document.createElement("p"); p.textContent=item.koreanName||""; content.append(h3,p); a.append(img,content); grid.appendChild(a);
  });
});
