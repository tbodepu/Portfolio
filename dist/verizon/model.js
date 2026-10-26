/* Schematic process animation. All durations, placement, routes and dispatch splits below
   are presentation choreography. They are not site rates, CAD geometry or calibrated inputs. */
(function(root){'use strict';
const inventory={amrs:{value:60,approximate:true,allocation:null},yaskawa:{value:14,cellAssignment:null},acs:{value:6},ags:{value:6},rata:{value:15},radi:{value:10},asrs:{value:null},pack:{value:null}};
const brands=['Apple','Google','Samsung','Motorola','OnePlus'];
const stages=[
 ['receive','Smart receive','reverse',70,140,140,190,140,350,'receive',1,'Automated receipt. Hospital fallback is confirmed; recovery and re-entry details remain open.'],
 ['acs','ACS · 6','reverse',250,140,180,190,340,350,'clean',6,'Six automated cleaning systems reported. Chamber motion and robotic service are schematic.'],
 ['ags','AGS · 6','reverse',460,140,180,190,550,350,'grade',6,'Six automated grading systems reported. Actual ACS/AGS routing and robot assignment await confirmation.'],
 ['rata','RATA · 15','reverse',680,140,240,190,800,350,'test',15,'Fifteen RATA units reported. This example selects a functionality bank; product eligibility is not established.'],
 ['radi','RADI · 10','reverse',950,140,150,190,1025,350,'test',10,'Ten RADI units reported. Cell footprint, loading and routing are representative.'],
 ['hospital','Hospital receiving','reverse',80,465,160,105,160,600,'manual',1,'Fallback for smart-receive automation failures. Re-entry shown here is an example route.'],
 ['manual-clean','Manual clean / grade','reverse',280,465,160,105,360,600,'manual',1,'Manual cleaning and cosmetic grading. Mandatory versus exception-only usage is unresolved.'],
 ['manual-test','Manual function','reverse',480,465,160,105,560,600,'manual',1,'Manual functionality testing. The current example is a fallback journey, not an eligibility rule.'],
 ['rf','RF · R&S / Keysight','reverse',680,465,180,105,770,600,'rf',2,'Rohde & Schwarz and Keysight RF systems. Instrument counts, recipes and test limits are not supplied.'],
 ['extended','Extended testing','reverse',900,465,200,125,1000,610,'extended',3,'PUCD/CDWRF, Radiant display, peak temperature and Head Acoustics audio are represented as test areas. Sequence and counts remain open.'],
 ['repair','Repair workcells','reverse',80,720,160,125,160,695,'manual',1,'Example repair return to RF is illustrative. Actual failure disposition and retest requirements need confirmation.'],
 ['storage','ASRS / Locus / racks','reverse',280,720,230,125,395,695,'asrs',2,'Reverse storage and movement systems are reported. Rack layout, capacity and physical integration remain schematic.'],
 ['quality','Quality audit','reverse',550,720,120,125,610,695,'manual',1,'Quality audit areas are reported. Audit placement, sample policy and release gates remain unverified.'],
 ['pack','Automated packaging','reverse',720,720,180,125,810,695,'pack',2,'Automated packaging is reported. Two rendered modules are representative shapes, not a machine count.'],
 ['ship','Reverse outbound','reverse',950,720,140,125,1020,695,'ship',2,'Example dispatch after quality and packaging. Shipment cutoffs and destination rules are unset.'],
 ['f-receive','Automated receiving','forward',1240,150,165,115,1430,210,'receive',1,'Forward product is received automatically. Actual handling unit and exception destinations are open.'],
 ['f-asrs','ASRS · store / retrieve','forward',1470,140,225,330,1720,310,'asrs',2,'Conveyors connect automated receiving, ASRS and storage. Rendered rack bays and shuttle cycles are illustrative.'],
 ['f-vas','Floor VAS','forward',1240,510,170,110,1430,565,'manual',1,'Manual floor VAS. Planned VAS and ASRS-recovery work are not yet distinguished in the site routing.'],
 ['f-pack','Automated packing','forward',1490,610,200,140,1720,685,'pack',2,'Forward packing is automated. Equipment quantity and pack / label validation sequence remain unspecified.'],
 ['f-ship','Forward outbound','forward',1490,810,200,65,1720,840,'ship',2,'Forward dispatch closes this example journey. Outbound automation boundaries await confirmation.']
].map(([id,name,network,x,y,w,h,px,py,kind,slots,note])=>({id,name,network,x,y,w,h,port:{x:px,y:py},kind,demoSlots:slots,note}));
const nodes=Object.fromEntries(stages.map(s=>[s.id,s]));
function path(points){const p=points.filter((v,i)=>!i||Math.hypot(v[0]-points[i-1][0],v[1]-points[i-1][1])>.01),lengths=[0];for(let i=1;i<p.length;i++)lengths.push(lengths.at(-1)+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return{p,lengths,total:lengths.at(-1)};}
function at(P,d){d=Math.max(0,Math.min(d,P.total));let i=1;while(i<P.lengths.length-1&&P.lengths[i]<d)i++;const a=P.p[i-1],b=P.p[i]||a,t=(d-P.lengths[i-1])/(P.lengths[i]-P.lengths[i-1]||1);return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}
const bus=s=>s.y<400?365:s.y<650?640:680;
function routePath(a,b){a=nodes[a];b=nodes[b];if(a.network==='reverse'){const ay=bus(a),by=bus(b);return path([[a.port.x,a.port.y],[a.port.x,ay],...(ay===by?[]:[[1120,ay],[1120,by]]),[b.port.x,by],[b.port.x,b.port.y]]);}return path([[a.port.x,a.port.y],[1740,a.port.y],[1740,b.port.y],[b.port.x,b.port.y]]);}
const robotPaths=[
 path([[52,96],[1142,96],[1142,660],[52,660],[52,96]]),
 path([[52,96],[1142,96],[1142,908],[52,908],[52,96]]),
 path([[52,660],[1142,660],[1142,908],[52,908],[52,660]]),
 path([[1220,96],[1760,96],[1760,908],[1220,908],[1220,96]])
];
function armPose(t){const u=(t%6)/6;return{phase:u<.2?'Approach':u<.38?'Pick':u<.72?'Transfer':'Place',angle:Math.sin(u*Math.PI*2)*.9,lift:Math.sin(u*Math.PI)*20,loaded:u>.25&&u<.84};}
class Model{
 constructor(){this.profile='standard';this.brand='mixed';this.reset();}
 reset(){this.t=0;this.flags={conveyor:false,rf:false,asrs:false,pack:false};this.units=[];this.seq=0;this.arrived=0;this.completed=0;this.events=[];this.nextBirth={reverse:0,forward:1};this.bots=Array.from({length:60},(_,i)=>{const P=robotPaths[i<40?i%3:3];return{id:'AMR-'+String(i+1).padStart(2,'0'),network:i<40?'reverse':'forward',path:P,d:P.total*(i*.1618%1),pause:0,loaded:i%2===0,...at(P,P.total*(i*.1618%1)),state:'Travel'};});this.arms=Array.from({length:14},(_,i)=>({id:'YC-'+String(i+1).padStart(2,'0'),x:665+i*33,y:405,t:i*.38,state:'Approach'}));for(let i=0;i<10;i++)this.spawn(i%3?'reverse':'forward',true,i);this.log('Scene ready · 60 representative AMRs / 14 Yaskawa arms');}
 setProfile(p){if(!['standard','fallback','repair'].includes(p))return;this.profile=p;this.reset();}
 setBrand(b){this.brand=brands.includes(b)?b:'mixed';this.reset();}
 route(network,i){if(network==='forward')return this.profile==='fallback'?['f-receive','f-asrs','f-vas','f-pack','f-ship']:['f-receive','f-asrs','f-pack','f-ship'];const test=i%2?'rata':'radi';if(this.profile==='fallback')return['receive','hospital','manual-clean','manual-test','rf','extended','storage','quality','pack','ship'];if(this.profile==='repair')return['receive','acs','ags',test,'rf','repair','rf','extended','storage','quality','pack','ship'];return['receive','acs','ags',test,'rf','extended','storage','quality','pack','ship'];}
 countAt(id){return this.units.filter(u=>u.node===id&&u.state!=='done').length;}
 available(id){return this.countAt(id)<nodes[id].demoSlots+5;}
 spawn(network,seed=false,i=0){const route=this.route(network,this.seq),index=seed?i%route.length:0,node=route[index];if(!this.available(node))return false;const id=++this.seq;this.units.push({id:'DEMO-'+String(id).padStart(3,'0'),serial:id,network,brand:this.brand==='mixed'?brands[(id-1)%5]:this.brand,route,index,node,state:'queue',elapsed:0,duration:0,x:nodes[node].port.x,y:nodes[node].port.y,path:null,d:0});this.arrived++;return true;}
 log(text){this.events.unshift({id:this.seq,t:this.t,text});this.events.length=Math.min(this.events.length,6);}
 held(id){return this.flags.rf&&id==='rf'||this.flags.asrs&&['storage','f-asrs'].includes(id)||this.flags.pack&&['pack','f-pack'].includes(id);}
 toggle(key){if(!Object.hasOwn(this.flags,key))return;this.flags[key]=!this.flags[key];this.log(key+' '+(this.flags[key]?'hold introduced':'released'));}
 clear(){Object.keys(this.flags).forEach(k=>this.flags[k]=false);this.log('Holds cleared · recovery resumes');}
 moveOn(u){const next=u.route[u.index+1];if(!next){u.state='done';this.completed++;this.log(u.id+' · '+u.brand+' · '+u.network+' dispatch');return true;}if(this.flags.conveyor||!this.available(next)){u.state='blocked';return false;}u.path=routePath(u.node,next);u.node=next;u.index++;u.d=0;u.state='travel';u.elapsed=0;return true;}
 step(dt){dt=Math.max(0,Math.min(dt,.1));this.t+=dt;for(const n of ['reverse','forward'])if(this.t>=this.nextBirth[n]){if(this.spawn(n))this.nextBirth[n]=this.t+(n==='reverse'?2.8:5);else this.nextBirth[n]=this.t+1;}
 for(const u of this.units){const s=nodes[u.node];if(u.state==='travel'){if(!this.flags.conveyor){u.d=Math.min(u.path.total,u.d+dt*95);Object.assign(u,at(u.path,u.d));if(u.d>=u.path.total){u.state='queue';u.elapsed=0;}}}else if(u.state==='queue'){if(!this.held(u.node)&&this.units.filter(x=>x.node===u.node&&['processing','blocked'].includes(x.state)).length<s.demoSlots){u.state='processing';u.elapsed=0;u.duration=3+(u.serial%4)*.8+(s.kind==='asrs'?3:0);}}else if(u.state==='processing'){if(!this.held(u.node)){u.elapsed+=dt;if(u.elapsed>=u.duration)this.moveOn(u);}}else if(u.state==='blocked'){if(!this.held(u.node))this.moveOn(u);}}
 this.units=this.units.filter(u=>u.state!=='done');
 for(const b of this.bots){if((b.network==='forward'&&this.flags.asrs)||(b.network==='reverse'&&this.flags.pack)){b.state='Waiting';continue;}if(b.pause>0){b.pause-=dt;b.state=b.loaded?'Drop-off':'Pick-up';if(b.pause<=0)b.loaded=!b.loaded;}else{const before=Math.floor(b.d/(b.path.total/4));b.d=(b.d+dt*(28+(Number(b.id.slice(-2))%6)))%b.path.total;Object.assign(b,at(b.path,b.d));b.state=b.loaded?'Loaded travel':'Return';if(Math.floor(b.d/(b.path.total/4))!==before)b.pause=1.1;}}
 for(const a of this.arms){if(this.flags.conveyor){a.state='Downstream hold';continue;}a.t+=dt;a.state=armPose(a.t).phase;}
 }
 summary(){return{moving:this.units.filter(x=>x.state==='travel').length,processing:this.units.filter(x=>x.state==='processing').length,waiting:this.units.filter(x=>['queue','blocked'].includes(x.state)).length};}
}
root.VerizonModel={Model,inventory,stages,nodes,brands,path,at,routePath,robotPaths,armPose};if(typeof module!=='undefined'&&module.exports)module.exports=root.VerizonModel;
})(typeof window!=='undefined'?window:globalThis);
