/**
 * RouteMap: LOURDES route-of-operation map (illustrative).
 *
 * Server component (two small client helpers: MapPan for the phone layout, FallbackImage for a missing base
 * map). Two layers share one viewBox:
 *   1. /images/route/base-map.svg, a lazily loaded <img>: Natural Earth land, coastline and a faint
 *      graticule (Mercator), transparent sea;
 *   2. an inline SVG overlay: the operating areas, the illustrative routes, the major ports, the yard
 *      marker and the labels.
 * Both come from scripts/create-route-map.py, which also checks every route against the land data and
 * checks that the labels stay clear of each other, the routes, the points and the edges at each of the
 * breakpoints below. Re-run it after changing waypoints, ports, the extent, the label anchors or the
 * label and point sizes here; it rewrites the generated block below. Typography inherits the site fonts
 * (--font-mono, --font-sans).
 *
 * Sizes: labels and points (.rm-scale) are scaled per container width by --rm-k so names stay readable;
 * the passage and graticule labels show only where the map is at least 1100 px wide. Below 600 px the
 * map is drawn wider than the screen (about 1.75x) and pans sideways, starting centred on Goa, so the
 * regions and routes stay readable instead of shrinking to a thumbnail. The generator's BREAKPOINTS
 * mirror these values: change both together.
 *
 * The routes are illustrative sea lanes from the BNBSBD shipyard at Fomar, Shiroda, Goa, to the four
 * intended operating regions. They are not confirmed sailing routes, passage plans or port calls.
 * Points (owner, 13 Oct 2026): every point uses the orange BNBSBD marker ("make all points like the
 * BNBSBD circle"), the yard at full size and the major ports and route ends smaller, with no dark circles;
 * the ports are not named on the map ("remove those black circles and the names"), only in the
 * screen-reader text. Every port, Goa included, has the same illustrative operating radius around it;
 * overlapping circles merge into one operating area. The ports are reference points, not port calls or
 * services; the radius is not published.
 *
 * Animation (not enabled yet). Each route is <path class="route-path" pathLength=1 data-route=…>,
 * drawn statically with stroke-dasharray: 1 and stroke-dashoffset: 0. To draw the routes later:
 *   - when the figure enters view (IntersectionObserver, or a scroll-driven `animation-timeline:
 *     view()`), set data-state="ready" on the figure first (dashoffset 1, routes hidden), then
 *     data-state="drawn" so stroke-dashoffset transitions 1 → 0;
 *   - stagger with a per-route transition-delay keyed on [data-route] (the casing path under each
 *     route carries the same data-route); fade in .rm-end and .rm-label after their route arrives,
 *     then the port points ([data-port]) and the operating areas ([data-area], listing the ports inside);
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
const MAP = {"width":1200,"height":597,"routes":{"mediterranean":{"d":"M821.3 304.7C820.6 304.5 820.1 304.2 819.3 303.9C818.1 303.5 816.6 303 814.3 302.9C809.2 302.7 799.1 304 789.5 305.4C776.2 307.2 758.6 311.9 742.1 314C724.5 316.1 702.1 316.2 686.8 317.6C676 318.6 668.7 319.5 659.2 320.9C649 322.4 638.1 325 627.6 326.5C617.3 328 605.2 329.8 596.8 329.8C591.1 329.8 585.3 329 582.2 328.2C580.7 327.8 579.8 327.6 578.9 326.8C578 325.9 577.5 324.3 576.9 322.9C576.3 321.3 575.8 319.3 575.4 317.6C574.9 316 575.4 314.4 574.3 312.7C572.6 310 566.5 308 563.3 304.2C559.4 299.5 557.1 292.4 553.8 286C550.3 279.1 546.6 271.7 542.8 264.3C538.7 256.6 534.5 248.6 530.1 240.6C525.6 232.3 520.3 222.3 515.9 215.4C512.7 210.3 509.1 205.8 506.8 202.6C505.5 200.7 504.7 199.6 503.5 198.1C502.3 196.6 500.7 195.3 499.6 193.7C498.4 192 497.5 190.1 496.6 188.3C495.7 186.6 494.8 184.9 494.4 183.3C494 182 494 181.2 493.8 179.7C493.4 176.7 493.8 170.4 492.1 166.8C490.5 163.6 488.1 161.4 484.7 158.9C479.8 155.3 471.8 151.9 464.2 149.1C455.3 145.8 445.2 143.6 434.2 141C420.9 138 404 134.5 390 132.4","end":[390.0,132.4]},"west-africa":{"d":"M821.3 304.7C820.6 304.5 820.1 304.2 819.3 303.9C818.1 303.5 816.6 303 814.3 302.9C809.2 302.7 799.1 304 789.5 305.4C776.2 307.2 758.6 311.9 742.1 314C724.5 316.1 702.1 316.2 686.8 317.6C676 318.6 668.7 319.5 659.2 320.9C649 322.4 638.1 325 627.6 326.5C617.3 328 605.2 329.8 596.8 329.8C591.1 329.8 585.3 329 582.2 328.2C580.7 327.8 579.8 327.6 578.9 326.8C578 325.9 577.5 324.3 576.9 322.9C576.3 321.3 575.8 319.3 575.4 317.6C574.9 316 575.4 314.4 574.3 312.7C572.6 310 566.5 308 563.3 304.2C559.4 299.5 557.1 292.4 553.8 286C550.3 279.1 546.6 271.7 542.8 264.3C538.7 256.6 534.5 248.6 530.1 240.6C525.6 232.3 520.3 222.3 515.9 215.4C512.7 210.3 509.1 205.8 506.8 202.6C505.5 200.7 504.7 199.6 503.5 198.1C502.3 196.6 500.7 195.3 499.6 193.7C498.4 192 497.5 190.1 496.6 188.3C495.7 186.6 494.8 184.9 494.4 183.3C494 182 494 181.2 493.8 179.7C493.4 176.7 493.8 170.4 492.1 166.8C490.5 163.6 488.1 161.4 484.7 158.9C479.8 155.3 471.8 151.9 464.2 149.1C455.3 145.8 445.2 143.6 434.2 141C420.9 138 404 134.5 390 132.4C377.6 130.5 364.5 132.7 354.5 128.5C345.4 124.8 339.5 114.7 331.6 110.4C324.5 106.6 317.7 103.8 309.5 103C299.6 101.9 287.2 104.9 276.3 106.9C265.6 109 255 113.3 244.7 115.4C235.1 117.3 224.4 118.3 216.3 119.3C210.3 120 204.7 120.4 200.5 121.1C197.7 121.5 195.9 122.1 193.4 122.5C190.7 123 188 122.2 184.7 123.7C178.9 126.3 170.3 134.2 163.4 141.5C155.2 150.2 147.7 163.8 139.7 173.3C132.8 181.6 125.2 186.9 118.8 195.5C111.6 205 103.7 217.1 99.5 228.5C95.6 239 94.5 249.9 93.6 261C92.6 272.4 93.6 286.5 93.9 295.9C94.2 302.4 94.5 306.4 95.1 312.3C95.9 319.3 96.3 327.9 98.3 335C100.2 341.8 102.8 348.5 106.6 354.3C110.5 360.2 116.6 364.9 121.6 370.2","end":[121.6,370.2]},"asia":{"d":"M821.3 304.7C820.6 304.5 820 303.8 819.3 303.9C818.2 304.1 816.1 305.6 815.5 307.4C814.5 310.5 816.4 317 817.9 322.1C819.7 328 823.1 334.3 826.2 340.6C829.6 347.5 833.2 356.5 837.6 361.9C841.2 366.1 844.7 368.2 849.5 371.4C855.9 375.7 864 381.9 873.2 384.1C884.2 386.8 898.9 384 911.8 383.3C924.9 382.7 938.9 381.2 951.3 380.2C962.3 379.2 972.9 376.8 982.5 377.4C990.9 377.9 999.3 379.3 1005.8 382.2C1011.2 384.5 1015.1 388.2 1019.2 391.7C1023.1 395 1026.4 399.3 1029.9 402.3C1032.8 405 1035.6 407.2 1038.6 409.1C1041.3 410.8 1044.4 412.1 1046.8 413.4C1048.8 414.5 1050.5 415.5 1052 416.3C1053 416.9 1053.9 417.5 1054.7 417.8C1055.4 417.9 1056 417.9 1056.7 417.8C1057.5 417.8 1058.3 417.5 1059.1 417.3C1059.9 417 1060.7 417 1061.4 416.3C1062.9 415 1064.5 411.5 1065.8 408.3C1067.6 404 1068 397.6 1070.5 392.5C1073.3 386.7 1078.5 380.6 1082.4 375.8C1085.6 371.8 1088.7 368.9 1091.8 365.5","end":[1091.8,365.5]},"indian-ocean":{"d":"M821.3 304.7C820.6 304.5 820.1 303.9 819.3 303.9C818.1 304 816.2 305 814.7 306.6C812.3 309.3 811.2 315.4 808.4 320.5C804.7 327.2 799.2 334.9 793.4 343.1C786.2 353.2 777.1 365.6 768.2 376.6C759 387.9 748.2 399.4 738.9 409.9C730.7 419.2 723.2 427.5 715.3 436.3","end":[715.3,436.3]}},"labels":{"mediterranean":[394.7,89.8],"west-africa":[138.2,447.8],"asia":[1125.8,351.1],"indian-ocean":[683.7,481.8],"origin":[848.3,291.0],"p-suez":[507.6,170.5],"p-bab-el-mandeb":[585.0,310.3],"p-gibraltar":[180.0,109.4],"p-malacca":[1018.4,412.2]},"graticule":{"lon":[[0,236.8],[30,473.7],[60,710.5],[90,947.4],[120,1184.2]],"lat":[[-15,547.0],[0,427.2],[15,307.4],[30,178.8],[45,28.5]]},"passages":[{"key":"p-suez","text":"SUEZ CANAL","anchor":"start"},{"key":"p-bab-el-mandeb","text":"BAB-EL-MANDEB","anchor":"start"},{"key":"p-gibraltar","text":"STRAIT OF GIBRALTAR","anchor":"end"},{"key":"p-malacca","text":"STRAIT OF MALACCA","anchor":"end"}],"ports":{"mumbai":{"name":"Mumbai","x":811.9,"y":274.9},"kochi":{"name":"Kochi","x":838.9,"y":348.1},"colombo":{"name":"Colombo","x":867.2,"y":372.2},"male":{"name":"Mal\u00e9","x":817.2,"y":394.2},"salalah":{"name":"Salalah","x":663.2,"y":291.5},"jebel-ali":{"name":"Jebel Ali","x":671.3,"y":223.2},"djibouti":{"name":"Djibouti","x":577.4,"y":335.0},"jeddah":{"name":"Jeddah","x":546.1,"y":253.5},"port-said":{"name":"Port Said","x":491.8,"y":167.2},"valletta":{"name":"Valletta","x":351.4,"y":123.2},"gibraltar":{"name":"Gibraltar","x":194.6,"y":120.9},"dakar":{"name":"Dakar","x":99.2,"y":310.0},"abidjan":{"name":"Abidjan","x":205.2,"y":385.3},"lagos":{"name":"Lagos","x":263.7,"y":376.3},"mombasa":{"name":"Mombasa","x":550.0,"y":459.3},"singapore":{"name":"Singapore","x":1056.6,"y":417.3},"chittagong":{"name":"Chittagong","x":961.6,"y":246.3}},"areas":[{"ports":["goa","mumbai","kochi","colombo","male"],"d":"M850.4 268.5l-.2-1.2-.3-1.3-.3-1.2-.4-1.2-.3-1.2-.5-1.3-.4-1.1-.6-1.2-.5-1.2-.6-1.1-.6-1.1-.7-1.1-.7-1.1-.7-1-.7-1.1-.8-1-.9-.9-.8-1-.9-.9-.9-.9-1-.8-.9-.9-1-.8-1.1-.7-1-.8-1.1-.6-1.1-.7-1.1-.6-1.1-.6-1.2-.6-1.2-.5-1.2-.4-1.2-.5-1.2-.4-1.2-.3-1.2-.3-1.3-.3-1.2-.2-1.3-.2-1.3-.1-1.3-.2-1.2 0-1.3 0-1.3 0-1.3 0-1.2 .2-1.3 .1-1.3 .2-1.2 .2-1.3 .3-1.2 .3-1.2 .3-1.3 .4-1.2 .5-1.1 .4-1.2 .5-1.2 .6-1.1 .6-1.1 .6-1.1 .7-1.1 .6-1 .8-1.1 .7-1 .8-.9 .9-1 .8-.9 .9-.9 .9-.9 1-.8 .9-.8 1-.7 1.1-.8 1-.7 1.1-.6 1.1-.6 1.1-.6 1.1-.6 1.2-.5 1.2-.4 1.1-.5 1.3-.4 1.2-.3 1.2-.3 1.2-.3 1.3-.2 1.2-.2 1.3-.2 1.3-.1 1.2 0 1.3 0 1.3 0 1.3 0 1.3 .1 1.2 .2 1.3 .2 1.3 .2 1.2 .3 1.3 .3 1.2 .3 1.2 .4 1.2 .5 1.2 .4 1.2 .5 1.2 .6 1.2 .6 1.1 .6 1.1 .6 1.1 .7 1.1 .8 1 .7 1.1 .8 1 .8 .9 .6 .7 0 .9-.1 1.3 0 1.2 0 1.3 .1 1.2 .1 1.3 .1 1.2 .2 1.3 .2 1.2 .3 1.2 .3 1.2 .3 1.2 .4 1.2 .4 1.2 .5 1.2 .5 1.1 .5 1.2 .6 1.1 .6 1.1 .7 1.1 .6 1 .7 1 .8 1 .8 1 .8 1 .8 .9 .9 .9 .9 .9 .9 .8 1 .8 1 .8 1 .8 1 .7 1.1 .6 1 .7 .6 .3 0 .2-.3 1.2-.3 1.2-.2 1.2-.2 1.2-.1 1.2-.1 1.3-.1 1.2 0 1.2 0 1.2 .1 1.3 .1 1.2 .1 1.2 .2 1.2 .2 1.2 .3 1.2 .3 1.2 .3 1.2 .3 .9-.3 .1-1.1 .5-1.1 .5-1.1 .5-1 .6-1.1 .7-1 .6-1 .7-1 .7-.9 .8-.9 .8-.9 .8-.9 .8-.8 .9-.8 .9-.8 .9-.8 1-.7 .9-.7 1-.7 1-.6 1.1-.6 1-.5 1.1-.5 1.1-.5 1.1-.5 1.2-.4 1.1-.3 1.1-.4 1.2-.3 1.2-.2 1.2-.2 1.2-.2 1.2-.2 1.2-.1 1.2 0 1.2 0 1.2 0 1.2 0 1.2 .1 1.2 .2 1.2 .2 1.2 .2 1.2 .2 1.2 .3 1.2 .4 1.1 .3 1.2 .4 1.1 .5 1.2 .5 1.1 .5 1.1 .5 1 .6 1.1 .6 1 .7 1.1 .7 1 .7 .9 .8 1 .8 .9 .8 .9 .8 .9 .9 .8 .9 .8 .9 .8 .9 .8 1 .7 1 .7 1 .6 1.1 .7 1 .5 1.1 .6 1.1 .5 1.1 .5 1.1 .4 1.2 .4 1.1 .4 1.2 .4 1.2 .2 1.2 .3 1.2 .2 1.2 .2 1.2 .1 1.2 .1 1.2 .1 1.2 0 1.2 0 1.2-.1 1.2-.1 1.2-.1 1.2-.2 1.2-.2 1.2-.3 1.2-.2 1.1-.4 1.2-.4 1.1-.4 1.2-.4 1.1-.5 1.1-.5 1-.6 1.1-.5 1-.7 1.1-.6 .9-.7 1-.7 1-.8 .9-.8 .9-.8 .9-.8 .8-.9 .8-.9 .8-.9 .8-1 .7-.9 .7-1 .6-1.1 .6-1 .6-1.1 .6-1 .5-1.1 .5-1.1 .4-1.2 .4-1 .8 .4 1.1 .4 1.2 .4 1.1 .4 1.2 .3 1.2 .3 1.2 .3 1.2 .2 1.2 .2 1.2 .1 1.2 .1 1.2 .1 1.2 0 1.3 0 1.2-.1 1.2-.1 1.2-.1 1.2-.2 1.2-.2 1.2-.3 1.2-.3 1.1-.3 1.2-.4 1.1-.4 1.2-.4 1.1-.5 1.1-.5 1.1-.6 1-.6 1.1-.6 1-.7 1-.6 1-.8 .9-.7 1-.8 .9-.8 .8-.9 .9-.9 .8-.9 .8-.9 .7-.9 .8-1 .7-1 .6-1 .6-1.1 .6-1 .6-1.1 .5-1.1 .5-1.1 .4-1.2 .5-1.1 .3-1.2 .4-1.2 .3-1.1 .2-1.2 .2-1.2 .2-1.2 .2-1.2 .1-1.2 0-1.3 0-1.2 0-1.2 0-1.2-.1-1.2-.2-1.2-.2-1.2-.2-1.2-.2-1.2-.3-1.2-.4-1.2-.3-1.1-.5-1.2-.4-1.1-.5-1.1-.5-1.1-.6-1.1-.6-1.1-.6-1-.6-1-.7-1-.8-1-.7-1-.8-.9-.8-.9-.9-.9-.8-.8-.9-.8-1-.8-.9-.8-1-.7-1-.7-1-.7-1.1-.6-1-.6-1.1-.5-1.1-.6-1.1-.4-1.2-.5-1.1-.4-1.2-.4-1.1-.3-1.2-.3-1.2-.3-.2 0-.3-.8-.5-1.1-.5-1.2-.5-1.1-.5-1.1-.6-1-.7-1.1-.6-1-.7-1-.8-1-.7-1-.8-.9-.8-.9-.9-.9-.9-.8-.9-.9-.9-.8-1-.7-1-.8-1-.7-1-.6-.8-.5 .3-1.2 .3-1.2 .3-1.2 .2-1.2 .2-1.3 .2-1.2 .1-1.3 0-1.2 0-1.3 0-1.2 0-1.3-.1-1.2-.2-1.3-.2-1.2-.2-1.2-.3-1.3-.3-1.2-.3-1.2-.4-1.2-.4-1.1-.5-1.2-.5-1.2-.5-1.1-.6-1.1-.6-1.1-.6-1.1-.7-1-.7-1.1-.8-1-.7-.9-.3-.4 0-.1 .1-1.3 .1-1.2 .1-1.3 0-1.3 0-1.3-.1-1.3-.1-1.2-.1-1.3z"},{"ports":["salalah","jebel-ali"],"d":"M711.5 216.6l-.3-1.4-.2-1.3-.4-1.3-.3-1.2-.4-1.3-.5-1.3-.5-1.2-.5-1.2-.6-1.2-.6-1.2-.6-1.2-.7-1.1-.7-1.1-.8-1.1-.8-1.1-.8-1.1-.9-1-.9-1-.9-.9-1-.9-.9-.9-1.1-.9-1-.8-1.1-.8-1.1-.8-1.1-.7-1.1-.7-1.2-.6-1.2-.6-1.2-.6-1.2-.5-1.3-.5-1.2-.5-1.3-.4-1.3-.4-1.3-.3-1.3-.3-1.3-.2-1.3-.2-1.3-.2-1.3-.1-1.4 0-1.3 0-1.3 0-1.4 0-1.3 .1-1.3 .2-1.3 .2-1.4 .2-1.3 .3-1.3 .3-1.2 .4-1.3 .4-1.3 .5-1.2 .5-1.2 .5-1.2 .6-1.2 .6-1.2 .6-1.1 .7-1.1 .7-1.1 .8-1.1 .8-1.1 .8-1 .9-1 .9-.9 .9-.9 .9-.9 1-.9 1-.8 1.1-.8 1.1-.8 1.1-.7 1.1-.7 1.1-.6 1.2-.6 1.2-.6 1.2-.5 1.2-.5 1.2-.5 1.3-.4 1.3-.4 1.2-.3 1.3-.3 1.3-.2 1.4-.2 1.3-.2 1.3-.1 1.3 0 1.4-.1 1.3 .1 1.3 0 1.4 .1 1.3 .2 1.3 .2 1.3 .2 1.3 .3 1.3 .3 1.3 .4 1.3 .4 1.3 .5 1.2 .5 1.3 .5 1.2 .6 1.2 .6 1.2 .6 1.2 .7 1.1 .7 1.1 .8 1.1 .8 1.1 .8 1 .9 1.1 .9 .9 .9 1 .9 .9 1 .9 1 .9 1.1 .8 1 .7-.3 .1-1.1 .6-1.1 .6-1.1 .6-1.1 .6-1.1 .7-1 .7-1 .8-1 .8-1 .8-.9 .8-.9 .9-.9 .9-.9 .9-.8 1-.8 1-.7 1-.7 1.1-.7 1-.7 1.1-.6 1.1-.6 1.1-.5 1.2-.5 1.1-.5 1.2-.4 1.2-.4 1.2-.3 1.2-.3 1.2-.3 1.3-.2 1.2-.2 1.3-.2 1.2-.1 1.3 0 1.2 0 1.3 0 1.3 0 1.2 .1 1.3 .2 1.2 .2 1.3 .2 1.2 .3 1.3 .3 1.2 .3 1.2 .4 1.2 .4 1.2 .5 1.2 .5 1.1 .5 1.2 .6 1.1 .6 1.1 .7 1.1 .7 1 .7 1.1 .7 1 .8 1 .8 .9 .9 1 .9 .9 .9 .9 .9 .8 1 .8 1 .8 1 .8 1 .7 1.1 .7 1.1 .6 1.1 .6 1.1 .6 1.1 .5 1.2 .6 1.2 .4 1.2 .4 1.2 .4 1.2 .4 1.2 .3 1.2 .2 1.3 .3 1.2 .2 1.3 .1 1.2 .1 1.3 .1 1.3 0 1.2 0 1.3-.1 1.2-.1 1.3-.1 1.2-.2 1.3-.3 1.2-.2 1.2-.3 1.3-.4 1.2-.4 1.2-.4 1.1-.4 1.2-.6 1.1-.5 1.2-.6 1.1-.6 1-.6 1.1-.7 1-.7 1.1-.8 .9-.8 1-.8 .9-.8 .9-.9 .9-.9 .9-1 .8-.9 .8-1 .7-1 .7-1.1 .7-1 .7-1.1 .6-1.1 .6-1.1 .5-1.2 .5-1.1 .5-1.2 .4-1.2 .4-1.2 .3-1.2 .3-1.2 .3-1.3 .2-1.2 .2-1.3 .2-1.2 .1-1.3 0-1.2 .1-1.3-.1-1.3 0-1.2-.1-1.3-.2-1.2-.2-1.3-.2-1.2-.3-1.3-.3-1.2-.3-1.2-.4-1.2-.4-1.2-.5-1.2-.5-1.1-.5-1.2-.6-1.1-.6-1.1-.7-1.1-.7-1-.7-1.1-.7-1-.8-1-.8-1-.9-.9-.9-.9-.9-.9-.9-.8-1-.8-.9-.8 .2-.1 1.2-.5 1.2-.6 1.2-.6 1.2-.6 1.1-.7 1.1-.7 1.1-.8 1.1-.8 1-.8 1.1-.9 .9-.9 1-.9 .9-1 .9-.9 .9-1.1 .8-1 .8-1.1 .8-1.1 .7-1.1 .7-1.1 .6-1.2 .6-1.2 .6-1.2 .5-1.2 .5-1.3 .5-1.2 .4-1.3 .3-1.3 .4-1.3 .2-1.3 .3-1.3 .2-1.3 .1-1.3 .1-1.3 .1-1.4 0-1.3 0-1.3-.1-1.4-.1-1.3-.1-1.3z"},{"ports":["abidjan","lagos"],"d":"M300.3 370.2l-.2-1.2-.2-1.2-.3-1.1-.4-1.2-.3-1.2-.4-1.1-.5-1.1-.5-1.2-.5-1.1-.5-1-.6-1.1-.7-1-.6-1.1-.7-1-.7-.9-.8-1-.8-.9-.8-.9-.8-.9-.9-.8-.9-.9-.9-.7-1-.8-1-.7-1-.7-1-.7-1-.6-1.1-.6-1.1-.5-1.1-.6-1.1-.5-1.1-.4-1.2-.4-1.1-.4-1.2-.3-1.2-.3-1.2-.3-1.2-.2-1.2-.2-1.2-.1-1.2-.1-1.2-.1-1.2 0-1.2 0-1.2 .1-1.3 .1-1.2 .1-1.2 .2-1.2 .2-1.2 .3-1.1 .3-1.2 .3-1.2 .4-1.1 .4-1.1 .4-1.1 .5-1.1 .6-1.1 .5-1.1 .6-1 .6-1.1 .7-1 .7-.9 .7-1 .8-.9 .7-.9 .9-.9 .8-.8 .9-.8 .9-.8 .9-.8 1-.7 .9-.7 1-.7 1.1-.6 1-.5 1-.5-.4-.9-.9-.9-.7-.9-.8-1-.7-1-.7-1-.7-1.1-.6-1-.6-1.1-.5-1.1-.5-1.1-.5-1.2-.5-1.1-.4-1.2-.4-1.1-.3-1.2-.3-1.2-.2-1.2-.3-1.2-.1-1.2-.2-1.2-.1-1.2 0-1.2-.1-1.2 .1-1.2 0-1.3 .1-1.2 .2-1.2 .1-1.1 .3-1.2 .2-1.2 .3-1.2 .3-1.1 .4-1.2 .4-1.1 .5-1.1 .5-1.1 .5-1.1 .5-1.1 .6-1 .6-1 .7-1 .7-1 .7-.9 .8-1 .7-.9 .9-.8 .8-.9 .9-.8 .9-.8 .9-.7 1-.8 .9-.6 1-.7 1-.6 1.1-.6 1-.6 1.1-.5 1.1-.5 1.1-.4 1.2-.4 1.1-.4 1.2-.3 1.1-.3 1.2-.3 1.2-.2 1.2-.2 1.2-.1 1.2-.1 1.2-.1 1.2 0 1.2 0 1.2 .1 1.2 .1 1.3 .1 1.2 .2 1.2 .2 1.2 .3 1.1 .3 1.2 .3 1.2 .4 1.1 .4 1.2 .4 1.1 .5 1.1 .5 1.1 .6 1.1 .6 1.1 .6 1 .7 1 .6 1 .8 1 .7 .9 .8 1 .8 .9 .9 .8 .8 .9 .9 .8 1 .8 .9 .7 1 .8 1 .7 1 .6 1 .6 1.1 .6 1.1 .6 1.1 .5 1.1 .5 1.1 .4 1.2 .4 1.1 .4 1.2 .3 1.2 .3 1.2 .3 1.1 .2 1.2 .2 1.2 .1 1.3 .1 1.2 .1 1.2 0 1.2 0 1.2-.1 1.2-.1 1.2-.1 1.2-.2 1.2-.2 1.2-.3 1.2-.3 1.1-.3 1.2-.4 1.1-.4 1.2-.4 1.1-.5 1.1-.5 1.1-.6 1-.6 1.1-.6 1-.6 1-.7 1-.8 .9-.7 .9-.8 .9-.8 .9-.9 .8-.8 .9-.9 .7-1 .8-.9 .7-1 .7-1 .7-1 .6-1 .5-1 .5 .5 .9 .8 .9 .8 1 .8 .9 .7 1 .7 1.1 .6 1 .7 1.1 .5 1.1 .6 1.1 .5 1.1 .5 1.1 .4 1.1 .5 1.2 .3 1.2 .4 1.1 .3 1.2 .2 1.2 .2 1.2 .2 1.2 .2 1.3 0 1.2 .1 1.2 0 1.2 0 1.2-.1 1.2 0 1.2-.2 1.2-.2 1.2-.2 1.2-.2 1.2-.3 1.2-.4 1.1-.3 1.2-.5 1.1-.4 1.1-.5 1.1-.5 1.1-.6 1.1-.5 1-.7 1-.6 1-.7 1-.7 1-.8 .9-.8 .9-.8 .9-.9 .8-.8 .8-.9 .8-1 .8-.9 .7-1 .7-1 .6-1 .7-1 .6-1.1 .5-1.1 .5-1.1 .5-1.1 .5-1.1 .4-1.2 .3-1.1 .4-1.2 .3-1.2 .2-1.2 .2-1.2 .2-1.2 .2-1.2 .1-1.2 0-1.2 0-1.2 0-1.2 0-1.3-.1-1.2-.2-1.2z"},{"ports":["gibraltar"],"d":"M239.7 113.4l-.3-1.5-.3-1.4-.3-1.5-.4-1.4-.5-1.4-.5-1.4-.6-1.4-.6-1.4-.6-1.4-.7-1.3-.7-1.3-.8-1.3-.8-1.2-.8-1.3-.9-1.2-1-1.1-.9-1.2-1-1.1-1.1-1.1-1-1-1.2-1-1.1-1-1.2-.9-1.2-.9-1.2-.9-1.3-.8-1.2-.7-1.3-.8-1.4-.6-1.3-.7-1.4-.6-1.4-.5-1.4-.5-1.4-.5-1.5-.4-1.4-.4-1.5-.3-1.4-.2-1.5-.3-1.5-.1-1.5-.2-1.5 0-1.5-.1-1.5 .1-1.5 0-1.5 .2-1.5 .1-1.4 .3-1.5 .2-1.5 .3-1.4 .4-1.5 .4-1.4 .5-1.4 .5-1.4 .5-1.4 .6-1.3 .7-1.3 .6-1.4 .8-1.2 .7-1.3 .8-1.2 .9-1.2 .9-1.2 .9-1.1 1-1.1 1-1.1 1-1.1 1.1-1 1.1-.9 1.2-1 1.1-.9 1.2-.8 1.3-.8 1.2-.8 1.3-.7 1.3-.7 1.3-.6 1.4-.6 1.4-.6 1.4-.5 1.4-.4 1.4-.5 1.4-.3 1.5-.3 1.4-.3 1.5-.2 1.5-.2 1.5-.1 1.5-.1 1.5 0 1.5 0 1.5 .1 1.4 .1 1.5 .2 1.5 .2 1.5 .3 1.5 .3 1.4 .3 1.5 .5 1.4 .4 1.5 .5 1.4 .6 1.4 .6 1.3 .6 1.4 .7 1.3 .7 1.3 .8 1.3 .8 1.3 .8 1.2 .9 1.2 1 1.2 .9 1.1 1 1.1 1.1 1.1 1.1 1 1.1 1 1.1 1 1.2 .9 1.2 .9 1.2 .9 1.3 .8 1.2 .8 1.4 .7 1.3 .7 1.3 .6 1.4 .6 1.4 .5 1.4 .5 1.4 .5 1.5 .4 1.4 .4 1.5 .3 1.5 .3 1.4 .2 1.5 .2 1.5 .1 1.5 .1 1.5 0 1.5 0 1.5-.1 1.5-.1 1.5-.2 1.5-.2 1.4-.3 1.5-.3 1.4-.4 1.5-.4 1.4-.5 1.4-.5 1.4-.5 1.4-.6 1.3-.6 1.4-.7 1.3-.7 1.2-.8 1.3-.8 1.2-.9 1.2-.9 1.2-.9 1.1-1 1.2-1 1-1 1.1-1.1 1-1.1 .9-1.1 1-1.2 .9-1.2 .8-1.2 .8-1.3 .8-1.3 .7-1.3 .7-1.3 .6-1.4 .6-1.3 .6-1.4 .5-1.4 .5-1.5 .4-1.4 .3-1.5 .3-1.4 .3-1.5 .2-1.5 .2-1.5 .1-1.5 .1-1.4 0-1.5 0-1.5-.1-1.5-.1-1.5-.2-1.5z"},{"ports":["valletta"],"d":"M396.4 115.8l-.3-1.5-.3-1.4-.4-1.5-.4-1.4-.4-1.4-.5-1.5-.6-1.3-.6-1.4-.6-1.4-.7-1.3-.7-1.3-.8-1.3-.8-1.2-.9-1.2-.8-1.2-1-1.2-.9-1.1-1-1.2-1.1-1-1-1.1-1.2-1-1.1-.9-1.2-1-1.2-.8-1.2-.9-1.2-.8-1.3-.8-1.3-.7-1.3-.7-1.4-.6-1.4-.6-1.4-.6-1.4-.5-1.4-.4-1.4-.4-1.5-.4-1.4-.3-1.5-.3-1.5-.2-1.4-.2-1.5-.1-1.5-.1-1.5 0-1.5 0-1.5 .1-1.5 .1-1.5 .2-1.4 .2-1.5 .3-1.5 .3-1.4 .4-1.4 .4-1.5 .4-1.4 .5-1.3 .6-1.4 .6-1.4 .6-1.3 .7-1.3 .7-1.3 .8-1.2 .8-1.3 .9-1.2 .8-1.1 1-1.2 .9-1.1 1-1 1.1-1.1 1-1 1.2-.9 1.1-1 1.2-.9 1.2-.8 1.2-.8 1.2-.8 1.3-.7 1.3-.7 1.3-.6 1.4-.6 1.4-.6 1.3-.5 1.5-.4 1.4-.4 1.4-.4 1.5-.3 1.4-.3 1.5-.2 1.5-.2 1.4-.1 1.5-.1 1.5 0 1.5 0 1.5 .1 1.5 .1 1.5 .2 1.5 .2 1.4 .3 1.5 .3 1.5 .4 1.4 .4 1.4 .4 1.5 .5 1.4 .6 1.3 .6 1.4 .6 1.4 .7 1.3 .7 1.3 .8 1.3 .8 1.2 .8 1.2 .9 1.2 1 1.2 .9 1.2 1 1.1 1.1 1 1 1.1 1.1 1 1.2 .9 1.1 1 1.2 .8 1.3 .9 1.2 .8 1.3 .8 1.3 .7 1.3 .7 1.4 .6 1.4 .6 1.3 .6 1.4 .5 1.5 .4 1.4 .4 1.4 .4 1.5 .3 1.5 .3 1.4 .2 1.5 .2 1.5 .1 1.5 .1 1.5 0 1.5 0 1.5-.1 1.5-.1 1.4-.2 1.5-.2 1.5-.3 1.4-.3 1.5-.4 1.4-.4 1.4-.4 1.4-.5 1.4-.6 1.4-.6 1.4-.6 1.3-.7 1.3-.7 1.3-.8 1.2-.8 1.2-.9 1.2-.8 1.2-1 1.1-.9 1.2-1 1-1.1 1.1-1 1-1.1 .9-1.2 1-1.2 .8-1.2 .9-1.2 .8-1.2 .8-1.3 .7-1.3 .7-1.3 .6-1.4 .6-1.4 .6-1.3 .5-1.4 .4-1.5 .4-1.4 .4-1.4 .3-1.5 .3-1.5 .2-1.4 .2-1.5 .1-1.5 0-1.5 .1-1.5-.1-1.5 0-1.5-.1-1.5-.2-1.4z"},{"ports":["port-said"],"d":"M534.5 160.2l-.3-1.4-.3-1.4-.3-1.4-.4-1.3-.5-1.4-.4-1.3-.6-1.3-.5-1.3-.6-1.3-.7-1.3-.7-1.2-.7-1.2-.7-1.2-.9-1.2-.8-1.1-.9-1.1-.9-1.1-.9-1-1-1-1-1-1.1-1-1.1-.9-1.1-.9-1.1-.8-1.2-.8-1.2-.8-1.2-.7-1.2-.7-1.3-.6-1.2-.6-1.3-.6-1.3-.5-1.4-.5-1.3-.4-1.4-.4-1.4-.4-1.3-.3-1.4-.2-1.4-.2-1.4-.2-1.4-.1-1.4-.1-1.5 0-1.4 0-1.4 .1-1.4 .1-1.4 .2-1.4 .2-1.4 .2-1.4 .3-1.3 .4-1.4 .4-1.3 .4-1.4 .5-1.3 .5-1.3 .6-1.3 .6-1.2 .6-1.3 .7-1.2 .7-1.2 .8-1.1 .8-1.2 .8-1.1 .9-1 .9-1.1 1-1 1-1 1-.9 1-.9 1.1-.9 1.1-.9 1.1-.8 1.2-.7 1.2-.8 1.2-.6 1.2-.7 1.3-.6 1.3-.6 1.3-.5 1.3-.5 1.3-.4 1.4-.4 1.3-.3 1.4-.3 1.4-.3 1.4-.2 1.4-.1 1.4-.2 1.4 0 1.4 0 1.4 0 1.4 0 1.4 .2 1.4 .1 1.4 .2 1.4 .3 1.4 .3 1.4 .3 1.4 .4 1.3 .4 1.4 .5 1.3 .5 1.3 .6 1.3 .6 1.3 .7 1.3 .6 1.2 .8 1.2 .7 1.2 .8 1.2 .9 1.1 .9 1.1 .9 1.1 .9 1 1 1 1 1 1.1 1 1 .9 1.1 .9 1.2 .8 1.1 .8 1.2 .8 1.2 .7 1.3 .7 1.2 .6 1.3 .6 1.3 .6 1.3 .5 1.4 .5 1.3 .4 1.4 .4 1.3 .4 1.4 .3 1.4 .2 1.4 .2 1.4 .2 1.4 .1 1.4 .1 1.4 0 1.5 0 1.4-.1 1.4-.1 1.4-.2 1.4-.2 1.4-.2 1.3-.3 1.4-.4 1.4-.4 1.3-.4 1.4-.5 1.3-.5 1.3-.6 1.2-.6 1.3-.6 1.2-.7 1.2-.7 1.2-.8 1.2-.8 1.1-.8 1.1-.9 1.1-.9 1.1-1 1-1 1-1 .9-1 .9-1.1 .9-1.1 .8-1.1 .9-1.2 .7-1.2 .7-1.2 .7-1.2 .7-1.3 .6-1.3 .5-1.3 .6-1.3 .4-1.3 .5-1.4 .4-1.3 .3-1.4 .3-1.4 .3-1.4 .2-1.4 .1-1.4 .1-1.4 .1-1.4 0-1.4 0-1.4-.1-1.4-.1-1.4-.1-1.4z"},{"ports":["chittagong"],"d":"M1001 239.8l-.3-1.3-.3-1.3-.3-1.2-.3-1.3-.4-1.2-.5-1.3-.4-1.2-.6-1.2-.5-1.2-.6-1.1-.7-1.2-.6-1.1-.7-1.1-.8-1.1-.8-1-.8-1-.8-1-.9-1-.9-.9-.9-.9-1-.9-1-.9-1-.8-1.1-.7-1-.8-1.1-.7-1.2-.7-1.1-.6-1.2-.6-1.1-.6-1.2-.5-1.3-.5-1.2-.4-1.2-.4-1.3-.4-1.3-.3-1.2-.3-1.3-.2-1.3-.2-1.3-.1-1.3-.1-1.3-.1-1.3 0-1.3 0-1.3 .1-1.3 .1-1.3 .1-1.3 .2-1.3 .2-1.3 .3-1.3 .3-1.2 .4-1.3 .4-1.2 .4-1.2 .5-1.2 .5-1.2 .6-1.1 .6-1.2 .6-1.1 .7-1.1 .7-1.1 .8-1 .7-1 .8-1 .9-1 .9-.9 .9-1 .9-.8 1-.9 1-.8 1-.8 1-.7 1.1-.7 1.1-.7 1.1-.6 1.2-.6 1.1-.6 1.2-.5 1.2-.5 1.2-.4 1.3-.4 1.2-.4 1.3-.3 1.2-.3 1.3-.2 1.3-.2 1.3-.1 1.3-.1 1.3-.1 1.3 0 1.3 0 1.3 .1 1.3 .1 1.3 .1 1.3 .2 1.3 .2 1.3 .3 1.3 .3 1.2 .4 1.3 .4 1.2 .4 1.3 .5 1.2 .5 1.2 .6 1.1 .6 1.2 .6 1.2 .7 1.1 .7 1.1 .7 1 .8 1.1 .8 1 .9 1 .8 1 1 .9 .9 .9 1 .9 1 .8 1 .9 1 .7 1.1 .8 1.1 .7 1.1 .7 1.2 .6 1.1 .6 1.2 .6 1.2 .5 1.2 .4 1.2 .5 1.3 .4 1.2 .3 1.3 .4 1.3 .2 1.3 .3 1.3 .2 1.3 .1 1.3 .1 1.3 .1 1.3 0 1.3 0 1.3-.1 1.3-.1 1.3-.1 1.3-.2 1.3-.3 1.2-.2 1.3-.4 1.3-.3 1.2-.4 1.2-.5 1.3-.4 1.2-.5 1.1-.6 1.2-.6 1.1-.6 1.2-.7 1.1-.7 1-.8 1.1-.7 1-.9 1-.8 1-.9 .9-.9 .9-.9 .9-1 .8-1 .8-1 .8-1.1 .8-1 .7-1.1 .6-1.1 .7-1.2 .6-1.2 .5-1.1 .6-1.2 .4-1.2 .5-1.3 .4-1.2 .3-1.3 .3-1.2 .3-1.3 .3-1.3 .2-1.3 .1-1.3 .1-1.3 .1-1.3 0-1.3 0-1.3-.1-1.3-.1-1.3-.1-1.3z"},{"ports":["jeddah"],"d":"M585.2 247.1l-.2-1.3-.3-1.3-.3-1.2-.4-1.3-.4-1.2-.4-1.2-.5-1.3-.5-1.1-.5-1.2-.6-1.2-.7-1.1-.6-1.1-.7-1.1-.8-1.1-.7-1-.9-1-.8-1-.9-1-.9-.9-.9-.9-1-.9-1-.8-1-.8-1-.8-1.1-.8-1.1-.7-1.1-.6-1.1-.7-1.2-.6-1.1-.5-1.2-.5-1.2-.5-1.3-.4-1.2-.4-1.3-.4-1.2-.3-1.3-.3-1.3-.2-1.2-.2-1.3-.2-1.3-.1-1.3 0-1.3 0-1.3 0-1.3 0-1.3 .1-1.3 .2-1.3 .2-1.3 .2-1.2 .3-1.3 .3-1.2 .4-1.3 .4-1.2 .4-1.2 .5-1.2 .5-1.2 .5-1.1 .6-1.2 .7-1.1 .6-1.1 .7-1 .8-1.1 .8-1 .8-1 .8-.9 .9-1 .9-.9 .9-.9 1-.8 1-.8 1-.8 1-.7 1.1-.7 1.1-.7 1.1-.6 1.1-.6 1.2-.6 1.2-.5 1.1-.5 1.3-.4 1.2-.4 1.2-.3 1.3-.4 1.2-.2 1.3-.3 1.3-.2 1.2-.1 1.3-.1 1.3-.1 1.3 0 1.3 0 1.3 .1 1.3 .1 1.3 .1 1.3 .2 1.3 .3 1.3 .2 1.2 .4 1.3 .3 1.2 .4 1.3 .4 1.2 .5 1.2 .5 1.2 .6 1.2 .6 1.1 .6 1.2 .7 1.1 .7 1.1 .7 1 .8 1.1 .8 1 .8 1 .9 .9 .9 1 1 .9 .9 .9 1 .8 1 .8 1.1 .8 1 .7 1.1 .7 1.1 .7 1.2 .6 1.1 .6 1.2 .6 1.2 .5 1.2 .5 1.2 .4 1.3 .4 1.2 .4 1.3 .3 1.2 .2 1.3 .3 1.3 .2 1.3 .1 1.3 .1 1.3 .1 1.3 0 1.3 0 1.3-.1 1.3-.1 1.3-.1 1.2-.2 1.3-.3 1.3-.2 1.2-.3 1.3-.4 1.2-.4 1.3-.4 1.2-.5 1.2-.5 1.1-.6 1.2-.6 1.1-.6 1.1-.7 1.1-.7 1.1-.7 1-.8 1-.8 1-.8 1-.9 .9-.9 .9-1 .9-.9 .8-1 .9-1 .7-1.1 .8-1 .7-1.1 .6-1.1 .7-1.2 .6-1.1 .5-1.2 .5-1.2 .5-1.2 .4-1.2 .4-1.3 .4-1.2 .3-1.3 .3-1.2 .2-1.3 .2-1.3 .2-1.3 .1-1.3 0-1.3 .1-1.3-.1-1.3 0-1.3-.1-1.3-.2-1.3z"},{"ports":["dakar"],"d":"M136.9 303.7l-.2-1.2-.3-1.2-.3-1.2-.3-1.2-.4-1.2-.4-1.2-.5-1.1-.5-1.2-.5-1.1-.6-1.1-.6-1.1-.7-1.1-.6-1-.7-1.1-.8-1-.8-1-.8-.9-.8-.9-.9-.9-.9-.9-.9-.8-1-.8-.9-.8-1-.8-1.1-.7-1-.7-1.1-.6-1.1-.6-1.1-.6-1.1-.5-1.2-.5-1.1-.5-1.2-.4-1.2-.4-1.2-.3-1.2-.3-1.2-.3-1.2-.2-1.3-.2-1.2-.1-1.3-.1-1.2-.1-1.3 0-1.2 0-1.3 .1-1.2 .1-1.2 .1-1.3 .2-1.2 .2-1.2 .3-1.2 .3-1.2 .3-1.2 .4-1.2 .4-1.2 .5-1.1 .5-1.1 .5-1.2 .6-1 .6-1.1 .6-1.1 .7-1 .7-1 .8-1 .8-.9 .8-1 .8-.9 .9-.8 .9-.9 .9-.8 .9-.7 1-.8 1-.7 1.1-.7 1-.6 1.1-.6 1.1-.6 1.1-.5 1.1-.5 1.2-.5 1.1-.4 1.2-.4 1.2-.3 1.2-.3 1.2-.3 1.2-.2 1.2-.2 1.3-.1 1.2-.1 1.3-.1 1.2 0 1.3 0 1.2 .1 1.3 .1 1.2 .1 1.2 .2 1.3 .2 1.2 .3 1.2 .3 1.2 .3 1.2 .4 1.2 .4 1.2 .5 1.2 .5 1.1 .5 1.1 .6 1.2 .6 1 .6 1.1 .7 1.1 .7 1 .8 1 .7 1 .8 .9 .9 1 .8 .8 .9 .9 1 .9 .9 .8 1 .7 1 .8 1 .7 1.1 .7 1.1 .6 1 .6 1.2 .6 1.1 .5 1.1 .5 1.2 .5 1.2 .4 1.2 .4 1.2 .3 1.2 .3 1.2 .3 1.2 .2 1.3 .2 1.2 .1 1.2 .1 1.3 .1 1.2 0 1.3 0 1.2-.1 1.3-.1 1.2-.1 1.3-.2 1.2-.2 1.2-.3 1.2-.3 1.2-.3 1.2-.4 1.2-.4 1.1-.5 1.2-.5 1.1-.5 1.1-.6 1.1-.6 1.1-.6 1-.7 1.1-.7 1-.8 .9-.7 1-.8 .9-.9 .9-.9 .9-.8 .8-1 .8-.9 .8-1 .8-1 .7-1 .6-1.1 .7-1.1 .6-1 .6-1.2 .5-1.1 .5-1.1 .5-1.2 .4-1.2 .4-1.2 .3-1.2 .3-1.2 .3-1.2 .2-1.2 .2-1.3 .1-1.2 .1-1.2 .1-1.3 0-1.2 0-1.3-.1-1.2-.1-1.3-.1-1.2z"},{"ports":["djibouti"],"d":"M614.6 328.9l-.2-1.2-.3-1.2-.3-1.2-.3-1.2-.4-1.2-.4-1.2-.5-1.1-.4-1.1-.6-1.2-.5-1.1-.6-1-.7-1.1-.6-1-.7-1-.8-1-.7-1-.8-.9-.9-1-.8-.8-.9-.9-.9-.8-1-.8-.9-.8-1-.7-1-.7-1.1-.7-1-.6-1.1-.6-1.1-.6-1.1-.5-1.2-.5-1.1-.5-1.2-.4-1.1-.4-1.2-.3-1.2-.3-1.2-.3-1.2-.2-1.3-.2-1.2-.1-1.2-.1-1.2-.1-1.3 0-1.2 0-1.2 .1-1.3 .1-1.2 .1-1.2 .2-1.2 .2-1.2 .3-1.2 .3-1.2 .3-1.2 .4-1.2 .4-1.1 .5-1.1 .5-1.1 .5-1.1 .6-1.1 .6-1.1 .6-1 .7-1 .7-1 .7-1 .8-.9 .8-.9 .8-.9 .9-.9 .8-.8 1-.8 .9-.8 1-.7 1-.7 1-.7 1-.6 1.1-.6 1-.6 1.1-.5 1.2-.5 1.1-.5 1.1-.4 1.2-.3 1.2-.4 1.2-.3 1.2-.2 1.2-.3 1.2-.1 1.2-.2 1.2-.1 1.2 0 1.3-.1 1.2 .1 1.2 0 1.3 .1 1.2 .2 1.2 .1 1.3 .3 1.2 .2 1.2 .3 1.2 .4 1.2 .3 1.1 .4 1.2 .5 1.1 .5 1.2 .5 1.1 .6 1.1 .6 1.1 .6 1 .7 1.1 .7 1 .7 1 .8 .9 .8 1 .8 .9 .9 .9 .9 .8 .9 .9 .9 .7 1 .8 1 .7 1 .8 1 .6 1.1 .7 1.1 .6 1.1 .5 1.1 .5 1.1 .5 1.1 .5 1.2 .4 1.2 .4 1.2 .3 1.2 .3 1.2 .3 1.2 .2 1.2 .2 1.2 .1 1.3 .1 1.2 .1 1.2 0 1.3 0 1.2-.1 1.2-.1 1.2-.1 1.3-.2 1.2-.2 1.2-.3 1.2-.3 1.2-.3 1.1-.4 1.2-.4 1.1-.5 1.2-.5 1.1-.5 1.1-.5 1.1-.6 1-.7 1.1-.6 1-.8 1-.7 .9-.8 1-.7 .9-.9 .9-.8 .8-.9 .9-.9 .8-1 .7-.9 .8-1 .7-1 .6-1.1 .7-1 .6-1.1 .5-1.1 .6-1.1 .4-1.2 .5-1.1 .4-1.2 .4-1.1 .3-1.2 .3-1.2 .3-1.2 .2-1.2 .2-1.3 .1-1.2 .1-1.2 .1-1.3 0-1.2 0-1.2-.1-1.3-.1-1.2-.1-1.2z"},{"ports":["mombasa"],"d":"M586.3 452.1l-.2-1.2-.3-1.2-.4-1.1-.3-1.2-.4-1.1-.5-1.2-.5-1.1-.5-1.1-.5-1-.6-1.1-.6-1-.7-1.1-.7-1-.7-.9-.8-1-.7-.9-.9-.9-.8-.9-.9-.8-.9-.8-.9-.8-.9-.8-1-.7-1-.7-1-.6-1.1-.6-1-.6-1.1-.6-1.1-.5-1.1-.5-1.1-.4-1.2-.4-1.1-.4-1.2-.3-1.2-.3-1.2-.3-1.1-.2-1.2-.2-1.2-.1-1.3-.1-1.2-.1-1.2 0-1.2 0-1.2 .1-1.2 .1-1.2 .1-1.2 .2-1.2 .2-1.2 .3-1.2 .3-1.1 .3-1.2 .4-1.1 .4-1.1 .4-1.1 .5-1.1 .5-1.1 .6-1.1 .6-1 .6-1 .6-1 .7-1 .7-1 .8-.9 .8-.9 .8-.8 .8-.9 .9-.8 .9-.8 .9-.7 1-.8 .9-.6 1-.7 1.1-.6 1-.6 1.1-.6 1-.5 1.1-.5 1.1-.4 1.2-.4 1.1-.4 1.2-.3 1.1-.3 1.2-.3 1.2-.2 1.2-.2 1.2-.1 1.2-.1 1.2-.1 1.2 0 1.2 0 1.2 .1 1.2 .1 1.2 .1 1.2 .2 1.2 .2 1.2 .3 1.2 .3 1.2 .3 1.1 .4 1.2 .4 1.1 .4 1.2 .5 1.1 .5 1.1 .6 1.1 .6 1 .6 1 .7 1.1 .6 1 .8 .9 .7 1 .8 .9 .8 .9 .9 .9 .8 .8 .9 .8 .9 .8 1 .8 1 .7 1 .7 1 .6 1 .7 1.1 .5 1.1 .6 1.1 .5 1.1 .5 1.1 .4 1.1 .5 1.2 .3 1.1 .4 1.2 .2 1.2 .3 1.2 .2 1.2 .2 1.2 .1 1.2 .1 1.2 .1 1.2 0 1.2 0 1.2-.1 1.3-.1 1.2-.1 1.2-.2 1.1-.2 1.2-.3 1.2-.2 1.2-.4 1.1-.3 1.2-.5 1.1-.4 1.1-.5 1.1-.5 1.1-.6 1-.5 1.1-.7 1-.6 1-.7 1-.7 .9-.8 .9-.8 .9-.8 .9-.8 .8-.9 .9-.9 .7-.9 .8-1 .7-.9 .7-1 .7-1.1 .6-1 .6-1 .5-1.1 .5-1.1 .5-1.1 .5-1.2 .4-1.1 .3-1.2 .4-1.1 .3-1.2 .2-1.2 .2-1.2 .2-1.2 .2-1.2 .1-1.2 0-1.2 0-1.2 0-1.2 0-1.2-.1-1.2-.2-1.2-.2-1.2z"},{"ports":["singapore"],"d":"M1092.9 410.1l-.3-1.2-.3-1.2-.3-1.1-.4-1.2-.4-1.1-.5-1.2-.4-1.1-.5-1.1-.6-1-.6-1.1-.6-1-.7-1-.7-1-.7-1-.7-1-.8-.9-.8-.9-.9-.8-.8-.9-.9-.8-.9-.8-1-.7-1-.7-1-.7-1-.7-1-.6-1.1-.6-1-.5-1.1-.6-1.1-.4-1.2-.5-1.1-.4-1.1-.4-1.2-.3-1.2-.3-1.2-.2-1.2-.3-1.1-.1-1.2-.2-1.3-.1-1.2 0-1.2-.1-1.2 .1-1.2 0-1.2 .1-1.2 .2-1.2 .1-1.2 .3-1.2 .2-1.1 .3-1.2 .3-1.1 .4-1.2 .4-1.1 .5-1.1 .4-1.1 .6-1.1 .5-1 .6-1.1 .6-1 .7-1 .7-.9 .7-1 .7-.9 .8-.9 .8-.9 .9-.8 .8-.8 .9-.8 .9-.8 1-.7 1-.7 1-.6 1-.6 1-.6 1.1-.6 1-.5 1.1-.5 1.1-.4 1.2-.4 1.1-.4 1.2-.3 1.1-.3 1.2-.3 1.2-.2 1.2-.2 1.2-.1 1.2-.1 1.2-.1 1.2 0 1.2 0 1.2 .1 1.2 .1 1.2 .1 1.2 .2 1.2 .2 1.2 .3 1.2 .3 1.1 .3 1.2 .4 1.1 .4 1.2 .4 1.1 .5 1.1 .5 1.1 .6 1.1 .6 1 .6 1.1 .6 1 .7 1 .7 1 .8 .9 .8 .9 .8 .9 .8 .9 .9 .8 .9 .8 .9 .8 1 .8 .9 .7 1 .7 1 .6 1.1 .7 1 .5 1.1 .6 1.1 .5 1.1 .5 1.1 .4 1.2 .4 1.1 .4 1.2 .3 1.1 .3 1.2 .3 1.2 .2 1.2 .2 1.2 .1 1.2 .1 1.2 .1 1.2 0 1.2 0 1.2-.1 1.3-.1 1.2-.1 1.1-.2 1.2-.2 1.2-.3 1.2-.3 1.2-.3 1.1-.4 1.1-.4 1.2-.4 1.1-.5 1.1-.5 1-.6 1.1-.5 1-.7 1-.6 1-.7 1-.7 1-.8 .9-.8 .9-.8 .8-.8 .9-.9 .8-.9 .8-.9 .7-.9 .7-1 .7-1 .7-1 .6-1.1 .6-1 .6-1.1 .5-1.1 .4-1.1 .5-1.1 .4-1.2 .4-1.1 .3-1.2 .3-1.1 .3-1.2 .2-1.2 .1-1.2 .2-1.2 .1-1.2 0-1.2 .1-1.2-.1-1.2 0-1.2-.1-1.2-.2-1.2-.1-1.2z"}],"origin":[821.3,304.7]} as const;
// @generated:route-geometry:end

/** Major ports, in the generator's order (region by region): points on the map, names in the screen-reader list. */
const PORT_IDS = Object.keys(MAP.ports) as (keyof typeof MAP.ports)[];

