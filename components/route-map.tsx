/**
 * RouteMap: Lourdes route-of-operation map (illustrative).
 *
 * Server component (two small client helpers: MapPan for the phone layout, FallbackImage for a missing base
 * map). Two layers share one viewBox:
 *   1. /images/route/base-map.svg, a lazily loaded <img>: Natural Earth land, coastline and a faint
 *      graticule (Mercator), transparent sea;
 *   2. an inline SVG overlay: region halos, the illustrative routes, the yard marker and the labels.
 * Both come from scripts/create-route-map.py, which also checks every route against the land data.
 * Re-run it after changing waypoints, the extent or the label anchors; it rewrites the generated
 * block below. Typography inherits the site fonts (--font-mono, --font-sans).
 *
 * Sizes: label groups (.rm-scale) are scaled per container width so names stay at about 12 px or more; the
 * passage and graticule labels show only where the map is at least 1100 px wide. Below 600 px the map is
 * drawn wider than the screen (about 1.75x) and pans sideways, starting centred on Goa, so the regions and
 * routes stay readable instead of shrinking to a thumbnail.
 *
 * The routes are illustrative sea lanes from the BNBSBD shipyard at Fomar, Shiroda, Goa, to the four
 * intended operating regions. They are not confirmed sailing routes, passage plans or port calls.
 *
 * Animation (not enabled yet). Each route is <path class="route-path" pathLength=1 data-route=…>,
 * drawn statically with stroke-dasharray: 1 and stroke-dashoffset: 0. To draw the routes later:
 *   - when the figure enters view (IntersectionObserver, or a scroll-driven `animation-timeline:
 *     view()`), set data-state="ready" on the figure first (dashoffset 1, routes hidden), then
 *     data-state="drawn" so stroke-dashoffset transitions 1 → 0;
 *   - stagger with a per-route transition-delay keyed on [data-route] (the casing path under each
 *     route carries the same data-route); fade in .rm-end and .rm-label after their route arrives;
 *   - wrap all of it in @media (prefers-reduced-motion: no-preference) and only hide the routes
 *     once the script is running, so reduced-motion and no-JS visitors always get this static,
 *     fully drawn map.
 */

import { MapPan } from "@/components/map-pan";
import { FallbackImage } from "@/components/fallback-image";

type RouteId = "mediterranean" | "west-africa" | "asia" | "indian-ocean";

type RouteInfo = {
  id: RouteId;
  n: string;
  name: string;
  /** label lines on the map (set in capitals when rendered) */
  label: readonly string[];
  anchor: "start" | "middle" | "end";
  via: string;
};

const ROUTES: readonly RouteInfo[] = [
  {
    id: "mediterranean",
    n: "01",
    name: "Mediterranean",
    label: ["Mediterranean"],
    anchor: "middle",
    via: "across the Arabian Sea and the Gulf of Aden, through the Red Sea and the Suez Canal",
  },
  {
    id: "west-africa",
    n: "02",
    name: "West coast of Africa",
    label: ["West coast", "of Africa"],
    anchor: "middle",
    via: "through the Suez Canal and the Mediterranean, out through the Strait of Gibraltar and south along the African coast",
  },
  {
    id: "asia",
    n: "03",
    name: "Asia",
    label: ["Asia"],
    anchor: "middle",
    via: "south of Sri Lanka, across the Bay of Bengal and through the Strait of Malacca to the South China Sea",
  },
  {
    id: "indian-ocean",
    n: "04",
    name: "Indian Ocean",
    label: ["Indian Ocean"],
    anchor: "middle",
    via: "south-west across the Arabian Sea, west of Lakshadweep, to the western Indian Ocean",
  },
];



