# Engineering portfolio blueprint

Version: 14 October 2026 · Working plan for a detailed, evidence-led portfolio.

## Positioning

Present the engineer who connects equipment, controls, data, people, and program delivery into an operating system. Warehouse technical program management is a target narrative, not a retroactive job title or a claim of ownership over every asset on the floor.

The differentiator is a traceable engineering argument: requirement → constraint → decision → integration → verification → operational result. Equipment lists and moving objects provide context; they do not establish the engineer's contribution or a performance improvement.

## Visitor experience

| Reader | First useful view | Deeper path |
| --- | --- | --- |
| Recruiter / hiring manager | Role, operating context, two or three substantiated results | Workstream summary and evidence |
| Engineering manager | End-to-end architecture, constraints, interface ownership | Failure handling, trade studies, validation and measured outcomes |
| Technical interviewer | One specific engineering problem | Inputs, decision record, alternatives, implementation, test evidence and limitations |
| GitHub reviewer | README, source structure, model assumptions | Reproducible checks, scenario definitions, data contract and known limits |

Keep the current graphite, white, and orange visual language. Use operation-specific diagrams, CAD-based views, equipment states, test sequences, and evidence. Reserve motion for explaining behavior. Avoid decorative concept imagery and numbers that appear to be live site telemetry.

Case chapters: Overview → System design → Simulation → Workstreams → Metrics → Photos & evidence → Skills. System design is available for Revelyst and Verizon. Tesla keeps its existing chapters until more system information is supplied. Every chapter and process inspector has a direct link, so an interviewer can be sent to the relevant issue.

Use progressive detail: a short case summary, an inspectable process map, and focused workstream narratives. Long technical detail belongs in those chapters and repository documentation, rather than one oversized landing page.

## Required depth for every substantial workstream

1. **Operating context:** product, customer/channel, boundary, before-state, demand mix, and the engineer's role.
2. **Problem statement:** observed failure or constraint, its operational consequence, and its measurement basis.
3. **Requirements:** performance, quality, integration, space, maintainability, and recovery needs; identify which are supplied and which remain unconfirmed.
4. **System boundary:** machines, manual work, buffers, material carriers, control owners, software interfaces, and exclusions.
5. **Baseline:** time window, population, raw source, formula, workload mix, and data limitations.
6. **Alternatives:** credible options, decision criteria, trade-offs, rejected approaches, and why the selected approach fit the constraint.
7. **Implementation:** the engineer's actual actions, vendor and cross-functional responsibilities, sequence, integration changes, and cutover dependencies.
8. **Verification:** test method, acceptance criteria, observed results, defects found, and retest evidence. Use FAT/SAT/UAT terminology only when supported by the actual project record.
9. **Results:** measured improvement, absolute and relative changes where meaningful, scope, uncertainty, and attribution limits.
10. **Operational handover:** training, SOP changes, maintenance, spare parts, alarms, recovery guidance, and performance monitoring where actually delivered.
11. **Lessons:** what failed, what changed, what would be done differently, and what remains unresolved.
12. **Evidence:** approved drawings, photos, annotated logs, test results, decision records, or clearly labeled synthetic examples.

A workstream should not be called complete simply because all headings have text. Each major claim needs evidence or an explicit qualification.

## Case boundaries

| Case | End-to-end scope | Currently documented personal work | Next depth |
| --- | --- | --- | --- |
| Revelyst | South inbound; receiving; dimensions; storage; replenishment; release; Locus each picking; Numina/tower; pack/VAS; retail staging; north outbound; IRA | Slotting, layout/CAPEX, ongoing Stretch RCA as retained in the original portfolio | Verify physical flow and controls, close lane-map conflicts, connect interventions and queues to measured outcomes |
| Verizon reverse | Smart/hospital receive; ACS/AGS; manual clean/grade; automated/manual functionality; RF/extended tests; repair; storage/Locus; quality; packaging; dispatch | Cobot coordination and NPI framework as retained in the original portfolio | Brand/model routing matrix, test coverage, rework returns, equipment handshakes, identity traceability and ownership evidence |
| Verizon forward | Automated receiving; ASRS and routed conveyors; storage; floor VAS; automated packing; outbound | Broader ownership not yet documented | Separate planned VAS from ASRS exceptions, map control interfaces, determine diversion/re-entry and outbound boundaries |
| Tesla | Battery-pack remanufacturing investigation and traceability | PFMEA/DOE/8D, torque investigation, SCADA/MES support, SQL inventory work | Baseline evidence, acceptance criteria, torque data, contribution boundaries and validation records |

The new Verizon process inventory describes the facility. It must not be read as proof that the portfolio owner designed or commissioned every station.

