/**
 * Single source for the website's copy and specifications. The site presents Lourdes only.
 *
 * Honesty rules (PROJECT_SPEC section 10): Lourdes particulars come from the Nirmon general
 * arrangement, Rev 0, 07.10.2026 (the drawing number is not published: the file name and the title block
 * disagree, SOURCE_CONFLICTS INT-8). Shipyard figures are the dimensions annotated on our yard plan.
 * Renders, site plans and route maps are labelled as illustrations. No crew number, prices, certification
 * or demonstrated performance are published.
 */

export type Figure = { value: string; unit?: string; label: string };
export type SpecRow = { label: string; value: string; note?: string };

export type StoryChapter = {
  id: string;
  /** short label for the chapter navigation */
  label: string;
  title: string;
  body: string;
  /** default frame range (1-based, inclusive); the sequence manifest overrides it when present */
  start: number;
  end: number;
  /** what the visual shows, for screen readers and the stills fallback */
  alt: string;
  fact?: Figure & { qualifier?: string };
  note?: string;
  link?: { href: string; label: string };
};

export type Poster = {
  src: string;
  srcSet?: string;
  /** `sizes` for srcSet (defaults to 100vw) */
  sizes?: string;
  width: number;
  height: number;
  /** optional portrait-composed variant, served to portrait screens through <picture> */
  portrait?: { srcSet: string; sizes: string; width: number; height: number; media: string };
  alt: string;
  /** "sketch": a light line illustration, shown inverted (light lines on navy) in dark sections */
  treatment?: "sketch" | "photo";
  /** label shown while the poster stands in for the sequence */
  caption?: string;
};

export type Story = {
  id: string;
  manifest: string;
  /** default timeline length used when the manifest is unavailable */
  frames: number;
  eyebrow: string;
  title: string;
  status: string;
  /** stills mode and failure fallback (16:9) */
  poster: Poster;
  /** under the canvas in scroll mode: the hero picture (same file as the hero, so no second download) */
  scrollPoster?: Poster;
  disclaimer: string;
  /** one-line version kept visible on short phones, where the full disclaimer does not fit */
  disclaimerShort: string;
  chapters: StoryChapter[];
};

/* ------------------------------------------------------------------ asset switches
 * Each switch is true while its files are in public/. Turning one off makes the page use the fallback
 * named beside it, so it never shows a broken image.
 */
export const assets = {
  /** /images/lourdes-poster-1600.webp + -960.webp (Blender poster). Fallback: the earlier Lourdes illustration. */
  lourdesPoster: true,
  /** /images/yard/yard-hero-* and yard-berth-* (illustrative yard renders). Fallback: the site plan only. */
  yardRender: true,
};

export const brand = {
  name: "Bennet and Bernard Subsea",
  shipbuilding: "BNBSBD",
  email: "inquiry@bnbsubsea.com",
  location: "Goa, India",
  yard: "Fomar, Shiroda, Goa",
};

/* ------------------------------------------------------------------ Lourdes */

/** 16:9 still in the story's own light (graphite hull): story poster before the frames load, 3D fallback */
const posterRender = {
  src: "/images/lourdes-poster-1600.webp",
  srcSet: "/images/lourdes-poster-960.webp 960w, /images/lourdes-poster-1600.webp 1600w",
  width: 1600,
  height: 900,
  alt: "Lourdes at sea, design visualisation",
  caption: "Design visualisation",
  treatment: "photo",
} satisfies Poster & { caption: string };

const posterSketch = {
  src: "/images/lourdes-hero-1600.webp",
  srcSet: "/images/lourdes-hero-960.webp 960w, /images/lourdes-hero-1600.webp 1600w",
  width: 1600,
  height: 900,
  alt: "Lourdes design illustration with the bow ramp lowered",
  caption: "Design visualisation",
  treatment: "sketch",
} satisfies Poster & { caption: string };

/**
 * Hero: a 21:9 render (same light and paint as the story) with the vessel in the right half, so every
 * landscape crop keeps the bow and ramp; a portrait-composed render for phones (vessel in the upper part,
 * sea below the title).
 */
