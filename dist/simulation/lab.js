
const GEOM = window.RevelystCAD;
(()=>{
"use strict";
// ---------- utils ----------
let seed = 20261005;
function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const R = (a,b)=>a+(b-a)*rnd();
const RI = (a,b)=>Math.floor(R(a,b+1));
const pick = arr => arr[Math.floor(rnd()*arr.length)];
const expR = m => -Math.log(1-rnd())*m;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $ = id => document.getElementById(id);

// ---------- geometry decode ----------
const LAYERS = {};
for (const [k,b64] of Object.entries(GEOM)){
  const bin = atob(b64); const u8 = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  const a = new Int16Array(u8.buffer); const polys=[]; let i=0;
  while(i<a.length){ const n=a[i++]; const p=new Float32Array(n*2); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(let j=0;j<n*2;j+=2){ const x=a[i++]/10, y=a[i++]/10; p[j]=x;p[j+1]=y; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    polys.push({p,x0,y0,x1,y1}); }
  LAYERS[k]=polys;
}

// ---------- facility model (unverified relative units; x east, y south; source CAD trace) ----------
const NORTH_WALL=20, SOUTH_WALL=631;
const N_Y=[150,356], S_Y=[397,561];
const aisles=[];
for(let k=0;k<=45;k++){ const n=57-k; aisles.push({name:"N"+n, x:52+15*k, block:"N", type: n<=14?"V":"R"}); }
for(let k=0;k<=45;k++){ const n=57-k; aisles.push({name:"S"+n, x:51+15*k, block:"S", type: n<=12?"L":"R"}); }
aisles.find(a=>a.name==="S12").x=730;
aisles.push({name:"S11",x:749.5,block:"S",type:"L"},{name:"S10",x:770,block:"S",type:"L"},{name:"S09",x:787,block:"S",type:"L"});
const LOCUS_PAL=[772,793,813,834].map((x,i)=>({name:"Locus pallets "+(i+1),x,block:"L",type:"L"}));
const T_AISLES=[["T7",1072],["T6",1090],["T5",1110],["T4",1130],["T3",1150],["T2",1170],["T1",1190],["T0",1209]].map(([name,x])=>({name,x,block:"T",type:"W"}));
const NA=aisles.filter(a=>a.block==="N").sort((a,b)=>a.x-b.x), SA=aisles.filter(a=>a.block==="S").sort((a,b)=>a.x-b.x);
const reserveAisles=aisles.filter(a=>a.type==="R");
const vnaAisles=aisles.filter(a=>a.type==="V");
const locusAisles=[...LOCUS_PAL, ...SA.filter(a=>a.type==="L").sort((a,b)=>b.x-a.x)];
const replenTargets=[...locusAisles, ...vnaAisles, ...T_AISLES];
const isRack=a=>a.block==="N"||a.block==="S";
function yRange(a){ return a.block==="N"?[N_Y[0]+3,N_Y[1]-3]:a.block==="S"?[S_Y[0]+3,S_Y[1]-3]:a.block==="T"?[150,355]:[150,355]; }
function locIn(a){ const [y0,y1]=yRange(a); return {x:a.x, y:R(y0,y1), aisle:a}; }

// docks
const STRETCH_DOCKS=[{door:44,x:454},{door:42,x:466},{door:36,x:574}];
const INBOUND_DOCKS=[{door:24,x:729},{door:20,x:813},{door:16,x:848},{door:12,x:933}];
const OUT_X=[456,468,492,504,576,588,612,624,696,708,732,744];
const OUT=OUT_X.map((x,i)=>({i,x,kind:i<3?"wm":i>=10?"pc":"ltl",count:0,reserved:0,loading:false,timer:0,trailerOut:0,firstAt:null,loadedN:0}));
const OUT_CAP=26, outSlot=j=>({dx:(j%2?2.6:-2.6), y:33+Math.floor(j/2)*5.6}), OUT_ENTRY=110;
// downlanes, numbered east to west like the spirals
const DL_X=[1105,1084,1063,1023,1002,981,941,920,867];
const DL=DL_X.map((x,i)=>({i,x,kind:i>=7?"pc":i===6?"exception":"rt",cur:0,full:0,reserved:0,weight:i===5?2.4:1,recirc:0}));
const DL_POS=14, dlSlot=j=>({x:(j%2?7:-7), y:52+Math.floor(j/2)*6}), DL_CONV_Y=104;
// User clarification: levels 1–2 active pick; level 3 approximately ten pack positions.
const TOWER={levels:[0,10.5,21],activeLevels:[0,10.5],packLevel:21,packStationsApproximate:10};
const PACK=[[962,173],[1017,184],[969,216],[1022,230],[960,258],[1014,274],[966,302],[1020,320],[963,341],[1023,347]].map(([x,y],i)=>({id:i+1,x,y,h:TOWER.packLevel,q:0,cur:null,left:0,inbound:0}));
const WEIGH={x:998,y:285,h:24},PRINT_APPLY={x:998,y:215,h:24};
const TOWER_RISE=h=>[{x:935,y:366,h},{x:946,y:350,h},{x:946,y:290,h:24},{x:980,y:290,h:24}];
const WRAP={x:1040,y:415,q:[],cur:null,left:0};
const VAS_ST=[{x:1025,y:532,cur:null,left:0},{x:1058,y:532,cur:null,left:0}];
const VAS_IN={x:1000,y:552}, VAS_OUT={x:1085,y:552};
const SLAP={x:945,y:525,cases:0,acc:0,pending:false};
const WM_PROC={x:1195,y:80,in:{x:1180,y:118},out:{x:1212,y:118},st:[{x:1185,y:60,cur:null,left:0},{x:1205,y:60,cur:null,left:0}],q:0,ready:0};
const VNA_INDUCT={x:946,y:378};
const INDUCT=[{x:792,y:366},{x:802,y:366},{x:812,y:366}], DEDUCT={x:866,y:366};
const CHARGERS=[0,1,2,3,4,5].map(i=>({x:753+i*4,y:362,bot:null}));
const BRIDGE={x:786,y:384};
const IN_STAGE=[]; for(let r=0;r<3;r++) for(let c=0;c<22;c++) IN_STAGE.push({x:752+c*12,y:596+r*7,used:false});

const AREAS=[
  {x0:430,y0:566,x1:600,y1:631,name:"Stretch docks",d:"Three Stretch robots in use at doors 44, 42 and 36. Floor-loaded cartons ride the extendable conveyors and are palletized at the dock.",tint:"--stretch"},
  {x0:640,y0:566,x1:1036,y1:631,name:"Inbound docks · staging",d:"Hand-unloaded trailers at the inbound docks. Built pallets wait in inbound staging for putaway.",tint:"--stretch"},
  {x0:30,y0:24,x1:790,y1:132,name:"Outbound staging",d:"Pallets staged in front of the outbound docks on the north wall: doors 1–3 High-volume customer, 4–10 LTL, 11–12 parcel. 26 pallets per trailer.",tint:"--pallet"},
  {x0:848,y0:28,x1:1128,y1:100,name:"Downlanes 1–9",d:"Cases and parcels divert off the tower conveyance into 9 lanes with 14 pallet positions each. DL1–DL6 build retail pallets; DL7 is reserved for exceptions and, DL8–DL9 build parcel pallets.",tint:"--tote"},
  {x0:1160,y0:28,x1:1236,y1:124,name:"High-volume customer process",d:"High-volume customer case pallets from the High-volume customer case area are processed here, then go to outbound staging.",tint:"--locusZone"},
  {x0:746,y0:140,x1:856,y1:374,name:"Locus picking pallets",d:"Locus pick faces on pallets, induct / deduct queue, carton & tote storage and 6 chargers. The bridge at the south end connects to aisles S09–S12.",tint:"--locusZone"},
  {x0:856,y0:140,x1:936,y1:374,name:"Pick tower",d:"Split-case pick tower. Levels 1 and 2 hold active pick locations. Their totes use conveyors to reach approximately ten pack stations on Level 3.",tint:"--conv"},
  {x0:936,y0:140,x1:1066,y1:374,name:"Tower conveyance",d:"Locus and tower totes feed Level 3 packing. Weighing scales and automated print-and-apply stations sit on the conveyor; packed parcels and other case flows join the shared route to the north downlanes.",tint:"--conv"},
  {x0:1066,y0:140,x1:1236,y1:374,name:"High-volume customer case area",d:"Aisles T7–T0. High-volume customer cases are picked to pallets here and taken to High-volume customer process.",tint:"--locusZone"},
  {x0:790,y0:386,x1:1090,y1:566,name:"VAS",d:"Value-added services in front of the pick tower: slapper locations, display assembly and the stretch wrapper.",tint:"--vasZone"},
  {x0:1092,y0:386,x1:1236,y1:628,name:"Manufacturing",d:"Manufacturing equipment and racking as drawn in the CAD. Not modeled.",tint:"--cad"},
];

// ---------- route network ----------
const H=[ {y:OUT_ENTRY,x0:450,x1:790}, {y:140,x0:52,x1:1215}, {y:377,x0:51,x1:1215}, {y:575,x0:51,x1:1035} ];
const V=[];
NA.forEach(a=>V.push({x:a.x,y0:140,y1:377}));
SA.forEach(a=>V.push({x:a.x,y0:377,y1:575}));
LOCUS_PAL.forEach(a=>V.push({x:a.x,y0:140,y1:377}));
T_AISLES.forEach(a=>V.push({x:a.x,y0:140,y1:377}));
V.push({x:855,y0:140,y1:377});
[900,1040].forEach(x=>V.push({x,y0:377,y1:575}));
OUT.forEach(o=>V.push({x:o.x,y0:OUT_ENTRY,y1:140}));
const nodes=[], nodeKey=new Map();
function nodeAt(x,y){ const k=Math.round(x*2)+","+Math.round(y*2); if(nodeKey.has(k)) return nodeKey.get(k); const id=nodes.length; nodes.push({x,y,adj:[]}); nodeKey.set(k,id); return id; }
const lineNodes=[];
function linkLine(ids, horiz){ ids.sort((a,b)=>horiz?nodes[a].x-nodes[b].x:nodes[a].y-nodes[b].y); for(let i=1;i<ids.length;i++){ const a=nodes[ids[i-1]], b=nodes[ids[i]]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<0.01) continue; a.adj.push([ids[i],d]); b.adj.push([ids[i-1],d]); } return ids; }
const hIds=H.map(h=>[nodeAt(h.x0,h.y),nodeAt(h.x1,h.y)]);
const vIds=V.map(v=>[nodeAt(v.x,v.y0),nodeAt(v.x,v.y1)]);
V.forEach((v,vi)=>H.forEach((h,hi)=>{ if(v.x>=h.x0-0.01&&v.x<=h.x1+0.01&&h.y>=v.y0-0.01&&h.y<=v.y1+0.01){ const id=nodeAt(v.x,h.y); hIds[hi].push(id); vIds[vi].push(id);} }));
H.forEach((h,i)=>lineNodes.push({h, ids:linkLine([...new Set(hIds[i])],true)}));
V.forEach((v,i)=>lineNodes.push({v, ids:linkLine([...new Set(vIds[i])],false)}));
function snap(p){ let best=null, bd=1e9;
  for(const L of lineNodes){ let q;
    if(L.h){ q={x:clamp(p.x,L.h.x0,L.h.x1), y:L.h.y}; } else { q={x:L.v.x, y:clamp(p.y,L.v.y0,L.v.y1)}; }
    const d=Math.abs(q.x-p.x)+Math.abs(q.y-p.y); if(d<bd){bd=d;best={q,L};} }
  return best; }
function neighbors(s){ const {q,L}=s; const ids=L.ids; const key=L.h?"x":"y"; let lo=null,hi=null;
  for(const id of ids){ const v=nodes[id][key]; if(v<=q[key]+1e-6) lo=id; if(v>=q[key]-1e-6 && hi===null) hi=id; }
  const out=[]; if(lo!==null) out.push([lo,Math.hypot(nodes[lo].x-q.x,nodes[lo].y-q.y)]); if(hi!==null&&hi!==lo) out.push([hi,Math.hypot(nodes[hi].x-q.x,nodes[hi].y-q.y)]); return out; }
function route(a,b){
  const sa=snap(a), sb=snap(b);
  if(sa.L===sb.L) return [a,sa.q,sb.q,b];
  const N=nodes.length, dist=new Float64Array(N).fill(1e18), prev=new Int32Array(N).fill(-1), done=new Uint8Array(N);
  const start=neighbors(sa), goal=new Map(neighbors(sb));
  const heap=[]; const push=(d,i)=>{heap.push([d,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const pop=()=>{const top=heap[0];const last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  for(const [i,d] of start){ dist[i]=d; push(d,i); }
  let bestEnd=-1,bestD=1e18;
  while(heap.length){ const [d,i]=pop(); if(done[i]) continue; done[i]=1; if(d>=bestD) break;
    if(goal.has(i)){ const t=d+goal.get(i); if(t<bestD){bestD=t;bestEnd=i;} }
    for(const [j,w] of nodes[i].adj){ const nd=d+w; if(nd<dist[j]){dist[j]=nd;prev[j]=i;push(nd,j);} } }
  if(bestEnd<0) return [a,b];
  const chain=[]; for(let i=bestEnd;i>=0;i=prev[i]) chain.push(nodes[i]); chain.reverse();
  return [a,sa.q,...chain,sb.q,b];
}
function cleanPath(pts){ const out=[]; for(const p of pts){ const l=out[out.length-1]; if(!l||Math.hypot(l.x-p.x,l.y-p.y,(l.h||0)-(p.h||0))>0.05) out.push({...p}); } if(out.length===1) out.push({...out[0]}); return out; }
function prepPath(pts){ pts=cleanPath(pts); const L=[0]; for(let i=1;i<pts.length;i++) L.push(L[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y,(pts[i].h||0)-(pts[i-1].h||0))); return {pts,L,len:L[L.length-1]}; }
function pointAt(P,d){ const {pts,L}=P;if(d<=0)return {...pts[0],a:Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x)};if(d>=P.len){const n=pts.length;return {...pts[n-1],a:Math.atan2(pts[n-1].y-pts[n-2].y,pts[n-1].x-pts[n-2].x)};}
 let i=1;while(L[i]<d)i++;const t=(d-L[i-1])/((L[i]-L[i-1])||1),a=pts[i-1],b=pts[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,...(a.h!==undefined?{h:a.h+((b.h??a.h)-a.h)*t}:{}),a:Math.atan2(b.y-a.y,b.x-a.x)}; }

// ---------- parameters ----------
const PARAMS=[
  {id:"stretchRate",label:"Stretch rate, cases/hr per robot",min:150,max:800,step:10,v:450,tag:"a"},
  {id:"mtbi",label:"Stretch mean time between interventions, min",min:10,max:180,step:5,v:45,tag:"a"},
  {id:"mttr",label:"Stretch intervention time, min",min:1,max:20,step:1,v:4,tag:"a"},
  {id:"manualRate",label:"Inbound dock unload, cases/hr per door",min:80,max:400,step:10,v:220,tag:"a"},
  {id:"bots",label:"Locus bots",min:5,max:40,step:1,v:20,tag:"c"},
  {id:"pickers",label:"Locus pick associates",min:2,max:20,step:1,v:8,tag:"a"},
  {id:"pickTime",label:"Locus pick time per stop, s",min:6,max:40,step:1,v:14,tag:"a"},
  {id:"forks",label:"Lift trucks (reach, VNA, jacks)",min:4,max:24,step:1,v:16,tag:"a"},
  {id:"towerRate",label:"Pick-tower split-case totes / hr",min:0,max:400,step:10,v:120,tag:"a"},
  {id:"packTime",label:"Pack time per tote, s",min:20,max:240,step:5,v:60,tag:"a"},
  {id:"vnaRate",label:"VNA case pallets inducted / hr (N12–N14)",min:0,max:30,step:1,v:10,tag:"a"},
  {id:"slapRate",label:"Slapper cases / hr",min:0,max:400,step:10,v:150,tag:"a"},
  {id:"wmRate",label:"High-volume customer case pallets / hr",min:0,max:30,step:1,v:8,tag:"a"},
  {id:"wmProc",label:"High-volume customer process time per pallet, min",min:2,max:40,step:1,v:12,tag:"a"},
  {id:"ltlRate",label:"Full pallets from reserve to outbound / hr",min:0,max:40,step:1,v:10,tag:"a"},
  {id:"vasShare",label:"Of those, pallets needing VAS, %",min:0,max:80,step:5,v:30,tag:"a"},
];
PARAMS.push(
{id:"botSpeed",label:"AMR travel, model units/s",min:1,max:8,step:.2,v:4.4,tag:"a"},
{id:"pickerSpeed",label:"Associate travel, model units/s",min:1,max:6,step:.2,v:3.6,tag:"a"},
{id:"forkSpeed",label:"Lift-truck travel, model units/s (empty)",min:1,max:12,step:.5,v:8,tag:"a"},
{id:"conveyorScale",label:"Conveyor speed multiplier",min:.25,max:3,step:.25,v:1,tag:"a"},
{id:"casePallet",label:"Cases per retail pallet",min:5,max:100,step:1,v:40,tag:"a"},
{id:"parcelPallet",label:"Parcels per pallet",min:5,max:150,step:1,v:60,tag:"a"},
{id:"replenEvery",label:"Demonstration replenishment trigger, picks",min:5,max:100,step:1,v:30,tag:"a"},
{id:"trailerCases",label:"Stretch trailer cases (mean; ±20%)",min:100,max:2500,step:50,v:1100,tag:"a"},
{id:"manualCases",label:"Manual trailer cases (mean; ±20%)",min:100,max:2500,step:50,v:900,tag:"a"},
{id:"swapMinutes",label:"Trailer changeover, min (mean; ±25%)",min:1,max:60,step:1,v:20,tag:"a"},
{id:"lane6Weight",label:"Lane 6 retail routing weight",min:.1,max:5,step:.1,v:2.4,tag:"a"},
{id:"seed",label:"Random seed",min:1,max:2147483646,step:1,v:20261005,tag:"a"});
const P={}; PARAMS.forEach(p=>P[p.id]=p.v);
const holds={fleet:false,stretch:false,bridge:false,conveyor:false,lane:false};
let bridgeOwner=null;
const INITIAL_SEED=20261005;

let CASES_PER_PALLET=40, PARCELS_PER_PALLET=60, REPLEN_EVERY=30; const VNA_CASES=30;

// ---------- state ----------
let S, logDirty=true;
function newState(){
  seed=P.seed; bridgeOwner=null; for(const k of Object.keys(holds))holds[k]=false; CASES_PER_PALLET=P.casePallet;PARCELS_PER_PALLET=P.parcelPallet;REPLEN_EVERY=P.replenEvery;
  S={ t:0, t0:0, slotClaims:new Set(), forkWork:0, items:[], tasks:[], forks:[], bots:[], pickers:[], ev:{}, log:[],
      stretch:[], manual:[], faults:0, trailers:0, stretchBusy:0, stretchTime:0,
      picksSinceReplen:0, waits:[], acc:{tower:0,vna:0,wm:0,ltl:0}, vasQ:[], vasOut:0,vasClaimed:0, loaded:0, trailersOut:0, recirc:0,
      forkBusy:0, forkTime:0, tot:{} };
  STRETCH_DOCKS.forEach((d,i)=>S.stretch.push({id:"S"+(i+1),door:d.door,x:d.x,state:"swap",timer:R(60,600),swapT:600,left:0,total:1,acc:0,nextFault:0,arm:0,rec:{x:d.x,cartons:0}}));
  INBOUND_DOCKS.forEach(d=>S.manual.push({door:d.door,x:d.x,state:"swap",timer:R(300,900),swapT:900,left:0,total:1,acc:0,rec:{x:d.x,cartons:0}}));
  IN_STAGE.forEach(s=>s.used=false); S.stretch.forEach(s=>s.rec.pallets=0);
  OUT.forEach(o=>{o.count=0;o.reserved=0;o.loading=false;o.timer=0;o.trailerOut=0;o.firstAt=S.t-R(0,3*3600);o.loadedN=0;});
  DL.forEach(l=>{l.cur=0;l.full=0;l.weight=l.i===5?P.lane6Weight:1;l.reserved=0;l.recirc=0;});
  PACK.forEach(p=>{p.q=0;p.cur=null;p.left=0;p.inbound=0;});
  WRAP.q=[];WRAP.cur=null;WRAP.left=0; VAS_ST.forEach(v=>{v.cur=null;v.left=0;}); SLAP.cases=CASES_PER_PALLET; SLAP.acc=0; SLAP.pending=false;
  WM_PROC.q=0; WM_PROC.ready=0;WM_PROC.claimed=0; WM_PROC.st.forEach(s=>{s.cur=null;s.left=0;});
  CHARGERS.forEach(c=>c.bot=null);
  syncBots(); syncPickers(); syncForks();
  DL.forEach(l=>{ for(let j=0;j<l.full;j++) queuePull(l); });
}
function ev(name,n=1){ (S.ev[name] ||= []).push([S.t,n]); S.tot[name]=(S.tot[name]||0)+n; }
function rate(name){ const a=S.ev[name]; if(!a) return 0; const cut=S.t-3600; while(a.length&&a[0][0]<cut) a.shift(); let s=0; for(const e of a) s+=e[1]; const span=Math.min(3600,S.t-S.t0); return span>0?s*3600/span:0; }
function log(msg,kind){ S.log.unshift({t:S.t,msg,kind}); if(S.log.length>8) S.log.pop(); logDirty=true; }
function hhmm(t){ const m=Math.floor(t/60)%1440; return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); }

// ---------- agents: sync counts ----------
function syncBots(){ while(S.bots.filter(b=>!b.retire).length<P.bots){ const p=pick(INDUCT); S.bots.push({id:S.bots.length+1,x:p.x+R(-3,3),y:p.y+R(-2,2),a:0,state:"toInduct",path:null,d:0,stops:[],si:0,timer:0,bat:R(45,100),wait0:0,claimed:null}); }
  let extra=S.bots.filter(b=>!b.retire).length-P.bots; for(const b of S.bots){ if(extra<=0)break; if(!b.retire){b.retire=true;extra--;} } }
function syncPickers(){ while(S.pickers.length<P.pickers) S.pickers.push({x:0,y:0,state:"idle",path:null,d:0,bot:null,zone:[]}); S.pickers.length=P.pickers;
  const per=locusAisles.length/S.pickers.length; S.pickers.forEach((p,i)=>{ p.zone=locusAisles.slice(Math.floor(i*per),Math.max(Math.floor(i*per)+1,Math.floor((i+1)*per))); if(!p.x){ const l=locIn(p.zone[0]); p.x=l.x; p.y=l.y; } if(p.bot&&!S.bots.includes(p.bot)){p.bot=null;p.state="idle";} }); }
function syncForks(){ while(S.forks.filter(f=>!f.retire).length<P.forks){ const i=S.forks.length; S.forks.push({id:i+1,x:640+(i%10)*7,y:585,a:-Math.PI/2,task:null,si:0,path:null,d:0,load:false}); }
  let extra=S.forks.filter(f=>!f.retire).length-P.forks; for(let i=S.forks.length-1;i>=0&&extra>0;i--){ if(!S.forks[i].retire){S.forks[i].retire=true;extra--;} } }

// ---------- conveyor items ----------
function addItem(pts,speed,kind,onEnd){ S.items.push({P:prepPath(pts.map(p=>({...p,h:p.h??elev(p.x,p.y)}))),d:0,speed,kind,onEnd}); }
const NORTH_RUN=[{x:998,y:345,h:24},WEIGH,PRINT_APPLY,{x:998,y:145,h:24},{x:1012,y:121,h:10},{x:1012,y:DL_CONV_Y,h:10}];
function chooseDL(kind){ const ls=DL.filter(l=>l.kind===kind); let tot=ls.reduce((s,l)=>s+l.weight,0), r=rnd()*tot; for(const l of ls){ r-=l.weight; if(r<=0) return l; } return ls[ls.length-1]; }
function toDownlane(fromPts, kind, itemKind){ const l=chooseDL(kind);
  // Passing a process point is recorded; no unmeasured scale/label dwell or weight is fabricated.
  const last=fromPts[fromPts.length-1],h=last.h??elev(last.x,last.y);
  addItem([...fromPts,{x:1040,y:last.y,h},{x:1040,y:366,h:24},{x:998,y:366,h:24},...NORTH_RUN.slice(0,2)],2.3,itemKind,()=>{
   ev('weighPass');addItem([WEIGH,PRINT_APPLY],2.3,itemKind,()=>{ev('labelPass');addItem(NORTH_RUN.slice(2).concat([{x:l.x,y:DL_CONV_Y,h:10},{x:l.x,y:93,h:10},{x:l.x,y:70,h:3}]),2.3,itemKind,()=>dlArrive(l,kind,itemKind));});
  }); }
function dlArrive(l,kind,itemKind){
  if(l.full>=DL_POS||(holds.lane&&l.i===5)){ l.recirc++; S.recirc++; ev("recirc"); if(l.recirc%20===1) log(`DL${l.i+1} full: ${itemKind==="carton"?"parcel":"case"} recirculating`, "warn");
    addItem([{x:l.x,y:93},{x:l.x,y:DL_CONV_Y},{x:1125,y:DL_CONV_Y},{x:1125,y:112},{x:l.x,y:112},{x:l.x,y:DL_CONV_Y},{x:l.x,y:70}],2.3,itemKind,()=>dlArrive(l,kind,itemKind)); return; }
  ev(kind==="pc"?"dlParcel":"dlCase"); l.cur++; const per=kind==="pc"?PARCELS_PER_PALLET:CASES_PER_PALLET;
  if(l.cur>=per){ l.cur=0; l.full++; ev("dlPallet"); queuePull(l); } }
function queuePull(l){ addTask({type:"dlpull",pri:3,lane:l}); }
function sendToPack(fromPts){ let best=PACK[0],bv=1e9; for(const p of PACK){ const v=p.q+(p.cur?1:0)+p.inbound; if(v<bv){bv=v;best=p;} } best.inbound++;
  const last=fromPts[fromPts.length-1],h=last.h??3;
  addItem([...fromPts,...TOWER_RISE(h),{x:980,y:best.y,h:24},{x:best.x,y:best.y,h:24}],2.2,"tote",()=>{best.inbound--;best.q++;}); }

// ---------- tasks ----------
function addTask(t){if(t.from?.unavailable||t.to?.unavailable){if(t.out)t.out.reserved=Math.max(0,t.out.reserved-1);log("Stock location unavailable; task deferred", "warn");return false;}t.created=S.t;S.tasks.push(t);return true;}
function takeTask(){let bi=-1;for(let i=0;i<S.tasks.length;i++){const t=S.tasks[i];if(t.type==='dlpull'&&!chooseOut(t.lane.kind==='pc'?'pc':'ltl'))continue;if(bi<0||t.pri>S.tasks[bi].pri)bi=i;}return bi<0?null:S.tasks.splice(bi,1)[0];}
function chooseOut(kind){ const open=OUT.filter(o=>o.kind===kind && !o.loading && o.count+o.reserved<OUT_CAP); if(!open.length) return null; return open.reduce((a,b)=>(a.count+a.reserved)<=(b.count+b.reserved)?a:b); }
function stageSteps(o){ return [ {k:"go",p:{x:o.x,y:OUT_ENTRY}}, {k:"stage",o}, {k:"dwell",t:15,fn:f=>{f.load=false;}} ]; }

// ---------- rack faces (3D storage model) ----------
const SL=4.17; // slot length along aisle (one pallet position)
const LEVELS={R:[0,6,12,18,24,30], V:[0,6,12,18,24,30], L:[0,2.7,5.4,9.5,15.5,21.5,27.5]};
const LOADH={R:[4.6,4.6,4.6,4.6,4.6,4.6], V:[4.6,4.6,4.6,4.6,4.6,4.6], L:[2.2,2.2,2.2,4.6,4.6,4.6,4.6]};
const ROWS=[], FACES=[], aisleFaces=new Map();
(function buildRows(){
  const mk=(list,y0,y1)=>{
    for(let i=0;i<list.length-1;i++){ const a=list[i], nb=list[i+1]; const gap=nb.x-a.x; const w=gap>16?gap-11:8.6; const cx=a.x+gap/2; ROWS.push({x0:cx-w/2,x1:cx+w/2,y0,y1,wA:a,eA:nb}); }
    const f=list[0]; ROWS.push({x0:f.x-11.3,x1:f.x-4.8,y0,y1,wA:null,eA:f});
    const l=list[list.length-1]; if(l.block==="N") ROWS.push({x0:l.x+4.5,x1:l.x+11,y0,y1,wA:l,eA:null});
  };
  mk(NA,N_Y[0],N_Y[1]); mk(SA,S_Y[0],S_Y[1]);
  let base=0;
  for(const r of ROWS){
    const cx=(r.x0+r.x1)/2, n=Math.floor((r.y1-r.y0)/SL);
    const single=!r.wA||!r.eA;
    if(r.wA){ const t=r.wA.type, lv=LEVELS[t]; const f={aisle:r.wA,x0:r.x0,x1:single?r.x1:cx,front:r.x0,side:1,type:t,lv,lh:LOADH[t],n,y0:r.y0,base}; base+=n*lv.length; FACES.push(f); }
    if(r.eA){ const t=r.eA.type, lv=LEVELS[t]; const f={aisle:r.eA,x0:single?r.x0:cx,x1:r.x1,front:r.x1,side:-1,type:t,lv,lh:LOADH[t],n,y0:r.y0,base}; base+=n*lv.length; FACES.push(f); }
  }
  FACES.total=base;
  for(const f of FACES){ if(!aisleFaces.has(f.aisle)) aisleFaces.set(f.aisle,[]); aisleFaces.get(f.aisle).push(f); }
})();
const OCC=new Uint8Array(FACES.total);
let occDirty=true;
function initOcc(){ for(const f of FACES){ const p=f.type==="R"?0.91:f.type==="V"?0.86:0.8; for(let i=0;i<f.n*f.lv.length;i++) OCC[f.base+i]=rnd()<p?1:0; } occDirty=true; }
function slotIdx(f,slot,lvl){ return f.base+slot*f.lv.length+lvl; }
function locSlot(a,wantFull){
 const candidates=aisleFaces.get(a);if(!candidates)return locIn(a);
 const pool=[...candidates,...FACES.filter(f=>f.aisle.type===a.type&&!candidates.includes(f))];
 for(const f of pool){const n=f.n*f.lv.length,start=RI(0,n-1);for(let k=0;k<n;k++){const off=(start+k)%n,slot=Math.floor(off/f.lv.length),lvl=off%f.lv.length,i=f.base+off;if(f.type==='L'&&lvl<3)continue;if(!!OCC[i]===wantFull&&!S.slotClaims.has(i)){S.slotClaims.add(i);return{x:f.aisle.x,y:f.y0+(slot+.5)*SL,aisle:f.aisle,face:f,slot,lvl,h:f.lv[lvl],side:f.front>f.aisle.x?1:-1};}}}
 return {...locIn(a),unavailable:true};
}
function setOcc(loc,v){ if(!loc||!loc.face) return; const index=slotIdx(loc.face,loc.slot,loc.lvl);OCC[index]=v?1:0;S.slotClaims.delete(index); occDirty=true; }
function rackDwell(t,loc,kind,extra){ return {k:"dwell",t,h:loc.h||0,side:loc.side||0,kind,mid:f=>{ if(kind==="drop"){ f.load=false; setOcc(loc,1); } else { f.load=true; if(extra!=="keep") setOcc(loc,0);else if(loc.face)S.slotClaims.delete(slotIdx(loc.face,loc.slot,loc.lvl)); } },fn:extra&&typeof extra==="function"?extra:null}; }
function stepsFor(t){
  const LIFT=40, LOW=20;
  switch(t.type){
  case "putaway": return [ {k:"go",p:{x:t.src.x,y:t.src.y}}, {k:"dwell",t:LOW,fn:f=>{t.release();f.load=true;}}, {k:"go",p:t.to}, rackDwell(t.to.aisle.type==="R"?LIFT:LOW,t.to,"drop",()=>ev("putaway")) ];
  case "replen": return [ {k:"go",p:t.from}, rackDwell(LIFT,t.from,"pick"), {k:"go",p:t.to}, {k:"dwell",t:LOW,h:t.to.h||0,side:t.to.side||0,kind:"drop",mid:f=>{f.load=false;},fn:()=>ev("replen")} ];
  case "slapper": return [ {k:"go",p:t.from}, rackDwell(LIFT,t.from,"pick"), {k:"go",p:{x:SLAP.x-14,y:SLAP.y}}, {k:"dwell",t:LOW,fn:f=>{f.load=false;SLAP.cases+=CASES_PER_PALLET;SLAP.pending=false;}} ];
  case "vna": return [ {k:"go",p:t.from}, rackDwell(240,t.from,"pick","keep"), {k:"go",p:VNA_INDUCT}, {k:"dwell",t:30,fn:f=>{f.load=false; S.vnaQ=(S.vnaQ||0)+VNA_CASES;}} ];
  case "dlpull": { const l=t.lane, j=Math.max(0,l.full-1), s=dlSlot(j); const kind=l.kind==="pc"?"pc":"ltl";
    t.out=chooseOut(kind); t.out.reserved++;
    return [ {k:"go",p:{x:l.x+s.x,y:s.y}}, {k:"dwell",t:30,fn:f=>{f.load=true; l.full=Math.max(0,l.full-1);}}, {k:"go",p:{x:WRAP.x,y:WRAP.y+8}}, {k:"wrap"}, ...stageSteps(t.out) ]; }
  case "wm": return [ {k:"go",p:t.locs[0]}, {k:"dwell",t:150,h:t.locs[0].h||0}, {k:"go",p:t.locs[1]}, {k:"dwell",t:150,h:5}, {k:"go",p:t.locs[2]}, {k:"dwell",t:150,fn:f=>{f.load=true;ev("wmPick");}}, {k:"go",p:WM_PROC.in}, {k:"dwell",t:LOW,fn:f=>{f.load=false;WM_PROC.q++;}} ];
  case "wmout": return [ {k:"go",p:WM_PROC.out}, {k:"dwell",t:LOW,fn:f=>{WM_PROC.ready--;WM_PROC.claimed--;f.load=true;}}, ...stageSteps(t.out) ];
  case "ltl": if(t.vas) return [ {k:"go",p:t.from}, rackDwell(LIFT,t.from,"pick"), {k:"go",p:VAS_IN}, {k:"dwell",t:LOW,fn:f=>{f.load=false;S.vasQ.push(1);ev("vasIn");}} ];
    return [ {k:"go",p:t.from}, rackDwell(LIFT,t.from,"pick"), {k:"go",p:{x:WRAP.x,y:WRAP.y+8}}, {k:"wrap"}, ...stageSteps(t.out) ];
  case "vasout": return [ {k:"go",p:VAS_OUT}, {k:"dwell",t:LOW,fn:f=>{S.vasOut--;S.vasClaimed--;f.load=true;}}, {k:"go",p:{x:WRAP.x,y:WRAP.y+8}}, {k:"wrap"}, ...stageSteps(t.out) ];
  }
}
function makeInboundPallet(srcPt){ const spot=IN_STAGE.find(s=>!s.used); const toRes=rnd()<0.82; const a=toRes?pick(reserveAisles):pick(replenTargets);
  const to=locSlot(a,false);if(to.unavailable)return false;
  if(srcPt){ srcPt.pallets++; addTask({type:"putaway",pri:1,src:{x:srcPt.x,y:592},to,release:()=>{srcPt.pallets--;}}); return true; }
  if(!spot){if(to.face)S.slotClaims.delete(slotIdx(to.face,to.slot,to.lvl));return false;} spot.used=true; addTask({type:"putaway",pri:1,src:{x:spot.x,y:spot.y},to,release:()=>{spot.used=false;}}); return true; }

// ---------- update ----------
function moveAlong(a,dist){ a.d+=dist; const p=pointAt(a.path,a.d); a.x=p.x; a.y=p.y; if(dist>0) a.a=p.a; return a.d>=a.path.len; }
function goTo(a,target,speed,dt){
 if(!a.path){let pts=route({x:a.x,y:a.y},target);if(S.bots.includes(a)&&((a.y>393&&target.y<377)||(a.y<377&&target.y>393))){const south=a.y>393;pts=[{x:a.x,y:a.y},{x:a.x,y:south?393:377},{x:786,y:south?393:377},{x:786,y:south?377:393},{x:target.x,y:south?377:393},target];}a.path=prepPath(pts);a.d=0;}
 if(S.bots.includes(a)){const p=pointAt(a.path,a.d+speed*dt),inside=q=>q.x>776&&q.x<797&&q.y>376&&q.y<394;const entry=inside(p);if(entry&&(holds.bridge||(bridgeOwner&&bridgeOwner!==a.id))){a.bridgeWait=true;return false;}a.bridgeWait=false;if(entry)bridgeOwner=a.id;else if(bridgeOwner===a.id)bridgeOwner=null;}
 if(moveAlong(a,speed*dt)){a.path=null;return true;}return false;
}
const FAULTS=["suction seal lost on porous case","case face under 6 in","stack top above reach","vision: low light at trailer nose","Wi-Fi drop"];
function stretchY(s){ return SOUTH_WALL+6+44*(1-s.left/s.total); }
function updateInbound(dt){
  for(const s of S.stretch){
    if(s.paused||(holds.stretch&&s===S.stretch[0]))continue;
    if(s.state==="swap"){ s.timer-=dt; if(s.timer<=0){ s.total=s.left=Math.round(P.trailerCases*R(.8,1.2)); s.state="unload"; s.nextFault=expR(P.mtbi*60); s.acc=0; log(`Trailer docked at door ${s.door}, ${s.id} unloading ${s.total} cases`); } }
    else if(s.state==="unload"){ S.stretchBusy+=dt; s.arm+=dt*P.stretchRate/3600*Math.PI*2;
      s.acc+=dt*P.stretchRate/3600; while(s.acc>=1&&s.left>0){ s.acc--; s.left--; ev("in"); ev("inSt");
        const sy=stretchY(s); addItem([{x:s.x,y:sy-4},{x:s.x,y:SOUTH_WALL},{x:s.x+2.5,y:612},{x:s.x+2.5,y:600}],2,"carton",()=>{ s.rec.cartons++; if(s.rec.cartons>=CASES_PER_PALLET){ if(makeInboundPallet(s.rec))s.rec.cartons-=CASES_PER_PALLET; } }); }
      s.nextFault-=dt; if(s.nextFault<=0&&s.left>0){ s.state="fault"; s.timer=P.mttr*60*R(0.5,1.6); S.faults++; ev("fault"); log(`${s.id} intervention at door ${s.door}: ${pick(FAULTS)}`,"bad"); }
      if(s.left<=0){ s.state="swap"; s.timer=s.swapT=P.swapMinutes*60*R(.75,1.25); S.trailers++; log(`Door ${s.door} trailer empty, pulling and re-spotting`,"ok"); } }
    else if(s.state==="fault"){ s.timer-=dt; if(s.timer<=0){ s.state="unload"; s.nextFault=expR(P.mtbi*60); } }
  }
  S.stretchTime+=dt*S.stretch.length;
  for(const m of S.manual){
    if(m.state==="swap"){ m.timer-=dt; if(m.timer<=0){ m.total=m.left=Math.round(P.manualCases*R(.8,1.2)); m.state="unload"; m.acc=0; } }
    else {if(m.rec.cartons>=CASES_PER_PALLET){if(makeInboundPallet(null))m.rec.cartons-=CASES_PER_PALLET;else continue;} m.acc+=dt*P.manualRate/3600; while(m.acc>=1&&m.left>0){ m.acc--; m.left--; ev("in"); ev("inMan"); m.rec.cartons++; if(m.rec.cartons>=CASES_PER_PALLET){if(makeInboundPallet(null))m.rec.cartons-=CASES_PER_PALLET;else{m.acc=0;break;}} }
      if(m.left<=0){ m.state="swap"; m.timer=m.swapT=P.swapMinutes*60*R(.75,1.25); S.trailers++; } }
  }
}
function updateForks(dt){
  for(const f of S.forks){
    if(f.paused)continue;
    if(!f.task){ if(f.retire) continue; const t=takeTask(); if(t){ f.task=t; f.steps=stepsFor(t); f.si=0; f.path=null; } else { goTo(f,{x:640+((f.id-1)%10)*7,y:588},P.forkSpeed*.75,dt); continue; } }
    S.forkBusy+=dt;
    const st=f.steps[f.si]; if(st.k==="go"||st.k==="dwell")S.forkWork+=dt;let next=false;
    if(st.k==="go"){ next=goTo(f,st.p,P.forkSpeed*(f.load?.75:1),dt); }
    else if(st.k==="dwell"){ if(st.left===undefined) st.left=st.t; st.left-=dt; if(st.mid&&!st.midDone&&st.left<=st.t/2){ st.midDone=true; st.mid(f); } if(st.left<=0){ st.fn&&st.fn(f); next=true; } }
    else if(st.k==="wrap"){ if(WRAP.cur!==f){ if(!WRAP.q.includes(f)) WRAP.q.push(f); if(!WRAP.cur&&WRAP.q[0]===f){ WRAP.q.shift(); WRAP.cur=f; WRAP.left=f.task.type==="dlpull"?60:90; } }
      else { WRAP.left-=dt; if(WRAP.left<=0){ WRAP.cur=null; next=true; } } }
    else if(st.k==="stage"){ const o=st.o; if(!o.loading && o.count<OUT_CAP){ o.count++; o.reserved--;f.load=false;if(f.task.type==="wmout")ev("wmStaged");if(f.task.type==="vasout")ev("vasStaged"); if(o.firstAt===null) o.firstAt=S.t; ev("staged"); next=true; } }
    if(next){ f.si++; if(f.si>=f.steps.length){ f.task=null; } }
  }
  S.forkTime+=dt*S.forks.filter(f=>!f.retire).length;
}
function updateDemand(dt){
  const A=S.acc;
  // tower split case -> pack
  A.tower+=dt*P.towerRate/3600; while(A.tower>=1){ A.tower--; const y=R(165,345),level=pick(TOWER.activeLevels),h=level+3; sendToPack([{x:925,y,h},{x:935,y,h},{x:935,y:366,h}]); ev("tower");ev(level===0?"towerL1":"towerL2"); }
  // VNA case pallets from N12-N14 -> induct -> downlanes (retail)
  A.vna+=dt*P.vnaRate/3600; while(A.vna>=1){ A.vna--; addTask({type:"vna",pri:1,from:locSlot(pick(vnaAisles),true)}); }
  if(S.vnaQ>0){ S.vnaAcc=(S.vnaAcc||0)+dt/6; while(S.vnaAcc>=1&&S.vnaQ>0){ S.vnaAcc--; S.vnaQ--; ev("vnaCase"); toDownlane([{x:VNA_INDUCT.x,y:372},{x:998,y:372}],"rt","case"); } } else S.vnaAcc=0;
  // slapper -> parcel downlanes
  if(P.slapRate>0 && SLAP.cases>0){ SLAP.acc+=dt*P.slapRate/3600; while(SLAP.acc>=1&&SLAP.cases>0){ SLAP.acc--; SLAP.cases--; ev("slap");
    toDownlane([{x:SLAP.x+12,y:SLAP.y},{x:985,y:SLAP.y},{x:985,y:377},{x:998,y:366}],"pc","case"); } }
  if(SLAP.cases<25 && !SLAP.pending && P.slapRate>0){ SLAP.pending=true; addTask({type:"slapper",pri:1,from:locSlot(pick(reserveAisles),true)}); }
  // High-volume customer
  A.wm+=dt*P.wmRate/3600; while(A.wm>=1){ A.wm--; const a=pick(T_AISLES); const i=T_AISLES.indexOf(a); const locs=[0,1,2].map(k=>locIn(T_AISLES[clamp(i+RI(-1,1),0,7)])).sort((p,q)=>p.x-q.x); addTask({type:"wm",pri:1,locs}); }
  for(const s of WM_PROC.st){ if(!s.cur&&WM_PROC.q>0){ WM_PROC.q--; s.cur=1; s.left=P.wmProc*60*R(0.7,1.3); } else if(s.cur){ s.left-=dt; if(s.left<=0){ s.cur=null; WM_PROC.ready++; ev("wmDone"); /* outbound pickup is scheduled when a door has capacity */ } } }
  // full pallets reserve -> (VAS) -> wrap -> outbound
  A.ltl+=dt*P.ltlRate/3600; while(A.ltl>=1){ A.ltl--; const o=chooseOut("ltl"); if(!o) break; const vas=rnd()*100<P.vasShare;if(!vas)o.reserved++;addTask({type:"ltl",pri:0,from:locSlot(pick(reserveAisles),true),vas,out:vas?null:o}); }
  for(const v of VAS_ST){ if(!v.cur && S.vasQ.length){ S.vasQ.shift(); v.cur=1; v.left=R(360,600); } else if(v.cur){ v.left-=dt; if(v.left<=0){ v.cur=null; S.vasOut++; ev("vas"); /* completed VAS pallet waits for outbound capacity */ } } }
  while(WM_PROC.ready>WM_PROC.claimed){const o=chooseOut('wm');if(!o)break;o.reserved++;WM_PROC.claimed++;addTask({type:'wmout',pri:2,out:o});}
  while(S.vasOut>S.vasClaimed){const o=chooseOut('ltl');if(!o)break;o.reserved++;S.vasClaimed++;addTask({type:'vasout',pri:1,out:o});}
  // packing -> parcel downlanes
  for(const p of PACK){ if(!p.cur&&p.q>0){ p.q--; p.cur=1; p.left=P.packTime*R(0.6,1.5); } else if(p.cur){ p.left-=dt; if(p.left<=0){ p.cur=null; ev("pack"); toDownlane([{x:p.x,y:p.y+5,h:p.h+3}],"pc","carton"); } } }
  // outbound loading
  for(const o of OUT){
    if(!o.loading && (o.count>=OUT_CAP || (o.count>=8 && o.firstAt!==null && S.t-o.firstAt>3*3600))){ o.loading=true; o.timer=0; o.loadedN=0; log(`Door ${o.i+1} ${o.count>=OUT_CAP?"full":"cut-off"}: loading ${o.kind==="wm"?"High-volume customer":o.kind==="pc"?"parcel":"LTL"} trailer (${o.count} pallets)`,"ok"); }
    if(o.loading){ o.timer+=dt; if(o.timer>=60){ o.timer=0; o.count--; o.loadedN++; S.loaded++; ev("loaded"); if(o.count<=0){ o.count=0; o.loading=false; o.firstAt=null; o.trailerOut=300; S.trailersOut++; } } }
    if(o.trailerOut>0) o.trailerOut-=dt;
  }
}
function missionStops(){ const n=RI(4,7); const base=RI(0,locusAisles.length-1); const stops=[];
  for(let i=0;i<n;i++){ const a=locusAisles[clamp(base+RI(-2,2),0,locusAisles.length-1)]; stops.push(locIn(a)); }
  return stops.sort((p,q)=>(p.aisle.block===q.aisle.block?0:p.aisle.block==="L"?-1:1)||p.x-q.x||p.y-q.y); }
function updateBots(dt){
  for(const b of S.bots){
    if(b.paused||holds.fleet)continue;
    const moving=["toInduct","travel","toDeduct","toCharge"].includes(b.state);
    b.bat-=dt*(moving?0.55:0.15)/60;
    switch(b.state){
      case "toInduct": if(goTo(b,{x:pick(INDUCT).x+R(-2,2),y:366},P.botSpeed,dt)){ if(b.retire){ b.gone=true; break; } b.state="induct"; b.timer=R(15,30); } break;
      case "induct": if(holds.conveyor)break;b.timer-=dt; if(b.timer<=0){ b.stops=missionStops(); b.si=0; b.state="travel"; } break;
      case "travel": if(goTo(b,b.stops[b.si],P.botSpeed,dt)){ b.state="wait"; b.wait0=S.t; } break;
      case "wait": break;
      case "picking": b.timer-=dt; if(b.timer<=0){ ev("pick"); S.picksSinceReplen++; if(S.picksSinceReplen>=REPLEN_EVERY){ S.picksSinceReplen=0; const to=b.stops[b.si]; addTask({type:"replen",pri:2,from:locSlot(pick(reserveAisles),true),to:{x:to.x,y:to.y,aisle:to.aisle}}); }
          if(b.claimed){ b.claimed.state="idle"; b.claimed.bot=null; b.claimed=null; }
          b.si++; b.state=b.si<b.stops.length?"travel":"toDeduct"; } break;
      case "toDeduct": if(goTo(b,{x:DEDUCT.x+R(-2,2),y:DEDUCT.y},P.botSpeed,dt)){ b.state="deduct"; b.timer=R(10,18); } break;
      case "deduct": if(holds.conveyor)break;b.timer-=dt; if(b.timer<=0){ ev("mission"); sendToPack([{x:DEDUCT.x+4,y:366}]);
          if(b.bat<25){ const c=CHARGERS.find(c=>!c.bot); if(c){ c.bot=b; b.charger=c; b.state="toCharge"; break; } } b.state="toInduct"; } break;
      case "toCharge": if(goTo(b,{x:b.charger.x,y:b.charger.y},P.botSpeed,dt)){ b.state="charge"; } break;
      case "charge": b.bat+=dt*1.6/60; if(b.bat>=95){ b.charger.bot=null; b.charger=null; b.state="toInduct"; } break;
    }
  }
  S.bots=S.bots.filter(b=>!b.gone);
}
function updatePickers(dt){
  for(const p of S.pickers){
    if(p.state==="idle"){ let best=null; for(const b of S.bots){ if(!b.paused&&!holds.fleet&&b.state==="wait"&&!b.claimed&&p.zone.includes(b.stops[b.si].aisle)){ if(!best||b.wait0<best.wait0) best=b; } }
      if(best){ best.claimed=p; p.bot=best; p.state="walk"; p.path=null; } }
    if(p.state==="walk"){ const b=p.bot;if(b?.paused||holds.fleet)continue; if(!b||b.state!=="wait"){ p.state="idle"; p.bot=null; p.path=null; continue; } const s=b.stops[b.si];
      if(goTo(p,{x:s.x+1.6,y:s.y},P.pickerSpeed,dt)){ p.state="pick"; S.waits.push(S.t-b.wait0); if(S.waits.length>200) S.waits.shift(); b.state="picking"; b.timer=P.pickTime*R(0.7,1.4); } }
  }
}
function updateItems(dt){if(holds.conveyor)return;const old=S.items;S.items=[];for(const it of old){it.d+=it.speed*P.conveyorScale*dt;if(it.d>=it.P.len){it.onEnd&&it.onEnd();}else S.items.push(it);}}
function step(dt){if(!Number.isFinite(dt)||dt<=0||dt>1)throw Error('Step must be in (0,1] seconds');S.t+=dt;updateInbound(dt);updateDemand(dt);updateForks(dt);updateBots(dt);updatePickers(dt);updateItems(dt);}
function snapshot(){const hours=(S.t-S.t0)/3600;return {elapsedSeconds:S.t-S.t0,seed:P.seed,parameters:{...P},totals:{...S.tot},rates:Object.fromEntries(['in','inSt','inMan','fault','putaway','replen','pick','mission','towerL1','towerL2','pack','weighPass','labelPass','vnaCase','slap','dlCase','dlParcel','dlPallet','wmPick','wmDone','vas','staged','loaded'].map(k=>[k,rate(k)])),stretchBusyFraction:S.stretchTime?S.stretchBusy/S.stretchTime:null,truckAssignedFraction:S.forkTime?S.forkBusy/S.forkTime:null,truckWorkFraction:S.forkTime?S.forkWork/S.forkTime:null,meanCompletedWaitSeconds:S.waits.length?S.waits.reduce((a,b)=>a+b,0)/S.waits.length:null,waitSampleCount:S.waits.length,queues:{tasks:S.tasks.length,pack:PACK.reduce((n,p)=>n+p.q,0),inbound:IN_STAGE.filter(s=>s.used).length+S.stretch.reduce((n,s)=>n+s.rec.pallets,0),highVolumeCustomer:WM_PROC.q,vas:S.vasQ.length,wrapper:WRAP.q.length},lanes:DL.map(l=>({lane:l.i+1,full:l.full,positions:l.full+(l.cur>0?1:0),capacity:14,recirculations:l.recirc})),outbound:OUT.map(o=>({door:o.i+1,staged:o.count,reserved:o.reserved,capacity:OUT_CAP})),trailersOut:S.trailersOut,recirculations:S.recirc,holds:{...holds},readiness:'Illustrative scenario — not calibrated',replications:1};}
const MODEL={get S(){return S},P,PARAMS,holds,newState,initOcc,step,snapshot,route,DL,OUT,PACK,TOWER,WEIGH,PRINT_APPLY,NORTH_RUN,pointAt,prepPath,WM_PROC,WRAP,IN_STAGE,get OCC(){return OCC},pauseAgent:a=>{a.paused=!a.paused},clearHolds:()=>{Object.keys(holds).forEach(k=>holds[k]=false);[...S.bots,...S.forks,...S.stretch].forEach(a=>a.paused=false);}};
window.RevelystLab=MODEL;
if(window.__REVELYST_HEADLESS__){newState();initOcc();return;}

// ================= 3D RECONSTRUCTION =================
let C={};
const TOK=["bg","paper","ink","muted","hair","cad","wall","conv","convLt","locusZone","vasZone","walk","stretch","fault","locus","picker","fork","tote","parcel","pallet","trailer","trailerLine","ok","warn","bad","accent","sky","floor","yard","upright","beam","loadR","loadA","slab"];
function readColors(){ const cs=getComputedStyle(document.documentElement); TOK.forEach(n=>{ const v=cs.getPropertyValue("--"+n).trim(); C[n]=v.length===9?v.slice(0,7):v; }); }
readColors();
const col=n=>new THREE.Color(C[n]||"#888");
const host=$("gl"), stage=$("stage");
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});}catch(error){$("gl").innerHTML='<div class="graphics-fallback"><h2>3D graphics unavailable</h2><p>The lightweight view includes the facility layout and robot controls.</p><a id="fallbackLink" href="walkthrough.html">Open lightweight view →</a></div>';if(window.RevelystFallbackURL)$("fallbackLink").href=window.RevelystFallbackURL;return;}
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,2,8000);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=0.12; controls.maxPolarAngle=Math.PI*0.48; controls.minDistance=12; controls.maxDistance=6000; controls.screenSpacePanning=false;
camera.position.set(700,780,1180); controls.target.set(680,0,330);
const hemi=new THREE.HemisphereLight(0xffffff,0x8a949a,0.85); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,0.55); sun.position.set(-400,900,700); scene.add(sun);
const MAT={}; // theme-bound materials
function lam(key,opts={}){ const m=new THREE.MeshLambertMaterial(Object.assign({color:col(key)},opts)); m.userData.tok=key; return m; }
function lineMat(key,opacity=1){ const m=new THREE.LineBasicMaterial({color:col(key),transparent:opacity<1,opacity}); m.userData.tok=key; return m; }
const themed=[];
function T(m){ themed.push(m); return m; }
const V3=(x,h,y)=>new THREE.Vector3(x,h,y);
const tmpM=new THREE.Matrix4(), tmpQ=new THREE.Quaternion(), tmpS=new THREE.Vector3(), tmpP=new THREE.Vector3(), tmpC=new THREE.Color();
const ZERO=new THREE.Vector3(0,0,0), UPQ=new THREE.Quaternion();
function setInst(mesh,i,x,h,y,sx,sy,sz,rotY=0){ tmpP.set(x,h,y); tmpS.set(sx,sy,sz); if(rotY) tmpQ.setFromAxisAngle(new THREE.Vector3(0,1,0),rotY); else tmpQ.identity(); tmpM.compose(tmpP,tmpQ,tmpS); mesh.setMatrixAt(i,tmpM); }
const BOX=new THREE.BoxGeometry(1,1,1); BOX.translate(0,0.5,0); // origin at bottom center
const BOXC=new THREE.BoxGeometry(1,1,1);

