# Revelyst facility and scenario lab

## What was combined

The user-supplied **Revelyst DC Flow Model (1).html** contributes detailed Three.js equipment, bay-level racks, relative CAD trace, moving loads, operators, conveyors and task-based flow. The portfolio contributes the project-owned case study, named equipment controls, route inspection, fault/hold experiments, source boundaries and a lightweight fallback. The original uploaded file is preserved.

The result is a custom JavaScript model with a Three.js view. It is not a FlexSim, Simio or AnyLogic file and has not been calibrated against facility observations. The supplied relative trace is reused; its scale, elevations, equipment footprints, dock allocation and routes have not been independently surveyed.

## Modes and inputs

Explore runs illustrative choreography and hides numerical performance measures. Reported equipment/location facts remain visible. Scenario lab requires all 28 form fields to be supplied and applied. Operating fields start blank; the 20-AMR fleet field starts with the reported count. Loading the optional illustrative preset only edits the draft; applying it starts a fresh seeded run.

Controls include unload/intervention rates, staffing and fleet quantities, pick and pack times, process demand, travel speed in model units, conveyor multiplier, pallet conversion quantities, replenishment frequency, trailer quantity, trailer exchange time, Lane 6 demand weight and seed. The preset retains the supplied model's demonstration values and is never labeled as current site performance. Playback speed changes wall-clock presentation, not model parameters.

The Basis panel lists major fixed assumptions: 12 outbound doors, 26 positions per door, four manual receiving positions, receiving buffers, approximately ten Level 3 pack stations (user estimate), two VAS stations, two High-volume customer process stations, six chargers, handling times, synthetic demand and inventory, charging behavior and route logic. These remain assumptions even after form inputs are replaced. No shift calendar is assumed.

Four Stretch robots are reported, but the trace only places three active unload positions. The original source's modeled lane mapping is retained: 1–6 retail, 7 exception/international/parcel, 8–9 parcel. Lane 7 receives no fabricated synthetic demand. The mapping itself still needs site verification.

The user clarified on 2026-10-15 that the tower has three levels: Levels 1 and 2 contain active picking, and Level 3 holds approximately ten pack positions beside the conveyor. The model now places racks and pickers only on the lower two levels, pack tables/operators and queues at the top level, and representative inline weighing and print-and-apply equipment on the shared downlane route. The active-level camera enables a tower-deck cutaway; the Level 3 camera restores the decks. Coordinates, heights, quantities of inline devices and the illustrated vertical transfers remain unverified. No dwell, measured weight, rejection logic or print verification is fabricated. Passage counters are route events, not equipment-quality KPIs. Generic Reserve and High-volume customer labels replace detailed reserve-range banners and the customer name.

## Reported facts and arithmetic

| Item | Basis |
| --- | --- |
| 20 AMRs / 4 Stretch fleet | User facility brief |
| 12,768 active pick locations | User facility brief |
| 43,300 reserve / 39,547 used / 3,753 empty | User facility brief |
| 91.3% reserve occupancy | 39,547 ÷ 43,300, rounded |
| 126 downlane positions | 9 × 14 |
| 1,064–1,666 active-location shortfall | 13,832–14,434 stated need less 12,768 |
| 14,568 locations with one N-Large aisle | 12,768 + 1,800 |

Rendered bay counts are representative and are not an enumeration of all reported inventory locations.

## Measures

| Measure | Definition / limit |
| --- | --- |
| Rates | Event count over trailing 60 simulated minutes; actual elapsed duration during the first hour |
| Inbound | Cartons unloaded, split between Stretch and manual unloading |
| Stretch unloading share | Accumulated robot time actively unloading divided by accumulated robot time |
| Putaway / replenishment | Completed pallet moves, not units or SKU transactions |
| Truck task occupancy | Assigned truck time / truck time; includes waiting and blocking |
| Truck travel / handling share | Travel or handling time / truck time; excludes holds and blocking |
| Locus picks | Completed associate pick stops; not order lines or each units |
| Mean completed wait | Mean of the most recent 200 completed stop waits; unfinished waits are excluded |
| Pack | Completed totes and currently queued totes at the approximately ten Level 3 stations; no real order identity |
| Weighing / print-and-apply | Load passages through representative inline process points, not measured weights or verified labels |
| Downlane occupancy | Full pallets plus one position when a pallet is being built, maximum 14 |
| Recirculation | Repeated arrival events; not unique affected cases |
| Outbound | Staged pallets, reserved positions, loaded pallets and dispatched trailers |

