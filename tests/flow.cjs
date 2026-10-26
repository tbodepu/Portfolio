const assert=require('assert'),fs=require('fs'),vm=require('vm'),E=require('../dist/simulation/flow-engine.js');
const run=(m,n)=>{for(let i=0;i<n;i++)m.step(.06)};
let m=new E.Model();run(m,1000);assert.equal(m.bots.length,20);assert.equal(m.stretch.length,3);assert(m.stats.inducted>0&&m.stats.packed>0&&m.stats.sorted>0);for(const b of m.bots)assert(Number.isFinite(b.x)&&Number.isFinite(b.y));
m=new E.Model();m.toggle('conveyor');const d=m.items.map(x=>x.d);run(m,350);assert.deepEqual(m.items.map(x=>x.d),d);assert(m.bots.some(x=>x.state==='induct wait'));assert.equal(m.stats.inducted,0);m.toggle('conveyor');run(m,100);assert(m.stats.inducted>0);
m=new E.Model();m.toggle('stretch');let st=m.stretch.map(x=>x.t);run(m,100);assert.equal(m.stretch[0].t,st[0]);assert(m.stretch[1].t>st[1]);m.clear();run(m,10);assert(m.stretch[0].t>st[0]);
m=new E.Model();m.toggle('bridge');run(m,350);assert(m.bots.some(x=>x.state==='bridge wait'));const waiting=m.bots.filter(x=>x.state==='bridge wait').map(x=>x.id);m.clear();run(m,1200);assert(waiting.some(id=>m.bots.find(x=>x.id===id).round>0));
m=new E.Model();m.toggle('lane');run(m,400);assert(m.items.some(x=>x.state==='recirculate'));m.clear();run(m,800);assert(!m.items.some(x=>x.state==='recirculate'));m.reset();assert.equal(m.t,0);assert(Object.values(m.flags).every(x=>!x));
console.log('PASS: 20 agents; active Stretch count; pick → induction → pack → sort handoffs; all four hold / release paths; reset; finite coordinates.');