// static batching: collect boxes per material, emit one InstancedMesh per material
const SB=new Map();
function sbox(mat,geo,sx,sy,sz,x,y,z,ry=0,rz=0){ const e=new THREE.Euler(0,ry,rz,"YZX"); tmpQ.setFromEuler(e); tmpP.set(x,y,z); tmpS.set(sx,sy,sz); const m=new THREE.Matrix4().compose(tmpP,tmpQ,tmpS);
  const key=mat.uuid+geo.uuid; if(!SB.has(key)) SB.set(key,{mat,geo,ms:[]}); SB.get(key).ms.push(m); }
function flushStatic(){ for(const {mat,geo,ms} of SB.values()){ const im=new THREE.InstancedMesh(geo,mat,ms.length); ms.forEach((m,i)=>im.setMatrixAt(i,m)); im.instanceMatrix.needsUpdate=true; scene.add(im); } SB.clear(); }

// ---------- ground ----------
const yard=new THREE.Mesh(new THREE.PlaneGeometry(2400,1600),T(lam("yard"))); yard.rotation.x=-Math.PI/2; yard.position.set(670,-0.2,330); scene.add(yard);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(1330,612),T(lam("floor"))); floor.rotation.x=-Math.PI/2; floor.position.set(675,-0.05,325); scene.add(floor);
// zone paint
for(const a of AREAS){ const m=new THREE.Mesh(new THREE.PlaneGeometry(a.x1-a.x0,a.y1-a.y0),T(lam(a.tint.slice(2),{transparent:true,opacity:0.12,depthWrite:false}))); m.rotation.x=-Math.PI/2; m.position.set((a.x0+a.x1)/2,0.03,(a.y0+a.y1)/2); scene.add(m); }