const heroRender = {
  src: "/images/lourdes-poster-wide-1920.webp",
  srcSet:
    "/images/lourdes-poster-wide-1280.webp 1280w, /images/lourdes-poster-wide-1920.webp 1920w, /images/lourdes-poster-wide-2560.webp 2560w",
  // object-fit: cover fills the viewport height on anything narrower than 64:27
  sizes: "(min-aspect-ratio: 64/27) 100vw, 237vh",
  width: 2560,
  height: 1080,
  portrait: {
    media: "(max-aspect-ratio: 4/5)",
    srcSet: "/images/lourdes-poster-portrait-720.webp 720w, /images/lourdes-poster-portrait-1080.webp 1080w",
    sizes: "(max-aspect-ratio: 9/16) 57vh, 100vw",
    width: 1080,
    height: 1920,
  },
  alt: "Lourdes at sea, design visualisation",
  caption: "Design visualisation",
  treatment: "photo",
} satisfies Poster & { caption: string };

const lourdesPoster: Poster & { caption: string } = assets.lourdesPoster ? posterRender : posterSketch;
const lourdesHero: Poster & { caption: string } = assets.lourdesPoster ? heroRender : posterSketch;

export const lourdes = {
  name: "LOURDES",
  type: "Ro-Ro / landing craft",
  status: "To be built · Fomar, Shiroda",
  edition: "Bennet and Bernard / Our first vessel",
  tagline: "Cargo capability. Coastal access. Cyber resilience.",
  hero: lourdesHero,
  heroFigures: [
    { value: "52.68", unit: "m", label: "Overall length, with ramp" },
    { value: "24", unit: "TEU", label: "Nominal container capacity" },
    { value: "800", unit: "t", label: "Maximum loading capacity" },
    { value: "BV", label: "Bureau Veritas classification" },
  ] satisfies Figure[],
  specsIntro:
    "A Ro-Ro / landing craft for cargo through ports and permitted beach landing sites. Lourdes will be built under Bureau Veritas classification at our shipyard in Fomar, Shiroda, Goa.",
  specsSource: "Particulars follow the Nirmon general arrangement, Rev 0, dated 07 October 2026.",
  specs: [
    { label: "Vessel type", value: "Ro-Ro / landing craft" },
    { label: "Overall length, including ramp", value: "52.68\u00a0m" },
    { label: "Hull length overall", value: "51.00\u00a0m" },
    { label: "Breadth / depth / draft", value: "12.50 / 4.00 / 2.70\u00a0m" },
    { label: "Nominal container capacity", value: "24\u00a0TEU", note: "Five bays of four 20\u00a0ft containers, plus four on the aft bay" },
    { label: "Maximum loading capacity", value: "800\u00a0t" },
    { label: "Main engines", value: "2 × 600\u00a0BHP" },
    { label: "Design speed, approximate", value: "10\u00a0knots" },
    { label: "Hull design basis", value: "Sea state 5", note: "As stated on the general arrangement" },
    { label: "Flag", value: "Malta" },
    { label: "Classification", value: "Bureau Veritas (BV)", note: "To be built to BV class" },
    { label: "Cyber resilience", value: "Notation in scope", note: "Not yet certified" },
    { label: "Build yard", value: "BNBSBD shipyard", note: "Fomar, Shiroda, Goa" },
    { label: "Project status", value: "To be built", note: "At our shipyard in Fomar, Shiroda" },
  ] satisfies SpecRow[],
  capabilities: [
    {
      id: "roro-access",
      title: "Ro-Ro cargo access.",
      body: "A cargo vessel with a bow ramp, designed to serve dedicated Ro-Ro ports and support roll-on, roll-off operations.",
    },
    {
      id: "beyond-the-port",
      title: "Beyond the port.",
      body: "Designed for beach landing operations, so cargo can be loaded and unloaded at suitable, permitted beaches where port facilities are unavailable, within the vessel’s operating limits.",
    },
    {
      id: "cyber-resilience",
      title: "Cyber resilience.",
      body: "A cyber-resilience notation is in scope for Lourdes, with onboard protections designed to address modern cyber threats and support digital security and operational resilience.",
      status: "Notation in scope",
    },
  ],
};

