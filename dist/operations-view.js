'use strict';
(() => {
const D=window.PortfolioOperations;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const path=(slug,network,stage)=>`#project/${slug}/systems/${network}${stage?'~'+stage:''}`;
function render(slug,detail=''){
 const project=D[slug];if(!project)return '';
 const [requestedNetwork,requestedStage]=String(detail||'').split('~');
 const network=Object.hasOwn(project.networks,requestedNetwork)?requestedNetwork:Object.keys(project.networks)[0];
 const n=project.networks[network],stage=n.stages.find(s=>s.id===requestedStage)||n.stages[0];
 const list=(values,klass='')=>`<ul class="${klass}">${values.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
 return `<div class="operations-intro"><p class="eyebrow">END-TO-END SYSTEM DESIGN</p><h2 id="chapter-title" tabindex="-1">${slug==='verizon'?'Two operations. Different flow logic.':'One operation. Connected decisions.'}</h2><p>${slug==='verizon'?'A device-refurbishment network and an automated forward-logistics network share a case study, with their process rules and exceptions kept distinct.':'Receiving, storage, release, picking, packing, and dispatch form one connected system. Inspect the handoffs as well as the equipment.'}</p></div>
 ${project.brands?`<div class="brand-scope"><span>TRADE-IN BRANDS</span>${project.brands.map(b=>`<b>${esc(b)}</b>`).join('')}</div>`:''}
 <nav class="operations-switch" aria-label="Operation">${Object.entries(project.networks).map(([id,p])=>`<a href="${path(slug,id)}" ${network===id?'aria-current="page"':''}>${esc(p.title)}</a>`).join('')}</nav>
 <div class="operations-workspace"><section class="process-board" aria-label="Logical process areas"><div class="board-heading"><div><p class="eyebrow">LOGICAL PROCESS MAP</p><h3>${esc(n.title)}</h3></div><span class="map-status">DESCRIBED PROCESS</span></div><p class="board-description">${esc(n.subtitle)}</p><p class="map-instruction">Select an area to inspect its equipment, handoffs, open routing questions, and proposed measurements.</p>
 <div class="process-families">${n.groups.map(([label,ids])=>`<div class="process-family"><h4>${esc(label)}</h4><div>${ids.map(id=>{const s=n.stages.find(x=>x.id===id);return `<a class="process-area" href="${path(slug,network,id)}" ${stage.id===id?'aria-current="true"':''}><span>${esc(s.mode)}</span><strong>${esc(s.name)}</strong><b aria-hidden="true">↗</b></a>`;}).join('')}</div></div>`).join('')}</div>
 ${n.confirmedConnections.length?`<div class="confirmed-handoffs"><p class="eyebrow">EXPLICIT CONNECTIONS IN THE BRIEF</p>${n.confirmedConnections.map(c=>`<p><strong>${esc(n.stages.find(s=>s.id===c.from).name)} → ${esc(n.stages.find(s=>s.id===c.to).name)}</strong><span>${esc(c.condition)}</span></p>`).join('')}</div>`:''}
 <p class="routing-boundary">${esc(n.routingNote)}</p></section>
 <aside class="operation-inspector" aria-label="Selected process details"><p class="eyebrow">PROCESS INSPECTOR</p><h3 id="operation-detail" tabindex="-1">${esc(stage.name)}</h3><span class="operation-mode">${esc(stage.mode)}</span><section class="operation-fact"><h4>Confirmed from your description</h4><p>${esc(stage.confirmed)}</p></section><section><h4>Interface questions</h4>${list(stage.interfaceQuestions)}</section><section class="routing-questions"><h4>Routing & configuration to confirm</h4>${list(stage.openQuestions)}</section><section><h4>Measurements to capture</h4>${list(stage.measurementCandidates,'measurement-tags')}<p class="inspector-note">Proposed measurements. No operating values or targets have been assigned.</p></section></aside></div>
 <div class="systems-insights"><div class="insights-heading"><p class="eyebrow">ENGINEERING QUESTIONS</p><h3>Where the analysis becomes useful.</h3><p>These are questions to test against site evidence, not measured conclusions.</p></div><div class="insight-grid">${project.insights.map(([title,body,basis],i)=>`<article><span class="insight-number">0${i+1}</span><h4>${esc(title)}</h4><p>${esc(body)}</p><small>${esc(basis)}</small></article>`).join('')}</div></div>
 <details class="model-readiness"><summary>What is required before performance simulation?<span>Inputs & validation</span></summary><p>The current views explain process relationships. A predictive model needs verified routes, measured input distributions, and comparison with observed operation.</p>${list(D.requiredInputs)}<p class="readiness-note">Current specification: logical process model. Cycle times, capacities, resource counts, and route eligibility remain unset where the brief does not supply them. Source: ${esc(D.provenance[slug])}</p></details>`;
}
window.PortfolioSystems={render};
})();