// ---------- CAD linework ----------
const cadGroup=new THREE.Group(); scene.add(cadGroup);
function cadLines(key,colorTok,h,opacity=1){ const polys=LAYERS[key]; if(!polys) return; const pos=[];
  for(const q of polys){ const p=q.p; for(let j=2;j<p.length;j+=2){ pos.push(p[j-2],h,p[j-1],p[j],h,p[j+1]); } }
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); const ls=new THREE.LineSegments(g,T(lineMat(colorTok,opacity))); cadGroup.add(ls); }
cadLines("walk","walk",0.08,0.8); cadLines("misc","cad",0.08,0.6); cadLines("col","cad",0.08,0.8); cadLines("vas","vasZone",0.08,0.9);
cadLines("rack","cad",0.08,0.7); cadLines("locus","locusZone",0.1,0.9); cadLines("door","cad",0.08,0.9); cadLines("mezz","cad",10.6,0.5);
cadLines("conv1","conv",3,1); cadLines("convship","conv",10,1); cadLines("conv2","convLt",13.5,1); cadLines("conv3","convLt",24,1);
// walls (extruded)
const wallGroup=new THREE.Group(); scene.add(wallGroup);
(function(){ const polys=LAYERS.wall||[]; const pos=[]; const H=10;
  for(const q of polys){ const p=q.p; for(let j=2;j<p.length;j+=2){ const x0=p[j-2],z0=p[j-1],x1=p[j],z1=p[j+1]; if(Math.hypot(x1-x0,z1-z0)<0.4) continue; pos.push(x0,0,z0, x1,0,z1, x1,H,z1, x0,0,z0, x1,H,z1, x0,H,z0); } }
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
  wallGroup.add(new THREE.Mesh(g,T(lam("wall",{transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false})))); })();