export const drawings = {
  title: "THE DRAWINGS.",
  intro:
    "Explore the vessel in 3D or study the general arrangement. The GA views are taken directly from the Nirmon general arrangement, Rev 0, 07 October 2026.",
  model: {
    src: "/models/lourdes.glb",
    /** transparent still of the live 3D view (same framing and light), shown while it loads and without WebGL */
    poster: {
      src: "/images/lourdes-3d-still-1600.webp",
      srcSet: "/images/lourdes-3d-still-960.webp 960w, /images/lourdes-3d-still-1600.webp 1600w",
      width: 1600,
      height: 825,
      alt: "Lourdes 3D model, three-quarter view from the bow, design visualisation",
    },
    caption: "Interactive 3D / Design visualisation, not a construction model",
  },
  views: [
    {
      id: "profile",
      label: "Side profile",
      src: "/images/lourdes-ga-profile.webp",
      full: "/images/lourdes-profile-latest.png",
      width: 2400,
      height: 835,
      fullWidth: 5143,
      fullHeight: 1789,
      alt: "Lourdes outboard profile from the Nirmon general arrangement dated 07 October 2026",
      caption: "General arrangement / Outboard profile / 07 October 2026",
    },
    {
      id: "deck",
      label: "Main deck plan",
      src: "/images/lourdes-ga-deck.webp",
      full: "/images/lourdes-deck-latest.png",
      width: 2400,
      height: 552,
      fullWidth: 5150,
      fullHeight: 1184,
      alt: "Lourdes main deck plan with the 24\u00a0TEU cargo arrangement from the Nirmon general arrangement",
      caption: "General arrangement / Main deck plan / 07 October 2026",
    },
  ],
};

export const lourdesStory: Story = {
  id: "lourdes",
  manifest: "/sequences/lourdes/manifest.json",
  frames: 360,
  eyebrow: "Lourdes / The vessel in layers",
  title: "Lourdes, revealed",
  status: "Design visualisation",
  poster: lourdesPoster,
  scrollPoster: lourdesHero,
  disclaimer:
    "Explanatory visualisation. The hull does not separate; internal structure is informed by the drawings, and equipment is representative.",
  disclaimerShort: "Explanatory visualisation · equipment representative",
  chapters: [
    {
      id: "arrival",
      label: "Arrival",
      title: "Built for the journey ahead.",
      body: "A 52.68\u00a0m Ro-Ro landing craft with an open cargo deck, an aft deckhouse and a working bow ramp. Practical proportions for ports and permitted beach landings.",
      start: 1,
      end: 69,
      alt: "Lourdes at sea in calm water, seen first in side profile and then from a three-quarter bow view.",
      fact: { value: "52.68", unit: "m", label: "Overall length, with ramp" },
    },
    {
      id: "roro-access",
      label: "Ro-Ro access",
      title: "Open to more shores.",
      body: "The bow ramp lowers about its hinge to give rolling cargo direct access to the deck. Above, the container layout: five bays of four 20\u00a0ft units, with four more stacked on the aft bay.",
      start: 70,
      end: 130,
      alt: "The bow ramp lowers and the camera rises to show the 24\u00a0TEU container arrangement on deck.",
      fact: { value: "24", unit: "TEU", label: "Nominal container capacity" },
    },
    {
      id: "inside",
      label: "Inside the vessel",
      title: "Strength, from within.",
      body: "Containers, deckhouse and deck plating lift away to show the structure beneath: web frames every 1.5\u00a0m, longitudinal bulkheads either side of the centreline, tanks and void spaces, twin engines driving two shafts, and the tunnel bow thruster.",
      start: 131,
      end: 230,
      alt: "An exploded engineering view: deck, deckhouse and one side shell move apart along clean axes to reveal frames, bulkheads, tanks, the engine room and the propulsion line.",
      fact: { value: "2 × 600", unit: "BHP", label: "Main engines, twin-screw" },
      note: "Explanatory view. Structure is informed by the design drawings; machinery is representative.",
    },
    {
      id: "systems",
      label: "Systems",
      title: "Connected. Cyber-resilient.",
      body: "The structure settles back into place, and the wheelhouse brings navigation and communications together above the deckhouse. Lourdes will be built under Bureau Veritas classification, with a cyber-resilience notation in scope.",
      start: 231,
      end: 299,
      alt: "The structure and the deckhouse levels settle back into place while the camera moves to the wheelhouse, mast and antennas.",
      fact: { value: "BV", label: "Bureau Veritas classification" },
      note: "Bridge equipment shown is representative.",
    },
    {
      id: "reassembly",
      label: "Reassembly",
      title: "Whole again, and ready.",
      body: "The ramp closes and the sea comes back: the complete vessel, as she will be built at our shipyard in Fomar, Shiroda.",
      start: 300,
      end: 360,
      alt: "The bow ramp closes, the sea returns and the camera finishes on a three-quarter view of the complete vessel.",
      fact: { value: "800", unit: "t", label: "Maximum loading capacity" },
      link: { href: "#shipyard", label: "Where Lourdes will be built" },
    },
  ],
};

