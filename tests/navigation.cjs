const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');
const dir=path.resolve(__dirname,'../dist')+'/';
let mounted=null, rulesMounted=false, destroys=0,focus=0;
class Element {
 constructor(){this.innerHTML='';this.hidden=false;this.attrs={};this.dataset={};this.handlers={};this.nodes={};this.classList={add(){},remove(){}};}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){focus++;}
 scrollIntoView(){}
 getAttribute(k){return this.attrs[k];}
 querySelector(selector){if(selector==='.process-simulation')return this.innerHTML.includes('process-simulation')?new Element():null;return this.nodes[selector]||(this.nodes[selector]=new Element());}
 querySelectorAll(selector){if(selector!=='[data-overview-view]')return [];return this.nodes[selector]||(this.nodes[selector]=['reverse','forward'].map(view=>{const b=new Element();b.dataset.overviewView=view;b.setAttribute('aria-pressed',String(view==='reverse'));return b;}));}
 addEventListener(n,f){this.handlers[n]=f;}
 click(){this.handlers.click?.();}
}
const root=new Element(),home=new Element(),skip=new Element(),meta=new Element(),events={};
const document={querySelector:s=>s==='#case-study'?root:s==='#portfolio-home'?home:s==='meta[name="description"]'?meta:skip,getElementById:()=>new Element(),body:new Element(),title:''};
const location={hash:''};
const window={addEventListener:(name,fn)=>events[name]=fn,scrollTo(){},PortfolioSim:{destroyCase(){mounted=null;destroys++;},markup(id){return `<section class="process-simulation" data-simulation="${id}"></section>`;},mountCase(id,el){assert(el);mounted=id;}},RevelystModel:{mount(){rulesMounted=true;return{destroy(){rulesMounted=false;}};}}};
const context=vm.createContext({window,document,location,history:{replaceState(a,b,hash){location.hash=hash;}},requestAnimationFrame:fn=>fn()});
for(const name of ['case-data.js','operations-data.js','operations-view.js','case-studies.js'])vm.runInContext(fs.readFileSync(dir+name,'utf8'),context,{filename:name});
function route(hash){root.nodes={};location.hash=hash;events.hashchange();return root.innerHTML;}
assert.equal(root.hidden,true);
const routes=[];
for(const slug of ['revelyst','verizon','tesla'])for(const chapter of ['overview','simulation','workstreams','metrics','evidence','skills']){
 const h=route(`#project/${slug}/${chapter}`);assert(!root.hidden&&home.hidden);assert(h.includes('aria-current="page"'));assert(h.includes('id="chapter-title"'));assert(document.title.includes(slug==='revelyst'?'Revelyst':slug==='verizon'?'Verizon':'Tesla'));assert(!h.includes('undefined'));routes.push([slug,chapter,h]);
}
for(const id of ['slotting','layout','stretch']){route(`#project/revelyst/simulation/${id}`);assert.equal(mounted,id);assert(!root.innerHTML.includes('<iframe'));}
for(const [slug,id]of [['verizon','cobot'],['verizon','npi'],['tesla','tesla']]){route(`#project/${slug}/simulation/${id}`);assert.equal(mounted,id);}
for(const view of ['reverse','forward']){const h=route('#project/verizon/simulation/'+view);assert(h.includes('src="verizon/#'+view+'"'));assert.equal(mounted,null);}
route('#project/revelyst/simulation');assert(root.innerHTML.includes('<iframe'));assert.equal(mounted,null);
route('#project/revelyst/simulation/rules');assert(rulesMounted);route('#project/revelyst/metrics');assert(!rulesMounted);
for(const [old,expected]of [['#slotting','#project/revelyst/workstreams/slotting'],['#cobot','#project/verizon/workstreams/cobot'],['#facility','#project/revelyst/simulation/rules'],['#tesla','#project/tesla']]){route(old);assert.equal(location.hash,expected);}
route('#project/verizon/workstreams/npi');assert(root.innerHTML.includes('One validation framework'));route('#project/revelyst/workstreams/stretch');assert(root.innerHTML.includes('no final performance improvement'));
route('#project/revelyst/simulation/no-such-model');assert(root.innerHTML.includes('<iframe'));
for(const slug of ['revelyst','verizon']){const h=route('#project/'+slug);assert(h.includes('overview-simulator'));assert(h.indexOf('<iframe')<h.indexOf('The challenge'));assert(h.includes('allow="fullscreen"'));}
const forward=root.querySelectorAll('[data-overview-view]')[1];forward.click();assert.equal(root.querySelector('#overview-facility').src,'verizon/#forward');assert.equal(root.querySelector('[data-overview-fullscreen]').href,'verizon/#forward');assert.equal(root.querySelector('[data-overview-chapter]').href,'#project/verizon/simulation/forward');assert.equal(forward.getAttribute('aria-pressed'),'true');
const reverse=root.querySelectorAll('[data-overview-view]')[0];reverse.click();assert.equal(root.querySelector('#overview-facility').src,'verizon/#reverse');assert.equal(reverse.getAttribute('aria-pressed'),'true');assert.equal(forward.getAttribute('aria-pressed'),'false');
route('#project/tesla');assert.equal(mounted,'tesla');assert(root.innerHTML.indexOf('process-simulation')<root.innerHTML.indexOf('The challenge'));
route('#work');assert(!home.hidden&&root.hidden);assert.equal(root.innerHTML,'');assert(!rulesMounted&&!mounted);
const homeHTML=fs.readFileSync(dir+'index.html','utf8');assert(!homeHTML.includes('facility-simulation'));assert(!homeHTML.includes('id="facility"'));assert(!homeHTML.includes('case-dialog'));assert(!homeHTML.includes('cad-geometry.js'));
const model=fs.readFileSync(dir+'simulation/index.html','utf8');assert(model.includes('#project/revelyst/simulation'));assert(!model.includes('/#facility'));

for(const slug of ['revelyst','verizon']) {const d=window.PortfolioOperations[slug];for(const [network,n] of Object.entries(d.networks)){for(const area of n.stages){const h=route(`#project/${slug}/systems/${network}~${area.id}`);assert(h.includes(area.confirmed.replace(/&/g,'&amp;')));assert(h.includes('id="operation-detail"'));assert(h.includes('No operating values or targets have been assigned'));assert.equal(mounted,null);}}}
route('#project/verizon/systems/forward~f-vas');assert(root.innerHTML.includes('Floor VAS'));assert(!root.innerHTML.includes('RATA / RADI'));route('#project/verizon/systems/__proto__');assert(root.innerHTML.includes('Smart receive'));route('#project/toString');assert(root.hidden);route('#toString');assert(root.hidden);route('#project/tesla/systems');assert(root.innerHTML.includes('The challenge'));
console.log('PASS: all 31 process inspectors, reverse/forward isolation, unknown-route fallback, 18 base chapters, 6 process-model routes, facility embed, model teardown, rules teardown, legacy deep links, invalid model fallback, home/case transitions and case-specific simulation backlinks.');