// ---------- racks ----------
let nUp=0,nBeam=0; const upList=[], beamList=[];
for(const f of FACES){ const top=f.lv[f.lv.length-1]+6; const bays=Math.ceil(f.n/2);
  for(let b=0;b<=bays;b++){ const y=f.y0+Math.min(b*2*SL,f.n*SL); upList.push([f.front,y,top]); upList.push([f.front===f.x0?f.x1:f.x0,y,top]); }
  for(let b=0;b<bays;b++){ const y=f.y0+(b*2+1)*SL; const len=Math.min(2*SL,(f.n-b*2)*SL); for(let l=1;l<f.lv.length;l++){ beamList.push([f.front,y,f.lv[l],len]); } } }
const upMesh=new THREE.InstancedMesh(BOX,T(lam("upright")),upList.length);
upList.forEach(([x,y,h],i)=>setInst(upMesh,i,x,0,y,0.35,h,0.35)); scene.add(upMesh);
const beamMesh=new THREE.InstancedMesh(BOX,T(lam("beam")),beamList.length);
beamList.forEach(([x,y,h,len],i)=>setInst(beamMesh,i,x,h-0.45,y,0.3,0.45,len)); scene.add(beamMesh);
// back-row ties / decking for handstack levels
const loadMesh=new THREE.InstancedMesh(BOX,new THREE.MeshLambertMaterial({color:0xffffff}),FACES.total);
loadMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(loadMesh);
const loadCol=new Float32Array(FACES.total*3);
function colorLoads(){ const r=col("loadR"), a=col("loadA"); let s=7;
  for(const f of FACES){ const base=f.type==="R"?r:a; for(let i=0;i<f.n*f.lv.length;i++){ s=(s*16807)%2147483647; const v=0.86+0.22*(s/2147483647); const k=(f.base+i)*3; loadCol[k]=base.r*v; loadCol[k+1]=base.g*v; loadCol[k+2]=base.b*v; } }
  loadMesh.instanceColor=new THREE.InstancedBufferAttribute(loadCol,3); loadMesh.instanceColor.needsUpdate=true; }