const CSS = `
.route-map{container:route-map/inline-size;position:relative;margin:0;color:var(--on-dark,#e9eef2);background:#09131d radial-gradient(120% 90% at 58% 42%,#11263a 0%,#0b1824 48%,#070f17 100%);font-family:var(--font-mono,ui-monospace,monospace)}
.rm-canvas{position:relative;--rm-k:1}
.rm-base,.rm-overlay{position:absolute;inset:0;width:100%;height:100%;display:block}
.rm-base{object-fit:contain;user-select:none;pointer-events:none}
.rm-overlay{overflow:hidden}
.rm-overlay text{font-family:inherit;paint-order:stroke;stroke:#09141f;stroke-width:3.2px;stroke-linejoin:round}
.rm-area{fill:#9cc1dc;fill-opacity:.075;stroke:#9cc1dc;stroke-opacity:.5;stroke-width:.9px;stroke-dasharray:3 3.5;stroke-linejoin:round}
.rm-pan{position:relative}
.route-map .route-path,.route-map .route-casing{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0}
.route-map .route-path{stroke:#eef3f6;stroke-opacity:.92;stroke-width:1.6px}
.route-map .route-casing{stroke:#07111a;stroke-opacity:.55;stroke-width:4.5px}
.rm-scale{transform:scale(var(--rm-k))}
.rm-pt-glow{fill:url(#rm-origin-glow);opacity:.7}
.rm-pt-ring{fill:none;stroke:var(--accent,#ea5a16);stroke-opacity:.55;stroke-width:1px}
.rm-pt-dot{fill:var(--accent,#ea5a16);stroke:#fff;stroke-width:1px}
.rm-origin .rm-ring{fill:none;stroke:var(--accent,#ea5a16);stroke-opacity:.55;stroke-width:1.2px}
.rm-origin .rm-ring--outer{stroke-opacity:.22}
.rm-origin .rm-glow{fill:url(#rm-origin-glow)}
.rm-origin .rm-dot{fill:var(--accent,#ea5a16);stroke:#fff;stroke-width:1.2px}
.rm-origin-name{font-size:12px;font-weight:500;letter-spacing:.12em;fill:#fff}
.rm-origin-sub{font-size:9.5px;letter-spacing:.14em;fill:var(--on-dark-soft,#aab7c2)}
.rm-label-n{font-size:10px;font-weight:500;letter-spacing:.16em;fill:var(--accent,#ea5a16)}
.rm-label-name{font-size:12.5px;font-weight:500;letter-spacing:.2em;fill:#eef3f6}
.rm-pass{font-size:8.5px;letter-spacing:.12em;fill:var(--on-dark-soft,#aab7c2);fill-opacity:.85}
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
 .rm-area{stroke-width:1.1px;stroke-dasharray:3.6 4.2}
}
@container route-map (max-width:1099px){
 .rm-grat,.rm-pass{display:none}
}
@container route-map (max-width:899px){
 .rm-canvas{--rm-k:1.6}
 .rm-origin-sub{display:none}
 .route-map .route-path{stroke-width:2.6px}
 .route-map .route-casing{stroke-width:7.5px}
 .rm-area{fill-opacity:.09;stroke-width:1.5px;stroke-dasharray:4.5 5}
}
@container route-map (max-width:599px){
 .rm-pan{overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%)}
 .rm-pan::-webkit-scrollbar{display:none}
 .rm-canvas{width:max(175%,600px);--rm-k:1.8}
 .route-map .route-path{stroke-width:3.8px}
 .route-map .route-casing{stroke-width:9px}
 .rm-area{fill-opacity:.11;stroke-width:2px;stroke-dasharray:6 6}
 .rm-pan-hint{display:block}
 .rm-foot{padding-top:12px}
}
`;

