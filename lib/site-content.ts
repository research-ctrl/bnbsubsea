/**
 * Single source for the website's copy and specifications. The site presents one vessel: LOURDES, the reference
 * newbuild of the BNB SHOREBRIDGE 55 (owner's presentation email and answers, 13 Oct 2026).
 *
 * Naming: BNB SHOREBRIDGE 55 is the commercial model name (SHOREBRIDGE = the landing craft / cargo Ro-Ro series,
 * 55 = the model's nominal length in metres); LOURDES is the individual vessel's name. The measured particulars
 * follow the general arrangement (52.68 m overall with ramp).
 *
 * Honesty rules (PROJECT_SPEC section 10): LOURDES particulars come from the Nirmon general arrangement, Rev 0,
 * 07.10.2026; the cargo payload (610 t), the cargo types, the AUT-UMS notation and sea state 5 as an operating
 * capability are owner statements (13 Oct 2026). Owner's final changes, 13 Oct 2026: the site carries no source
 * notes for the particulars (no GA citation, no "55 is nominal" note, no "company figure" label); provenance is kept
 * in VESSEL_SOURCES.md and SOURCE_CONFLICTS.md (SB-1, SB-2, SB-12). Bureau Veritas is always written in full,
 * "Bureau Veritas (BV)", never the abbreviation alone. No deadweight figure was supplied, so none is published, and 800 t stays
 * "maximum loading capacity" as the GA labels it. Shipyard figures are the dimensions annotated on our yard plan.
 * Renders, site plans and route maps are labelled as illustrations. No crew number, prices, certification or
 * demonstrated performance are published.
 * The 400–500 DWT design-to-order card is an invitation to enquire, not a design: no model number, specifications or
 * picture.
 */

import type { EnquiryInterest } from "@/lib/enquiry";

export type Figure = { value: string; unit?: string; label: string };
export type SpecRow = { label: string; value: string; note?: string };
export type SpecGroup = { id: string; title: string; rows: SpecRow[] };

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

/* ------------------------------------------------------------------ BNB SHOREBRIDGE 55 / LOURDES */

/**
 * The model block, presented exactly as the owner's email sets it out (four lines, in this order). The range card
 * renders these four strings as they are; the hero and the specifications use the same values.
 */
export const shorebridge55 = {
  model: "BNB SHOREBRIDGE 55",
  descriptor: "55-metre Landing Craft / Cargo Ro-Ro",
  vessel: "LOURDES",
  referenceLabel: "Reference newbuild",
  statusLabel: "Status",
  status: "Current newbuild programme",
  /** owner wording, 13 Oct 2026 */
  classification: "Under Bureau Veritas (BV) classification",
  /** owner, 13 Oct 2026: AUT-UMS, the Bureau Veritas (BV) notation for an unattended machinery space */
  notation: "AUT-UMS",
  notationMeaning: "Unattended machinery space",
  /** owner, 13 Oct 2026: what she carries */
  cargo: "Containers, vehicles, pallets, fuel tanks and hazardous materials",
  /** the exact four-line block */
  lines: [
    "BNB SHOREBRIDGE 55",
    "55-metre Landing Craft / Cargo Ro-Ro",
    "Reference newbuild: LOURDES",
    "Status: Current newbuild programme",
  ],
} as const;

/** 16:9 still in the story's own light (graphite hull): story poster before the frames load, 3D fallback */
const posterRender = {
  src: "/images/lourdes-poster-1600.webp",
  srcSet: "/images/lourdes-poster-960.webp 960w, /images/lourdes-poster-1600.webp 1600w",
  width: 1600,
  height: 900,
  alt: "LOURDES, the BNB SHOREBRIDGE 55 reference newbuild, at sea; design visualisation",
  caption: "Design visualisation",
  treatment: "photo",
} satisfies Poster & { caption: string };

const posterSketch = {
  src: "/images/lourdes-hero-1600.webp",
  srcSet: "/images/lourdes-hero-960.webp 960w, /images/lourdes-hero-1600.webp 1600w",
  width: 1600,
  height: 900,
  alt: "LOURDES, the BNB SHOREBRIDGE 55 reference newbuild, design illustration with the bow ramp lowered",
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
  alt: "LOURDES, the BNB SHOREBRIDGE 55 reference newbuild, at sea; design visualisation",
  caption: "Design visualisation",
  treatment: "photo",
} satisfies Poster & { caption: string };

const lourdesPoster: Poster & { caption: string } = assets.lourdesPoster ? posterRender : posterSketch;
const lourdesHero: Poster & { caption: string } = assets.lourdesPoster ? heroRender : posterSketch;