function writeLoads(){ for(const f of FACES){ const cx=(f.x0+f.x1)/2, d=Math.abs(f.x1-f.x0)-0.6; for(let s=0;s<f.n;s++){ const y=f.y0+(s+0.5)*SL; for(let l=0;l<f.lv.length;l++){ const i=f.base+s*f.lv.length+l;
      if(OCC[i]) setInst(loadMesh,i,cx,f.lv[l]+(l?0.05:0.05),y,d,f.lh[l],SL-0.5); else { tmpM.makeScale(0,0,0); loadMesh.setMatrixAt(i,tmpM); } } } }
  loadMesh.instanceMatrix.needsUpdate=true; occDirty=false; }
colorLoads();
// Locus pallet area racks (2 levels) and High-volume customer case area (pallet flow, 3 levels)
const miscRack=new THREE.Group(); scene.add(miscRack);
function simpleRack(x0,x1,y0,y1,levels,loadTok){ const n=Math.floor((y1-y0)/SL); const g=miscRack;
  const top=levels[levels.length-1]+5; for(let b=0;b<=n;b+=2){ const y=y0+b*SL; for(const x of [x0,x1]) sbox(MAT.up,BOX,0.35,top,0.35,x,0,y); }
  for(let l=1;l<levels.length;l++) for(const x of [x0,x1]) sbox(MAT.beam,BOX,0.3,0.45,y1-y0,x,levels[l]-0.45,(y0+y1)/2);
  for(let s=0;s<n;s++) for(const lv of levels){ if(rnd()<0.88) sbox(MAT[loadTok],BOX,Math.abs(x1-x0)-0.6,lv>0?3.8:4.2,SL-0.5,(x0+x1)/2,lv+0.05,y0+(s+0.5)*SL); } }
MAT.up=T(lam("upright")); MAT.beam=T(lam("beam")); MAT.loadA=T(lam("loadA")); MAT.loadR=T(lam("loadR"));
for(const [x0,x1] of [[751,757],[777,788],[798,808],[818,829],[839,845]]) for(const [y0,y1] of [[150,245],[255,315],[322,352]]) simpleRack(x0,x1,y0,y1,[0,5.5],"loadA");
for(let i=0;i<T_AISLES.length-1;i++){ const a=T_AISLES[i], b=T_AISLES[i+1]; const w=(b.x-a.x)-8; simpleRack((a.x+b.x)/2-w/2,(a.x+b.x)/2+w/2,152,355,[0,5,10],"loadA"); }

// ---------- pick tower mezzanine ----------
const towerDecks=new THREE.Group();towerDecks.name="Tower decks";scene.add(towerDecks);
MAT.slab=T(lam("slab",{transparent:true,opacity:0.35,depthWrite:false}));
for(const h of [10.5,21]){ const m=new THREE.Mesh(BOX,MAT.slab); m.scale.set(1066-858,0.5,372-140); m.position.set((858+1066)/2,h-0.5,(140+372)/2); towerDecks.add(m); }
for(const x of [858,936,1000,1066]) for(const y of [140,200,260,320,372]) sbox(MAT.up,BOX,0.6,21,0.6,x,0,y);
MAT.flow=T(lam("tote")); MAT.flowFrame=T(lam("hair"));
// Open carton-flow framing keeps the two active levels visible in cutaway.
for(const lvl of TOWER.activeLevels)for(const x of [868,884,900,916]){
 for(let y=157;y<=347;y+=19){sbox(MAT.up,BOX,.45,7.1,.45,x-3,lvl,y);sbox(MAT.up,BOX,.45,7.1,.45,x+3,lvl,y);}
 for(let row=0;row<3;row++){const h=lvl+1.4+row*2.1;sbox(MAT.flowFrame,BOX,6.2,.25,190,x,h,252);for(let bay=0;bay<19;bay++)for(let col=0;col<2;col++){if((bay+row+col+Math.round(lvl))%7===0)continue;sbox(MAT.flow,BOX,2.35,1.45,8.2,x+(col?1.5:-1.5),h+.25,162+bay*9.5);}}
}

// ---------- animated-path conveyors (beds) ----------
function elev(x,y){
  if(y<=113 && x>=850 && x<=1130){ if(y<93 && y>=60) return 3+7*clamp((y-70)/23,0,1); return 10; }
  if(Math.abs(x-998)<1.6 && y<=345 && y>=145){ return y>300?3+10*(345-y)/45:13; }
  if(x>998 && x<=1013 && y<145 && y>=104) return 13-3*(145-y)/41;
  return 3; }
MAT.bed=T(lam("hair")); MAT.rail=T(lam("conv"));
function bed(pts,w=2.4){ for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i]; const len=Math.hypot(b.x-a.x,b.y-a.y); if(len<0.2) continue; const ang=Math.atan2(b.y-a.y,b.x-a.x);
    const steps=Math.max(1,Math.ceil(len/6)); for(let k=0;k<steps;k++){ const t0=k/steps,t1=(k+1)/steps; const x0=a.x+(b.x-a.x)*t0,y0=a.y+(b.y-a.y)*t0,x1=a.x+(b.x-a.x)*t1,y1=a.y+(b.y-a.y)*t1; const ah=a.h??elev(a.x,a.y),bh=b.h??elev(b.x,b.y),h0=ah+(bh-ah)*t0,h1=ah+(bh-ah)*t1;
      const seg=len/steps; sbox(MAT.rail,BOXC,Math.hypot(seg,h1-h0)+0.05,0.45,w,(x0+x1)/2,(h0+h1)/2-0.6,(y0+y1)/2,-ang,Math.atan2(h1-h0,seg));
      if(h0>4 && k%2===0) sbox(MAT.up,BOX,0.3,h0-0.8,0.3,x0,0,y0); } } }
const P2=(x,y)=>({x,y});
bed([{x:DEDUCT.x,y:366,h:3},{x:935,y:366,h:3}]);
for(const level of TOWER.activeLevels){bed([{x:935,y:160,h:level+3},{x:935,y:366,h:level+3}]);bed(TOWER_RISE(level+3));for(const y of [175,240,310])bed([{x:925,y,h:level+3},{x:935,y,h:level+3}]);}
bed([{x:980,y:155,h:24},{x:980,y:355,h:24}]);bed([{x:1040,y:155,h:24},{x:1040,y:366,h:24},{x:998,y:366,h:24},...NORTH_RUN]);
for(const p of PACK){bed([{x:980,y:p.y,h:24},{x:p.x,y:p.y,h:24}],1.6);bed([{x:p.x,y:p.y+5,h:24},{x:1040,y:p.y+5,h:24}],1.6);}
bed([{x:998,y:366,h:3},{x:1040,y:366,h:24}]);
bed([P2(860,DL_CONV_Y),P2(1125,DL_CONV_Y),P2(1125,112),P2(860,112)]);
for(const l of DL){ bed([P2(l.x,DL_CONV_Y),P2(l.x,62)],3); const sp=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,9,20,1,true),MAT.rail); sp.material=MAT.rail; sp.position.set(l.x,5.5,93); scene.add(sp); }
bed([P2(SLAP.x+12,SLAP.y),P2(985,SLAP.y),P2(985,377),P2(998,366)]); bed([P2(VNA_INDUCT.x,372),P2(998,372)]);
for(const s of STRETCH_DOCKS){ bed([P2(s.x,SOUTH_WALL),P2(s.x+2.5,612),P2(s.x+2.5,600)],2); }
// pack stations, process tables, VAS tables, wrapper, chargers
MAT.table=T(lam("locus")); MAT.vas=T(lam("vasZone")); MAT.dark=T(lam("ink"));
for(const p of PACK){
 sbox(MAT.table,BOX,8,0.6,5,p.x,p.h+2.8,p.y);for(const dx of [-3.4,3.4])sbox(MAT.up,BOX,.5,2.8,4,p.x+dx,p.h,p.y);
 sbox(MAT.dark,BOX,2.1,1.8,.5,p.x+2.3,p.h+3.4,p.y-1.9);sbox(MAT.flow,BOX,2,1.4,2,p.x-1.8,p.h+3.4,p.y); // monitor and tote
}
// Representative inline checkweigher and print/apply equipment on the shared top conveyor.
for(const q of [WEIGH,PRINT_APPLY]){sbox(MAT.up,BOX,.6,7,.6,q.x-3,q.h-3,q.y);sbox(MAT.up,BOX,.6,7,.6,q.x+3,q.h-3,q.y);sbox(MAT.dark,BOX,7,.7,.9,q.x,q.h+4,q.y);}
sbox(MAT.table,BOX,3.2,.4,6,WEIGH.x,WEIGH.h-.2,WEIGH.y);sbox(MAT.dark,BOX,2,1.8,.5,WEIGH.x+4,WEIGH.h+1.5,WEIGH.y);
sbox(MAT.dark,BOX,3.1,3,3.5,PRINT_APPLY.x+4,PRINT_APPLY.h,PRINT_APPLY.y);sbox(MAT.table,BOX,4,.55,.65,PRINT_APPLY.x+2,PRINT_APPLY.h+2,PRINT_APPLY.y);sbox(MAT.flowFrame,BOX,1.5,.35,1.5,PRINT_APPLY.x,PRINT_APPLY.h+1.7,PRINT_APPLY.y);
for(const s of WM_PROC.st) sbox(MAT.table,BOX,8,3,5,s.x,0,s.y);
for(const v of VAS_ST) sbox(MAT.vas,BOX,8,3,5,v.x,0,v.y);
const wrapTT=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,0.6,24),MAT.vas); wrapTT.position.set(WRAP.x,0.3,WRAP.y); scene.add(wrapTT);
const wrapMast=new THREE.Mesh(BOX,MAT.dark); wrapMast.scale.set(0.8,9,0.8); wrapMast.position.set(WRAP.x+4.5,0,WRAP.y); scene.add(wrapMast);
const wrapArm=new THREE.Group(); wrapArm.position.set(WRAP.x,0,WRAP.y); const wa=new THREE.Mesh(BOX,MAT.vas); wa.scale.set(0.6,0.6,0.6); wa.position.set(4.5,2,0); wrapArm.add(wa); scene.add(wrapArm);
MAT.okS=T(lam("ok")); for(const ch of CHARGERS) sbox(MAT.okS,BOX,2.4,0.4,2.4,ch.x,0,ch.y);
flushStatic();
const bridgeRing=new THREE.Mesh(new THREE.RingGeometry(9,10.5,40),T(lam("bad",{side:THREE.DoubleSide}))); bridgeRing.rotation.x=-Math.PI/2; bridgeRing.position.set(BRIDGE.x,0.15,BRIDGE.y); scene.add(bridgeRing);

// ---------- labels ----------
const labelGroup=new THREE.Group(); scene.add(labelGroup);
function makeLabel(text,x,h,y,size=1,sub=null){ const small=size<0.9; const cvs=document.createElement("canvas"); const ctx=cvs.getContext("2d"); const fs=44; ctx.font=`700 ${fs}px "Barlow Condensed","Arial Narrow",sans-serif`;
  const w=Math.ceil(ctx.measureText(text).width)+28; cvs.width=w; cvs.height=fs+22; ctx.font=`700 ${fs}px "Barlow Condensed","Arial Narrow",sans-serif`;
  ctx.fillStyle="rgba(20,30,38,0.82)"; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.fillStyle="#ffffff"; ctx.textBaseline="middle"; ctx.fillText(text,14,cvs.height/2+2);
  const tex=new THREE.CanvasTexture(cvs); tex.minFilter=THREE.LinearFilter; const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true,sizeAttenuation:false}));
  const k=0.00042*Math.sqrt(size); sp.scale.set(cvs.width*k,cvs.height*k,1); sp.position.set(x,h,y); sp.renderOrder=10; sp.userData.small=small;sp.userData.text=text; labelGroup.add(sp); return sp; }
const LABEL_POS={"Locus picking pallets":[800,46,165],"Pick tower":[897,62,330],"Tower conveyance":[1000,34,215],"High-volume customer case area":[1150,46,330],"Downlanes 1–9":[930,36,60],"High-volume customer process":[1205,52,95],"Manufacturing":[1165,30,520]};
const LABEL_SPECS=()=>[
  ...AREAS.map(a=>{ const o=LABEL_POS[a.name]||[(a.x0+a.x1)/2,40,(a.y0+a.y1)/2]; return [a.name.toUpperCase(),o[0],o[1],o[2],1]; }),
  ["RESERVE",380,52,253,1.4],["RESERVE",380,52,479,1.4],["VNA ACTIVE · N12–N14",715,46,253,0.8],["LOCUS AISLES · S09–S12",760,46,479,0.8],["LOCUS BRIDGE",BRIDGE.x,22,BRIDGE.y,0.7],
  ["L1 + L2 · ACTIVE PICK",898,33,320,.7],["L3 · PACK ≈10",1024,39,320,.75],["WEIGHING",1000,32,285,.55],["PRINT + APPLY",1000,32,215,.55],
  ...DL.map(l=>["DL"+(l.i+1),l.x,20,72,0.55]), ...OUT.map(o=>["D"+(o.i+1),o.x,14,72,0.5]),
  ...NA.filter(a=>+a.name.slice(1)%5===0||a.name==="N12").map(a=>[a.name,a.x,40,146,0.5]), ...SA.filter(a=>+a.name.slice(1)%5===0||a.name==="S09").map(a=>[a.name,a.x,36,566,0.5]),
];
document.fonts&&document.fonts.ready.then(()=>{ labelGroup.clear(); LABEL_SPECS().forEach(s=>makeLabel(...s)); });
LABEL_SPECS().forEach(s=>makeLabel(...s));

// ---------- agent meshes ----------
const agentGroup=new THREE.Group(); scene.add(agentGroup);
MAT.stretch=T(lam("stretch")); MAT.fault=T(lam("fault")); MAT.black=new THREE.MeshLambertMaterial({color:0x22272b}); MAT.case=T(lam("parcel")); MAT.fork=T(lam("fork")); MAT.pallet=T(lam("pallet")); MAT.wood=new THREE.MeshLambertMaterial({color:0xA07a50});
MAT.locus=T(lam("locus")); MAT.tote=new THREE.MeshLambertMaterial({color:0xE8862A}); MAT.picker=T(lam("picker")); MAT.skin=new THREE.MeshLambertMaterial({color:0xD9B08C}); MAT.warn=T(lam("warn",{side:THREE.DoubleSide})); MAT.ok=T(lam("ok")); MAT.trailer=T(lam("trailer")); MAT.trailerLine=T(lam("trailerLine"));
MAT.wmLoad=T(lam("locus")); MAT.vasOp=T(lam("vasZone")); MAT.towerOp=T(lam("tote"));
function box(mat,sx,sy,sz,x=0,y=0,z=0,parent){ const m=new THREE.Mesh(BOX,mat); m.scale.set(sx,sy,sz); m.position.set(x,y,z); if(parent) parent.add(m); return m; }
function mkStretch(s){ const g=new THREE.Group(); g.userData.agent=s; g.userData.kind="Stretch";
  g.userData.base=box(MAT.stretch,4.2,1.6,4.2,0,0,0,g); box(MAT.black,4.3,0.3,4.3,0,1.6,0,g);
  const tt=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,0.6,20),MAT.black); tt.position.y=2.2; g.add(tt);
  box(MAT.black,0.8,5.5,0.8,0,1.9,-1.6,g); box(MAT.stretch,1.2,0.8,1.2,0,7.2,-1.6,g);
  const pivot=new THREE.Group(); pivot.position.set(0,3.4,0); g.add(pivot); const arm=new THREE.Group(); pivot.add(arm);
  box(MAT.stretch,0.7,0.7,5.2,0,-0.35,2.6,arm); const grip=box(MAT.black,1.8,0.5,1.4,0,-0.6,5.4,arm); const cs=box(MAT.case,1.6,1.4,1.6,0,-2.1,5.4,arm);
  const ring=new THREE.Mesh(new THREE.RingGeometry(5,5.8,36),MAT.fault); ring.rotation.x=-Math.PI/2; ring.position.y=0.2; g.add(ring);
  Object.assign(g.userData,{pivot,arm,cs,ring}); agentGroup.add(g); return g; }
