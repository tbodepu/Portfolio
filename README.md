# Thrinadh Pradeep Bodepu — Engineering Portfolio

An engineering portfolio organized around complete operations and the workstreams within them: Revelyst fulfillment, Verizon device refurbishment / reverse and forward logistics, and Tesla battery remanufacturing.

## What is implemented

- Project-owned overview, simulation, workstreams, metrics, evidence and skills chapters.
- Revelyst and Verizon system-design chapters with process inspectors, equipment facts, interface questions, routing gaps and proposed measurements.
- Revelyst detailed Three.js facility and task model with bay-level racks, moving loads, equipment holds, cameras, named process measures and seeded scenario comparisons. Operational inputs start blank; the supplied model preset is explicitly illustrative. A lightweight renderer remains available.
- Verizon schematic reverse and forward facility views with 60 representative AMRs, 14 Yaskawa arms, 6 ACS, 6 AGS, 15 RATA and 10 RADI, example device journeys and four hold/recovery scenarios.
- Earlier illustrative workstream animations for cobot coordination, test validation, slotting, layout, reliability and fastening.
- A traceable operation specification with unknown rates and capacities left unset.

**Model boundary:** animation is not calibrated performance prediction. Existing portfolio improvement figures are reported project claims, not model outputs. Verizon's new process inventory does not establish personal ownership of every facility asset.

## Explore

| Route | Content |
| --- | --- |
| `/#project/revelyst` | Revelyst case study |
| `/#project/revelyst/systems` | Fulfillment interfaces and constraints |
| `/#project/revelyst/simulation` | Embedded facility and scenario lab |
| `/#project/verizon/simulation/reverse` | Reverse facility animation |
| `/#project/verizon/simulation/forward` | Forward facility animation |
| `/#project/verizon/systems/reverse` | Trade-in refurbishment operation |
| `/#project/verizon/systems/forward` | Automated forward logistics |
| `/#project/verizon/systems/reverse~rf` | RF process inspector |
| `/#project/tesla` | Battery remanufacturing case |

The hash routes also work below a repository subpath on GitHub Pages. They are client-side chapters; they do not yet have independent server-rendered social-preview metadata.

## Run locally

The site is buildless HTML, CSS and JavaScript. Node.js 24 is used for repository checks; the website itself has no package-install step.

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000` in a browser. Run checks with:

```sh
node scripts/check.mjs
```

Checks cover syntax, content contracts, routing, simulation lifecycle, local assets and key model invariants. They do not replace visual, keyboard, screen-reader, touch, or performance checks in a real browser.

## Source map

- `dist/index.html`, `styles.css`, `app.js`: portfolio home and shared behavior.
- `dist/case-data.js`: existing workstream narratives and reported outcomes.
- `dist/case-studies.js`, `case-studies.css`: project records and chapter routing.
- `dist/operations-data.js`: sourced operation inventory, open questions, measurement candidates and null operating inputs.
- `dist/operations-view.js`, `operations.css`: system-design explorer.
- `dist/verizon/`: schematic reverse / forward facility animation. See `docs/verizon-animation.md` for exact model boundaries and CAD replacement steps.
- `dist/simulation/`: Revelyst facility animation and referenced geometry.
- `dist/facility-data.js`, `revelyst.js`: process rules and capacity arithmetic.
- `docs/portfolio-blueprint.md`: scope, UX, evidence standard, simulation specification and delivery order.
- `docs/operations-spec.json`: machine-readable operation inventory, matching `operations-data.js`.
- `docs/verizon-routing-worksheet.csv`: unresolved route and eligibility fields to complete.
- `tests/`: dependency-free checks; `scripts/check.mjs` is their entry point.

## GitHub publication

A manually triggered GitHub Pages workflow is included at `.github/workflows/pages.yml`. It checks the repository and uploads **only `dist/`** as the site artifact. It does not run on ordinary pushes. No GitHub repository has been created or published by this update.

When ready: create/select the intended repository, push the source package, set Settings → Pages → Source to GitHub Actions, then run the Publish portfolio workflow. The workflow uses the official Pages actions and environment. Site-relative assets and return links support a project repository path.

The export excludes Git history, local working state and Sites identity. Source drawings and annotated evidence remain in `dist/`; decide the intended public asset scope before public release. Raw device identifiers, operational extracts and private credentials do not belong in committed demonstration datasets. Keep synthetic examples clearly labeled.

## Content and evidence practice

- Separate facility context from personal ownership.
- Separate confirmed process presence from validated route connectivity.
- Separate reported outcomes from demonstrated evidence and model outputs.
- Attach source, population, time window and formula to each measured KPI.
- Keep unknown inputs null; never backfill them with hidden industry defaults.
- Preserve original source attribution and permissions for drawings or third-party material. No blanket open-source license is assigned to the supplied facility assets.

## Current verification boundary

Automated static and runtime-harness checks are available. This editing environment has no supported browser-control skill, so no new visual-browser, accessibility or performance score is claimed. Real-browser desktop/mobile and keyboard verification remains a public-release gate.

## Homepage motion and case-study entry points

- Each project opens with its model in the Overview: Revelyst's 3D facility, Verizon's reverse/forward views, or Tesla's interactive process sequence. The Simulation chapter retains the remaining views and workstream models.
- Homepage previews reuse the existing Stretch, cobot and battery-process renderers. They are illustrative sequences, not telemetry or measured throughput. The preview cards lead directly to their case studies.
- Page motion includes staged introductions, subtle section reveals, animated process previews and a reading-progress bar. The visible pause control and reduced-motion preference govern homepage animation; individual models retain their own controls.
- Homepage previews pause off screen, on case-study routes and in hidden tabs. Embedded facility renderers receive visibility updates from their containing page. Verizon's view switch updates the existing facility camera without restarting the model.
- `tests/motion.cjs`, `tests/navigation.cjs` and the model UI harnesses cover motion preferences, overview embeds, view switching, model teardown and off-screen suspension. They do not substitute for browser layout tests.

## References

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically
- https://www.w3.org/WAI/WCAG22/quickref/

## Revelyst facility and scenario lab

`dist/simulation/index.html` now loads `lab.js` / `lab.css`, based on the detailed user-supplied Claude model and the portfolio controls. Three.js r128 and OrbitControls are vendored locally; their MIT license is included. No runtime CDN dependency is required.

- **Explore:** three-level tower with two active-pick levels, approximately ten Level 3 pack stations, weighing and print-and-apply on the common outbound route; detailed animated facility, equipment inspection, individual/fleet holds, bridge blockage, conveyor hold, Lane 6 divert hold, follow cameras, guided tour, route overlay and fitted whole/plan views. Performance values are suppressed.
- **Scenario lab:** 28 explicit inputs, reproducible seed, fixed 0.5-second steps, elapsed-time experiments, baseline comparison and JSON/CSV export. A deliberately labeled source preset is optional.
- **Basis:** reported facility figures, derived capacity arithmetic, geometric limits and major fixed assumptions. Structural assumptions still apply even when operating inputs are replaced.
- **Lightweight view:** `simulation/walkthrough.html` preserves the previous custom WebGL/Canvas renderer and presentation controls; it is also the no-WebGL fallback.

See [the model specification](docs/revelyst-scenario-lab.md) for metric definitions, validation and limitations. This is a custom illustrative process model, not a native FlexSim project or a calibrated digital twin.