// @generated:route-geometry:start (scripts/create-route-map.py — do not edit by hand)
const MAP = {"width":1200,"height":597,"routes":{"mediterranean":{"d":"M821.3 304.7C820.6 304.5 820.1 304.2 819.3 303.9C818.1 303.5 816.6 303 814.3 302.9C809.2 302.7 799.1 304 789.5 305.4C776.2 307.2 758.6 311.9 742.1 314C724.5 316.1 702.1 316.2 686.8 317.6C676 318.6 668.7 319.5 659.2 320.9C649 322.4 638.1 325 627.6 326.5C617.3 328 605.2 329.8 596.8 329.8C591.1 329.8 585.3 329 582.2 328.2C580.7 327.8 579.8 327.6 578.9 326.8C578 325.9 577.5 324.3 576.9 322.9C576.3 321.3 575.8 319.3 575.4 317.6C574.9 316 575.4 314.4 574.3 312.7C572.6 310 566.5 308 563.3 304.2C559.4 299.5 557.1 292.4 553.8 286C550.3 279.1 546.6 271.7 542.8 264.3C538.7 256.6 534.5 248.6 530.1 240.6C525.6 232.3 520.3 222.3 515.9 215.4C512.7 210.3 509.1 205.8 506.8 202.6C505.5 200.7 504.7 199.6 503.5 198.1C502.3 196.6 500.7 195.3 499.6 193.7C498.4 192 497.5 190.1 496.6 188.3C495.7 186.6 494.8 184.9 494.4 183.3C494 182 494 181.2 493.8 179.7C493.4 176.7 493.8 170.4 492.1 166.8C490.5 163.6 488.1 161.4 484.7 158.9C479.8 155.3 471.8 151.9 464.2 149.1C455.3 145.8 445.2 143.6 434.2 141C420.9 138 404 134.5 390 132.4","end":[390.0,132.4]},"west-africa":{"d":"M821.3 304.7C820.6 304.5 820.1 304.2 819.3 303.9C818.1 303.5 816.6 303 814.3 302.9C809.2 302.7 799.1 304 789.5 305.4C776.2 307.2 758.6 311.9 742.1 314C724.5 316.1 702.1 316.2 686.8 317.6C676 318.6 668.7 319.5 659.2 320.9C649 322.4 638.1 325 627.6 326.5C617.3 328 605.2 329.8 596.8 329.8C591.1 329.8 585.3 329 582.2 328.2C580.7 327.8 579.8 327.6 578.9 326.8C578 325.9 577.5 324.3 576.9 322.9C576.3 321.3 575.8 319.3 575.4 317.6C574.9 316 575.4 314.4 574.3 312.7C572.6 310 566.5 308 563.3 304.2C559.4 299.5 557.1 292.4 553.8 286C550.3 279.1 546.6 271.7 542.8 264.3C538.7 256.6 534.5 248.6 530.1 240.6C525.6 232.3 520.3 222.3 515.9 215.4C512.7 210.3 509.1 205.8 506.8 202.6C505.5 200.7 504.7 199.6 503.5 198.1C502.3 196.6 500.7 195.3 499.6 193.7C498.4 192 497.5 190.1 496.6 188.3C495.7 186.6 494.8 184.9 494.4 183.3C494 182 494 181.2 493.8 179.7C493.4 176.7 493.8 170.4 492.1 166.8C490.5 163.6 488.1 161.4 484.7 158.9C479.8 155.3 471.8 151.9 464.2 149.1C455.3 145.8 445.2 143.6 434.2 141C420.9 138 404 134.5 390 132.4C377.6 130.5 364.5 132.7 354.5 128.5C345.4 124.8 339.5 114.7 331.6 110.4C324.5 106.6 317.7 103.8 309.5 103C299.6 101.9 287.2 104.9 276.3 106.9C265.6 109 255 113.3 244.7 115.4C235.1 117.3 224.4 118.3 216.3 119.3C210.3 120 204.7 120.4 200.5 121.1C197.7 121.5 195.9 122.1 193.4 122.5C190.7 123 188 122.2 184.7 123.7C178.9 126.3 170.3 134.2 163.4 141.5C155.2 150.2 147.7 163.8 139.7 173.3C132.8 181.6 125.2 186.9 118.8 195.5C111.6 205 103.7 217.1 99.5 228.5C95.6 239 94.5 249.9 93.6 261C92.6 272.4 93.6 286.5 93.9 295.9C94.2 302.4 94.5 306.4 95.1 312.3C95.9 319.3 96.3 327.9 98.3 335C100.2 341.8 102.8 348.5 106.6 354.3C110.5 360.2 116.6 364.9 121.6 370.2","end":[121.6,370.2]},"asia":{"d":"M821.3 304.7C820.6 304.5 820 303.8 819.3 303.9C818.2 304.1 816.1 305.6 815.5 307.4C814.5 310.5 816.4 317 817.9 322.1C819.7 328 823.1 334.3 826.2 340.6C829.6 347.5 833.2 356.5 837.6 361.9C841.2 366.1 844.7 368.2 849.5 371.4C855.9 375.7 864 381.9 873.2 384.1C884.2 386.8 898.9 384 911.8 383.3C924.9 382.7 938.9 381.2 951.3 380.2C962.3 379.2 972.9 376.8 982.5 377.4C990.9 377.9 999.3 379.3 1005.8 382.2C1011.2 384.5 1015.1 388.2 1019.2 391.7C1023.1 395 1026.4 399.3 1029.9 402.3C1032.8 405 1035.6 407.2 1038.6 409.1C1041.3 410.8 1044.4 412.1 1046.8 413.4C1048.8 414.5 1050.5 415.5 1052 416.3C1053 416.9 1053.9 417.5 1054.7 417.8C1055.4 417.9 1056 417.9 1056.7 417.8C1057.5 417.8 1058.3 417.5 1059.1 417.3C1059.9 417 1060.7 417 1061.4 416.3C1062.9 415 1064.5 411.5 1065.8 408.3C1067.6 404 1068 397.6 1070.5 392.5C1073.3 386.7 1078.5 380.6 1082.4 375.8C1085.6 371.8 1088.7 368.9 1091.8 365.5","end":[1091.8,365.5]},"indian-ocean":{"d":"M821.3 304.7C820.6 304.5 820.1 303.9 819.3 303.9C818.1 304 816.2 305 814.7 306.6C812.3 309.3 811.2 315.4 808.4 320.5C804.7 327.2 799.2 334.9 793.4 343.1C786.2 353.2 777.1 365.6 768.2 376.6C759 387.9 748.2 399.4 738.9 409.9C730.7 419.2 723.2 427.5 715.3 436.3","end":[715.3,436.3]}},"halos":{"mediterranean":{"cx":378.9,"cy":112.4,"rx":165.8,"ry":65.6,"rot":-4},"west-africa":{"cx":118.4,"cy":339.8,"rx":63.2,"ry":85.0,"rot":18},"asia":{"cx":1069.7,"cy":371.8,"rx":98.7,"ry":88.1,"rot":0},"indian-ocean":{"cx":730.3,"cy":443.0,"rx":118.4,"ry":87.4,"rot":-18}},"labels":{"mediterranean":[394.7,89.8],"west-africa":[138.2,422.5],"asia":[1125.8,351.1],"indian-ocean":[699.5,469.9],"origin":[841.6,294.3],"p-suez":[507.6,170.5],"p-bab-el-mandeb":[570.0,338.2],"p-gibraltar":[202.9,105.0],"p-gibraltar-from":[193.8,120.8],"p-malacca":[1020.0,408.3]},"graticule":{"lon":[[0,236.8],[30,473.7],[60,710.5],[90,947.4],[120,1184.2]],"lat":[[-15,547.0],[0,427.2],[15,307.4],[30,178.8],[45,28.5]]},"origin":[821.3,304.7]} as const;
// @generated:route-geometry:end