## Technical program-management story to develop

For each applicable project, collect the real artifacts behind these questions. These are interview and documentation prompts, not claims that the work has already been completed.

| Delivery phase | Engineering questions | Useful evidence |
| --- | --- | --- |
| Define | What business constraint justified the project? What did success mean? | Problem statement, baseline, requirements and boundary |
| Design | Which layout, automation, capacity, and process options were considered? | Trade study, layout revisions, interface list, resource assumptions |
| Integrate | Who owned each mechanical, controls, WMS/WCS, test, and data interface? | Responsibility matrix, interface contract, issue log, vendor actions |
| Qualify | What acceptance conditions were tested, including abnormal recovery? | FAT/SAT/UAT or actual equivalent, results, defect closure |
| Cut over | What dependencies, outage window, fallback, and rollback were required? | Cutover plan, readiness review, operator training |
| Ramp | What limited throughput after launch? How did the bottleneck move? | Ramp curve, queue history, defect Pareto, changes by revision |
| Sustain | How did the site maintain the gain? | SOPs, PM, monitoring, escalation, spares and handover records |

## Three different model products

| Model | What it can claim | Release condition |
| --- | --- | --- |
| Logical process explorer | Explains known process areas, explicit connections, open routes and interface questions | Source inventory and ambiguity labels verified |
| Illustrative facility animation | Shows equipment motion and example sequences on a referenced layout | Geometry, path meaning, control labels and non-predictive status are clear |
| Calibrated discrete-event model | Estimates performance for a defined scenario and uncertainty range | Measured inputs, validated routing, resource constraints, reproducible runs and comparison with observations |

Current status: Revelyst has a CAD-based illustrative facility animation and a rule/capacity explorer. Verizon has the logical operation explorer, schematic reverse / forward facility animations, and earlier simplified workstream animations. The new animation uses the supplied equipment counts; its placement, AMR split, robot assignments and routes are illustrative. Neither is a validated facility performance model. The existing portfolio result figures are independent of these animations.

## Simulation specification

### Entity and resource model

- Revelyst entities: carton, masterpack, pallet, tote, order line, order, wave, and shipment. Specify conversion rules and identity links; do not treat them as interchangeable units.
- Verizon reverse entities: device with stable synthetic ID, brand/model, receipt status, grade, recipe/version, test history, repair history, inventory state, and shipment association. Distinguish the device from its tray, tote, and carton.
- Verizon forward entities: actual handling unit still to be confirmed, plus order, storage task, retrieval task, VAS task, pack and shipment.
- Resources: the actual station counts, robots, operators, chambers, conveyors, ASRS interfaces, maintenance resources and shifts. Unspecified counts remain null.
- Machine state proposal: idle, loading, processing, unloading, blocked, starved, faulted, awaiting intervention, and recovering. Validate each state and transition against actual equipment; these are not asserted site tag names.

### Scheduling and controls

Specify queue capacity, priority, eligibility, recipe selection, batching, resource acquisition/release, downstream readiness, timeouts, retry limits, and recovery ownership. For every handoff, document identity, request, acknowledgment, completion, failure, timeout, and reconciliation semantics. Do not assume a generic PLC protocol is the site's implementation.

### Performance inputs

Arrival profiles by shift, workload mix, route matrix, cycle-time distributions, station counts, calendars, travel distances, conveyor/ASRS limits, buffers, failure/intervention records, repair distributions, release policy and carrier cutoffs. Unknown values must stay null. Synthetic demonstration values, if later requested, belong in a separate named scenario with explicit provenance.

### Verification and validation

- Conservation: every entity has one valid location/state; no duplicates or unexplained disappearance.
- Resource ownership: a chamber, cell or operator cannot process two incompatible jobs simultaneously.
- Routing: eligible and ineligible brand/model combinations obey the approved matrix.
- Hold behavior: full downstream buffers, failed equipment and missing acknowledgments produce the specified blocking behavior.
- Recovery: repair, manual fallback, and exception resolution return to an allowed state without double counting.
- Determinism: same inputs and random seed reproduce the event trace.
- Calibration: compare relevant state occupancy, queue length, output, lead time and failure mix with an observed baseline.
- Experiment design: use multiple replications, an explicit run horizon, and a justified warm-up or initial state where applicable. Report variation, not only one visually attractive run.

No numeric tolerance, run length, warm-up or confidence claim is assigned before the validation dataset and study objective are agreed.

## Metrics and evidence contract

Each metric must retain value, unit, numerator, denominator, population, baseline and comparison windows, source, scope, owner, target if supplied, uncertainty and verification status. A missing denominator or measurement window is a gap, not a field to fill from memory.