export const lourdes = {
  name: "LOURDES",
  /** hero eyebrow: where the model sits in the company's vessel ranges */
  // no-break space after "&": a narrow screen breaks before "& Cargo Ro-Ro", never after the ampersand
  eyebrow: "Commercial Vessels · Landing Craft &\u00a0Cargo Ro-Ro",
  /** shown beside the capabilities heading */
  tagline: "Versatile cargo. Coastal access. Sea state 5. Cyber resilience.",
  hero: lourdesHero,
  heroFigures: [
    { value: "52.68", unit: "m", label: "Overall length, with ramp" },
    { value: "24", unit: "TEU", label: "Nominal container capacity" },
    { value: "610", unit: "t", label: "Cargo payload" },
    { value: "800", unit: "t", label: "Maximum loading capacity" },
  ] satisfies Figure[],
  specsIntro:
    "A 55-metre landing craft / cargo Ro-Ro that carries containers, vehicles, pallets, fuel tanks and hazardous materials through ports and permitted beach landing sites, designed for sea state\u00a05. Its reference newbuild, LOURDES, is our current newbuild programme at our shipyard in Fomar, Shiroda, Goa, under Bureau Veritas (BV) classification with the AUT-UMS notation.",
  specGroups: [
    {
      id: "identity",
      title: "Model and vessel",
      rows: [
        { label: "Model", value: shorebridge55.model },
        { label: "Vessel", value: "LOURDES", note: "Reference newbuild" },
        { label: "Type", value: "Landing craft / cargo Ro-Ro" },
        { label: "Status", value: shorebridge55.status },
        { label: "Build yard", value: "BNBSBD shipyard", note: "Fomar, Shiroda, Goa" },
      ],
    },
    {
      id: "particulars",
      title: "Particulars",
      rows: [
        { label: "Length overall, including ramp", value: "52.68\u00a0m" },
        { label: "Hull length overall", value: "51.00\u00a0m" },
        { label: "Breadth", value: "12.50\u00a0m" },
        { label: "Depth", value: "4.00\u00a0m" },
        { label: "Draft", value: "2.70\u00a0m" },
        { label: "Main engines", value: "2 × 600\u00a0BHP" },
        { label: "Speed, approximate", value: "10\u00a0knots" },
        { label: "Design sea state", value: "Sea state\u00a05" },
        { label: "Flag", value: "Malta" },
      ],
    },
    {
      id: "cargo",
      title: "Cargo",
      rows: [
        { label: "Cargo carried", value: shorebridge55.cargo },
        { label: "Cargo payload", value: "610\u00a0t" },
        { label: "Maximum loading capacity", value: "800\u00a0t" },
        { label: "Nominal container capacity", value: "24\u00a0TEU", note: "Five bays of four 20\u00a0ft containers, plus four on the aft bay" },
      ],
    },
    {
      id: "classification",
      title: "Classification",
      rows: [
        { label: "Classification", value: shorebridge55.classification },
        { label: "Class notation", value: shorebridge55.notation, note: shorebridge55.notationMeaning },
        { label: "Cyber resilience", value: "Notation in scope", note: "Not yet certified" },
      ],
    },
  ] satisfies SpecGroup[],
  capabilities: [
    {
      id: "cargo",
      title: "Versatile cargo.",
      body: "Containers, vehicles, pallets, fuel tanks and hazardous materials. A bow ramp serves dedicated Ro-Ro ports and supports roll-on, roll-off operations.",
    },
    {
      id: "beyond-the-port",
      title: "Beyond the port.",
      body: "Designed for beach landing operations, so cargo can be loaded and unloaded at suitable, permitted beaches where port facilities are unavailable, within the vessel’s operating limits.",
    },
    {
      id: "sea-state-5",
      title: "Sea state\u00a05.",
      body: "LOURDES is designed for sea state\u00a05, so she can handle rough seas, within the vessel’s operating limits.",
    },
    {
      id: "cyber-resilience",
      title: "Cyber resilience.",
      body: "A cyber-resilience notation is in scope for LOURDES, with onboard protections designed to address modern cyber threats and support digital security and operational resilience.",
      status: "Notation in scope",
    },
  ],
};