/** Passages named on the map (wide screens only). `from`: a short leader from the passage to the label. */
const PASSAGES: readonly { key: keyof typeof MAP.labels; text: string; anchor: "start" | "end"; from?: keyof typeof MAP.labels }[] = [
  { key: "p-suez", text: "SUEZ CANAL", anchor: "start" },
  { key: "p-bab-el-mandeb", text: "BAB-EL-MANDEB", anchor: "end" },
  { key: "p-gibraltar", text: "STRAIT OF GIBRALTAR", anchor: "start", from: "p-gibraltar-from" },
  { key: "p-malacca", text: "STRAIT OF MALACCA", anchor: "end" },
];

const CSS = `
.route-map{container:route-map/inline-size;position:relative;margin:0;color:var(--on-dark,#e9eef2);background:#09131d radial-gradient(120% 90% at 58% 42%,#11263a 0%,#0b1824 48%,#070f17 100%);font-family:var(--font-mono,ui-monospace,monospace)}
.rm-canvas{position:relative;--rm-k:1}
.rm-base,.rm-overlay{position:absolute;inset:0;width:100%;height:100%;display:block}
.rm-base{object-fit:contain;user-select:none;pointer-events:none}
.rm-overlay{overflow:hidden}
.rm-overlay text{font-family:inherit;paint-order:stroke;stroke:#09141f;stroke-width:3.2px;stroke-linejoin:round}
.rm-halo{fill:url(#rm-halo-fill)}
.rm-pan{position:relative}
.route-map .route-path,.route-map .route-casing{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0}
.route-map .route-path{stroke:#eef3f6;stroke-opacity:.92;stroke-width:1.6px}
.route-map .route-casing{stroke:#07111a;stroke-opacity:.55;stroke-width:4.5px}
.rm-scale{transform:scale(var(--rm-k))}
.rm-end circle{fill:#0b1824;stroke:#eef3f6;stroke-width:1.4px}
.rm-origin .rm-ring{fill:none;stroke:var(--accent,#ea5a16);stroke-opacity:.55;stroke-width:1.2px}
.rm-origin .rm-ring--outer{stroke-opacity:.22}
.rm-origin .rm-glow{fill:url(#rm-origin-glow)}
.rm-origin .rm-dot{fill:var(--accent,#ea5a16);stroke:#fff;stroke-width:1.2px}
.rm-origin-name{font-size:12px;font-weight:500;letter-spacing:.12em;fill:#fff}
.rm-origin-sub{font-size:9.5px;letter-spacing:.14em;fill:var(--on-dark-soft,#aab7c2)}
.rm-label-n{font-size:10px;font-weight:500;letter-spacing:.16em;fill:var(--accent,#ea5a16)}
.rm-label-name{font-size:12.5px;font-weight:500;letter-spacing:.2em;fill:#eef3f6}
.rm-pass{font-size:8.5px;letter-spacing:.12em;fill:var(--on-dark-soft,#aab7c2);fill-opacity:.85}
.rm-leader{stroke:var(--on-dark-soft,#aab7c2);stroke-opacity:.6;stroke-width:.8px;fill:none}
.rm-grat{font-size:8.5px;letter-spacing:.08em;fill:var(--on-dark-mute,#8796a3);fill-opacity:.7;stroke:none}
.rm-pan-hint{display:none;margin:0;padding:10px clamp(16px,2.4vw,28px) 0;font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--on-dark-soft,#aab7c2)}
.rm-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 28px;padding:14px clamp(16px,2.4vw,28px) 16px;border-top:1px solid rgba(255,255,255,.1);font-size:.6875rem;line-height:1.5;letter-spacing:.08em;text-transform:uppercase;color:var(--on-dark-soft,#aab7c2)}
.rm-legend{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0;padding:0;list-style:none}
.rm-legend li{display:flex;align-items:center;gap:10px}
.rm-legend svg{flex:none;display:block}
.rm-caption{margin:0;color:var(--on-dark-mute,#8796a3)}
.rm-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@container route-map (max-width:1199px){
 .rm-canvas{--rm-k:1.35}
 .rm-pass,.rm-grat{font-size:10px}
 .route-map .route-path{stroke-width:2px}
 .route-map .route-casing{stroke-width:5.5px}
}
@container route-map (max-width:1099px){
 .rm-grat,.rm-pass,.rm-leader{display:none}
}
@container route-map (max-width:899px){
 .rm-canvas{--rm-k:1.6}
 .rm-origin-sub{display:none}
 .route-map .route-path{stroke-width:2.6px}
 .route-map .route-casing{stroke-width:7.5px}
}
@container route-map (max-width:599px){
 .rm-pan{overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%)}
 .rm-pan::-webkit-scrollbar{display:none}
 .rm-canvas{width:max(175%,600px);--rm-k:1.8}
 .rm-halo{fill:url(#rm-halo-fill-strong)}
 .route-map .route-path{stroke-width:3.8px}
 .route-map .route-casing{stroke-width:9px}
 .rm-pan-hint{display:block}
 .rm-foot{padding-top:12px}
}
`;

