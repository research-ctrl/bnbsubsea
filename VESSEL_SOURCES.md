# Vessel and site sources

Updated 12 October 2026 (integration pass; review fixes the same day). Since the 12 October scope change the website presents **Lourdes only**: its specifications and design, our shipyard at Fomar, Shiroda, Goa, where Lourdes will be built, and its route of operation. Every claim on the site is tagged as one of:

- **Verified**: taken from a supplied drawing or brief and checked against it.
- **Illustration**: a design visualisation, schematic or illustrative map. The site labels it as such.
- **Needs input**: needs owner or engineering confirmation. Recorded in `BNB_Website/SOURCE_CONFLICTS.md`.

Supplied references live in `BNB_Website/references_supplied/` (read-only). Nothing unsourced is published.

## 1. Lourdes (Ro-Ro / landing craft)

**Verified: general arrangement.** Nirmon general arrangement, Rev 0, 07.10.2026 (A1, 1:90). This governs all Lourdes particulars. The site cites it without a drawing number: the title block reads DRAWING NO NI564-101 (PROJECT NO NI564), while the supplied file name and PDF metadata say nd664-101 (SOURCE_CONFLICTS INT-8). File: `references_supplied/Nirmon_GA_ND664-101_2026-10-07.pdf`.

| Item | Value used on the site | Basis |
|---|---|---|
| Hull length overall | 51.00 m | GA |
| Length overall, with ramp | 52.68 m | GA |
| Breadth / depth / draft | 12.50 m / 4.00 m / 2.70 m | GA |
| Nominal capacity | 24 TEU: five bays of four 20 ft units on deck, four more on the aft bay | GA ("24TEU LCT") |
| Maximum loading capacity | 800 t | GA |
| Main engines | 2 × 600 BHP | GA |
| Speed | approx. 10 knots | GA |
| Hull design basis | sea state 5 | GA |
| Flag / class | Malta / Bureau Veritas | GA |
| Build yard | BNBSBD shipyard, Fomar, Shiroda, Goa | User instruction, 12 Oct 2026 |
| Status | To be built at our shipyard in Fomar, Shiroda | User instruction, 12 Oct 2026 (SOURCE_CONFLICTS WEB-1) |

