'use strict';
/* One project record owns its chapters and workstreams. Add evidence here as it becomes available. */
(() => {
const assets=window.PortfolioAssets||{facilityURL:'simulation/',layoutReference:'simulation/layout-reference.png',verizonURL:'verizon/'};
const projects = {
  revelyst: {
    index:'01', name:'Revelyst DC', organization:'DHL Supply Chain', period:'2025–present',
    title:'From dock to dispatch.',
    description:'A connected look at fulfillment, automation, and material flow across the Revelyst distribution center.',
    role:'Senior Industrial Engineer', place:'Illinois, USA',
    scope:'Retail LTL + eCommerce parcel', status:'Facility model · refining',
    summary:'At a user-reported facility scale of 1 million units per peak day, retail replenishment and eCommerce fulfillment share storage, replenishment, and automation. The engineering challenge is to keep those flows connected while managing SKU variability, location constraints, and equipment interventions.',
    contribution:'I lay out the end-to-end workflow from inbound dock receipt and robotic unloading through reserve storage, replenishment, active picking, VAS, packing, staging, and outbound dispatch. My scope connects dock operations and PO-specific outbound processes to vendor SLA requirements, alongside forward-pick slotting, facility-layout CAPEX execution, and robotic-unloading reliability.',
    contributionDetails:[
      ['Workflow & dock operations','Connect south-wall receiving to north-wall dispatch: trailer unloading, receiving buffers, reserve-to-active replenishment, Locus and tower picking, VAS, packing, and dock staging. Define handoffs, buffer needs, pedestrian / lift-truck separation, and exception paths across the workflow.'],
      ['Vendor SLA & PO-specific outbound','Translate vendor SLA and customer routing requirements into PO segregation, ship-to and wave grouping, staging assignments, and dispatch readiness. Coordinate retail LTL / FTL and parcel flows around release priorities, carrier cutoffs, and dock availability; specific contractual thresholds remain customer-dependent.'],
      ['Pre-dispatch quality & release','Build a release framework that checks the physical shipment against the PO and shipping record before loading. Separate unresolved discrepancies from ready-to-ship freight so exceptions have an owner and a clear release decision.']
    ],
    outboundChecks:[
      ['Order integrity','Reconcile PO, ship-to, SKU, carton / pallet quantity, and units against the released order; resolve shortages, overages, and wrong-item picks.'],
      ['Packaging & identification','Check packaging condition, pallet stability, required labels and barcode readability; compare weight with the applicable pack standard where one exists.'],
      ['Staging & load assignment','Verify PO segregation, assigned lane and dock, carrier / service, and trailer or load identity; prevent mixed-destination and wrong-carrier loading.'],
      ['Shipment records & release','Reconcile shipping documents and electronic shipment records where required; record audit disposition, close blocking exceptions, and authorize dispatch.']
    ],
    next:'The facility animation is the current focus. Layout and process refinements come first; throughput calibration will follow when the required operating inputs are available.',
    streams:['slotting','layout','stretch'], defaultModel:'facility',
    models:[['facility','Facility model'],['rules','Process & capacity'],['slotting','Slotting'],['layout','Layout'],['stretch','Stretch']],
    facts:[['1M units','Per peak day · facility throughput'],['12,768','Active pick locations'],['43,300','Reserve locations'],['20','Locus AMRs'],['4','Stretch fleet · 3 shown active']],
    metrics:[
      ['38% → 86%','Active-slot availability','+48 percentage points','slotting'],
      ['+35%','Pick rate','Reported layout project improvement','layout'],
      ['$1M','Layout CAPEX','Project budget · not a savings figure','layout'],
      ['In progress','Stretch field reliability','No final performance improvement claimed','stretch']
    ],
    metricNote:'These outcomes come from the existing portfolio. They are not outputs of the facility animation. The slotting result has not been revalidated against the current-state brief; measurement periods and supporting extracts can be added as evidence.',
    evidence:[{type:'Layout reference',title:'Annotated facility plan',description:'Supplied marked plan showing north-wall outbound, south-wall inbound, storage, the Locus area, pick tower, and VAS.',image:assets.layoutReference,alt:'Annotated Revelyst facility plan showing inbound south, outbound north, reserve and active storage, Locus, pick tower and VAS.'}, {type:'Model inputs',title:'Current-state facility brief',description:'Confirmed counts, business rules, conflicts, and missing operating inputs are carried into the process and capacity explorer.',chapter:'simulation/rules',label:'Inspect inputs & rules'}],
    evidenceNote:'Site photos, KPI extracts, and time-study records have not been added. The layout and supplied facility brief are the current references.',
    skillGroups:[['Outbound & dock operations',['Dock workflow design','Vendor SLA alignment','PO-specific fulfillment','Pre-dispatch audit design','Exception management']],['Material flow',['Forward-pick slotting','Demand forecasting','WMS data','Capacity planning']],['Layout & execution',['Facility layout','FlexSim','CAPEX & ROI','Traffic separation']],['Automation & reliability',['Stretch','Locus AMRs','Numina conveyance','Root cause analysis','Fault taxonomy']]],
  },
  verizon: {
    index:'02',name:'Verizon',organization:'DHL · Device remanufacturing',period:'2023–2025',
    title:'From trade-in to shipment.',
    description:'End-to-end device refurbishment, reverse logistics, and automated forward logistics across five device brands.',
    role:'Production Engineer',place:'Whiteland, Indiana',scope:'Reverse + forward logistics',status:'Two schematic facility views',
    summary:'Trade-in devices pass through receiving, cleaning and grading, functionality and RF testing, extended subsystem tests, repair, storage, quality audit, packaging, and outbound. A separate forward-logistics section integrates automated receiving, ASRS, conveyors, and packing, with floor VAS as the identified manual area.',
    contribution:'I investigated robot-to-cell handoff failures, ran DOE on sequencing and pick-and-place coordinates, and built a shared Python/C++ validation framework across device subsystems.',
    next:'Reverse and forward facility animations now show the supplied equipment scope. Their arrangement, AMR allocation and example device journeys are schematic. Both CAD files will establish the physical layout; verified routing and operating inputs will support later calibration.',
    streams:['cobot','npi'],defaultModel:'reverse',models:[['reverse','Reverse facility'],['forward','Forward facility'],['cobot','Cobot coordination'],['npi','NPI validation']],
    facts:[['≈60','AMRs · site fleet'],['14','Yaskawa cobots'],['6 + 6','ACS / AGS'],['15 + 10','RATA / RADI'],['ASRS + KNAPP','Storage & conveyance'],['Automated','Packaging · quantity unspecified']],
    metrics:[['32% → 86%','Coordination efficiency','+54 percentage points · not OEE','cobot'],['−25%','Test escapes','Reported validation framework outcome','npi'],['−15%','Procurement cost','Separate EBOM / MBOM alignment outcome','npi']],
    metricNote:'Reported outcomes are retained from the existing portfolio. The process illustrations explain the engineering sequence; they do not calculate these improvements. Baseline periods and supporting records have not been added.',
    evidence:[{type:'Operational brief · 14 Oct 2026',title:'Reverse & forward process inventory',description:'Confirmed equipment and process areas, explicit receiving fallback, unresolved routes, and proposed interface measurements.',chapter:'systems',label:'Inspect the system design'}],evidenceNote:'The 14 October 2026 operational description supplies the current reverse / forward process inventory. Facility drawings, photos, routing records, test logs, and KPI extracts have not been added.',
    skillGroups:[['Automation',['Yaskawa HC10','PLC logic review','Robot commissioning','Root cause analysis']],['Test engineering',['Python','C++','DOE','Cpk','R&S / Keysight']],['Production systems',['NPI validation','EBOM / MBOM alignment','Vendor coordination']]],
  },
  tesla: {
    index:'03',name:'Tesla',organization:'Tesla · Battery remanufacturing',period:'Jan–May 2023',
    title:'Tracing defects to the source.',
    description:'Fastening variation, end-of-line validation, and traceability on a Model S/X battery-pack remanufacturing line.',
    role:'Process Engineer Intern',place:'Buffalo, New York',scope:'Quality + reliability',status:'Process illustration available',
    summary:'End-of-line defects required a link back to the process that produced them. This case follows the investigation of fastening variation and the work to make production data traceable.',
    contribution:'I applied PFMEA, DOE, and 8D to the fastening investigation, supported SCADA / torque-controller / MES traceability, and created SQL inventory dashboards.',
    next:'The existing process illustration and reported results are collected here. Supporting records and a more detailed model can be added in a later case-study update.',
    streams:['tesla'],defaultModel:'tesla',models:[['tesla','Fastening & traceability']],
    facts:[['Model S/X','Battery-pack remanufacturing'],['Atlas Copco','Fastening system'],['SCADA / MES','Build traceability'],['PFMEA · DOE · 8D','Investigation methods']],
    metrics:[['−25%','Defects','Reported reduction from the original baseline','tesla'],['−20%','Downtime','Reported project outcome','tesla'],['+20%','Inventory accuracy','Reported inventory dashboard outcome','tesla']],
    metricNote:'Reported outcomes are retained from the existing portfolio and are independent of the illustrative process animation. The defect graphic uses an indexed baseline of 100 before and 75 after.',
    evidence:[],evidenceNote:'Site photos, torque traces, validation records, and KPI extracts have not been added. Current material is the project narrative and process illustration.',
    skillGroups:[['Quality & reliability',['PFMEA','DOE','8D','CAP / CAC analysis']],['Process traceability',['Atlas Copco fastening','SCADA','Torque controllers','MES']],['Production data',['SQL','Inventory dashboards']]],
  }
};
const streams=window.PortfolioWorkstreams;
const chapters=[['overview','Overview'],['simulation','Simulation'],['workstreams','Workstreams'],['metrics','Metrics'],['evidence','Photos & evidence'],['skills','Skills']];
const chaptersFor=slug=>['revelyst','verizon'].includes(slug)?[chapters[0],['systems','System design'],...chapters.slice(1)]:chapters;
const root=document.querySelector('#case-study'),home=document.querySelector('#portfolio-home');
const descriptionMeta=document.querySelector('meta[name="description"]');
const homeDescription='Thrinadh Pradeep Bodepu — engineering reliable automation, manufacturing systems, and material flow. Selected projects at DHL and Tesla.';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(slug,chapter='overview',detail='')=>'#project/'+slug+(chapter==='overview'?'':'/'+chapter)+(detail?'/'+detail:'');
let current=null,processModel=null,embedStop=null;
const legacy={slotting:['revelyst','workstreams','slotting'],layout:['revelyst','workstreams','layout'],stretch:['revelyst','workstreams','stretch'],cobot:['verizon','workstreams','cobot'],npi:['verizon','workstreams','npi'],tesla:['tesla','overview'],facility:['revelyst','simulation','rules']};
function heading(kicker,title,description=''){return `<div class="chapter-heading"><p class="eyebrow">${esc(kicker)}</p><h2 id="chapter-title" tabindex="-1">${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div>`;}
function selector(slug,chapter,options,selected,label){return `<nav class="chapter-selector" aria-label="${esc(label)}">${options.map(([id,name])=>`<a href="${url(slug,chapter,id)}" ${id===selected?'aria-current="page"':''}>${esc(name)}</a>`).join('')}</nav>`;}
function overviewSimulation(slug,p){
const facility=slug==='revelyst',verizon=slug==='verizon';
const source=facility?assets.facilityURL:(assets.verizonURL||'verizon/')+'#reverse';
const title=facility?'Explore the warehouse in 3D.':verizon?'Two facilities. One connected operation.':'Follow the pack through the process.';
const hint=facility?'Drag to orbit. Select a robot, inspect the pick tower, or try a conveyor hold.':verizon?'Switch facilities below. Select a cobot or AMR, follow a device, or introduce a process hold.':'Compare fastening variation with a controlled cycle. Pause, replay, or change the speed.';
const note=facility?'CAD-derived layout; equipment motion is illustrative. Operating inputs remain uncalibrated.':verizon?'Schematic layout pending CAD. Equipment counts are site figures; routes and motion are illustrative.':'Illustrative process sequence; reported improvements are separate from the animation.';
return `<section class="overview-simulator" aria-labelledby="overview-sim-title"><div class="overview-sim-head"><div><p class="eyebrow"><i class="motion-dot" aria-hidden="true"></i>${facility?'INTERACTIVE 3D FACILITY':verizon?'INTERACTIVE FACILITY SIMULATIONS':'INTERACTIVE PROCESS ILLUSTRATION'}</p><h3 id="overview-sim-title">${title}</h3><p>${hint}</p></div><div class="overview-sim-actions">${facility||verizon?`<a data-overview-fullscreen href="${esc(source)}" target="_blank" rel="noopener">Open full screen ↗</a>`:`<a href="${url(slug,'simulation')}">Open process chapter ↗</a>`}</div></div>
${verizon?'<div class="overview-views" role="group" aria-label="Verizon facility view"><button type="button" data-overview-view="reverse" aria-pressed="true" aria-controls="overview-facility">Reverse logistics</button><button type="button" data-overview-view="forward" aria-pressed="false" aria-controls="overview-facility">Forward logistics</button><span>≈60 AMRs sitewide · 14 Yaskawa cobots</span></div>':''}
${facility||verizon?`<iframe id="overview-facility" class="facility-frame" src="${esc(source)}" title="${esc(p.name)} ${verizon?'reverse logistics':'3D facility'} interactive simulation" allow="fullscreen"></iframe>`:window.PortfolioSim.markup('tesla')}
<div class="overview-sim-foot"><p>${note}</p><a href="${url(slug,'simulation')}" data-overview-chapter>${facility?'All models & scenario controls':verizon?'All facility & process views':'Read about the process'} ↗</a></div></section>`;
}
function bindOverview(slug){
if(slug==='tesla'){window.PortfolioSim.mountCase('tesla',root.querySelector('.process-simulation'));return;}
if(slug!=='verizon')return;
const frame=root.querySelector('#overview-facility'),full=root.querySelector('[data-overview-fullscreen]'),chapterLink=root.querySelector('[data-overview-chapter]');
const buttons=[...root.querySelectorAll('[data-overview-view]')];
buttons.forEach(button=>button.addEventListener('click',()=>{
 if(button.getAttribute('aria-pressed')==='true')return;
 const view=button.dataset.overviewView;
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const source=(assets.verizonURL||'verizon/')+'#'+view;
 frame.src=source;frame.title='Verizon '+view+' logistics interactive simulation';full.href=source;chapterLink.href=url(slug,'simulation',view);
}));
}
// Suspend embedded renderers while their canvas is outside the parent viewport.
function observeEmbed(){
const frame=root.querySelector('iframe.facility-frame');if(!frame||!window.IntersectionObserver)return;
let visible=true;
const send=()=>frame.contentWindow?.postMessage({type:'portfolio:visibility',visible},'*');
const observer=new window.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;send();},{threshold:0});
observer.observe(frame);frame.addEventListener('load',send);
embedStop=()=>{observer.disconnect();frame.removeEventListener('load',send);};
}
function overview(slug,p){return heading('EXPLORE THE OPERATION',p.title)+overviewSimulation(slug,p)+`
<div class="overview-story"><section><h3>The challenge</h3><p>${esc(p.summary)}</p></section><section><h3>My contribution</h3><p>${esc(p.contribution)}</p>${p.contributionDetails?`<div class="contribution-details">${p.contributionDetails.map(([title,body])=>`<h4>${esc(title)}</h4><p>${esc(body)}</p>`).join('')}</div>`:''}</section></div>
${p.outboundChecks?`<section class="measurement-note"><p class="eyebrow">OUTBOUND RELEASE FRAMEWORK</p><h3>Before product leaves the dock.</h3><p>Recommended audit checks for the outbound workflow. Specific implementation, sampling frequency, acceptance limits, and system enforcement require confirmation.</p><div class="metrics-grid">${p.outboundChecks.map(([title,body])=>`<article class="metric-card"><h4>${esc(title)}</h4><p>${esc(body)}</p></article>`).join('')}</div><p><strong>Outputs to track:</strong> PO-complete shipment rate, on-time dispatch against the agreed cutoff, audit first-pass rate, quantity / label discrepancies, and exception age. Definitions, reporting windows, and baselines are not yet supplied.</p><p><strong>Scale:</strong> 1M units per peak day is a user-reported facility throughput figure; it is not an individual improvement claim or a calibrated model output.</p></section>`:''}
<div class="project-facts ${slug==='verizon'?'equipment-facts':''}">${p.facts.map(([value,label])=>`<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')}</div>
${['revelyst','verizon'].includes(slug)?`<a class="system-entry" href="${url(slug,'systems')}"><div><span class="eyebrow">END-TO-END OPERATIONS</span><strong>${slug==='verizon'?'Explore reverse & forward logistics':'Inspect the connected fulfillment system'}</strong><p>Process areas, equipment interfaces, exception paths, and the questions behind a credible model.</p></div><span aria-hidden="true">↗</span></a>`:''}
<div class="overview-path"><div><p class="eyebrow">EXPLORE THE CASE</p><h3>See the system.<br>Then the engineering.</h3></div><a href="${url(slug,'simulation')}"><span>01 / SIMULATION</span><strong>${slug==='revelyst'?'Explore the facility in motion':slug==='verizon'?'Explore reverse & forward facilities':'Explore the process illustrations'}</strong><b aria-hidden="true">↗</b></a><a href="${url(slug,'workstreams')}"><span>02 / WORKSTREAMS</span><strong>${p.streams.length===1?'Follow the investigation':`Explore ${p.streams.length} connected workstreams`}</strong><b aria-hidden="true">↗</b></a></div>
<div class="case-development"><span class="status neutral">CASE DEVELOPMENT</span><p>${esc(p.next)}</p></div>`;}
function simulation(slug,p,detail){const selected=p.models.some(([id])=>id===detail)?detail:p.defaultModel;let body='';
if(slug==='verizon'&&['reverse','forward'].includes(selected))body=`<div class="simulation-frame-head"><div><strong>${selected==='reverse'?'Reverse logistics · refurbishment':'Forward logistics · automated fulfillment'}</strong><span>≈60 AMRs sitewide · 14 Yaskawa · 6 ACS / 6 AGS · 15 RATA / 10 RADI</span></div><a class="button secondary" href="${esc(assets.verizonURL||'verizon/')}#${selected}" target="_blank" rel="noopener">Open full screen ↗</a></div><iframe class="facility-frame" src="${esc(assets.verizonURL||'verizon/')}#${selected}" title="Verizon ${selected} schematic facility simulation" allow="fullscreen"></iframe><p class="chapter-note">CAD pending. Equipment counts come from your description; floor arrangement, the visual AMR split, robot assignments and device routes are illustrative. Both views use one site fleet of approximately 60 AMRs. No operating rates are inferred.</p>`;
else if(selected==='facility')body=`<div class="simulation-frame-head"><div><strong>Facility & scenario lab</strong><span>Detailed storage, equipment tasks and process measures · scenario comparison</span></div><a class="button secondary" href="${esc(assets.facilityURL)}" target="_blank" rel="noopener">Open full screen ↗</a></div><iframe class="facility-frame" src="${esc(assets.facilityURL)}" title="Revelyst interactive facility simulation: Stretch unloading, Locus picking, conveyors and outbound" allow="fullscreen"></iframe><p class="chapter-note">Explore the detailed CAD-derived reconstruction, inspect robots and lift trucks, and introduce process holds. The Scenario lab adds explicit inputs, live process measures, baseline comparisons and exports. Reported site facts are separated from hypothetical results; missing operating inputs remain blank until supplied or an illustrative preset is explicitly loaded.</p>`;
else if(selected==='rules')body='<div class="case-rules"><div id="revelyst-explorer"></div></div>';
else body=`<div class="model-context"><p class="eyebrow">${esc(streams[selected].category)}</p><h3>${esc(streams[selected].title)}</h3><a class="text-link" href="${url(slug,'workstreams',selected)}">Read the engineering workstream ↗</a></div>${window.PortfolioSim.markup(selected)}`;
return heading('SIMULATION',slug==='revelyst'?'Explore the operation.':'See the process work.',slug==='verizon'?'Explore reverse and forward logistics, inspect equipment, follow example devices, and test holds. Layouts remain schematic until the CAD files are supplied.':'Inspect the flow, handoffs, and process behavior within this case study.')+selector(slug,'simulation',p.models,selected,'Simulation views')+body;}
function workstreams(slug,p,detail){const selected=p.streams.includes(detail)?detail:p.streams[0],s=streams[selected];return heading('THE ENGINEERING',p.streams.length===1?'Inside the investigation.':'Connected workstreams.','Each workstream records the problem, my role, the approach, and the outcome.')+selector(slug,'workstreams',p.streams.map(id=>[id,streams[id].title]),selected,'Project workstreams')+`<article class="workstream-detail"><p class="eyebrow">${esc(s.category)}</p><h3>${esc(s.title)}</h3><p class="workstream-lead">${esc(s.lead)}</p><dl class="case-facts">${s.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><div class="case-story"><h4>The problem</h4><p>${esc(s.problem)}</p></div><div class="case-story"><h4>The approach</h4><p>${esc(s.approach)}</p></div><div class="case-story"><h4>${selected==='stretch'?'Current status':'The outcome'}</h4><p>${esc(s.outcome)}</p></div><div class="method-list">${s.methods.map(x=>`<span>${esc(x)}</span>`).join('')}</div><p class="case-note">${esc(s.note)}</p><div class="workstream-links"><a class="button primary" href="${url(slug,'simulation',selected)}">View process illustration</a><a class="text-link" href="${url(slug,'metrics')}">Project metrics ↗</a></div></article>`;}
function metrics(slug,p){return heading('RESULTS & MEASUREMENT','What changed.','Reported project outcomes, with scope and interpretation kept alongside the numbers.')+`<div class="metrics-grid">${p.metrics.map(([value,label,note,stream])=>`<article class="metric-card"><p class="eyebrow">${stream==='stretch'?'ONGOING STUDY':'REPORTED PROJECT FIGURE'}</p><strong>${esc(value)}</strong><h3>${esc(label)}</h3><p>${esc(note)}</p><a href="${url(slug,'workstreams',stream)}">${esc(streams[stream].title)} ↗</a></article>`).join('')}</div><p class="metric-source">${esc(p.metricNote)}</p>${slug==='revelyst'?'<div class="measurement-note"><h3>Facility counts and performance results</h3><p>The current-state storage and equipment counts are model inputs. They are kept in Overview and Process & capacity, separate from the improvement results here.</p></div>':''}`;}
function evidence(slug,p){return heading('PHOTOS & EVIDENCE','The material behind the story.','Reference drawings, photographs, records, and supporting analysis belong with the project they explain.')+`<div class="evidence-grid">${p.evidence.map(e=>`<article class="evidence-card">${e.image?`<a class="evidence-image" href="${esc(e.image)}" target="_blank" rel="noopener" aria-label="Open full-size annotated facility plan"><img src="${esc(e.image)}" alt="${esc(e.alt)}" loading="lazy"><span>View full-size plan ↗</span></a>`:''}<div class="evidence-copy"><p class="eyebrow">${esc(e.type)}</p><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>${e.chapter?`<a class="text-link" href="#project/${slug}/${e.chapter}">${esc(e.label)} ↗</a>`:''}</div></article>`).join('')}</div><div class="evidence-status"><span class="eyebrow">CURRENT EVIDENCE</span><p>${esc(p.evidenceNote)}</p></div>`;}
function skills(slug,p){return heading('METHODS & TOOLS','Skills in context.','The methods and systems used in this case, connected to the work they supported.')+`<div class="skills-grid">${p.skillGroups.map(([title,items])=>`<article><h3>${esc(title)}</h3><div class="method-list">${items.map(x=>`<span>${esc(x)}</span>`).join('')}</div></article>`).join('')}</div><a class="button secondary" href="${url(slug,'workstreams')}">Read the workstreams ↗</a>`;}
const panels={overview,systems:(slug,p,detail)=>window.PortfolioSystems.render(slug,detail),simulation,workstreams,metrics,evidence,skills};
function cleanup(){embedStop?.();embedStop=null;window.PortfolioSim?.destroyCase();processModel?.destroy();processModel=null;}
function render(){let hash=location.hash.slice(1);if(Object.hasOwn(legacy,hash)){hash=url(...legacy[hash]).slice(1);history.replaceState(null,'','#'+hash);}
const [prefix,slug,rawChapter,detail]=hash.split('/'),p=Object.hasOwn(projects,slug)?projects[slug]:null;
if(prefix!=='project'||!p){const leaving=!!current;cleanup();root.hidden=true;root.innerHTML='';home.hidden=false;document.body.classList.remove('viewing-case');document.title='Thrinadh Pradeep Bodepu — Engineering Portfolio';descriptionMeta.setAttribute('content',homeDescription);current=null;document.querySelector('.skip').setAttribute('href','#work');if(leaving)requestAnimationFrame(()=>{const destination=document.getElementById(hash)||document.getElementById('work');destination.scrollIntoView({block:'start'});destination.setAttribute('tabindex','-1');destination.focus({preventScroll:true});});return;}
const availableChapters=chaptersFor(slug);const chapter=availableChapters.some(([id])=>id===rawChapter)?rawChapter:'overview',previous=current;cleanup();home.hidden=true;root.hidden=false;document.body.classList.add('viewing-case');document.querySelector('.skip').setAttribute('href',url(slug,chapter,detail));
const ids=Object.keys(projects),next=ids[(ids.indexOf(slug)+1)%ids.length];
root.innerHTML=`<div class="case-shell"><div class="case-breadcrumb"><a href="#work">← All case studies</a><span>${esc(p.organization)} / ${p.index}</span></div><header class="project-header"><div><p class="eyebrow">CASE STUDY ${p.index} / ${esc(p.period)}</p><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p></div><dl class="project-context"><div><dt>MY ROLE</dt><dd>${esc(p.role)}</dd></div><div><dt>LOCATION</dt><dd>${esc(p.place)}</dd></div><div><dt>SCOPE</dt><dd>${esc(p.scope)}</dd></div><div><dt>MODEL STATUS</dt><dd>${esc(p.status)}</dd></div></dl></header><nav class="case-chapters" aria-label="${esc(p.name)} case-study chapters">${availableChapters.map(([id,label],i)=>`<a href="${url(slug,id)}" ${id===chapter?'aria-current="page"':''}><span>0${i+1}</span>${label}</a>`).join('')}</nav><section class="case-chapter" aria-labelledby="chapter-title">${panels[chapter](slug,p,detail)}</section><div class="case-bottom"><a href="#work">← All case studies</a><a href="${url(next)}">Next case: ${esc(projects[next].name)} ↗</a></div></div>`;
document.title=p.name+' / '+availableChapters.find(([id])=>id===chapter)[1]+' — Thrinadh Pradeep Bodepu';descriptionMeta.setAttribute('content',p.description);
if(chapter==='overview')bindOverview(slug);
observeEmbed();
if(chapter==='simulation'){if(slug==='revelyst'&&detail==='rules')processModel=window.RevelystModel?.mount();else{const selected=p.models.some(([id])=>id===detail)?detail:p.defaultModel;if(streams[selected])window.PortfolioSim.mountCase(selected,root.querySelector('.process-simulation'));}}
current={slug,chapter,detail};requestAnimationFrame(()=>{const sameProject=previous?.slug===slug;if(!sameProject)window.scrollTo({top:0,behavior:'instant'});else if(previous.chapter!==chapter)root.querySelector('.case-chapters').scrollIntoView({block:'start'});const processSelection=sameProject&&previous.chapter==='systems'&&chapter==='systems'&&previous.detail!==detail&&String(detail||'').includes('~');const focusTarget=root.querySelector(processSelection?'#operation-detail':'#chapter-title');if(processSelection&&window.innerWidth<761)focusTarget.scrollIntoView({block:'start'});focusTarget.focus({preventScroll:true});});
}
document.querySelector('.skip').addEventListener('click',event=>{if(!current)return;event.preventDefault();const target=root.querySelector('#chapter-title');target.scrollIntoView({block:'start'});target.focus({preventScroll:true});});
window.addEventListener('hashchange',render);render();
})();