export function RouteMap({
  caption = "Illustrative connections, not confirmed sailing routes.",
  className = "",
  idPrefix = "route-map",
}: {
  caption?: string;
  className?: string;
  idPrefix?: string;
}) {
  const { width: w, height: h } = MAP;
  const [ox, oy] = MAP.origin;
  const [olx, oly] = MAP.labels.origin;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  return (
    <figure className={`route-map ${className}`.trim()} data-route-map="">
      <style href="bnb-route-map" precedence="default">
        {CSS}
      </style>
      <p className="rm-pan-hint" aria-hidden="true">
        Swipe sideways to see all four routes
      </p>
      <MapPan className="rm-pan" focus={ox / w} align={0.4}>
      <div className="rm-canvas" style={{ aspectRatio: `${w} / ${h}` }}>
        <FallbackImage className="rm-base" src="/images/route/base-map.svg" alt="" width={w} height={h} loading="lazy" decoding="async" />
        <svg className="rm-overlay" viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
          <title id={titleId}>Lourdes: illustrative route of operation from Goa</title>
          <desc id={descId}>
            Map from the BNBSBD shipyard at Fomar, Shiroda, Goa, to the intended operating regions: the Mediterranean, the west
            coast of Africa, Asia and the Indian Ocean. The lines are illustrative connections, not confirmed sailing routes.
          </desc>
          <defs>
            <radialGradient id="rm-halo-fill">
              <stop offset="0" stopColor="#9cc1dc" stopOpacity="0.26" />
              <stop offset="0.5" stopColor="#9cc1dc" stopOpacity="0.11" />
              <stop offset="1" stopColor="#9cc1dc" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rm-halo-fill-strong">
              <stop offset="0" stopColor="#9cc1dc" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="#9cc1dc" stopOpacity="0.2" />
              <stop offset="1" stopColor="#9cc1dc" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rm-origin-glow">
              <stop offset="0" stopColor="#ea5a16" stopOpacity="0.32" />
              <stop offset="1" stopColor="#ea5a16" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="rm-halos" aria-hidden="true">
            {ROUTES.map(r => {
              const o = MAP.halos[r.id];
              return (
                <ellipse
                  key={r.id}
                  className="rm-halo"
                  data-region={r.id}
                  cx={o.cx}
                  cy={o.cy}
                  rx={o.rx}
                  ry={o.ry}
                  transform={o.rot ? `rotate(${o.rot} ${o.cx} ${o.cy})` : undefined}
                />
              );
            })}
          </g>

          <g className="rm-grat" aria-hidden="true">
            {MAP.graticule.lon.map(([lon, x]) => (
              <text key={`lon${lon}`} x={x} y={h - 10} textAnchor="middle">
                {lon === 0 ? "0°" : `${lon}°E`}
              </text>
            ))}
            {MAP.graticule.lat.map(([lat, y]) => (
              <text key={`lat${lat}`} x={10} y={y - 4}>
                {lat === 0 ? "0°" : lat > 0 ? `${lat}°N` : `${-lat}°S`}
              </text>
            ))}
          </g>

          <g className="rm-routes">
            {ROUTES.map(r => (
              <g key={r.id} className="rm-route" data-route={r.id}>
                <path className="route-casing" data-route={r.id} pathLength={1} d={MAP.routes[r.id].d} />
                <path id={`route-${r.id}`} className="route-path" data-route={r.id} pathLength={1} d={MAP.routes[r.id].d} />
              </g>
            ))}
          </g>

          <g className="rm-ends" aria-hidden="true">
            {ROUTES.map(r => {
              const [x, y] = MAP.routes[r.id].end;
              return (
                <g key={r.id} className="rm-end" data-route={r.id} transform={`translate(${x} ${y})`}>
                  <g className="rm-scale">
                    <circle r={3.4} />
                  </g>
                </g>
              );
            })}
          </g>

          <g className="rm-origin" aria-hidden="true" transform={`translate(${ox} ${oy})`}>
            <g className="rm-scale">
              <circle className="rm-glow" r={30} />
              <circle className="rm-ring rm-ring--outer" r={15} />
              <circle className="rm-ring" r={8.5} />
              <circle className="rm-dot" r={3.6} />
            </g>
          </g>

          <g className="rm-pass" aria-hidden="true">
            {PASSAGES.map(p => {
              const [x, y] = MAP.labels[p.key];
              const from = p.from ? MAP.labels[p.from] : null;
              return (
                <g key={p.key}>
                  {from && <path className="rm-leader" d={`M${from[0]} ${from[1]}L${x - 2} ${y + 2.5}`} />}
                  <text x={x} y={y} textAnchor={p.anchor}>
                    {p.text}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="rm-labels" aria-hidden="true">
            <g transform={`translate(${olx} ${oly})`}>
              <g className="rm-scale">
                <text className="rm-origin-name" x={0} y={0}>
                  GOA · FOMAR, SHIRODA
                </text>
                <text className="rm-origin-sub" x={0} y={14}>
                  BNBSBD SHIPYARD
                </text>
                <text className="rm-origin-sub" x={0} y={26}>
                  LOURDES WILL BE BUILT HERE
                </text>
              </g>
            </g>
            {ROUTES.map(r => {
              const [x, y] = MAP.labels[r.id];
              return (
                <g key={r.id} className="rm-label" data-route={r.id} transform={`translate(${x} ${y})`}>
                  <g className="rm-scale" textAnchor={r.anchor}>
                    <text className="rm-label-n" x={0} y={-14}>
                      {r.n}
                    </text>
                    {r.label.map((line, i) => (
                      <text key={line} className="rm-label-name" x={0} y={i * 15}>
                        {line.toUpperCase()}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      </MapPan>

      <figcaption className="rm-foot">
        <ul className="rm-legend" aria-hidden="true">
          <li>
            <svg width="22" height="14" viewBox="0 0 22 14">
              <circle cx="11" cy="7" r="6" fill="none" stroke="#ea5a16" strokeOpacity="0.55" strokeWidth="1" />
              <circle cx="11" cy="7" r="2.6" fill="#ea5a16" stroke="#fff" strokeWidth="1" />
            </svg>
            BNBSBD shipyard, Goa
          </li>
          <li>
            <svg width="28" height="14" viewBox="0 0 28 14">
              <path d="M2 10 C 9 2, 18 2, 26 6" fill="none" stroke="#eef3f6" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Illustrative route
          </li>
          <li>
            <svg width="22" height="14" viewBox="0 0 22 14">
              <ellipse cx="11" cy="7" rx="10" ry="6" fill="#9cc1dc" fillOpacity="0.16" />
              <circle cx="11" cy="7" r="2.4" fill="#0b1824" stroke="#eef3f6" strokeWidth="1.1" />
            </svg>
            Intended operating region
          </li>
        </ul>
        <p className="rm-caption">{caption} Map data: Natural Earth.</p>
      </figcaption>

      <ol className="rm-sr">
        {ROUTES.map(r => (
          <li key={r.id}>
            {r.name}: illustrative route from the BNBSBD shipyard at Fomar, Shiroda, Goa, {r.via}.
          </li>
        ))}
      </ol>
    </figure>
  );
}

export default RouteMap;