**Not published:** crew count. The GA shows 11; earlier public particulars said 9 (SOURCE_CONFLICTS #2).

**Midship section (informs structure only, never shown).** Midship ND664-401, Rev 0, 09.05.2026, is used only as the basis for the internal structure in the explanatory animation: web frames at 1.5 m, longitudinal bulkheads at ±3.0 m, pillars, tank and void layout. **The midship drawing is not published, is not displayed anywhere on the site, and no midship image file exists in `public/`.** Its title block (55.00 m LOA, closed ramp) is superseded by the GA (SOURCE_CONFLICTS #1).

**Published drawings (GA crops only).**

- Outboard profile: `public/images/lourdes-ga-profile.webp` (enlargement: `lourdes-profile-latest.png`).
- Main deck plan: `public/images/lourdes-ga-deck.webp` (enlargement: `lourdes-deck-latest.png`).

Both are cropped from the 07.10.2026 GA. No title block is published.

**Design visualisations (not drawings).**

- Hero: `public/images/lourdes-poster-wide-{1280,1920,2560}.webp` (21:9, vessel in the right half) and, for portrait screens, `lourdes-poster-portrait-{720,1080}.webp`, rendered from our own Blender model of the GA in the same light as the scroll story (`blender/lourdes/scripts/lourdes_poster.py`). `lourdes-poster-1600/-960.webp` are a 16:9 crop of the wide render (story poster before the frames load, stills fallback). Captioned "Design visualisation". `assets.lourdesPoster` in `lib/site-content.ts` is on; switching it off falls back to the user-supplied earlier illustration (`lourdes-hero-1600/-960.webp`, from `references_supplied/Lourdes_Provided_Render.png`).
- The interactive 3D model (`/models/lourdes.glb`) and the scroll story (`/sequences/lourdes/`, 360 frames, chapters arrival 1–69, roro-access 70–130, inside 131–230, systems 231–299, reassembly 300–360) come from our own Blender build of the GA. The 3D viewer's loading and no-WebGL image is a still of the same model (`lourdes-3d-still-1600/-960.webp`, captured from the viewer). Neither shows the drone docks (checked: no dock nodes in the GLB, none in the story file); the story ends on the complete vessel. Both fall back to the poster or chapter stills when a file is missing, and the story shows stills under reduced motion, save-data or slow connections.
- The web GLB is the Blender export with the builder metadata (glTF `extras`) removed by `scripts/strip-glb-extras.py`; geometry and names are unchanged. The viewer hides the translucent tank volumes (`SYS_TANKS`), which are for the cutaway story only.

**Class, cyber and beach-landing wording.**

- Bureau Veritas: "to be built to BV class" and "Bureau Veritas classification" only. Not described as built or certified.
- Cyber resilience: "notation in scope", "not yet certified". No certificate is implied.
- Beach landing: the capability is kept as stated in the brief ("designed for beach landing operations, at suitable, permitted beaches, within the operating limits"). The GA and midship text say nothing about a strengthened bottom, so that mechanism is not claimed. **Needs input:** engineering confirmation of the beaching arrangement and limits (SOURCE_CONFLICTS #11).

**Paint.** The GA gives no livery. The renders use the BNB palette and are labelled design visualisations. **Needs input:** owner livery decision (SOURCE_CONFLICTS #8).

## 2. Our shipyard (Fomar, Shiroda, Goa)

**Source.** `references_supplied/BNBSBD_Shipyard_Fomar_Shiroda_annotated_plan.pdf`, a printed satellite view with handwritten annotations. The satellite imagery is third-party. The site plan is an original schematic drawn from the annotated layout; the imagery itself is not reproduced; the renders are our own illustrations.

| Item | Value used on the site | Basis |
|---|---|---|
| Ship building area | 67.5 m × 20 m = 1,350 m², on the waterfront quay | Annotation on the yard plan ("ship building area"; the site does not call it a berth, which could suggest a launching facility) |
| Blasting shed | 10 m × 12 m | Annotation on the yard plan |
| Room around Lourdes in the area | 14.82 m in length, 7.50 m in breadth | Derived: 67.5 − 52.68 and 20 − 12.50 |
| 2 containers | "6×6", shown on the plan "as annotated", without a unit | Annotation (reading about 80 % certain, no unit written; SOURCE_CONFLICTS YD-1) |

No other yard facts (plot area, cranes, slipway type, workforce) are published.

**What the section shows.**

- Hero visual: `public/images/yard/yard-hero-*.webp`, an illustrative aerial render of the yard with Lourdes in the ship building area, from our own Blender scene `blender/yard/Yard_Lourdes.blend`: a monochrome architectural model (no trees) with Lourdes in colour. Captioned "Illustration … (to be built)" because the hull looks finished (YD-8). Building heights, quay fittings, keel blocks and shores are illustrative (YD-9).
- Schematic site plan (`components/yard-plan.tsx`, generated by `blender/yard/scripts/make_yard_plan.py` from `blender/yard/yard_layout.json`): original schematic drawn from the annotated layout; the imagery itself is not reproduced. Captioned "Schematic site plan … Approximate scale; buildings simplified" and "placement in the ship building area is illustrative"; opens larger in a dialog. Lourdes is drawn to scale from the GA deck outline (52.68 × 12.50 m, with the stowed ramp and the deckhouse footprint) centred in the area: 7.41 m clear at each end, 3.75 m each side. The water is labelled only "River" and the open ground "Open yard area" (the layout names neither).
- Ship building area view: `public/images/yard/yard-berth-*.webp`, Lourdes on keel blocks inside the marked area, captioned as an illustration.
- **Needs input:** the river's name (the plan no longer shows "Zuari", YD-4); the containers' "6×6" reading and unit (YD-1); the blasting shed's exact position and whether it exists yet (YD-2); which other structures belong to the yard and what the basin is for (YD-6); the exact yard coordinates (RM-1).

## 3. Route of operation

Intended operating regions: the Mediterranean, the west coast of Africa, Asia and the Indian Ocean, from Goa. The routes are **illustrative, not confirmed sailing routes**, and the map says so in its caption.

- Map: `components/route-map.tsx` (inline overlay) over `public/images/route/base-map.svg`, both generated by `scripts/create-route-map.py` from Natural Earth land (1:50m drawn; 1:10m land and minor islands used to check that every route stays at sea). Natural Earth is public domain and is credited on the map. Coastlines only, no country borders (RM-3).
- Origin marker: "Goa · Fomar, Shiroda / BNBSBD shipyard / Lourdes will be built here", placed at the Shiroda reference point 15.329 N 74.027 E; the exact yard coordinates are not known (RM-1).
- Lanes and end points are illustrative choices (RM-2): via Suez to the Mediterranean; via Suez, the Mediterranean and Gibraltar to West Africa (the Cape route is an equally plausible alternative); round Sri Lanka and through Malacca to Asia; south-west into the Indian Ocean. End points are positions at sea, not ports.
- Animation-ready: each route is a separate `<path id="route-…" pathLength="1">`; how to animate it is described at the top of `route-map.tsx`. Not animated yet.

## 4. Removed from the public site

**12 October 2026, scope change (Lourdes only).** Moved out of `public/` to `D:/BNB_Website_work/archive/website-removed-12oct/images/` (kept, not deleted; also in git history):

- Drone programme images: `farscout-1600.webp`, `farscout-960.webp`, `rescue-drone-concept.webp`.
- Other vessel images: `fleet/c90-forward.webp`, `fleet/c90-aft.webp`, `fleet/pw-600.webp`, `fleet/pt-600.webp`.
- Earlier-proposal reference photographs: `cargo-reference.webp`, `tanker-reference.webp`.

The `/marine-drones` page, the drone teaser, the fleet section and the earlier proposals were removed from the site at the same time. The drone and fleet source records remain in `BNB_Website/PROJECT_SPEC.md` and `SOURCE_CONFLICTS.md` for when that material returns.

**12 October 2026, integration.** `images/operating-regions.svg` and `scripts/create-operating-map.py` (replaced by the route map) and `images/lourdes-hero.webp` (no longer referenced) moved to the same archive folder.

**Earlier on 12 October 2026.** Unreferenced files archived at `D:/BNB_Website_work/archive/website-unused-public-images/`: `guardian-document.webp`, `maritime-eye-document.webp`, `rescue-document.webp`, `clean-document.webp`, `shipyard.jpg`, `ocean.jpg`, `farscout.jpg`, `operating-regions.png`.

Never published: the midship drawing; the third-party satellite imagery of the yard.

## 5. Third-party software and fonts

- **Fonts.** Self-hosted from `public/fonts/`, Latin subsets only. Barlow (400, 500, 600, 700) and Barlow Condensed (500, 600), SIL Open Font Licence 1.1. IBM Plex Mono (400, 500), SIL Open Font Licence 1.1.
- **three.js r186.1.** MIT licence, © 2010–2026 three.js authors. Used by the lazy-loaded 3D viewer (`three`, `GLTFLoader`, `DRACOLoader`, `OrbitControls`, `RoomEnvironment`). Not in the initial page load.
- **Draco decoder.** `public/draco/draco_decoder.js`, `draco_decoder.wasm`, `draco_wasm_wrapper.js`: default builds from the three.js examples (`libs/draco`), originally from Google Draco, **Apache License 2.0**. Used only when a GLB is loaded.
- **Icons.** lucide-react, ISC licence. UI components are shadcn-based (MIT licence).

## 6. Honesty status at publication

- Verified from drawings or briefs: the Lourdes particulars and drawing views; the berth and blasting-shed dimensions as annotated.
- Illustration: the hero poster, the 3D model, the scroll story, the yard renders, the schematic site plan and the route map. Machinery and bridge equipment in the explanatory views are representative.
- Needs input (see SOURCE_CONFLICTS.md): crew count, Lourdes livery, beach-landing mechanism, status wording (WEB-1), the GA drawing number (INT-8), what BNBSBD stands for (INT-9), the containers reading (YD-1), the river name (YD-4), yard structures (YD-2, YD-6), yard coordinates and intended lanes (RM-1, RM-2).