| Measure | Proposed definition to confirm | Common error to avoid |
| --- | --- | --- |
| Throughput | Unique accepted completions per defined operating interval | Counting retries or moves as finished units |
| First-pass yield | Units passing the defined test sequence on first attempt / eligible units attempting it | Combining first-pass and eventual pass |
| Retest load | Additional test visits after the first / first test visits, with window and population defined | Counting retests as new inbound demand |
| Receipt-to-ship time | Ship-complete timestamp minus receive-complete timestamp for matched units | Mixing unmatched cohorts or open WIP with completed-unit percentiles |
| Queue age | Current time minus queue-entry time, by state and process | Reporting only average age when old exceptions dominate risk |
| Autonomous completion | Eligible jobs completed without intervention / eligible jobs attempted | Excluding difficult jobs without stating eligibility |
| Coordination efficiency | Preserve the original reported metric until its exact formula is supplied | Renaming it OEE or inferring its denominator |
| Pick rate | Accepted picks / defined time basis, separated by mix and method | Comparing different order profiles without qualification |
| Active-slot availability | Eligible demanded SKUs present in active at release / demanded eligible SKUs, if this matches the actual calculation | Treating a SKU availability ratio as inventory fill rate |
| OTD | Define the eligible shipment population, required cutoff, and completion event | Treating production output and dispatch timeliness as the same result |

Reported portfolio outcomes currently remain reported claims. A simulation must never be used to retroactively validate them.

## UX and visual quality gates

- A reader can find role, problem and result before entering technical detail.
- Each case owns its diagrams, model, evidence, metrics and skills; no unrelated facility animation on the intro.
- Every simulation shows its maturity and what the numbers represent.
- Selected equipment/process state is readable in text, not color alone.
- Keyboard navigation, visible focus, reduced-motion support and pause controls are checked in a real browser before public release.
- Test the actual responsive experience at phone, tablet and desktop widths, including nested simulation scrolling, sticky navigation and inspect panels.
- Avoid duplicate terminology across chapters; use a small glossary for confirmed acronyms, leave PUCD/CDWRF and site-specific expansions unresolved until supplied.
- Load large CAD/model assets only when the simulation is opened; retain semantic content for readers who do not use animation.
- Review contrast, performance and accessibility using measured browser results. No audit score or conformance claim is made without the audit.
- Case-level social previews and stable static detail URLs are a later release enhancement; the current hash URLs are directly navigable but are not independent server-rendered metadata pages.

## Delivery sequence and acceptance

| Phase | Deliverable | Acceptance / dependency |
| --- | --- | --- |
| 0 · This revision | Verizon reverse/forward inventory; Revelyst system context; inspectable process areas; this blueprint; portable source package | Equipment and process descriptions reflect the supplied brief; open routes and unset inputs are explicit |
| 1 · Revelyst flow fidelity | Corrected layout, tower levels/connectivity, VAS, Locus routes, inbound cells, lane destinations and failure recovery | User-supplied corrections incorporated and route/equipment checks pass |
| 2 · Revelyst engineering evidence | Deep slotting, layout/CAPEX and Stretch case records with metric provenance | Personal actions, decision records and outcome definitions are supported or marked open |
| 3 · Verizon route specification | Reverse and forward route matrices, physical layout, test coverage, identities and re-entry rules | Mandatory, bypass, optional and rework paths are explicit for each product family |
| 4 · Verizon interactive facility model | Facility → room → cell → device drill-down, queues and handoff states | Approved logical rules and geometry implemented; illustrative/predictive boundary visible |
| 5 · Performance experiments | Measured baseline and scenario comparisons | Inputs populated from evidence; model validated; replications and uncertainty reported |
| 6 · Remaining case depth | Tesla and later projects adopt the same evidence structure | No unsupported results or duplicated generic story |
| 7 · GitHub/public release | Reviewed source, README, docs, tests, release assets, real-browser QA and publication | Public asset scope checked; missing proof qualified; GitHub repository and release action selected by the owner |

## First information needed

For the next Revelyst iteration: the specific layout/flow corrections still desired, especially conveyor/tower paths and lane destinations. For Verizon specification: a rough floor plan; mandatory vs fallback routes; ACS/AGS relationship; RF/extended test eligibility; repair return points; ASRS/Locus positions; planned VAS vs recovery; and what the engineer personally owned. A marked sketch and representative device journeys can resolve more than a large unstructured equipment list.

## Reference sources

The facility facts come from the user's brief and project records, not vendor marketing pages. Technical publishing and accessibility references were checked on 14 October 2026:

- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub static deployment example: https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically
- W3C WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/

These references inform the implementation and planned checks; they do not certify this portfolio's accessibility or validate site operating claims.
