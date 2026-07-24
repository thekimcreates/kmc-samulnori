"use strict";
(() => {
  const configs = [
    { id:"arrangements-list", label:"arrangements", empty:"No arrangements have been published yet." },
    { id:"members-grid", label:"team members", empty:"No team members have been published yet." },
    { id:"performances-grid", label:"performances", empty:"No performances have been published yet." }
  ];
  function stateElement(label){
    const el=document.createElement("div"); el.className="kmc-content-state"; el.setAttribute("role","status");
    el.innerHTML=`<div class="kmc-content-state__inner"><div class="kmc-content-state__spinner" aria-hidden="true"></div><h3>Loading ${label}</h3><p>Please wait a moment.</p></div>`;
    return el;
  }
  function hasRealContent(root){ return [...root.children].some(el=>!el.classList.contains("kmc-content-state") && !el.hidden); }
  function initialize(config){
    const root=document.getElementById(config.id); if(!root)return;
    const state=stateElement(config.label); root.prepend(state);
    const settle=()=>{ if(hasRealContent(root)) state.hidden=true; };
    const observer=new MutationObserver(settle); observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]}); settle();
    window.setTimeout(()=>{
      if(hasRealContent(root)){state.hidden=true;return;}
      state.hidden=false; state.innerHTML=`<div class="kmc-content-state__inner"><h3>${config.empty}</h3><p>Check back again soon.</p><button type="button">Try again</button></div>`;
      state.querySelector("button")?.addEventListener("click",()=>location.reload());
    },12000);
  }
  function imageFallbacks(){
    document.addEventListener("error",event=>{const img=event.target;if(!(img instanceof HTMLImageElement))return;img.closest(".arrangement-card,.instrument-image,.performance-card,.instructor-photo-wrap")?.classList.add("kmc-image-fallback")},true);
  }
  document.addEventListener("DOMContentLoaded",()=>{configs.forEach(initialize);imageFallbacks()});
})();
