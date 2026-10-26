# Verizon reverse and forward animation

Revision: 14 October 2026. This is an illustrative facility/process animation, not a calibrated performance model.

## Reported equipment and rendered interpretation

| Equipment | User-supplied quantity | Scene treatment |
| --- | --- | --- |
| AMRs | Approximately 60 sitewide | 60 representative agents; 40 reverse / 20 forward is an explicitly illustrative visual split |
| Yaskawa cobots | 14 | 14 animated arms on a common schematic transfer row; actual station assignments unknown |
| ACS | 6 | Six labeled cleaning units |
| AGS | 6 | Six labeled grading units |
| RATA | 15 | Fifteen labeled functionality units |
| RADI | 10 | Ten labeled functionality units |
| ASRS | Not supplied | Representative reverse and forward rack / shuttle areas; no installed-quantity claim |
| KNAPP conveyors | Not supplied | Schematic conveyor spines and branch connections |
| RF / extended testers | Not supplied | R&S, Keysight, PUCD/CDWRF, Radiant, peak-temperature and Head Acoustics areas represented |
| Automated packaging | Not supplied | Representative packing shapes and carton movement, not machine counts |

## Layout boundary

The operations appear side by side for exploration. Their adjacency, orientations, distances, equipment positions and connection geometry are not actual facility claims. Both CAD files are still pending. The shared scene does not imply a known common physical footprint.

AMR carrier motion is representative. The 40/20 split is visual allocation, not a documented deployment. It is kept separate from `inventory.amrs.allocation`, which remains null. Arm assignment is also null in the source specification. Rack bays, manual benches, queue limits and station concurrency in the animation are visual modeling choices, not inferred operating inputs.

## Example journeys

- **Automated flow:** example smart receive → ACS → AGS → one functionality bank → RF → extended tests → storage → quality → packaging → dispatch.
- **Manual fallback / floor VAS:** reverse follows smart receive → hospital → manual clean/grade → manual functionality → RF and downstream processing; forward illustrates a VAS diversion.
- **Repair & RF retest:** reverse includes one illustrative repair return to RF; forward continues its automated example route.

Only the smart-receive failure diversion to hospital is confirmed. The other route details are examples pending route matrices. Brand selection controls demonstration labels, not established eligibility or test recipes. Extended testing is displayed as a process area; no mandatory series order of its subsystem tests is asserted.

## Controls and behavior

- Both-operations, reverse, forward and equipment-family camera presets.
- Pan, zoom, fit, depth and AMR-path overlays; keyboard alternatives on the canvas.
- Equipment / process selector, close-up, locate, follow and device route trace.
- Pause, restart, playback speed, guided tour and reduced-motion startup.
- Conveyor, RF, ASRS and packaging holds. Queue space is reserved when a device moves to a destination; downstream saturation blocks upstream release. Clearing a hold resumes the illustrative flow.
- Scene device states and events are labeled as demonstration data. They are not live site telemetry, throughput or improvement KPIs.

## Source and replacement path

- `dist/verizon/model.js`: inventory, stage rectangles/ports, explicit example routes, presentation timing, queues and resource behavior.
- `dist/verizon/view.js`: schematic equipment rendering, animated belts and arms, camera, hit selection and close-ups.
- `dist/verizon/app.js`: controls, inspection, camera interaction and playback.
- `dist/verizon/index.html` and `style.css`: full-page interface, linked from the project's Simulation chapter.

When CAD is supplied, replace stage rectangles, machine footprints, routes, rack geometry and camera extents from a verified plan. Confirm handling units, conveyor topology, robot allocation, station assignments, failure returns and test eligibility before using the routes as a current-state model. Performance prediction additionally needs measured distributions, actual capacities and validation traces.

## Checks completed

Dependency-free checks cover the supplied equipment quantities, 60 AMRs and 14 arms, deterministic motion, unique device IDs, arrival/completion conservation, bounded destination queues, three journey profiles, four hold/recovery paths, and actual UI handlers in a DOM/canvas harness. Native canvas renders were inspected for scene composition and label interference. These checks do not substitute for real-browser responsive, keyboard or accessibility QA.
