/* Lightweight homepage motion. Process previews share the case-study renderers. */
(() => {
  'use strict';
  const home=document.getElementById('portfolio-home');
  const toggle=document.getElementById('page-motion');
  const progress=document.querySelector('.reading-progress');
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=preference.matches;
  try { if(sessionStorage.getItem('portfolio-motion')==='paused')paused=true; } catch (_) {}
  const previews=[...home.querySelectorAll('[data-process-preview]')].map((canvas,i)=>({canvas,id:canvas.dataset.processPreview,t:i*1.7,visible:false}));
  let frame=0,last=null,paintAt=0,scrollPending=false;
  const revealTargets=[...home.querySelectorAll('.section-heading,.case-cover,.career-item,.toolkit-grid article,.build-list article,.publication-column article')];
  let revealObserver=null;

  function syncMotion(){
    document.documentElement.dataset.pageMotion=paused?'paused':'playing';
    toggle.textContent=paused?'Play page motion':'Pause page motion';
    toggle.setAttribute('aria-pressed',String(paused));
    if(paused){revealTargets.forEach(el=>el.classList.remove('reveal-wait'));revealObserver?.disconnect();}
    last=null;schedule();
  }
  function draw(p){window.PortfolioSim.drawPreview(p.canvas,p.id,p.t);}
  function canAnimate(){return !paused&&!document.hidden&&!home.hidden&&previews.some(p=>p.visible);}
  function schedule(){if(canAnimate()&&!frame)frame=requestAnimationFrame(tick);else if(!canAnimate()&&frame){cancelAnimationFrame(frame);frame=0;last=null;}}
  function tick(now){
    frame=0;if(!canAnimate()){last=null;return;}
    const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;
    for(const p of previews)if(p.visible)p.t+=dt;
    if(now-paintAt>=32){previews.filter(p=>p.visible).forEach(draw);paintAt=now;}
    frame=requestAnimationFrame(tick);
  }
  if(window.IntersectionObserver){
    const previewObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){const p=previews.find(p=>p.canvas===entry.target);if(p){p.visible=entry.isIntersecting;if(p.visible)draw(p);}}
      last=null;schedule();
    },{threshold:.05});
    previews.forEach(p=>previewObserver.observe(p.canvas));
    if(!paused){
      revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('reveal-wait');revealObserver.unobserve(e.target);}}),{threshold:.08});
      revealTargets.forEach(el=>{if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('reveal-wait');revealObserver.observe(el);}});
    }
  } else previews.forEach(p=>{p.visible=true;});
  function updateProgress(){
    scrollPending=false;
    const span=document.documentElement.scrollHeight-window.innerHeight;
    progress.style.transform=`scaleX(${span>0?Math.min(1,Math.max(0,window.scrollY/span)):0})`;
  }
  function scroll(){if(!scrollPending){scrollPending=true;requestAnimationFrame(updateProgress);}}
  toggle.addEventListener('click',()=>{paused=!paused;try{sessionStorage.setItem('portfolio-motion',paused?'paused':'playing');}catch(_){}syncMotion();});
  preference.addEventListener('change',e=>{paused=e.matches;syncMotion();});
  document.addEventListener('visibilitychange',()=>{last=null;schedule();});
  window.addEventListener('hashchange',()=>{last=null;schedule();scroll();});
  window.addEventListener('scroll',scroll,{passive:true});
  window.addEventListener('resize',scroll,{passive:true});
  previews.forEach(draw);syncMotion();updateProgress();
})();
