const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/motion.js'),'utf8');
function harness(reduced=false,saved=null){
 const events={},docEvents={},observers=[],frames=new Map(),draws=[];let next=0,mediaHandler;
 const canvas={dataset:{processPreview:'cobot'}},button={attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this[k]=f;}};
 const home={hidden:false,querySelectorAll:s=>s==='[data-process-preview]'?[canvas]:[]};
 const progress={style:{}},html={dataset:{},scrollHeight:2500};
 const document={hidden:false,documentElement:html,getElementById:id=>id==='portfolio-home'?home:button,querySelector:()=>progress,addEventListener:(k,f)=>docEvents[k]=f};
 class IO{constructor(fn){this.fn=fn;observers.push(this);}observe(){}unobserve(){}disconnect(){}}
 const window={innerHeight:500,scrollY:1000,IntersectionObserver:IO,matchMedia:()=>({matches:reduced,addEventListener:(k,f)=>mediaHandler=f}),PortfolioSim:{drawPreview:(...args)=>draws.push(args)},addEventListener:(k,f)=>events[k]=f};
 const c={window,document,IntersectionObserver:IO,sessionStorage:{getItem:()=>saved,setItem:(k,v)=>saved=v},requestAnimationFrame:f=>{frames.set(++next,f);return next;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(source,c);
 return{window,document,home,button,frames,draws,html,progress,events,docEvents,intersect(value){observers[0].fn([{target:canvas,isIntersecting:value}]);},step(t){const [id,f]=frames.entries().next().value;frames.delete(id);f(t);},media(value){mediaHandler({matches:value});}};
}
const a=harness();assert.equal(a.frames.size,0);a.intersect(true);assert.equal(a.frames.size,1);a.step(100);a.step(150);assert(a.draws.at(-1)[2]>0);assert.equal(a.progress.style.transform,'scaleX(0.5)');
a.button.click();assert.equal(a.frames.size,0);assert.equal(a.button.attrs['aria-pressed'],'true');a.button.click();assert.equal(a.frames.size,1);
a.intersect(false);assert.equal(a.frames.size,0);a.intersect(true);a.document.hidden=true;a.docEvents.visibilitychange();assert.equal(a.frames.size,0);a.document.hidden=false;a.docEvents.visibilitychange();assert.equal(a.frames.size,1);
a.home.hidden=true;a.events.hashchange();assert.equal(a.frames.size,1,'only the reading-progress update remains');a.step(200);assert.equal(a.frames.size,0);a.home.hidden=false;a.events.hashchange();assert.equal(a.frames.size,2,'one animation and one progress update');
const b=harness(true);b.intersect(true);assert.equal(b.frames.size,0);assert.equal(b.button.textContent,'Play page motion');b.button.click();assert.equal(b.frames.size,1);b.media(true);assert.equal(b.frames.size,0);
const saved=harness(false,'paused');saved.intersect(true);assert.equal(saved.frames.size,0);
console.log('PASS: homepage preview visibility, pause/resume, reduced motion, persisted preference, hidden-tab and case-route suspension, reading progress.');