Comparisons use completed totals and ending queues. Deltas require identical duration and seed. One seed is not a confidence interval; changing a parameter may change random-number consumption, so identical seed alone does not establish statistically paired replications.

JSON exports contain the current report and captured baseline, applied parameters, seed, elapsed time, major fixed assumptions, facility facts, rates, totals, queues, lanes and actions. CSV exports contain current measures, rates, queues, lane/door occupancy, applied inputs and major fixed assumptions. Draft form changes never alter a current run's recorded provenance.

## Controls and experiments

1. Inspect the scene in Explore. Select equipment, follow it, show its route, or apply a hold.
2. Open Scenario lab. Supply all inputs, or explicitly load and review the illustrative preset.
3. Apply inputs. Start playback or run a 5–1,440 minute experiment.
4. Capture a baseline. Change an input or process/equipment hold and run the same duration and seed.
5. Compare and export. Changes are model behavior, not validated improvement claims.

Each experiment resets the scene and uses fixed 0.5-second steps. Process holds and individual equipment holds selected before running are preserved. Applying inputs restarts the model; a captured baseline remains available. The comparison does not automatically optimize staffing or identify a statistically supported bottleneck.

## Corrections to supplied logic

- Rendering no longer consumes operating random numbers or changes model state.
- High-volume customer completions wait for outbound space instead of disappearing.
- VAS pallets reserve outbound space once, after processing, rather than twice.
- Downlane pickups reserve available outbound space before assignment.
- Rack pickup/drop positions are reserved so concurrent tasks cannot claim the same slot.
- Newly emitted conveyor items start advancing on the next step, avoiding same-step double advancement.
- Manual receiving retains cartons when staging is full.
- Initial lane/outbound queues are empty to avoid counting phantom starting shipments.
- Pallet staging and loading maintain conservation checks.

## Validation and remaining gaps

`tests/lab.cjs` runs the actual engine and checks replay, pallet conservation, reservation limits, finite states, blocking/recovery and channel separation. `tests/lab-ui.cjs` loads the actual controller with real Three.js scene classes and a DOM/renderer harness; it checks blank inputs, explicit apply, reduced motion, reports, exports, draft provenance, controls and render/model separation. `scripts/export-lab-scene.cjs` optionally exports geometry for native GPU review. Native scene review is not browser rendering or interaction validation.

The environment had no supported browser-control skill; real-browser desktop/mobile, keyboard, screen-reader and performance testing remains outstanding. The fallback view preserves the previous lighter model.

Missing operational detail includes SKU/order identities, inventory balance by SKU, masterpack rules, top-40 slotting, missing dimensions, unslotted-wave locks, surveyed travel distances, physical conveyor accumulation, collision avoidance except at the demonstrated bridge, shift calendars, real equipment failure distributions and observed processing times. Those brief-level rules remain visible in the separate case-study Inputs & rules model; this task model does not claim to enforce them. Reliability currently demonstrates Stretch intervention and manually imposed holds, not validated MTBF/MTTR for the entire automation system.

Use the model for explaining flow and exploring explicit hypothetical scenarios. Decision use requires replacing assumptions, checking each interface and validating replicated runs against observations.

## Dependencies and rights

Three.js r128 and its matching OrbitControls are vendored in `dist/simulation/vendor/`; the Three.js MIT license is included. Geometry, drawings and the uploaded source were provided by the user; no new blanket license is granted for those assets.
