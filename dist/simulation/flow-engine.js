/* A deterministic process animation. Time is presentation time, never operating time.
   Speeds, dwell frames and sample loads are visual choreography; no TBD site parameters are assigned. */
(function(root){'use strict';
const W={north:20,south:631,bridge:{x:786,y:384},induct:{x:812,y:366},stretch:[454,466,574],lanes:[1105,1084,1063,1023,1002,981,941,920,867]};
const mix=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pt=(x,y,h)=>({x,y,...(h===undefined?{}:{h})});
function path(coords){const p=coords.map(v=>Array.isArray(v)?pt(...v):{...v}).filter((v,i,a)=>!i||Math.hypot(v.x-a[i-1].x,v.y-a[i-1].y,(v.h||0)-(a[i-1].h||0))>.01),L=[0];for(let i=1;i<p.length;i++)L.push(L.at(-1)+Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y,(p[i].h||0)-(p[i-1].h||0)));return{p,L,len:L.at(-1)};}
function at(P,d){d=clamp(d,0,P.len);let i=1;while(i<P.L.length-1&&P.L[i]<d)i++;const a=P.p[i-1],b=P.p[i]||a,u=(d-P.L[i-1])/(P.L[i]-P.L[i-1]||1);return{x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),...(a.h===undefined?{}:{h:mix(a.h,b.h??a.h,u)}),a:Math.atan2(b.y-a.y,b.x-a.x)};}
function pickRoute(target,back=false,port=812){const from=[port,366],pts=target.y>390?[from,[812,377],[786,377],[786,393],[target.x,393],[target.x,target.y]]:[from,[target.x,377],[target.x,target.y]];return path(back?pts.reverse():pts);}
function stretchPose(t){let u=((t%7)+7)%7/7,p,stage,carry=false;if(u<.22){p=u/.22;stage='Reach';return{x:mix(0,-14,p),y:mix(-5,16,p),lift:0,carry,stage};}if(u<.4){p=(u-.22)/.18;return{x:-14,y:16,lift:mix(0,15,p),carry:true,stage:'Grip & lift'};}if(u<.76){p=(u-.4)/.36;return{x:mix(-14,13,p),y:mix(16,-19,p),lift:mix(15,2,p),carry:true,stage:'Transfer'};}p=(u-.76)/.24;return{x:mix(13,0,p),y:mix(-19,-5,p),lift:mix(2,0,p),carry:false,stage:'Deposit'};}
const belt=path([[812,366,3],[935,366,3],[946,350,3],[946,290,24],[980,290,24],[980,302,24],[966,302,24]]);
const sortPath=lane=>path([[966,302,24],[966,307,24],[1040,307,24],[1040,366,24],[998,366,24],[998,285,24],[998,215,24],[998,145,24],[1012,121,10],[1012,104,10],[W.lanes[lane],104,10],[W.lanes[lane],93,10],[W.lanes[lane],75,3]]);
const recirc=path([[981,104],[1125,104],[1125,113],[860,113],[860,104],[981,104]]);
const forkRoutes=[
 [[840,596],[840,575],[397,575],[397,490],[397,575],[840,575],[840,596]],
 [[630,575],[630,377],[442,377],[442,280],[442,377],[711,377],[711,280],[711,377],[630,377],[630,575]],
 [[51,575],[51,377],[592,377],[592,250],[592,377],[51,377],[51,575]],
 [[1024,542],[1040,542],[1040,377],[1170,377],[1170,222],[1170,140],[1195,140],[1195,118],[1195,140],[624,140],[624,110],[624,60],[624,140],[1040,140],[1040,377],[1040,542],[1024,542]],
 [[1000,552],[900,552],[900,377],[652,377],[652,210],[652,377],[900,377],[900,552],[1000,552]],
 [[1040,415],[1040,377],[1084,377],[1084,140],[1084,92],[1084,140],[708,140],[708,110],[708,54],[708,140],[1040,140],[1040,377],[1040,415]]
].map(path);
class Model{
 constructor(options={}){this.options=options;this.reset();}
 reset(){this.controls={amrSpeed:1,pickDwell:1,stretchSpeed:1,conveyorSpeed:1,fleetPaused:false};this.retail=[];this.retailClock=0;this.retailSeq=0;this.t=0;this.beltT=0;this.flags={conveyor:false,stretch:false,bridge:false,lane:false};this.owner=null;this.events=[];this.seq=0;this.stats={unloaded:0,picked:0,inducted:0,packed:0,sorted:0};this.items=[];this.inbound=[];this.packed=[];this.stretch=W.stretch.map((x,i)=>({id:'ST-'+(i+1),x,y:652,t:i*2.1,last:0}));this.bots=Array.from({length:20},(_,i)=>{const target=this.target(i,0),port=[792,802,812][i%3],P=pickRoute(target,false,port),d=P.len*((i*.137)%1);return{id:'AMR-'+String(i+1).padStart(2,'0'),i,port,round:0,target,path:P,d,...at(P,d),state:'travel',phase:0,loaded:false,trail:[]};});this.forks=forkRoutes.map((P,i)=>({id:'MOVE-'+(i+1),path:P,d:P.len*i/6,...at(P,P.len*i/6),loaded:i%2===0}));for(let i=0;i<8;i++){const P=i<4?belt:sortPath(i-2),d=P.len*(.10+(i%4)*.21);this.items.push({id:'SAMPLE-'+(i+1),source:'Demonstration load',kind:i<4?'tote':'carton',path:P,d,state:i<4?'conveyor':'sort',phase:0,lane:i-2,...at(P,d)});}if(this.options.parcelOnly){for(const it of this.items){it.lane=7+Math.abs(it.lane%2);if(it.state==='sort'){it.path=sortPath(it.lane);it.d=Math.min(it.d,it.path.len);Object.assign(it,at(it.path,it.d));}}this.addRetail();}this.log('Scene ready · 20 AMRs / 3 active Stretch docks','system');}
 setControl(key,value){const ranges={amrSpeed:[.25,2],pickDwell:[.5,3],stretchSpeed:[.25,2],conveyorSpeed:[.25,2]};if(!ranges[key]||!Number.isFinite(Number(value)))return;this.controls[key]=clamp(Number(value),...ranges[key]);}
 pauseAgent(id){const agent=[...this.bots,...this.stretch].find(a=>a.id===id);if(!agent)return false;agent.paused=!agent.paused;this.log(id+(agent.paused?' · paused by viewer':' · released'),agent.paused?'hold':'flow');return agent.paused;}
 addRetail(){const P=path([[1084,140],[981,140],[981,110],[981,90]]);this.retail.push({id:'RETAIL-'+(++this.retailSeq),path:P,d:0,...at(P,0),state:'travel'});}
 stepRetail(dt){if(!this.options.parcelOnly)return;this.retailClock+=dt;if(this.retailClock>=9&&this.retail.length<6){this.retailClock=0;this.addRetail();}let leader=Infinity;for(const it of this.retail){const stop=this.flags.lane?it.path.len-8:it.path.len;const next=Math.max(it.d,Math.min(stop,leader-10,it.d+dt*15));it.state=next===it.d?'queued':'travel';it.d=next;Object.assign(it,at(it.path,it.d));leader=it.d;if(it.d>=it.path.len&&!this.flags.lane){it.state='done';this.log(it.id+' staged at Lane 6 · retail demonstration');}}this.retail=this.retail.filter(x=>x.state!=='done');}