export function RouteMap({
  caption = "Illustrative routes and operating areas, not confirmed sailing routes or port calls.",
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
  const portNames = PORT_IDS.map(id => MAP.ports[id].name);
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
          <title id={titleId}>LOURDES: illustrative route of operation from Goa</title>
          <desc id={descId}>
            Map from the BNBSBD shipyard at Fomar, Shiroda, Goa, to the intended operating regions: the Mediterranean, the west
            coast of Africa, Asia and the Indian Ocean. Small orange points mark the major ports and the route ends, and shaded
            circles around Goa and each port show illustrative operating areas. The lines are illustrative connections, not
            confirmed sailing routes or port calls.
          </desc>
          <defs>
            <radialGradient id="rm-origin-glow">
              <stop offset="0" stopColor="#ea5a16" stopOpacity="0.32" />
              <stop offset="1" stopColor="#ea5a16" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="rm-areas" aria-hidden="true">
            {MAP.areas.map(a => (
              <path key={a.ports.join("-")} className="rm-area" data-area={a.ports.join(" ")} d={a.d} />
            ))}
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
                    <circle className="rm-pt-glow" r={12} />
                    <circle className="rm-pt-ring" r={5.2} />
                    <circle className="rm-pt-dot" r={2.4} />
                  </g>
                </g>
              );
            })}
          </g>

          <g className="rm-ports" aria-hidden="true">
            {PORT_IDS.map(id => {
              const p = MAP.ports[id];
              return (
                <g key={id} className="rm-port" data-port={id} transform={`translate(${p.x} ${p.y})`}>
                  <g className="rm-scale">
                    <circle className="rm-pt-glow" r={12} />
                    <circle className="rm-pt-ring" r={5.2} />
                    <circle className="rm-pt-dot" r={2.4} />
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
            {MAP.passages.map(p => {
              const [x, y] = MAP.labels[p.key];
              return (
                <text key={p.key} x={x} y={y} textAnchor={p.anchor}>
                  {p.text}
                </text>
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
                  LOURDES NEWBUILD PROGRAMME
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
            <svg width="22" height="14" viewBox="0 0 22 14">
              <circle cx="11" cy="7" r="4.4" fill="none" stroke="#ea5a16" strokeOpacity="0.55" strokeWidth="0.9" />
              <circle cx="11" cy="7" r="2" fill="#ea5a16" stroke="#fff" strokeWidth="0.9" />
            </svg>
            Major port or route end
          </li>
          <li>
            <svg width="28" height="14" viewBox="0 0 28 14">
              <path d="M2 10 C 9 2, 18 2, 26 6" fill="none" stroke="#eef3f6" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Illustrative route
          </li>
          <li>
            <svg width="22" height="14" viewBox="0 0 22 14">
              <circle cx="11" cy="7" r="6.2" fill="#9cc1dc" fillOpacity="0.14" stroke="#9cc1dc" strokeOpacity="0.7" strokeWidth="0.9" strokeDasharray="2 2" />
            </svg>
            Illustrative operating area
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
        <li>
          Major ports marked on the map, each with an illustrative operating area around it: {portNames.slice(0, -1).join(", ")}{" "}
          and {portNames[portNames.length - 1]}. Goa has the same operating area around the shipyard.
        </li>
      </ol>
    </figure>
  );
}

export default RouteMap;