function mkFork(f){ const g=new THREE.Group(); g.userData.agent=f; g.userData.kind="Lift truck";
  box(MAT.fork,5.2,2.4,3.4,-0.6,0,0,g); box(MAT.black,5.4,0.4,3.6,-0.6,0,0,g);
  for(const [x,z] of [[-2.6,-1.5],[-2.6,1.5],[0.6,-1.5],[0.6,1.5]]) box(MAT.black,0.2,5.6,0.2,x,2.4,z,g); box(MAT.black,3.6,0.2,3.4,-1,7.9,0,g);
  const mast=new THREE.Group(); mast.position.set(2.1,0,0); g.add(mast); const outer=[box(MAT.black,0.3,7.5,0.3,0,0,-1.2,mast),box(MAT.black,0.3,7.5,0.3,0,0,1.2,mast)];
  const inner=[box(MAT.fork,0.25,7.5,0.25,0.2,0,-1,mast),box(MAT.fork,0.25,7.5,0.25,0.2,0,1,mast)];
  const car=new THREE.Group(); mast.add(car); box(MAT.black,0.3,1.6,2.8,0.35,0,0,car); box(MAT.black,3.8,0.18,0.35,2.3,0,-0.9,car); box(MAT.black,3.8,0.18,0.35,2.3,0,0.9,car);
  const load=new THREE.Group(); car.add(load); box(MAT.wood,3.8,0.5,3.6,2.4,0.2,0,load); const lb=box(MAT.loadR,3.6,3.6,3.4,2.4,0.7,0,load);
  Object.assign(g.userData,{inner,car,load,lb}); agentGroup.add(g); return g; }
function mkBot(b){ const g=new THREE.Group(); g.userData.agent=b; g.userData.kind="Locus bot";
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,1,20),MAT.locus); base.position.y=0.5; g.add(base);
  box(MAT.black,0.25,3.4,0.25,-0.6,1,0,g); box(MAT.black,0.9,0.7,0.12,-0.6,4.2,0,g);
  const tote=box(MAT.tote,1.6,1.1,1.25,0.2,1.05,0,g); box(MAT.tote,1.6,1.1,1.25,0.2,2.3,0,g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,2.1,24),MAT.warn); ring.rotation.x=-Math.PI/2; ring.position.y=0.12; g.add(ring);
  Object.assign(g.userData,{ring,tote}); agentGroup.add(g); return g; }
function mkPerson(p,mat,kind){ const g=new THREE.Group(); g.userData.agent=p; g.userData.kind=kind;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.65,3.6,10),mat); body.position.y=1.8; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.48,12,10),MAT.skin); head.position.y=4.2; g.add(head);
  agentGroup.add(g); return g; }
function mkTrailer(){ const g=new THREE.Group(); const L=53,W=8.5,H=13;
  box(MAT.trailer,W,0.6,L,0,3.4,0,g); box(MAT.trailer,0.3,H-4,L,-W/2,4,0,g); box(MAT.trailer,0.3,H-4,L,W/2,4,0,g); box(MAT.trailerLine,W,H-4,0.3,0,4,-L/2,g);
  for(const z of [-L/2+4,-L/2+8,L/2-6]) for(const x of [-3,3]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,0.9,14),MAT.black); w.rotation.z=Math.PI/2; w.position.set(x,1.6,z); g.add(w); }
  const cargo=box(MAT.case,W-1,8,1,0,4,0,g); g.userData.cargo=cargo; agentGroup.add(g); return g; }
const meshOf=new Map();
function getMesh(a,maker){ let m=meshOf.get(a); if(!m){ m=maker(a); meshOf.set(a,m); } m.userData.seen=true; return m; }
// instanced dynamic stuff
const MAXI=1500; const itemMesh=new THREE.InstancedMesh(BOXC,new THREE.MeshLambertMaterial({color:0xffffff}),MAXI); itemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(itemMesh);
itemMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXI*3),3);
const MAXP=1200; const palMesh=new THREE.InstancedMesh(BOX,new THREE.MeshLambertMaterial({color:0xffffff}),MAXP); palMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(palMesh);
palMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXP*3),3);
const trailers=new Map();
function trailerAt(key){ let t=trailers.get(key); if(!t){ t=mkTrailer(); trailers.set(key,t); } return t; }
// cosmetic operators
const towerOps=[]; for(let i=0;i<6;i++) towerOps.push({lvl:TOWER.activeLevels[i%2],x:[876,892,908][i%3]+ (i>2?8:0),y:R(160,340),ty:R(160,340),kind:"Pick-tower associate"});
const dockOps=[]; for(const d of INBOUND_DOCKS) for(let k=0;k<2;k++) dockOps.push({dock:d,k,ph:rnd()*6,kind:"Unload associate"});

// ---------- per-frame sync ----------
const swapOff=u=>{ const p=1-u.timer/u.swapT; return p<0.4?70*p/0.4:p<0.6?999:70*(1-(p-0.6)/0.4); };
function forkPose(f){ let fh=0, face=null, show=f.load; const st=f.task&&f.steps&&f.steps[f.si];
  if(st&&st.k==="dwell"&&st.h){ const p=clamp(1-(st.left===undefined?st.t:st.left)/st.t,0,1); fh=st.h*Math.sin(Math.PI*p); if(st.side) face=st.side>0?0:Math.PI; }
  return {fh,face,show}; }
function sync(){
  const t=S.t;
  for(const m of meshOf.values()) m.userData.seen=false;
  for(const tr of trailers.values()) tr.visible=false;
  // south trailers + stretch
  for(const u of [...S.stretch,...S.manual]){ const off=u.state==="swap"?swapOff(u):0; const tr=trailerAt("s"+u.door); if(off<200){ tr.visible=true; tr.position.set(u.x,0,SOUTH_WALL+1+26.5+off); tr.rotation.y=Math.PI;
      const frac=u.state==="swap"?0:u.left/u.total; const len=44*frac; tr.userData.cargo.visible=len>0.5; tr.userData.cargo.scale.z=Math.max(0.01,len); tr.userData.cargo.position.z=-26.5+len/2+0.5; } }
  for(const s of S.stretch){ const g=getMesh(s,mkStretch); g.visible=true; if(!g.visible) continue; const y=s.state==="swap"?SOUTH_WALL+3:stretchY(s); g.position.set(s.x,3.9,y); g.rotation.y=0;
    const ph=s.arm; g.userData.pivot.rotation.y=Math.PI*0.5*(1-Math.cos(ph))/1; g.userData.arm.rotation.x=0.25*Math.sin(ph*2);
    g.userData.cs.visible=s.state==="unload" && Math.sin(ph)>0; g.userData.ring.visible=s.state==="fault"; g.userData.base.material=s.state==="fault"&&Math.sin(t*1.5)>0?MAT.fault:MAT.stretch; }
  // north trailers
  for(const o of OUT){ if(o.trailerOut>150) continue; const tr=trailerAt("n"+o.i); tr.visible=true; const off=o.trailerOut>0?70*(1-o.trailerOut/150):0; tr.position.set(o.x,0,NORTH_WALL-1-26.5-off); tr.rotation.y=0;
    const len=o.loading?44*Math.min(1,o.loadedN/OUT_CAP):0; tr.userData.cargo.visible=len>0.5; tr.userData.cargo.scale.z=Math.max(0.01,len); tr.userData.cargo.position.z=-26.5+len/2+0.5; tr.userData.cargo.material=o.kind==="wm"?MAT.wmLoad:o.kind==="pc"?MAT.case:MAT.pallet; }
  // forks
  for(const f of S.forks){ const g=getMesh(f,mkFork); g.visible=!(f.retire&&!f.task); const pose=forkPose(f); g.position.set(f.x,0,f.y);
    const a=pose.face!==null?pose.face:(f.a||0); g.rotation.y=-a; const fh=pose.fh; g.userData.car.position.y=0.3+fh; g.userData.inner.forEach(m=>m.position.y=Math.max(0,fh-0.5)); g.userData.load.visible=pose.show;
    g.userData.lb.material=f.task&&(f.task.type==="wm"||f.task.type==="wmout")?MAT.wmLoad:f.task&&(f.task.type==="dlpull"||f.task.type==="ltl"||f.task.type==="vasout")?MAT.pallet:MAT.loadR; }
  for(const b of S.bots){ const g=getMesh(b,mkBot); g.position.set(b.x,0,b.y); g.rotation.y=-(b.a||0); const r=g.userData.ring; r.visible=b.state==="wait"||b.state==="picking"||b.state==="charge"; r.material=b.state==="charge"?MAT.ok:b.state==="picking"?MAT.picker:MAT.warn; }
  for(const p of S.pickers){ const g=getMesh(p,o=>mkPerson(o,MAT.picker,"Locus associate")); g.position.set(p.x,0,p.y); }
  for(const o of towerOps){const g=getMesh(o,a=>mkPerson(a,MAT.towerOp,a.kind));g.position.set(o.x+3.5,o.lvl,250+85*Math.sin(t/65+o.x));}
  for(const o of dockOps){ const m=S.manual.find(m=>m.door===o.dock.door); const g=getMesh(o,a=>mkPerson(a,MAT.vasOp,a.kind)); g.visible=m&&m.state==="unload"; if(!g.visible) continue; const depth=6+40*(1-m.left/m.total); const ph=t*0.25+o.ph; g.position.set(o.dock.x+(o.k?2:-2),3.9,SOUTH_WALL+3+(depth)*(0.5+0.5*Math.sin(ph))); }
  for(const v of VAS_ST){ const g=getMesh(v,a=>mkPerson(a,MAT.vasOp,"VAS operator")); g.visible=!!v.cur; g.position.set(v.x,0,v.y+4); }
  for(const s of WM_PROC.st){ const g=getMesh(s,a=>mkPerson(a,MAT.towerOp,"High-volume customer process operator")); g.visible=!!s.cur; g.position.set(s.x,0,s.y+4.5); }
  for(const p of PACK){ const g=getMesh(p,a=>mkPerson(a,MAT.towerOp,"Packer")); g.visible=true; g.position.set(p.x,p.h,p.y+5.5); }
  wrapArm.rotation.y=WRAP.cur?t*2:0; wrapArm.children[0].position.y=WRAP.cur?2+3*(0.5+0.5*Math.sin(t*0.3)):2;
  for(const [a,m] of meshOf){ if(!m.userData.seen){ agentGroup.remove(m); meshOf.delete(a); } }
  // items
  let n=0; const tc=col("tote"), pc=col("parcel");
  for(const it of S.items){ if(n>=MAXI) break; const p=pointAt(it.P,it.d); const h=p.h??elev(p.x,p.y);
    if(it.kind==="tote"){ setInst(itemMesh,n,p.x,h,p.y,1.6,1.1,1.25,-p.a); itemMesh.instanceColor.setXYZ(n,tc.r,tc.g,tc.b); } else { setInst(itemMesh,n,p.x,h,p.y,1.5,1.3,1.5,-p.a); itemMesh.instanceColor.setXYZ(n,pc.r,pc.g,pc.b); } n++; }
  itemMesh.count=n; itemMesh.instanceMatrix.needsUpdate=true; itemMesh.instanceColor.needsUpdate=true;
  // pallets (staging, downlanes, queues)
  let k=0; const put=(x,y,h,cn,sx=4,sz=4,base=0)=>{ if(k>=MAXP) return; setInst(palMesh,k,x,base,y,sx,h,sz); const c=col(cn); palMesh.instanceColor.setXYZ(k,c.r,c.g,c.b); k++; };
  for(const o of OUT){ const cn=o.kind==="wm"?"locus":o.kind==="pc"?"parcel":"pallet"; for(let j=0;j<o.count;j++){ const s=outSlot(j); put(o.x+s.dx,s.y,4.6,cn); } }
  for(const l of DL){ const cn=l.i===5?"warn":l.kind==="pc"?"parcel":"pallet"; for(let j=0;j<Math.min(l.full,DL_POS);j++){ const s=dlSlot(j); put(l.x+s.x,s.y+3,4.6,cn); }
    if(l.cur>0&&l.full<DL_POS){ const s=dlSlot(l.full); put(l.x+s.x,s.y+3,0.6+4*l.cur/(l.kind==="pc"?PARCELS_PER_PALLET:CASES_PER_PALLET),cn); } }
  for(const sp of IN_STAGE) if(sp.used) put(sp.x,sp.y,4.6,"loadR");
  for(const s of S.stretch) for(let i=0;i<Math.min(s.rec.pallets,6);i++) put(s.x-6+(i%3)*4.6,586+Math.floor(i/3)*4.6,4.6,"loadR");
  for(let i=0;i<Math.min(S.vasQ.length,8);i++) put(VAS_IN.x-14+i*4.8,VAS_IN.y,4.6,"pallet");
  for(let i=0;i<Math.min(S.vasOut,6);i++) put(VAS_OUT.x-14+i*4.8,VAS_OUT.y,4.6,"pallet");
  for(let i=0;i<Math.min(WM_PROC.q,6);i++) put(WM_PROC.in.x-8+i*4.8,WM_PROC.in.y-6,4.6,"locus");
  for(let i=0;i<Math.min(WM_PROC.ready,6);i++) put(WM_PROC.out.x-8+i*4.8,WM_PROC.out.y-6,4.6,"locus");
  for(let i=0;i<Math.ceil(SLAP.cases/20);i++) put(SLAP.x-10+i*4.8,SLAP.y,Math.min(4.6,SLAP.cases/20*4.6-i*4.6+4.6),"parcel");
  if(S.vnaQ>0) put(VNA_INDUCT.x,VNA_INDUCT.y+5,Math.max(0.5,4.6*S.vnaQ/VNA_CASES),"parcel");
  for(const p of PACK) for(let i=0;i<Math.min(p.q,4);i++) put(p.x-3+i*2,p.y+2.5,1.1,"tote",1.6,1.2,p.h+3.4);
  if(WRAP.cur) put(WRAP.x,WRAP.y,4.6,"pallet");
  palMesh.count=k; palMesh.instanceMatrix.needsUpdate=true; palMesh.instanceColor.needsUpdate=true;
  if(occDirty) writeLoads();
}

// ---------- theme ----------
function applyTheme(){ readColors(); scene.background=col("sky"); for(const m of themed){ if(m.userData.tok) m.color.copy(col(m.userData.tok)); } colorLoads(); }
applyTheme();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