/* ------------------------------------------------------------------ Shipyard */

export const shipyard = {
  eyebrow: "BNBSBD / Our shipyard",
  title: "Our shipyard at Fomar, Shiroda, Goa.",
  status: "Lourdes · To be built here",
  lead: "Lourdes will be built at our own shipyard on the waterfront at Fomar, Shiroda, in Goa. The 67.5\u00a0m × 20\u00a0m ship building area on the quay takes the full 52.68\u00a0m vessel with room to spare.",
  /** hero visual of the section (illustration; SOURCE_CONFLICTS YD-8: Lourdes is shown as she will be built) */
  render: {
    src: "/images/yard/yard-hero-1600.webp",
    srcSet: "/images/yard/yard-hero-960.webp 960w, /images/yard/yard-hero-1600.webp 1600w",
    width: 1600,
    height: 900,
    alt: "Illustration: aerial view of our shipyard at Fomar, Shiroda, Goa, with Lourdes on keel blocks inside the 67.5\u00a0m by 20\u00a0m ship building area beside the waterfront quay, the yard buildings and a walled basin behind",
    caption: "Illustration / Our shipyard at Fomar, Shiroda, with Lourdes in the ship building area (to be built)",
  },
  berthView: {
    src: "/images/yard/yard-berth-1600.webp",
    srcSet: "/images/yard/yard-berth-960.webp 960w, /images/yard/yard-berth-1600.webp 1600w",
    width: 1600,
    height: 900,
    alt: "Illustration: Lourdes on keel blocks and side shores inside the marked ship building area on the quay, seen from the waterside",
    caption: "Illustration / Lourdes in the ship building area (to be built)",
  },
  planTitle: "Site plan",
  factsTitle: "The yard in figures",
  facts: [
    { label: "Ship building area", value: "67.5 × 20\u00a0m", note: "1,350\u00a0m², on the waterfront quay" },
    { label: "Blasting shed", value: "10 × 12\u00a0m" },
    { label: "Lourdes", value: "52.68 × 12.50\u00a0m", note: "Length overall with ramp × breadth" },
    { label: "Room around Lourdes", value: "14.82\u00a0m / 7.50\u00a0m", note: "In length / in breadth: 7.41\u00a0m at each end and 3.75\u00a0m each side when centred" },
  ] satisfies SpecRow[],
  source: "Berth and shed dimensions as annotated on our yard plan. The site plan and renders are illustrations, not survey drawings.",
};

/* ------------------------------------------------------------------ Route of operation */

export const routes = {
  eyebrow: "Route of operation",
  title: "From Goa, to a wider horizon.",
  body: "From our shipyard in Goa, Lourdes is intended to operate across the Mediterranean, the west coast of Africa, Asia and the Indian Ocean.",
  origin: { label: "From", value: "Goa, India" },
  regions: [
    { id: "mediterranean", name: "Mediterranean" },
    { id: "west-africa", name: "West coast of Africa" },
    { id: "asia", name: "Asia" },
    { id: "indian-ocean", name: "Indian Ocean" },
  ],
  /** caption passed to <RouteMap /> (it appends the Natural Earth credit) */
  caption: "Illustrative routes from Goa, not confirmed sailing routes.",
};

/* ------------------------------------------------------------------ Company */

export const company = [
  { eyebrow: "01 / Shipbuilding", title: "BNBSBD.", body: "The shipbuilding brand of Bennet and Bernard Subsea. Lourdes is our first vessel." },
  { eyebrow: "02 / Fomar, Shiroda, Goa", title: "OUR SHIPYARD.", body: "Our shipyard on the waterfront at Fomar, Shiroda, in Goa, with a 67.5\u00a0m × 20\u00a0m ship building area on the quay. Lourdes will be built here." },
  { eyebrow: "03 / Our team", title: "OUR SHIPBUILDER.", body: "Our own shipbuilder brings the expertise to build and deliver Lourdes, under Bureau Veritas classification." },
];

export const contactCopy = {
  body: "Discuss Lourdes, a vessel project or our shipyard at Fomar, Shiroda.",
};