 target(i,round){const south=(i+round)%3===0;return{x:south?[730,749.5,770,787][(i+round)%4]:[772,793,813,834][(i+round)%4],y:south?430+((i*31+round*41)%113):166+((i*23+round*37)%165)};}
 log(message,kind='flow'){this.events.unshift({n:++this.seq,t:this.t,message,kind});this.events.length=Math.min(this.events.length,7);}
 toggle(key){this.flags[key]=!this.flags[key];this.log(({conveyor:'Tower conveyor',stretch:'Stretch 01',bridge:'Locus bridge',lane:'Lane 6'})[key]+(this.flags[key]?' · hold introduced':' · flow released'),this.flags[key]?'hold':'flow');return this.flags[key];}
 clear(){for(const k of Object.keys(this.flags))this.flags[k]=false;this.controls.fleetPaused=false;for(const a of [...this.bots,...this.stretch])a.paused=false;this.log('All disruptions and robot holds cleared','flow');}
 addTote(bot){const id='TOTE-'+String(++this.stats.inducted).padStart(3,'0');this.items.push({id,source:bot.id,kind:'tote',path:path([[bot.port,366],...belt.p]),d:0,state:'conveyor',phase:0,lane:this.options.parcelOnly?7+(this.stats.inducted%2):this.stats.inducted%9,...at(belt,0)});this.log(bot.id+' handed '+id+' to induction');}
 moveBot(b,dt){if(b.paused||this.controls.fleetPaused)return;let state=b.state;if(['travel','return','bridge wait'].includes(state)){
   const candidate=at(b.path,b.d+dt*29*this.controls.amrSpeed);const onBridge=(p)=>p.x>781&&p.x<791&&p.y>377&&p.y<394;
   if(onBridge(candidate)&&(this.flags.bridge||(this.owner&&this.owner!==b.id))){b.state='bridge wait';return;}
   if(onBridge(candidate))this.owner=b.id;else if(this.owner===b.id)this.owner=null;
   b.state=b.loaded?'return':'travel';b.d=Math.min(b.path.len,b.d+dt*29*this.controls.amrSpeed);Object.assign(b,at(b.path,b.d));
   if(b.d>=b.path.len){b.state=b.loaded?'induct wait':'pick';b.phase=0;if(b.state==='pick')this.log(b.id+' arrived at '+(b.target.y>390?'S09–S12':'Locus pallet face'));}
 }else if(state==='pick'){
   b.phase+=dt;if(b.phase>=2.4*this.controls.pickDwell){b.loaded=true;this.stats.picked++;b.state='return';b.path=pickRoute(b.target,true,b.port);b.d=0;b.phase=0;}
 }else if(state==='induct wait'){
   // A presentation queue: downstream hold stops new handoffs.
   if(!this.flags.conveyor&&!this.bots.some(x=>x.state==='induct'&&x.port===b.port)){b.state='induct';b.phase=0;}
 }else if(state==='induct'){
   if(!this.flags.conveyor){b.phase+=dt;if(b.phase>=1.2){this.addTote(b);b.loaded=false;b.round++;b.target=this.target(b.i,b.round);b.path=pickRoute(b.target,false,b.port);b.d=0;b.state='travel';b.phase=0;}}
 }
 b.trail.push({x:b.x,y:b.y});if(b.trail.length>24)b.trail.shift();}
 step(dt){dt=Math.min(dt,.12);this.t+=dt;if(!this.flags.conveyor)this.beltT+=dt*this.controls.conveyorSpeed;
 this.stretch.forEach((s,i)=>{if(!s.paused&&!(i===0&&this.flags.stretch)){const before=Math.floor(s.t/7),beforeDeposit=Math.floor((s.t+7*.24)/7);s.t+=dt*this.controls.stretchSpeed;if(Math.floor((s.t+7*.24)/7)>beforeDeposit){const P=path([[s.x,638],[s.x,611],[s.x+6,600]]);this.inbound.push({path:P,d:0,...at(P,0)});}if(Math.floor(s.t/7)>before){this.stats.unloaded++;this.log(s.id+' deposited a carton onto the dock belt');}}});
 this.bots.forEach(b=>this.moveBot(b,dt));this.inbound.forEach(it=>{it.d+=dt*16;Object.assign(it,at(it.path,it.d));});this.inbound=this.inbound.filter(it=>it.d<it.path.len+16);
 for(const it of this.items){
  if(it.state==='pack'){it.phase+=dt;if(it.phase>=2.7){it.kind='carton';it.state='sort';it.path=sortPath(it.lane);it.d=0;this.stats.packed++;this.log(it.id.replace('TOTE','ORDER')+' packed · label applied');}continue;}
  if(this.flags.conveyor)continue;
  it.d=Math.min(it.path.len,it.d+dt*38*this.controls.conveyorSpeed);Object.assign(it,at(it.path,it.d));
  if(it.d>=it.path.len){if(it.state==='conveyor'){it.state='pack';it.phase=0;}else if(it.state==='sort'){if(this.flags.lane&&it.lane===5){it.state='recirculate';it.path=path([[it.x,it.y],...recirc.p]);it.d=0;this.log(it.id+' recirculating · Lane 6 held','hold');}else {it.state='done';this.stats.sorted++;this.packed.push({lane:it.lane,at:this.t});this.log(it.id.replace('TOTE','ORDER')+' diverted to lane '+(it.lane+1));}}
  else if(it.state==='recirculate'){it.d=0;it.path=recirc;if(!this.flags.lane){it.state='sort';it.path=path([[981,104],[981,75]]);}}}
 }
 this.items=this.items.filter(x=>x.state!=='done');this.packed=this.packed.filter(x=>this.t-x.at<12);
 this.stepRetail(dt);this.forks.forEach((f,i)=>{f.d=(f.d+dt*(20+i*1.4))%f.path.len;Object.assign(f,at(f.path,f.d));f.loaded=f.d/f.path.len<.6;});
 }
 snapshot(){return{t:this.t,bots:this.bots.map(b=>({id:b.id,state:b.state,x:b.x,y:b.y,loaded:b.loaded})),items:this.items.map(i=>({id:i.id,state:i.state,x:i.x,y:i.y})),stats:{...this.stats},flags:{...this.flags}};}
}
const api={Model,W,path,at,pickRoute,stretchPose,belt,sortPath,forkRoutes};root.FlowEngine=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