export const drawings = {
  // no-break space after the slash: a narrow screen breaks before "/ Drawings", never leaving the slash at a line end
  eyebrow: "BNB SHOREBRIDGE 55 · LOURDES /\u00a0Drawings",
  title: "THE DRAWINGS.",
  intro:
    "Explore LOURDES, the BNB SHOREBRIDGE 55 reference newbuild, in 3D, or study her general arrangement.",
  model: {
    src: "/models/lourdes.glb",
    /** transparent still of the live 3D view (same framing and light), shown while it loads and without WebGL */
    poster: {
      src: "/images/lourdes-3d-still-1600.webp",
      srcSet: "/images/lourdes-3d-still-960.webp 960w, /images/lourdes-3d-still-1600.webp 1600w",
      width: 1600,
      height: 825,
      alt: "LOURDES (BNB SHOREBRIDGE 55) 3D model, three-quarter view from the bow, design visualisation",
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
      alt: "LOURDES outboard profile from her general arrangement",
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
      alt: "LOURDES main deck plan from her general arrangement, with the 24\u00a0TEU cargo arrangement",
      caption: "General arrangement / Main deck plan / 07 October 2026",
    },
  ],
};

export const lourdesStory: Story = {
  id: "lourdes",
  manifest: "/sequences/lourdes/manifest.json",
  frames: 360,
  /** the vessel this story shows; kept as short as the pre-13 Oct label so the top bar keeps its geometry at every
   * width (the model name leads the hero just above, and the story's screen-reader title names both) */
  eyebrow: "LOURDES / The vessel in layers",
  title: "BNB SHOREBRIDGE 55 · LOURDES, revealed",
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
      body: "A 52.68\u00a0m landing craft / cargo Ro-Ro with an open deck, an aft deckhouse and a working bow ramp. Practical proportions for ports and permitted beach landings.",
      start: 1,
      end: 69,
      alt: "LOURDES at sea in calm water, seen first in side profile and then from a three-quarter bow view.",
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
      body: "The structure settles back into place, and the wheelhouse brings navigation and communications together above the deckhouse. LOURDES is under Bureau Veritas (BV) classification with the AUT-UMS notation; a cyber-resilience notation is in scope.",
      start: 231,
      end: 299,
      alt: "The structure and the deckhouse levels settle back into place while the camera moves to the wheelhouse, mast and antennas.",
      fact: { value: shorebridge55.notation, label: "Bureau Veritas (BV) notation · unattended machinery space" },
      note: "Bridge equipment shown is representative.",
    },
    {
      id: "reassembly",
      label: "Reassembly",
      title: "Whole again, and ready.",
      body: "The ramp closes and the sea comes back: LOURDES complete, the reference newbuild of the BNB SHOREBRIDGE 55.",
      start: 300,
      end: 360,
      alt: "The bow ramp closes, the sea returns and the camera finishes on a three-quarter view of the complete vessel.",
      fact: { value: "800", unit: "t", label: "Maximum loading capacity" },
      link: { href: "#shipyard", label: "Our shipyard, home of the newbuild" },
    },
  ],
};

/* ------------------------------------------------------------------ Commercial vessels */

/**
 * "Commercial Vessels → Landing Craft & Cargo Ro-Ro": the range section and the header menu. Card 1 is the model
 * block (shorebridge55.lines, exactly as written); card 2 invites design-to-order enquiries and is text only: no
 * model number, no specifications, no picture (it is not a design).
 */
export const vesselRange = {
  id: "landing-craft-roro",
  category: "Commercial Vessels",
  name: "Landing Craft & Cargo Ro-Ro",
  convention:
    "SHOREBRIDGE is our landing craft and cargo Ro-Ro series. The number in a model’s name is its nominal length in metres, and every vessel carries her own name.",
  model: {
    id: "shorebridge-55",
    /**
     * The model's enquiry action (range card and hero): preselects "BNB SHOREBRIDGE 55 / LOURDES" in the contact form
     * (enquiryTopics). No-break spaces keep the model name on one line when the button wraps on a phone.
     */
    enquire: { label: `Enquire about the ${shorebridge55.model.replace(/ /g, "\u00a0")}`, href: "#enquire-shorebridge-55" },
    links: [
      { href: "#lourdes-story", label: "The vessel in layers" },
      { href: "#specifications", label: "Specifications" },
    ],
  },
  designToOrder: {
    id: "design-to-order",
    title: "400–500\u00a0DWT Landing Craft — Design-to-Order Enquiries Welcome",
    body: "Tell us about your cargo, route and operating requirements.",
    note: "Configuration and specifications subject to engineering feasibility and applicable approvals.",
    cta: "Enquire about design to order",
    href: "#enquire-design-to-order",
  },
};

/**
 * Deep links into the contact form. Each id is an anchor at the top of the contact section; arriving on it, or
 * following a link to it, preselects the matching "Enquiry about" subject (components/contact-section.tsx).
 */
export const enquiryTopics: { id: string; interest: EnquiryInterest }[] = [
  { id: "enquire-shorebridge-55", interest: "BNB SHOREBRIDGE 55 / LOURDES" },
  { id: "enquire-design-to-order", interest: "400–500 DWT design-to-order landing craft" },
  { id: "enquire-shipyard", interest: "Shipyard / general" },
];

