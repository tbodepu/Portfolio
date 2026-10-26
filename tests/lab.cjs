const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../dist/simulation'),code=fs.readFileSync(path.join(dir,'lab.js'),'utf8'),cad=fs.readFileSync(path.join(dir,'cad-geometry.js'),'utf8');
function fresh(){const ctx={window:{__REVELYST_HEADLESS__:true},atob:s=>Buffer.from(s,'base64').toString('binary'),console};vm.createContext(ctx);vm.runInContext(cad,ctx);vm.runInContext(code,ctx);return ctx.window.RevelystLab;}
const run=(m,seconds)=>{for(let i=0;i<seconds*2;i++)m.step(.5);};
let m=fresh();assert.equal(m.S.bots.length,20);assert.equal(m.S.stretch.length,3);assert.equal(m.OUT.reduce((n,o)=>n+o.count,0),0);
assert.equal(m.TOWER.levels.length,3);assert.deepEqual(Array.from(m.TOWER.activeLevels),[0,10.5]);assert.equal(m.PACK.length,10);assert(m.PACK.every(p=>p.h===21));
run(m,3600);let a=m.snapshot();assert(a.totals.in>0&&a.totals.pick>0&&a.totals.pack>0&&a.totals.putaway>0);assert(a.truckWorkFraction>=0&&a.truckWorkFraction<=a.truckAssignedFraction&&a.truckAssignedFraction<=1.00001);assert(a.stretchBusyFraction>=0&&a.stretchBusyFraction<=1);assert(m.DL.every(l=>l.full>=0&&l.full<=14));assert.equal(m.DL[6].cur,0);assert.equal(m.DL[6].full,0);
assert.equal((a.totals.staged||0)-(a.totals.loaded||0),m.OUT.reduce((n,o)=>n+o.count,0),'outbound pallet conservation');
assert.equal(a.totals.wmDone||0,m.WM_PROC.ready+m.S.forks.filter(f=>f.task?.type==='wmout'&&f.load).length+(a.totals.wmStaged||0),'High-volume customer completions remain queued, carried or staged');
assert.equal(a.totals.vas||0,m.S.vasOut+m.S.forks.filter(f=>f.task?.type==='vasout'&&f.load).length+(a.totals.vasStaged||0),'VAS completions remain queued, carried or staged');
for(const o of m.OUT)assert(o.reserved>=0&&o.count>=0&&o.count+o.reserved<=26);for(const b of [...m.S.bots,...m.S.forks])assert(Number.isFinite(b.x)&&Number.isFinite(b.y));
assert(a.totals.towerL1>0&&a.totals.towerL2>0,'both active levels send picks');assert(a.totals.weighPass>0&&a.totals.labelPass>0);assert(a.totals.weighPass>=a.totals.labelPass);assert(a.totals.labelPass>=(a.totals.dlCase||0)+(a.totals.dlParcel||0),'downlane loads pass weigh and print points first');assert(m.S.items.filter(i=>i.kind==='tote').every(i=>i.P.pts.at(-1).h===24),'totes end at Level 3 packing');
const before=JSON.stringify(a);m.newState();m.initOcc();run(m,3600);assert.equal(JSON.stringify(m.snapshot()),before,'same seed + fixed time reproduces results');
const b=m.S.bots[0];b.paused=true;const pos=[b.x,b.y,b.state,b.bat];run(m,15);assert.deepEqual([b.x,b.y,b.state,b.bat],pos);m.clearHolds();m.holds.fleet=true;const all=m.S.bots.map(b=>[b.x,b.y,b.state,b.bat]);run(m,10);assert.deepEqual(m.S.bots.map(b=>[b.x,b.y,b.state,b.bat]),all);m.clearHolds();
const st=m.S.stretch[0];m.holds.stretch=true;const s0=[st.arm,st.timer,st.left];run(m,20);assert.deepEqual([st.arm,st.timer,st.left],s0);m.clearHolds();
m.holds.conveyor=true;const items=m.S.items.map(i=>[i,i.d]);run(m,20);assert(items.every(([i,d])=>i.d===d));m.clearHolds();run(m,20);assert(items.some(([i,d])=>i.d>d));
m.newState();m.initOcc();m.holds.bridge=true;run(m,600);assert(m.S.bots.some(b=>b.bridgeWait));m.clearHolds();run(m,600);assert(m.S.tot.pick>0);
m.newState();m.initOcc();m.holds.lane=true;run(m,3600);assert(m.S.recirc>0);assert(m.S.tot.dlParcel>0,'parcel lanes continue during lane-6 hold');m.clearHolds();run(m,600);assert(m.DL[5].full>0||m.DL[5].cur>0);
// Completed High-volume customer product remains available even when every matching door is full.
m.newState();m.initOcc();m.P.ltlRate=0;m.P.wmRate=30;for(const o of m.OUT.filter(o=>o.kind==='wm')){o.count=26;o.loading=true;o.timer=-1e9;}run(m,3600);assert(m.WM_PROC.ready>0);assert.equal(m.S.tot.wmDone,m.WM_PROC.ready);for(const o of m.OUT.filter(o=>o.kind==='wm')){o.count=0;o.loading=false;o.timer=0;}run(m,1200);assert((m.S.tot.wmStaged||0)>0);
console.log('PASS: operational model deterministic replay; seeded rates; productive/assigned time distinction; outbound/High-volume customer/VAS accounting; five hold/recovery paths; exception-lane isolation; finite coordinates.');
