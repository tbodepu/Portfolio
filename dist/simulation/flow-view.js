/* Rendering uses the supplied model's embedded CAD linework; no invented measured scale. */
(function(root){'use strict';
const E=root.FlowEngine||(typeof require==='function'?require('./flow-engine.js'):null);
const C={bg:'#10191f',floor:'#1b282f',grid:'#25343c',wall:'#97a8b4',line:'#3b515d',text:'#e9f0f3',muted:'#94a8b5',rack:'#344855',rackEdge:'#678294',active:'#315a51',green:'#86d9b6',blue:'#77bdfb',cyan:'#64d6d0',amber:'#ffc878',orange:'#ff9866',red:'#ff7881',violet:'#b69eef'};
const views={site:{label:'Whole facility',rect:[-15,-80,1360,705]},inbound:{label:'Stretch & inbound',rect:[405,530,965,709]},locus:{label:'Locus & bridge',rect:[707,123,864,570]},tower:{label:'Pick tower & conveyors',rect:[848,126,1114,389]},vas:{label:'VAS & slapper',rect:[782,379,1110,578]},outbound:{label:'Outbound & downlanes',rect:[425,-61,1252,155]}};
function decode(G){const out={};for(const [k,v]of Object.entries(G)){const bytes=typeof Buffer!=='undefined'?Buffer.from(v,'base64'):Uint8Array.from(atob(v),x=>x.charCodeAt(0));const a=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2);let i=0;out[k]=[];while(i<a.length){const n=a[i++],p=[];for(let j=0;j<n;j++)p.push([a[i++]/10,a[i++]/10]);p.bounds=[Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))];out[k].push(p);}}return out;}
function line(c,ps,col,w=1,dash=[]){c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x??p[0],p.y??p[1]):c.moveTo(p.x??p[0],p.y??p[1]));c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash);c.lineCap='round';c.lineJoin='round';c.stroke();c.setLineDash([]);}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.6;c.stroke();}}
function dot(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=color;c.fill();}
function txt(c,t,x,y,size=12,color=C.text,align='left',weight=500){c.font=`${weight} ${size}px Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(t,x,y);}
class View{
 constructor(canvas,G,makeCanvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.layers=decode(G);this.makeCanvas=makeCanvas||(()=>document.createElement('canvas'));this.bg=this.makeCanvas();this.bgCtx=this.bg.getContext('2d');this.camera={s:1,x:0,y:0};this.cached=null;this.depth=true;this.labels=true;this.paths=false;this.cad=true;this.w=1200;this.h=740;this.dpr=1;this.selection='AMR-07';this.focus='site';}
 resize(w,h,dpr=1){this.w=w;this.h=h;this.dpr=Math.min(2,dpr);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.bg.width=this.canvas.width;this.bg.height=this.canvas.height;this.cached=null;}
 fit(key){this.focus=key;const r=Array.isArray(key)?key:views[key].rect,s=Math.min(this.w/(r[2]-r[0]),this.h/(r[3]-r[1]))*.91;this.camera={s,x:this.w/2-(r[0]+r[2])/2*s,y:this.h/2-(r[1]+r[3])/2*s};this.cached=null;return this.camera;}
 world(x,y){const v=this.camera;return{x:(x-v.x)/v.s,y:(y-v.y)/v.s};}
 label(c,title,sub,x,y,col=C.text){const s=this.camera.s,size=13/s; c.font=`600 ${size}px Arial, sans-serif`;const w=Math.max(c.measureText(title).width,sub?sub.length*6.2/s:0)+16/s;round(c,x-w/2,y-19/s,w,sub?39/s:25/s,3/s,'#17252fee','#4e647266');txt(c,title,x,y-3/s,size,col,'center',600);if(sub)txt(c,sub,x,y+12/s,11/s,C.muted,'center');}
 background(){const c=this.bgCtx,v=this.camera,s=v.s,d=this.dpr;c.setTransform(1,0,0,1,0,0);c.fillStyle=C.bg;c.fillRect(0,0,this.bg.width,this.bg.height);c.setTransform(d*s,0,0,d*s,d*v.x,d*v.y);
 c.fillStyle='#080f1599';c.fillRect(8,26,1285,610);c.fillStyle=C.floor;c.fillRect(0,20,1279,611);
 for(let x=0;x<=1340;x+=30)line(c,[[x,-75],[x,704]],C.grid,.5/s);for(let y=-60;y<=700;y+=30)line(c,[[-15,y],[1340,y]],C.grid,.5/s);
 // Area tints are deliberately restrained, leaving the CAD structure legible.
 for(const [x,y,w,h,col]of [[744,140,112,234,'#183955'],[852,140,214,237,'#173d42'],[796,392,290,170,'#3b342c'],[1066,140,168,234,'#253a48']]){c.fillStyle=col;c.fillRect(x,y,w,h);}
 const rack=(x,y,w,h,active=false)=>{const lift=this.depth?2.5:0;c.fillStyle='#080f1677';c.fillRect(x+2,y+2,w,h);c.fillStyle=active?C.active:C.rack;c.fillRect(x,y-lift,w,h);c.strokeStyle=active?'#72ad99':C.rackEdge;c.lineWidth=.5/s;c.strokeRect(x,y-lift,w,h);line(c,[[x+w/2,y-lift],[x+w/2,y+h-lift]],'#213743',.5/s);if(s>1)for(let z=y+8;z<y+h;z+=8.3){line(c,[[x,z-lift],[x+w,z-lift]],active?'#5b927e':'#506a7b',.5/s);if(this.depth&&s>2){c.fillStyle=active?'#80ad8b':'#809baf';c.fillRect(x+.6,z-5,2.5,3);c.fillStyle='#b68d67';c.fillRect(x+w-3.1,z-5,2.5,3);}}};
 for(let i=0;i<45;i++){rack(55+i*15,150,8.6,206,i>41);rack(54+i*15,397,8.6,164,i>43);}for(let x of [734,754,774])rack(x,397,8.6,164,true);
 for(let x of [1115,1135,1155,1175,1195])rack(x,151,8.5,204,true);
 // CAD linework from the supplied HTML, at its original relative coordinates.
 const layer=(key,col,width,alpha=1)=>{const ps=this.layers[key];if(!ps)return;c.beginPath();for(const p of ps){const b=p.bounds;if(b[2]<-v.x/s||b[0]>(this.w-v.x)/s||b[3]<-v.y/s||b[1]>(this.h-v.y)/s)continue;c.moveTo(...p[0]);for(let i=1;i<p.length;i++)c.lineTo(...p[i]);}c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=width/s;c.stroke();c.globalAlpha=1;};
 if(this.cad){layer('walk','#7c7051',.65,.55);layer('misc','#506371',.45,.55);layer('col','#597180',.7,.7);layer('mezz','#58747a',.5,.55);layer('vas','#b09065',.8,.8);layer('rack','#668b80',.7,.9);layer('locus','#5693b5',.85,.9);}
 for(const [k,col]of [['conv3','#426d77'],['conv2','#608d99'],['conv1','#89c9cb'],['convship','#93dfd1']])layer(k,col,.9,.95);
 layer('door','#597482',.8,.8);layer('wall',C.wall,1.2,.9);
 // Conveyor surface and route rails, with separate pack and sort paths.
 for(const P of [E.belt,E.sortPath(2)]){line(c,P.p,'#081b23',4);line(c,P.p,'#4eaaa9',1.1);}
 for(let i=0;i<9;i++){const x=E.W.lanes[i];for(let j=0;j<14;j++){const xx=x+(j%2?4.8:-9.6),yy=50+Math.floor(j/2)*6;round(c,xx,yy,4.8,4.8,.4,'#263f43',i===5?'#c48c69':'#718d84');}if(s>1.4)txt(c,'DL'+(i+1),x,42,10/s,i===5?C.orange:C.muted,'center',600);}
 line(c,[[776,377],[776,393],[796,393],[796,377]],'#75a6c7',1/s);line(c,[[779,383],[793,383]],'#75a6c7',.65/s);line(c,[[779,388],[793,388]],'#75a6c7',.65/s);
 // Plan projection of approximately ten Level 3 pack cells.
 for(const [x,y] of [[962,173],[1017,184],[969,216],[1022,230],[960,258],[1014,274],[966,302],[1020,320],[963,341],[1023,347]])round(c,x-4,y,8,5,1,'#4575a0','#80a9c9');
 if(this.labels){this.label(c,'NORTH / OUTBOUND','Dock staging',365,-6);this.label(c,'SOUTH / INBOUND','3 Stretch docks active',560,699,C.amber);
 if(this.focus==='site'||s<1.1){this.label(c,'RESERVE',null,346,248);this.label(c,'RESERVE',null,346,479);this.label(c,'LOCUS','Pallet picking',797,257,C.blue);this.label(c,'PICK TOWER','L1–2 active / L3 pack',978,273,C.cyan);this.label(c,'VAS','Slapper / assembly',948,475,C.amber);this.label(c,'DOWNLANES 1–9','14 positions per lane',994,14);this.label(c,'HIGH-VOLUME CUSTOMER','Case area',1150,266);}
 else {for(let i=0;i<46;i++){if(i%5===0||s>1.8){txt(c,'N'+(57-i),52+i*15,145,11/s,C.muted,'center');txt(c,'S'+(57-i),51+i*15,574,11/s,C.muted,'center');}}this.label(c,'LOCUS BRIDGE','North ↔ S09–S12',812,402,C.blue);this.label(c,'INDUCT / DEDUCT',null,807,352,C.blue);this.label(c,'L3 PACK / WEIGH / PRINT',null,1004,384,C.cyan);this.label(c,'SLAPPER',null,953,554,C.amber);this.label(c,'HIGH-VOLUME CUSTOMER PROCESS',null,1197,36);}
 if(s>.9){c.save();c.translate(713,256);c.rotate(-Math.PI/2);txt(c,'VNA ACTIVE · N12–N14',0,0,11/s,C.green,'center',600);c.restore();c.save();c.translate(751,479);c.rotate(-Math.PI/2);txt(c,'LOCUS · S09–S12',0,0,11/s,C.blue,'center',600);c.restore();}}
 this.cached={...v};}
 draw(model,opt={}){if(!this.cached||Math.abs(this.camera.s-this.cached.s)>.02||Math.abs(this.camera.x-this.cached.x)>16||Math.abs(this.camera.y-this.cached.y)>16)this.background();const c=this.c,v=this.camera,d=this.dpr,s=v.s;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.fillStyle=C.bg;c.fillRect(0,0,this.canvas.width,this.canvas.height);const k=v.s/this.cached.s;c.setTransform(k,0,0,k,d*(v.x-this.cached.x*k),d*(v.y-this.cached.y*k));c.drawImage(this.bg,0,0);c.setTransform(d*s,0,0,d*s,d*v.x,d*v.y);
 const size=(n,min)=>Math.max(n,min/s);
 // Slow directional chevrons and small moving cartons make belt direction readable at every zoom.
 for(const P of [E.belt,E.sortPath(2)]){for(let j=0;j<P.len;j+=50){const p=E.at(P,(j+model.beltT*12)%P.len);c.save();c.translate(p.x,p.y);c.rotate(p.a);line(c,[[-3,-2],[0,0],[-3,2]],model.flags.conveyor?C.amber:C.cyan,1/s);c.restore();}}
 if(this.paths){for(const b of model.bots){line(c,b.path.p,'#558bc144',1/s,[3/s,5/s]);}E.forkRoutes.forEach(P=>line(c,P.p,'#c4935c66',1/s,[5/s,8/s]));}
 const chosen=model.bots.find(b=>b.id===this.selection)||model.stretch.find(b=>b.id===this.selection);
 if(chosen?.path){line(c,chosen.path.p,'#78bffc66',3/s);line(c,chosen.trail,C.blue,2.5/s);}
 // South trailers: carton stack depletes during the demonstration and resets at the next visual cycle.
 for(const [i,u]of model.stretch.entries()){
 const x=u.x;round(c,x-4.4,633,8.8,53,1,'#53616a','#a5b3ba');line(c,[[x-3.9,634],[x-3.9,684],[x+3.9,684],[x+3.9,634]],'#b4c1c8',.6/s);
 const removed=(Math.floor(u.t/7)%12)+((u.t%7)/7>=.22?1:0);for(let j=removed;j<12;j++){c.fillStyle=j%2?'#cd9b73':'#b78059';c.fillRect(x-3+(j%2)*3.2,659+Math.floor(j/2)*3.8,2.8,3.3);}
 line(c,[[x,649],[x,611],[x+6,600]],'#95a6af',4);line(c,[[x,649],[x,611],[x+6,600]],'#31454e',2);
 const pose=E.stretchPose(u.t),fault=i===0&&model.flags.stretch,r=size(3.5,4);round(c,x-r,650-r,r*2,r*2,1,fault?C.red:C.amber,'#f5e9c6');
 const target=[x+pose.x*.21,649+pose.y*.48],joint=[x-1,642-pose.lift*.12];line(c,[[x,650],joint,target],fault?C.red:'#e5e7de',size(.9,1.6));dot(c,...joint,size(1,2),C.orange);if(pose.carry){c.fillStyle='#ffb477';c.fillRect(target[0]-1.3,target[1]-.4,2.6,2.6);}
 
 if(fault){c.beginPath();c.arc(x,649,size(8,14),0,7);c.strokeStyle=C.red;c.lineWidth=1.5/s;c.stroke();}if(s>1.5)txt(c,u.id,x,693+(i%2)*8,11/s,C.amber,'center',600);
 }
 for(const it of model.inbound){round(c,it.x-1.2,it.y-1.2,2.4,2.4,.3,C.orange);if(it.d>=it.path.len){c.strokeStyle=C.cyan;c.lineWidth=.8/s;c.strokeRect(it.x-3,it.y-3,6,6);}}
 // Representative staging pallets and outbound trailers; there is no real-time inventory feed.
 for(let x of [456,492,576,612,696,744]){round(c,x-4.2,-34,8.4,52,1,'#485967','#92a6b4');c.fillStyle='#263945';c.fillRect(x-3,-29,6,40);}
 for(let j=0;j<18;j++){const x=758+(j%9)*19,y=594+Math.floor(j/9)*12;round(c,x,y,6,5,.5,'#8f9b79','#c2c2a0');line(c,[[x+1,y+2],[x+5,y+2]],'#676e4e',.6);}
 // Reach trucks carry a visible pallet and turn with the aisle route.
 for(const f of model.forks){const k=size(1,1.1);c.save();c.translate(f.x,f.y);c.rotate(f.a);c.scale(k,k);round(c,-4,-2.5,8,5,1,C.orange);c.fillStyle='#14232c';c.fillRect(-2,-2,3,4);line(c,[[4,-2],[9,-2]],'#d5dfdf',1);line(c,[[4,2],[9,2]],'#d5dfdf',1);if(f.loaded){round(c,6,-3,5,6,.4,'#b9976c','#e1c396');line(c,[[8,-3],[8,3]],'#6b553c',.65);}c.restore();}
 for(const it of model.items){const p=it.state==='pack'?{x:980,y:352,a:0}:it;const r=size(1.7,2.7);c.save();c.translate(p.x,p.y);c.rotate(p.a||0);c.shadowColor=it.kind==='tote'?C.cyan:C.orange;c.shadowBlur=it.state==='pack'?6:0;round(c,-r,-r,r*2,r*2,.5,it.kind==='tote'?C.cyan:'#d7a876');c.shadowBlur=0;if(it.kind==='tote'){c.fillStyle='#175253';c.fillRect(-r*.65,-r*.45,r*1.3,r*.9);}else {line(c,[[0,-r],[0,r]],'#755d48',.5);c.fillStyle='#f3eddf';c.fillRect(0,-r*.5,r*.7,r*.7);}c.restore();}
 for(const p of model.packed){const i=model.packed.filter(x=>x.lane===p.lane).indexOf(p),x=E.W.lanes[p.lane],y=58+i*5;round(c,x-2,y,4,4,.4,C.green);}
 // VAS pack / label / wrap choreography. It is separate from timing calibration.
 {const t=model.t%12,x=1023,y=532;round(c,x-9,y-5,18,10,1,'#706345','#cbb98b');round(c,x-3,y-3,6,6,.6,C.orange);if(t<6){line(c,[[x+10,y+8],[x+6-Math.sin(t)*2,y+1]],'#dbe6e9',1.4);dot(c,x+12,y+10,2.1,C.violet);}else {c.strokeStyle=C.amber;c.lineWidth=1/s;c.beginPath();c.arc(1040,415,7,t,t+4.4);c.stroke();round(c,1037,412,6,6,.5,'#c7b294');}}
 const queues=model.bots.filter(b=>b.state==='induct wait');this.positions=new Map();
 for(const b of model.bots){let x=b.x,y=b.y;const qi=queues.indexOf(b);if(qi>=0){x=b.port;y=361-queues.filter(q=>q.port===b.port).indexOf(b)*9;}this.positions.set(b.id,{x,y});const r=size(2.1,4.1),wait=b.state.includes('wait'),selected=b.id===this.selection;
 if(selected){dot(c,x,y,r*2.5,'#73b8ff22');c.beginPath();c.arc(x,y,r*2.2,0,7);c.lineWidth=1.4/s;c.strokeStyle=C.blue;c.stroke();}
 c.save();c.translate(x,y);c.rotate(b.a||0);c.fillStyle='#070f1777';c.beginPath();c.ellipse(1,2,r*1.2,r*.9,0,0,7);c.fill();round(c,-r,-r*.8,r*2,r*1.6,r*.6,wait?C.amber:C.blue,'#bcdeee');round(c,-r*.55,-r*.5,r*1.1,r,.4,b.loaded?'#eef0d7':'#274458');c.fillStyle='#14232e';c.fillRect(-r*.6,r*.65,r*.38,.8);c.fillRect(r*.2,r*.65,r*.38,.8);dot(c,r*.75,0,.55,C.green);c.restore();
 if(b.state==='pick'){const hand=Math.sin(b.phase*7);dot(c,x+5,y+3,size(1.6,3),C.violet);line(c,[[x+4,y+3],[x+2+hand,y]],'#cfbcf6',size(.8,1));c.beginPath();c.arc(x,y,r+2/s,-Math.PI/2,-Math.PI/2+b.phase/2.4*6.28);c.strokeStyle=C.green;c.lineWidth=1.5/s;c.stroke();}
 if(selected&&s>1.2){round(c,x+5/s,y-25/s,92/s,20/s,3/s,'#263e51','#79bff9');txt(c,b.id,x+11/s,y-11/s,11/s,C.text);}
 }
 if(model.flags.bridge){line(c,[[777,384],[795,384]],C.red,3/s);this.label(c,'BRIDGE HELD',null,785,417,C.red);}
 if(model.flags.conveyor)this.label(c,'CONVEYOR HOLD',null,976,285,C.amber);
 if(model.flags.lane){c.strokeStyle=C.red;c.lineWidth=2/s;c.strokeRect(970,46,22,51);}
 if(opt.pointer){const p=opt.pointer;dot(c,p.x,p.y,4/s,C.text);}
 c.setTransform(d,0,0,d,0,0);
 // North marker and edge labels stay readable while panning.
 txt(c,'N',this.w-29,29,12,C.muted,'center',600);line(c,[[this.w-29,53],[this.w-29,36]],C.muted,1.3);line(c,[[this.w-34,42],[this.w-29,35],[this.w-24,42]],C.muted,1.3);
 }
 hit(x,y,model){const p=this.world(x,y),radius=10/this.camera.s;let found=null,dist=radius;for(const b of [...model.bots,...model.stretch]){const position=this.positions?.get(b.id)||b;const d=Math.hypot(position.x-p.x,position.y-p.y);if(d<dist){found=b;dist=d;}}return found;}
}
function closeup(canvas,model,id){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#14232b';c.fillRect(0,0,w,h);c.save();c.scale(w/300,h/164);const stretch=model.stretch.find(x=>x.id===id);
 if(stretch){const p=E.stretchPose(stretch.t),fault=id==='ST-1'&&model.flags.stretch;round(c,12,26,71,114,4,'#354650','#6e8592');for(let i=0;i<9;i++){if(i===8&&(stretch.t%7)/7>=.22)continue;round(c,20+i%3*18,52+Math.floor(i/3)*24,14,20,1,'#b9815c');}line(c,[[196,134],[286,134]],'#94a7ad',13);for(let x=198;x<287;x+=10)line(c,[[x,129],[x,139]],'#334b57',2);round(c,112,127,42,19,4,C.amber);const q={x:139+p.x*5,y:101-p.y*.57-p.lift*2},el={x:132,y:39};line(c,[[132,129],el,[q.x,q.y]],fault?C.red:'#b3c6cf',10);dot(c,el.x,el.y,8,C.amber);dot(c,132,129,7,C.amber);line(c,[[q.x-8,q.y+4],[q.x+8,q.y+4]],C.orange,4);if(p.carry)round(c,q.x-8,q.y+8,16,18,1,C.orange);if(p.stage==='Deposit')round(c,210+((stretch.t%7/7-.76)/.24)*60,116,16,12,1,C.orange);txt(c,fault?'INTERVENTION':p.stage.toUpperCase(),16,17,11,fault?C.red:C.amber);}
 else {const b=model.bots.find(x=>x.id===id)||model.bots[6];for(let i=0;i<4;i++){round(c,14,26+i*29,63,19,1,'#385564','#688499');round(c,21,29+i*29,20,13,1,'#b98d65');round(c,48,29+i*29,20,13,1,'#8eaaa8');}dot(c,183,128,27,'#080f1566');round(c,157,107,53,27,12,C.blue,'#b8e0f7');round(c,161,129,9,7,3,'#172d3d');round(c,196,129,9,7,3,'#172d3d');line(c,[[183,110],[183,53]],'#bbcbd4',7);round(c,162,67,43,22,3,b.loaded?'#67d5cd':'#3a5b6d','#b7d4da');round(c,174,39,18,13,4,'#d0e6ed');dot(c,183,45,3,C.green);if(b.state==='pick'){dot(c,118,56,10,C.violet);line(c,[[118,72],[117,110]],C.violet,14);line(c,[[118,80],[150,79],[162,76]],'#d0bafb',6);line(c,[[113,111],[106,133]],C.violet,6);line(c,[[123,111],[129,133]],C.violet,6);}
 else {line(c,[[106,126],[144,126]],'#47748d',1.5,[4,4]);line(c,[[220,126],[267,126]],'#47748d',1.5,[4,4]);}txt(c,b.id,16,17,11,C.blue);txt(c,b.loaded?'TOTE LOADED':'PICK ASSIST',283,17,10,C.muted,'right');}
 c.restore();}
root.FlowView={View,views,decode,closeup,C};if(typeof module!=='undefined'&&module.exports)module.exports=root.FlowView;
})(typeof window!=='undefined'?window:globalThis);