/* ------------------------------------------------------------------ Shipyard */

export const shipyard = {
  eyebrow: "BNBSBD / Our shipyard",
  title: "Our shipyard at Fomar, Shiroda, Goa.",
  status: "Home of the LOURDES newbuild programme",
  lead: "Our own shipyard on the waterfront at Fomar, Shiroda, in Goa, is the home of the LOURDES newbuild programme. The 67.5\u00a0m × 20\u00a0m ship building area on the quay takes the full 52.68\u00a0m vessel with room to spare.",
  /** hero visual of the section (illustration; SOURCE_CONFLICTS YD-8: LOURDES is shown complete, so the captions say so) */
  render: {
    src: "/images/yard/yard-hero-1600.webp",
    srcSet: "/images/yard/yard-hero-960.webp 960w, /images/yard/yard-hero-1600.webp 1600w",
    width: 1600,
    height: 900,
    alt: "Illustration: aerial view of our shipyard at Fomar, Shiroda, Goa, with LOURDES shown complete on keel blocks inside the 67.5\u00a0m by 20\u00a0m ship building area beside the waterfront quay, the yard buildings and a walled basin behind",
    caption: "Illustration / Our shipyard at Fomar, Shiroda, with LOURDES shown complete in the ship building area",
  },
  berthView: {
    src: "/images/yard/yard-berth-1600.webp",
    srcSet: "/images/yard/yard-berth-960.webp 960w, /images/yard/yard-berth-1600.webp 1600w",
    width: 1600,
    height: 900,
    alt: "Illustration: LOURDES, shown complete, on keel blocks and side shores inside the marked ship building area on the quay, seen from the waterside",
    caption: "Illustration / LOURDES shown complete in the ship building area",
  },
  planTitle: "Site plan",
  factsTitle: "The yard in figures",
  facts: [
    { label: "Ship building area", value: "67.5 × 20\u00a0m", note: "1,350\u00a0m², on the waterfront quay" },
    { label: "Blasting shed", value: "10 × 12\u00a0m" },
    { label: "LOURDES", value: "52.68 × 12.50\u00a0m", note: "Length overall with ramp × breadth" },
    { label: "Room around LOURDES", value: "14.82\u00a0m / 7.50\u00a0m", note: "In length / in breadth: 7.41\u00a0m at each end and 3.75\u00a0m each side when centred" },
  ] satisfies SpecRow[],
  source: "Berth and shed dimensions as annotated on our yard plan. The site plan and renders are illustrations, not survey drawings.",
};

/* ------------------------------------------------------------------ Route of operation */

export const routes = {
  eyebrow: "Route of operation",
  title: "From Goa, to a wider horizon.",
  body: "From our shipyard in Goa, LOURDES is intended to operate across the Mediterranean, the west coast of Africa, Asia and the Indian Ocean. The circles mark illustrative operating areas around Goa and the major ports of each region.",
  origin: { label: "From", value: "Goa, India" },
  regions: [
    { id: "mediterranean", name: "Mediterranean" },
    { id: "west-africa", name: "West coast of Africa" },
    { id: "asia", name: "Asia" },
    { id: "indian-ocean", name: "Indian Ocean" },
  ],
  /** caption passed to <RouteMap /> (it appends the Natural Earth credit) */
  caption: "Illustrative routes and operating areas from Goa, not confirmed sailing routes or port calls.",
};

/* ------------------------------------------------------------------ Company */

export const company = [
  { eyebrow: "01 / Shipbuilding", title: "BNBSBD.", body: "The shipbuilding brand of Bennet and Bernard Subsea. Our first vessel is LOURDES, the reference newbuild of the BNB SHOREBRIDGE 55." },
  { eyebrow: "02 / Fomar, Shiroda, Goa", title: "OUR SHIPYARD.", body: "Our shipyard on the waterfront at Fomar, Shiroda, in Goa, with a 67.5\u00a0m × 20\u00a0m ship building area on the quay: the home of the LOURDES newbuild programme." },
  { eyebrow: "03 / Our team", title: "OUR SHIPBUILDER.", body: "Our own shipbuilder brings the expertise to build and deliver LOURDES, under Bureau Veritas (BV) classification." },
];

export const contactCopy = {
  body: "Ask about the BNB SHOREBRIDGE 55 and LOURDES, our current newbuild programme. Design-to-order enquiries for a 400–500\u00a0DWT landing craft are welcome, as are questions about our shipyard at Fomar, Shiroda.",
};