// ---------- camera views / follow / picking ----------
const VIEWS=[
  {n:"Whole site",t:[680,0,330],p:[700,780,1180]},
  {n:"Inbound · Stretch",t:[520,4,640],p:[600,85,545]},
  {n:"Locus & tower",t:[880,0,280],p:[760,150,470]},
  {n:"Tower · active L1 / L2",t:[900,8,275],p:[950,70,410],cutaway:true},
  {n:"Tower · L3 packing",t:[990,21,250],p:[1070,145,410],cutaway:false},
  {n:"Downlanes & High-volume customer",t:[1030,0,110],p:[1010,150,330]},
  {n:"VAS",t:[960,0,470],p:[930,150,660]},
  {n:"Outbound",t:[600,0,70],p:[620,140,260]},
  {n:"Reserve aisle",t:[427,10,250],p:[427,20,372]},
];
let fly=null, followA=null, selected=null;
function fittedView(v){
 if(v!==VIEWS[0]&&!v.plan)return v;
 const target=new THREE.Vector3(...v.t),back=new THREE.Vector3(...v.p).sub(target).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),back).normalize(),up=new THREE.Vector3().crossVectors(back,right),tanV=Math.tan(camera.fov*Math.PI/360),tanH=tanV*camera.aspect;
 let distance=0;for(const x of [0,1320])for(const y of [0,65])for(const z of [-65,725]){const q=new THREE.Vector3(x,y,z).sub(target),near=q.dot(back);distance=Math.max(distance,near+Math.abs(q.dot(right))/tanH,near+Math.abs(q.dot(up))/tanV);}
 return {...v,p:target.clone().addScaledVector(back,distance*1.09).toArray()};
}
function flyTo(v){if(v.cutaway!==undefined){towerDecks.visible=!v.cutaway;$("tDecks").checked=v.cutaway;}v=fittedView(v); fly={t0:performance.now(),fromT:controls.target.clone(),fromP:camera.position.clone(),toT:V3(...v.t),toP:V3(...v.p)}; followA=null; }
VIEWS.forEach(v=>{ const b=document.createElement("button"); b.textContent=v.n; b.onclick=()=>flyTo(v); $("views").appendChild(b); });
function agentPos(a){ const m=meshOf.get(a); return m?m.position:null; }
const FOLLOWS=[["Follow Stretch",()=>S.stretch.find(s=>s.state!=="swap")||S.stretch[0]],["Follow Locus bot",()=>S.bots.find(b=>b.state==="travel")||S.bots[0]],["Follow lift truck",()=>S.forks.find(f=>f.task&&(f.task.type==="putaway"||f.task.type==="replen"))||S.forks[0]],["Stop follow",()=>null]];
FOLLOWS.forEach(([n,fn])=>{ const b=document.createElement("button"); b.textContent=n; b.onclick=()=>{ const a=fn(); followA=a; if(a){ selected=a; const p=agentPos(a); if(p){ const off=camera.position.clone().sub(controls.target); const d=off.length(); if(d>160) off.setLength(110); controls.target.copy(p); camera.position.copy(p).add(off); } } renderSel(); }; $("follow").appendChild(b); });
const ray=new THREE.Raycaster(); const mouse=new THREE.Vector2(); let downAt=null;
renderer.domElement.addEventListener("pointerdown",e=>{ downAt={x:e.clientX,y:e.clientY}; fly=null; });
renderer.domElement.addEventListener("pointerup",e=>{ if(!downAt||Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>4) return; const r=renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(agentGroup.children,true); let a=null,kind=null; for(const h of hits){ let o=h.object; while(o&&!o.userData.agent) o=o.parent; if(o&&o.visible){ a=o.userData.agent; kind=o.userData.kind; break; } }
  selected=a; selKind=kind; renderSel(); });
let selKind=null;
function renderSel(force=false){ const focusId=document.activeElement?.id;if(!force&&/^sel[FPX]$/.test(focusId||''))return; const el=$("sel"); if(!selected){ el.hidden=true; return; } el.hidden=false; const a=selected; let rows=[];
  if(S.stretch.includes(a)){ selKind="Stretch"; rows=[["Robot",a.id],["Door",a.door],["State",a.state==="unload"?"Unloading":a.state==="fault"?"Intervention":"Trailer swap"],["Cases left",a.state==="swap"?"–":`${a.left} of ${a.total}`],["Interventions (site)",S.faults]]; }
  else if(S.forks.includes(a)){ selKind="Lift truck"; const st=a.task&&a.steps[a.si]; rows=[["Truck",a.id],["Task",a.task?a.task.type:"idle"],["Step",st?(st.k==="go"?"travelling":st.k==="dwell"?(st.h?`lift to ${st.h.toFixed(0)} model u`:"handling"):st.k):"–"],["Carrying",a.load?"pallet":"empty"]]; }
  else if(S.bots.includes(a)){ selKind="Locus bot"; rows=[["Bot",a.id],["State",a.paused?"Viewer hold":a.bridgeWait?"Bridge wait":a.state],["Stop",a.stops.length?`${Math.min(a.si+1,a.stops.length)} of ${a.stops.length}`:"–"],["Aisle",a.stops[a.si]?a.stops[a.si].aisle.name:"–"],["Battery",Math.round(a.bat)+"%"]]; }
  else if(S.pickers.includes(a)){ selKind="Locus associate"; rows=[["Zone",a.zone.map(z=>z.name).join(", ")],["State",a.state]]; }
  else rows=[["Role",selKind||"–"]];
  el.innerHTML=`<h3>${selKind||"Selected"}</h3><div class="kv">${rows.map(([k,v])=>`<span>${k}</span><b>${v}</b>`).join("")}</div><div class="row"><button id="selF">${followA===a?"Following":"Follow"}</button><button id="selP">${a.paused?"Resume":"Pause"}</button><button id="selX">Close</button></div>`;
  $("selP").disabled=![...S.bots,...S.forks,...S.stretch].includes(a);$("selP").onclick=()=>{a.paused=!a.paused;recordAction("Individual hold: "+(selKind||"agent")+" "+(a.id||""));renderSel(true);};
  $("selF").onclick=()=>{ followA=followA===a?null:a; renderSel(true); }; $("selX").onclick=()=>{ selected=null; followA=null; renderSel(true); }; if(focusId&&/^sel[FPX]$/.test(focusId))$(focusId)?.focus(); }
// toggles
$("tDecks").onchange=e=>towerDecks.visible=!e.target.checked;
$("tWalls").onchange=e=>wallGroup.visible=e.target.checked; $("tLabels").onchange=e=>labelGroup.visible=e.target.checked; $("tCad").onchange=e=>cadGroup.visible=e.target.checked;
let initialFit=false;
function resize(){ const r=stage.getBoundingClientRect(); renderer.setSize(r.width,r.height,false); camera.aspect=r.width/Math.max(1,r.height); camera.updateProjectionMatrix();if(!initialFit){const v=fittedView(VIEWS[0]);camera.position.set(...v.p);controls.target.set(...v.t);initialFit=true;} }
new ResizeObserver(resize).observe(stage); resize();
const routeLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffa36f,depthTest:false}));routeLine.renderOrder=9;scene.add(routeLine);let showRoute=false;
function render3d(){
  if(fly){ const k=clamp((performance.now()-fly.t0)/900,0,1), e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2; controls.target.lerpVectors(fly.fromT,fly.toT,e); camera.position.lerpVectors(fly.fromP,fly.toP,e); if(k>=1) fly=null; }
  sync();
  if(followA){ const p=agentPos(followA); if(p){ const d=p.clone().sub(controls.target); controls.target.add(d); camera.position.add(d); } }
  routeLine.visible=showRoute&&!!selected?.path;if(routeLine.visible){routeLine.geometry.dispose();routeLine.geometry=new THREE.BufferGeometry().setFromPoints(selected.path.pts.map(p=>V3(p.x,.8,p.y)));}
  bridgeRing.visible=holds.bridge;
  controls.update(); const dist=camera.position.distanceTo(controls.target); for(const sp of labelGroup.children){ if(sp.userData.small) sp.visible=dist<420; else sp.visible=true; }
  renderer.render(scene,camera); }
// ---------- portfolio controls, measurements, and reproducible scenarios ----------
let mode='walkthrough',playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=30,running=false,baseline=null,actions=[],sourceKind='none',appliedSource='none',tour=false,tourIndex=0,tourTime=0,simPending=0,lastReport=null;
const SPEEDS=[1,10,30,60,120];
function recordAction(message){actions.push({elapsedSeconds:S.t,message});log(message,'warn');syncHolds();}
function setPlaying(value){playing=value;$('bPlay').textContent=value?'Pause':'Play';$('bPlay').setAttribute('aria-pressed',String(value));}
function panel(key){document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===key;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;$('panel-'+b.dataset.tab).hidden=!on;});}
const tabs=[...document.querySelectorAll('[data-tab]')];tabs.forEach((b,i)=>{b.onclick=()=>panel(b.dataset.tab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[j].click();tabs[j].focus();};});
SPEEDS.forEach(v=>{const b=document.createElement('button');b.textContent=v+'×';b.setAttribute('aria-pressed',String(v===speed));b.onclick=()=>{speed=v;[...$('speeds').children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};$('speeds').appendChild(b);});
function syncHolds(){document.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed',String(holds[b.dataset.hold])));const n=Object.values(holds).filter(Boolean).length+[...S.bots,...S.stretch,...S.forks].filter(a=>a.paused).length;$('holdStatus').textContent=n?n+' active process / equipment holds.':'All holds released.';}
document.querySelectorAll('[data-hold]').forEach(b=>b.onclick=()=>{holds[b.dataset.hold]=!holds[b.dataset.hold];recordAction(b.textContent+(holds[b.dataset.hold]?' — enabled':' — released'));});$('clearHolds').onclick=()=>{MODEL.clearHolds();recordAction('All holds released');renderSel();};
function equipmentOptions(){const list=$('equipment');list.innerHTML='<option value="">Choose equipment</option>';for(const [name,agents,prefix] of [['Locus AMRs',S.bots,'AMR'],['Stretch',S.stretch,'Stretch'],['Lift trucks',S.forks,'Truck']]){const group=document.createElement('optgroup');group.label=name;agents.forEach((a,i)=>{const o=document.createElement('option');o.value=prefix+':'+i;o.textContent=prefix+' '+String(i+1).padStart(2,'0');group.appendChild(o);});list.appendChild(group);}}
$('equipment').onchange=e=>{const [type,i]=e.target.value.split(':');selected=({AMR:S.bots,Stretch:S.stretch,Truck:S.forks})[type]?.[Number(i)]||null;followA=null;if(selected){const p=agentPos(selected)||V3(selected.x||0,3,selected.y||SOUTH_WALL);flyTo({t:[p.x,3,p.z],p:[p.x-45,60,p.z+65]});}renderSel();};
$('bPlay').onclick=()=>setPlaying(!playing);
function resetScene(){newState();initOcc();selected=null;followA=null;simPending=0;actions=[];lastReport=null;equipmentOptions();syncHolds();renderSel();updateUI();}
$('bReset').onclick=()=>{if(running)return;resetScene();log('Scene restarted with current settings');};
$('fit').onclick=()=>{tour=false;flyTo(VIEWS[0]);};
$('plan').onclick=()=>{const on=$('plan').getAttribute('aria-pressed')!=='true';$('plan').setAttribute('aria-pressed',String(on));flyTo(on?{plan:true,t:[680,0,330],p:[680,1400,331]}:VIEWS[0]);};
$('tour').onclick=()=>{tour=!tour;$('tour').setAttribute('aria-pressed',String(tour));$('tour').textContent=tour?'Stop tour':'Guided tour';tourTime=0;tourIndex=0;if(tour)flyTo(VIEWS[0]);};
$('tRoute').onchange=e=>{showRoute=e.target.checked;};
$('referenceOpen').onclick=()=>$('referenceDialog').showModal();$('referenceClose').onclick=()=>$('referenceDialog').close();
if(window.RevelystFallbackURL)$('lightweightLink').href=window.RevelystFallbackURL;
renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D facility. Use named camera views or select equipment to inspect. Space pauses; plus and minus zoom; Home fits.');
renderer.domElement.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();setPlaying(!playing);}else if(e.key==='Home'){e.preventDefault();flyTo(VIEWS[0]);}else if(['+','=','-'].includes(e.key)){e.preventDefault();const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(e.key==='-'?1.2:1/1.2);camera.position.copy(controls.target).add(offset);}});
PARAMS.forEach(p=>{const d=document.createElement('div');d.className='param';d.innerHTML=`<label for="p_${p.id}">${p.label}<span class="tag ${p.id==='bots'?'c':'a'}">${p.id==='bots'?'site baseline 20':'required scenario input'}</span></label><input type="number" id="p_${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" ${p.id==='bots'?'value="20"':''} placeholder="Not supplied" required>`;$('params').appendChild(d);d.querySelector('input').addEventListener('input',()=>{sourceKind='user-edited';$('inputStatus').textContent='Draft changed. Apply inputs to start a fresh run; current run is unchanged.';});});
$('preset').onclick=()=>{PARAMS.forEach(p=>$('p_'+p.id).value=p.v);sourceKind='uploaded illustrative preset';$('inputStatus').textContent='Illustrative values loaded for review. Apply inputs to run; these are not verified site inputs.';};
$('blankInputs').onclick=()=>{PARAMS.forEach(p=>$('p_'+p.id).value=p.id==='bots'?20:'');sourceKind='none';$('inputStatus').textContent='Operating inputs cleared. Supply all values to start a scenario.';};
function modeUI(){const scenario=mode==='scenario';$('modeName').textContent=scenario?'Illustrative scenario · uncalibrated':'Visual walkthrough';$('modeDetail').textContent=scenario?'Seed '+P.seed+' · one replication · no forecast claim':'Relative CAD geometry · illustrative equipment motion';$('exploreMode').setAttribute('aria-pressed',String(!scenario));$('scenarioMode').setAttribute('aria-pressed',String(scenario));for(const id of ['bRun','baseline','exportJson','exportCsv'])$(id).disabled=!scenario||running;$('compare').disabled=!scenario||!baseline||running;$('measureNote').textContent=scenario?'Model-generated results using the applied scenario inputs. These are not observed facility KPIs.':'Choose Scenario lab and supply inputs to calculate rates and queues. Visual walkthrough has no operating-performance results.';}
$('exploreMode').onclick=()=>{if(running)return;mode='walkthrough';PARAMS.forEach(p=>P[p.id]=p.v);resetScene();modeUI();panel('equipment');};
$('scenarioMode').onclick=()=>panel('inputs');
$('scenarioForm').onsubmit=e=>{e.preventDefault();if(running)return;const draft={};for(const p of PARAMS){const input=$('p_'+p.id);if(!input.value.trim()||!Number.isFinite(Number(input.value))||Number(input.value)<p.min||Number(input.value)>p.max){$('inputStatus').textContent='Enter a valid value for '+p.label+'.';input.focus();return;}const value=Number(input.value);if(p.step===1&&!Number.isInteger(value)){$('inputStatus').textContent=p.label+' must be a whole number.';input.focus();return;}draft[p.id]=value;}Object.assign(P,draft);mode='scenario';resetScene();appliedSource=sourceKind==='none'?'user-entered':sourceKind;modeUI();panel('metrics');setPlaying(false);$('inputStatus').textContent='Inputs applied. Start playback or run an experiment.';log('Fresh scenario · seed '+P.seed+' · '+sourceKind);};
DL.forEach(l=>{const d=document.createElement('div');d.className='lane'+(l.i===5?' hot':'')+(l.kind==='pc'?' pc':'');d.innerHTML=`<div class="bar"><i></i></div><span>${l.i+1}</span>`;$('dl').appendChild(d);l.el=d;});
OUT.forEach(o=>{const d=document.createElement('div');d.className='lane'+(o.kind==='wm'?' wm':o.kind==='pc'?' pc':'');d.innerHTML=`<div class="bar"><i></i></div><span>${o.i+1}</span>`;$('ob').appendChild(d);o.el=d;});
function updateUI(){
  $('cTime').textContent=hhmm(S.t);$('cShift').textContent='scenario elapsed';
  const f=n=>Math.round(n).toLocaleString();
  $("kIn").textContent=f(rate("in")); $("kInSplit").textContent=`${f(rate("inSt"))} / ${f(rate("inMan"))}`;
  $("kFault").textContent=`${S.faults} · ${rate("fault").toFixed(1)}/hr`; $("kUtil").textContent=Math.round(100*S.stretchBusy/Math.max(1,S.stretchTime))+"%"; $("kTrl").textContent=S.trailers;
  $("stretchUnits").innerHTML=S.stretch.map(s=>`<div class="unit"><b>${s.id} · D${s.door}</b><span class="st ${s.state==="unload"?"run":s.state==="fault"?"flt":"swp"}">${s.state==="unload"?Math.round(100*(1-s.left/s.total))+"%":s.state==="fault"?"FAULT":"SWAP"}</span></div>`).join("");
  $("kPut").textContent=f(rate("putaway")); $("kRep").textContent=f(rate("replen"));
  $("kRecQ").textContent=IN_STAGE.filter(s=>s.used).length+S.stretch.reduce((a,s)=>a+s.rec.pallets,0);
  $("kFU").textContent=`${S.tasks.length} · ${Math.round(100*S.forkBusy/Math.max(1,S.forkTime))}%`;
  $("kPick").textContent=f(rate("pick")); const w=S.waits.length?S.waits.reduce((a,b)=>a+b,0)/S.waits.length:0; $("kWait").textContent=Math.round(w)+" s";
  const cnt=st=>S.bots.filter(b=>st.includes(b.state)).length;
  $("kBots").textContent=`${cnt(["travel","toDeduct","toInduct"])} · ${cnt(["wait"])} · ${cnt(["picking"])}`;
  $("kBots2").textContent=`${cnt(["induct","deduct"])} · ${cnt(["charge","toCharge"])} · ${S.bots.filter(b=>Math.hypot(b.x-BRIDGE.x,b.y-BRIDGE.y)<14).length}`;
  $("kConv").textContent=S.items.filter(i=>i.kind==="tote").length; $("kPack").textContent=f(rate("pack")); $("kPackQ").textContent=PACK.reduce((a,p)=>a+p.q,0);$("kWeigh").textContent=f(rate("weighPass"));$("kLabel").textContent=f(rate("labelPass"));
  $("kVna").textContent=f(rate("vnaCase")); $("kSlap").textContent=f(rate("slap"));
  $("kDlIn").textContent=`${f(rate("dlCase"))} · ${f(rate("dlParcel"))}`; $("kDlOut").textContent=f(rate("dlPallet")); $("kRecirc").textContent=S.recirc.toLocaleString();
  $("kWm").textContent=f(rate("wmPick")); $("kWmQ").textContent=`${WM_PROC.q} waiting · ${WM_PROC.st.filter(s=>s.cur).length} in process`;
  $("kVasQ").textContent=`${S.vasQ.length} · ${WRAP.q.length+(WRAP.cur?1:0)}`; $("kStage").textContent=f(rate("staged")); $("kLtl").textContent=`${S.loaded} · ${S.trailersOut}`;
  DL.forEach(l=>{ l.el.querySelector("i").style.height=(100*Math.min(DL_POS,l.full+(l.cur>0?1:0))/DL_POS)+"%"; l.el.classList.toggle("blk",l.full>=DL_POS);l.el.title=`Lane ${l.i+1}: ${l.full+(l.cur>0?1:0)} / ${DL_POS} pallet positions`; });
  OUT.forEach(o=>{ o.el.querySelector("i").style.height=(100*o.count/OUT_CAP)+"%"; o.el.classList.toggle("load",o.loading);o.el.title=`Door ${o.i+1}: ${o.count} / ${OUT_CAP} staged; ${o.reserved} reserved`; });
  $('kFWork').textContent=Math.round(100*S.forkWork/Math.max(1,S.forkTime))+'%';
  if(mode!=='scenario'){document.querySelectorAll('[id^="k"]').forEach(e=>e.textContent='—');DL.forEach(l=>l.el.querySelector('i').style.height='0%');OUT.forEach(o=>o.el.querySelector('i').style.height='0%');$('cTime').textContent='—';$('cShift').textContent='presentation motion';}
  if(selected)renderSel();
  if(logDirty){ $("log").innerHTML=S.log.map(e=>`<div style="color:${e.kind==="bad"?"var(--bad)":e.kind==="warn"?"var(--warn)":"inherit"}"><time>${hhmm(e.t)}</time>${e.msg}</div>`).join(""); logDirty=false; }
}


