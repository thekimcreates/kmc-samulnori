"use strict";
window.KMC_ARRANGEMENT_DEFAULTS = {
  instruments: [
    {id:"kkwaenggwari",name:"Kkwaenggwari",koreanName:"꽹과리",photoUrl:"assets/instruments/kkwaenggwari.jpg",photoPath:""},
    {id:"jing",name:"Jing",koreanName:"징",photoUrl:"assets/instruments/jing.jpg",photoPath:""},
    {id:"janggu",name:"Janggu",koreanName:"장구",photoUrl:"assets/instruments/janggu.jpg",photoPath:""},
    {id:"buk",name:"Buk",koreanName:"북",photoUrl:"assets/instruments/buk.jpg",photoPath:""},
    {id:"sogo",name:"Sogo",koreanName:"소고",photoUrl:"assets/instruments/sogo.jpg",photoPath:""},
    {id:"sangmo",name:"Sangmo",koreanName:"상모",photoUrl:"assets/instruments/sangmo.jpg",photoPath:""},
    {id:"five-buk",name:"Five Buk",koreanName:"오북",photoUrl:"assets/instruments/fivebuk.jpg",photoPath:""}
  ],
  arrangements: [
    {id:"samulnori",name:"Samulnori",koreanName:"사물놀이",photoUrl:"assets/arrangements/samulnori.jpg",photoPath:"",order:0,instruments:["kkwaenggwari","jing","janggu","buk"].map((instrumentId,order)=>({instrumentId,description:"Description coming soon.",order}))},
    {id:"nongak",name:"Nongak",koreanName:"농악",photoUrl:"assets/arrangements/nongak.jpg",photoPath:"",order:1,instruments:["kkwaenggwari","jing","janggu","buk","sogo","sangmo"].map((instrumentId,order)=>({instrumentId,description:"Description coming soon.",order}))},
    {id:"ogomu",name:"Ogomu",koreanName:"오고무",photoUrl:"assets/arrangements/ogomu.jpg",photoPath:"",order:2,instruments:["five-buk","buk"].map((instrumentId,order)=>({instrumentId,description:"Description coming soon.",order}))},
    {id:"nanta",name:"Nanta",koreanName:"난타",photoUrl:"assets/arrangements/nanta.jpg",photoPath:"",order:3,instruments:[{instrumentId:"buk",description:"Description coming soon.",order:0}]},
    {id:"sogo",name:"Sogo Dance",koreanName:"소고춤",photoUrl:"assets/arrangements/sogo.jpg",photoPath:"",order:4,instruments:[{instrumentId:"sogo",description:"Description coming soon.",order:0}]}
  ]
};