const FIXED_ASSUMPTIONS={northDoors:12,palletsPerDoor:26,manualInboundPositions:4,packStations:10,packStationCountApproximate:true,packCoordinatesVerified:false,scaleAndLabelProcessingTimes:null,vasStations:2,highVolumeCustomerStations:2,chargers:6,sharedReceivingPositions:66,highRackHandlingSeconds:40,lowHandlingSeconds:20,vnaPickSeconds:240,vnaInductSeconds:30,downlanePickupSeconds:30,wrapperSeconds:[60,90],vasSeconds:[360,600],highVolumeCustomerPickStops:3,highVolumeCustomerPickSecondsPerStop:150,outboundLoadSecondsPerPallet:60,outboundCutoffHours:3,outboundCutoffMinPallets:8,locusStops:[4,7],pickTimeMultiplier:[.7,1.4],packTimeMultiplier:[.6,1.5],inboundToReserveFraction:.82,batteryDrainPercentagePointsPerMinute:[.55,.15],batteryChargePercentagePointsPerMinute:1.6,batteryThresholds:[25,95],conveyorBaseModelUnitsPerSecond:[2,2.3],shiftCalendar:null,coordinateScaleVerified:false,skuInventory:false};
const METRIC_ROWS=[['Inbound cartons','cases',r=>r.totals.in||0],['Stretch cartons','cases',r=>r.totals.inSt||0],['Manual unload cartons','cases',r=>r.totals.inMan||0],['Stretch interventions','events',r=>r.totals.fault||0],['Stretch time unloading','%',r=>r.stretchBusyFraction===null?null:r.stretchBusyFraction*100],['Putaways completed','pallet moves',r=>r.totals.putaway||0],['Replenishments completed','pallet moves',r=>r.totals.replen||0],['Truck travel / handling share','%',r=>r.truckWorkFraction===null?null:r.truckWorkFraction*100],['Locus picks','completed stops',r=>r.totals.pick||0],['AMR totes to pack','totes',r=>r.totals.mission||0],['Packed totes','totes',r=>r.totals.pack||0],['Weighing-point passages','loads',r=>r.totals.weighPass||0],['Print-and-apply passages','loads',r=>r.totals.labelPass||0],['Mean completed associate wait','seconds',r=>r.meanCompletedWaitSeconds],['Retail lane arrivals','cases',r=>r.totals.dlCase||0],['Parcel lane arrivals','parcels/cases',r=>r.totals.dlParcel||0],['Pallets built','pallets',r=>r.totals.dlPallet||0],['Lane recirculations','events',r=>r.recirculations],['High-volume customer processed','pallets',r=>r.totals.wmDone||0],['VAS completed','pallets',r=>r.totals.vas||0],['Outbound loaded','pallets',r=>r.totals.loaded||0],['Trailers dispatched','trailers',r=>r.trailersOut],['Ending pack queue','totes',r=>r.queues.pack],['Ending task queue','tasks',r=>r.queues.tasks]];
function report(){return {...snapshot(),schemaVersion:2,inputSource:appliedSource,fixedAssumptions:{...FIXED_ASSUMPTIONS},actions:actions.map(x=>({...x})),facilityFacts:{amrFleet:20,stretchFleet:4,activeStretchPositions:3,activeLocations:12768,reserveLocations:43300,reserveUsed:39547,downlanes:9,positionsPerLane:14,towerLevels:3,towerActiveLevels:[1,2],towerPackLevel:3,towerPackStationsApproximate:10,inlineWeighing:true,inlinePrintAndApply:true},geometrySource:'Supplied Claude flow-model CAD trace; scale and elevations unverified'};}
const fmt=v=>v===null||v===undefined?'—':Number(v).toLocaleString(undefined,{maximumFractionDigits:1});
function showReport(){lastReport=report();const r=lastReport,match=!!baseline&&Math.abs(baseline.elapsedSeconds-r.elapsedSeconds)<.01&&baseline.seed===r.seed;const changed=baseline?PARAMS.filter(p=>baseline.parameters[p.id]!==r.parameters[p.id]).map(p=>p.label):[];
$('results').hidden=false;$('resCard').innerHTML=`<h3>${baseline?'Scenario comparison':'Experiment results'}</h3><p class="sub">${fmt(r.elapsedSeconds/60)} simulated minutes · seed ${r.seed} · one replication · illustrative inputs</p><p class="note">${baseline?(match?'Same duration and seed. Changes: '+(changed.join('; ')||'none; inspect the action history for holds.'):'Baseline duration or seed differs. Deltas are withheld; rerun with matching duration and seed.'):'Capture this run as a baseline, change an input or hold, then rerun the same duration.'}</p><div class="tblwrap"><table class="res"><thead><tr><th>Measure</th>${baseline?'<th>Baseline</th>':''}<th>Current</th>${baseline?'<th>Change</th>':''}</tr></thead><tbody>${METRIC_ROWS.map(([label,unit,fn])=>{const v=fn(r),b=baseline?fn(baseline):null;return `<tr><td>${label}<small>${unit}</small></td>${baseline?`<td>${fmt(b)}</td>`:''}<td>${fmt(v)}</td>${baseline?`<td>${match&&v!==null&&b!==null?fmt(v-b):'—'}</td>`:''}</tr>`;}).join('')}</tbody></table></div><p class="note">Scenario results are not site forecasts. Wait is based on completed stops only; unfinished waits remain in the queue. The model omits SKU-level orders and many physical constraints.</p><div class="result-actions"><button id="resultBaseline">Capture baseline</button><button id="resultExport">Export full JSON</button><button id="resultClose" class="primary">Return to scene</button></div>`;
$('resultBaseline').onclick=()=>{captureBaseline();showReport();};$('resultExport').onclick=()=>download('json');$('resultClose').onclick=()=>$('results').hidden=true;
}
function captureBaseline(){if(mode!=='scenario'||S.t<=0)return;baseline=report();$('baselineStatus').textContent='Baseline: '+fmt(baseline.elapsedSeconds/60)+' min · seed '+baseline.seed+'.';modeUI();}
$('baseline').onclick=captureBaseline;$('compare').onclick=showReport;
function download(format){if(mode!=='scenario')return;const r=report();let data,mime;if(format==='json'){data=JSON.stringify({current:r,baseline},null,2);mime='application/json';}else {const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';const lines=[['Result type','Illustrative scenario; not calibrated'],['Duration seconds',r.elapsedSeconds],['Seed',r.seed],[],['Metric','Unit','Value'],...METRIC_ROWS.map(([label,unit,fn])=>[label,unit,fn(r)]),[],['Rate key','Events per simulated hour'],...Object.entries(r.rates),[],['Ending queue','Count'],...Object.entries(r.queues),[],['Downlane','Positions','Capacity','Recirculations'],...r.lanes.map(l=>[l.lane,l.positions,l.capacity,l.recirculations]),[],['Outbound door','Staged','Reserved','Capacity'],...r.outbound.map(o=>[o.door,o.staged,o.reserved,o.capacity]),[],['Scenario input','Value'],...Object.entries(r.parameters),[],['Fixed assumption','Value'],...Object.entries(r.fixedAssumptions).map(([k,v])=>[k,JSON.stringify(v)])];data=lines.map(row=>row.map(cell).join(',')).join('\r\n');mime='text/csv';}const url=URL.createObjectURL(new Blob([data],{type:mime})),a=document.createElement('a');a.href=url;a.download='Revelyst-Scenario-'+Math.round(r.elapsedSeconds)+'s.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('exportJson').onclick=()=>download('json');$('exportCsv').onclick=()=>download('csv');
let cancelRun=false;
$('bRun').onclick=()=>{if(mode!=='scenario'||running)return;const minutes=Number($('duration').value);if(!Number.isFinite(minutes)||minutes<5||minutes>1440){$('measureNote').textContent='Enter an experiment duration from 5 to 1,440 minutes.';return;}const initialHolds={...holds},individualHolds=[['bots',S.bots],['forks',S.forks],['stretch',S.stretch]].flatMap(([kind,agents])=>agents.flatMap((a,i)=>a.paused?[[kind,i]]:[]));resetScene();Object.assign(holds,initialHolds);individualHolds.forEach(([kind,i])=>{S[kind][i].paused=true;recordAction('Initial individual hold: '+kind+' '+(i+1));});if(Object.values(holds).some(Boolean))recordAction('Initial holds: '+Object.keys(holds).filter(k=>holds[k]).join(', '));running=true;cancelRun=false;setPlaying(false);modeUI();$('results').hidden=false;$('resCard').innerHTML='<h3>Running scenario</h3><p class="sub">Fixed 0.5-second steps. The scene pauses while the experiment runs.</p><div class="prog"><i id="pg"></i></div><button id="cancelRun">Cancel experiment</button>';$('cancelRun').onclick=()=>{cancelRun=true;};const target=minutes*60;
function chunk(){if(cancelRun){running=false;modeUI();$('results').hidden=true;updateUI();return;}const wall=performance.now();while(performance.now()-wall<25&&S.t<target)step(Math.min(.5,target-S.t));$('pg').style.width=(100*S.t/target)+'%';if(S.t<target){setTimeout(chunk,0);return;}running=false;modeUI();syncHolds();updateUI();showReport();}setTimeout(chunk,0);};
newState();initOcc();writeLoads();equipmentOptions();modeUI();syncHolds();setPlaying(playing);updateUI();
MODEL.ui={get mode(){return mode},get baseline(){return baseline},get playing(){return playing},get running(){return running},get selected(){return selected},get renderer(){return renderer},get scene(){return scene},get camera(){return camera},report,render3d,updateUI,panel,resetScene,showReport};
let embeddedVisible=true;
window.addEventListener?.('message',event=>{if(window.parent!==window&&event.source===window.parent&&event.data?.type==='portfolio:visibility')embeddedVisible=event.data.visible===true;});
let last=performance.now(),uiAcc=0;
function loop(now){const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;if(embeddedVisible&&playing&&!running&&!document.hidden){simPending+=dt*speed;while(simPending>=.5){step(.5);simPending-=.5;}}if(embeddedVisible&&tour&&!running){tourTime+=dt;if(tourTime>7){tourTime=0;tourIndex=(tourIndex+1)%VIEWS.length;flyTo(VIEWS[tourIndex]);}}if(embeddedVisible&&!document.hidden&&!running)render3d();uiAcc+=dt;if(uiAcc>.25){uiAcc=0;updateUI();}requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})();
