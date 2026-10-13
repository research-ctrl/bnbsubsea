#!/usr/bin/env python3
"""Create the Lourdes route-of-operation map: base map SVG + overlay geometry.

Outputs
  public/images/route/base-map.svg   land, coastline and a faint graticule (no text, transparent sea)
  components/route-map.tsx           the block between the "@generated:route-geometry" markers is
                                     rewritten with the overlay geometry (same projection and viewBox)

Map data
  Natural Earth land polygons, public domain (https://www.naturalearthdata.com/about/terms-of-use/).
  1:50m land is drawn. The land/water check of the routes uses 1:10m land plus 1:10m minor islands
  (finer coastline); the routes must also stay off the 1:50m land that is drawn.
  The GeoJSON files come from the Natural Earth vector repository
  https://github.com/nvkelso/natural-earth-vector (folder geojson/). They are cached outside the
  repository in --ne-dir (default D:/BNB_Website_work/data/natural_earth) and downloaded there only
  when missing. The SHA-256 of the files used is printed on every run.
  Cached copy used on 12 Oct 2026:
    ne_50m_land.geojson  1,636,166 bytes  sha256 e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b
    ne_10m_land.geojson 10,157,965 bytes  sha256 1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416

Routes
  Illustrative sea lanes from the BNBSBD shipyard at Fomar, Shiroda, Goa (approx. 15.33 N, 74.03 E,
  Shiroda village reference point) to the four intended operating regions. They are NOT confirmed
  sailing routes, passage plans or port calls. Each route is a smooth curve (centripetal Catmull-Rom
  converted to cubic Beziers) through the waypoints below. The script samples every drawn route
  (the rounded path data, as published) at >= 2,000 points and checks each sample against the 1:10m
  and 1:50m land polygons. Two kinds of segment are exempt from the check because the waterway is
  narrower than the land data: the Zuari estuary from the yard to Mormugao Bay, and the Suez Canal.
  The run fails (exit code 1) if any other sample falls on land.
  Lanes chosen for the illustration (12 Oct 2026):
    Mediterranean        Arabian Sea, north of Socotra, Gulf of Aden, Bab-el-Mandeb, Red Sea, Gulf of Suez,
                         Suez Canal, south of Crete; ends in the central Mediterranean (Ionian Sea).
    West coast of Africa the Mediterranean lane continued through the Strait of Sicily and the Strait of
                         Gibraltar, then south off Morocco, between Fuerteventura and Gran Canaria, past
                         Cap Blanc and Cap-Vert; ends off Sierra Leone. The Cape of Good Hope lane is an
                         equally plausible alternative; the Mediterranean lane was chosen because it links
                         the named regions in one sequence. Neither is a passage plan.
    Asia                 down the Konkan and Kerala coast inside Lakshadweep, round Kanyakumari, south of
                         Sri Lanka, Great Channel, Strait of Malacca, Singapore Strait; ends in the
                         South China Sea off southern Vietnam.
    Indian Ocean         south-west across the Arabian Sea, west of Lakshadweep; ends in the western
                         Indian Ocean (no port implied).
  Region end points are positions at sea inside each region, not ports or port calls.

Major ports and operating areas (owner's final changes, 13 Oct 2026)
  A small orange point, in the style of the BNBSBD yard marker, marks each major port in the operating
  regions (the route ends use the same point); the ports are not named on the map, only in its
  screen-reader text (owner: "remove those black circles and the names"). Every port, Goa included, has
  the same illustrative operating radius around it; overlapping circles merge into one operating area. The
  ports are approximate harbour positions used as reference points: not port calls, agencies or services.
  The radius is illustrative and is not published as a figure. Mercator is conformal, so a circle of fixed
  ground radius is drawn as a circle whose radius grows with 1/cos(lat). The script checks that every port
  lies on the coast (within PORT_COAST_KM of 1:10m land) and reports operating circles that nearly touch.

Labels
  The region, origin and passage labels are checked at every map breakpoint (BREAKPOINTS, which mirror the
  CSS in route-map.tsx): they must stay clear of each other, of the routes, of every point and of the map
  edges. The run fails if one does not.

Country borders are deliberately not drawn (only coastlines).

Usage (from the website folder):
  python scripts/create-route-map.py [--ne-dir DIR] [--no-write]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
BASE_OUT = ROOT / "public" / "images" / "route" / "base-map.svg"
TSX = ROOT / "components" / "route-map.tsx"
NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/{name}.geojson"
DEFAULT_NE_DIR = Path("D:/BNB_Website_work/data/natural_earth")

# ----------------------------------------------------------------------------- projection
# Mercator, cropped to the Atlantic / Mediterranean / Indian Ocean / South-East Asia extent.
W = 1200
LON_W, LON_E = -30.0, 122.0
LAT_N, LAT_S = 47.5, -21.0
R_EARTH_KM = 6371.0


def merc(lat: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


K = W / math.radians(LON_E - LON_W)  # px per radian
Y_N = merc(LAT_N)
H = round((Y_N - merc(LAT_S)) * K)


def project(lon, lat):
    lon = np.asarray(lon, dtype=float)
    lat = np.clip(np.asarray(lat, dtype=float), -85, 85)
    x = np.radians(lon - LON_W) * K
    y = (Y_N - np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))) * K
    return x, y


def unproject(x, y):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    lon = LON_W + np.degrees(x / K)
    lat = np.degrees(2 * np.arctan(np.exp(Y_N - y / K)) - np.pi / 2)
    return lon, lat


def pt(lon: float, lat: float) -> tuple[float, float]:
    x, y = project(lon, lat)
    return float(x), float(y)


# ----------------------------------------------------------------------------- places and routes
# Origin. Shiroda (Ponda taluka, South Goa) is about 15.329 N, 74.027 E (Wikipedia, cross-checked
# with the Shiroda post-office location 15.320 N, 74.029 E). The yard lies on the Zuari river; at
# this map scale (1 px ~ 14 km) the village reference point is used for the yard.
ORIGIN = (74.027, 15.329)

ESTUARY = "Zuari estuary (yard to Mormugao Bay)"
CANAL = "Suez Canal"

# Waypoints: (lon, lat, tag for the segment that STARTS at this waypoint or None).
GOA_OUT = [
    (ORIGIN[0], ORIGIN[1], ESTUARY),
    (73.78, 15.43, None),     # Mormugao Bay entrance
]

# Goa - Gulf of Aden - Red Sea - Suez Canal - Mediterranean - Gibraltar - west coast of Africa.
# The Mediterranean route is the first part of this lane (ends at MED_END), so the shared trunk is
# geometrically identical.
WEST_AFRICA = GOA_OUT + [
    (73.15, 15.55, None),
    (70.0, 15.25, None),
    (64.0, 14.2, None),       # Arabian Sea
    (57.0, 13.75, None),
    (53.5, 13.35, None),      # north of Socotra
    (49.5, 12.65, None),      # Gulf of Aden
    (45.6, 12.25, None),
    (43.75, 12.45, None),
    (43.33, 12.62, None),     # Bab-el-Mandeb
    (43.08, 13.1, None),
    (42.88, 13.75, None),     # east of the Hanish Islands
    (42.75, 14.35, None),
    (41.35, 15.4, None),      # southern Red Sea
    (40.15, 17.6, None),
    (38.75, 20.2, None),
    (37.15, 23.0, None),
    (35.35, 25.9, None),
    (34.2, 27.35, None),      # Strait of Gubal, east of Shadwan
    (33.78, 27.85, None),     # Gulf of Suez (mid-channel)
    (33.28, 28.35, None),
    (32.9, 28.95, None),
    (32.62, 29.5, None),
    (32.55, 29.9, CANAL),     # Suez
    (32.33, 31.3, None),      # Port Said
    (31.4, 32.15, None),
    (28.8, 33.2, None),
    (25.0, 34.05, None),      # south of Crete
    (19.4, 34.95, None),      # Ionian Sea, central Mediterranean
    (14.9, 35.35, None),      # south of Malta
    (12.0, 37.2, None),       # Strait of Sicily
    (9.2, 37.95, None),
    (5.0, 37.55, None),
    (1.0, 36.7, None),
    (-2.6, 36.3, None),       # Alboran Sea
    (-4.6, 36.12, None),
    (-5.5, 35.97, None),      # Strait of Gibraltar
    (-6.6, 35.85, None),
    (-9.3, 34.0, None),
    (-12.3, 30.6, None),
    (-14.95, 28.15, None),    # between Fuerteventura and Gran Canaria
    (-17.4, 24.4, None),
    (-18.15, 20.6, None),     # off Cap Blanc
    (-18.1, 16.4, None),
    (-17.95, 14.4, None),     # off Cap-Vert (Dakar)
    (-17.55, 11.6, None),
    (-16.5, 9.2, None),
    (-14.6, 7.2, None),       # region marker, off Sierra Leone
]
MED_END_AT = (19.4, 34.95)  # the Mediterranean route ends at this West Africa waypoint
MED_END = next(i for i, w in enumerate(WEST_AFRICA) if w[:2] == MED_END_AT)

ASIA = GOA_OUT + [
    (73.3, 15.0, None),
    (73.6, 13.2, None),
    (74.65, 10.9, None),      # between Lakshadweep and the Kerala coast
    (76.1, 8.25, None),
    (77.6, 7.05, None),       # off Kanyakumari
    (80.6, 5.45, None),       # south of Sri Lanka (Dondra Head)
    (85.5, 5.55, None),
    (90.5, 5.95, None),
    (94.45, 6.3, None),       # Great Channel (Great Nicobar - Sumatra)
    (97.4, 5.7, None),
    (99.1, 4.5, None),        # Strait of Malacca
    (100.45, 3.15, None),
    (101.55, 2.3, None),
    (102.6, 1.75, None),
    (103.25, 1.38, None),     # north of the Karimun islands
    (103.6, 1.2, None),
    (103.85, 1.19, None),     # Singapore Strait (mid-channel)
    (104.15, 1.26, None),
    (104.45, 1.38, None),
    (105.0, 2.4, None),
    (105.6, 4.4, None),       # South China Sea
    (107.1, 6.5, None),
    (108.3, 7.8, None),       # region marker
]

INDIAN_OCEAN = GOA_OUT + [
    (73.2, 15.1, None),
    (72.4, 13.4, None),
    (70.5, 10.6, None),       # west of Lakshadweep
    (67.3, 6.4, None),
    (63.6, 2.2, None),
    (60.6, -1.15, None),      # region marker, western Indian Ocean
]

ROUTES = [
    # id, waypoints, number of Bezier segments drawn (None = all)
    ("mediterranean", WEST_AFRICA, MED_END),
    ("west-africa", WEST_AFRICA, None),
    ("asia", ASIA, None),
    ("indian-ocean", INDIAN_OCEAN, None),
]

# Label anchors (lon, lat) for the region labels; text-anchor chosen per label in the component.
LABELS = {
    "mediterranean": (20.0, 39.25),
    "west-africa": (-12.5, -2.6),  # 13 Oct 2026: moved from (-12.5, 0.6), clear of the Abidjan point
    "asia": (112.6, 9.6),
    "indian-ocean": (56.6, -6.9),  # 13 Oct 2026: moved from (58.6, -5.4), clear of the route end on phones
    "origin": (77.45, 17.0),  # 13 Oct 2026: from (76.6, 16.6), clear of the yard marker's rings
    # passages named on the map (small labels, wide screens only)
    "p-suez": (34.3, 30.9),
    # 13 Oct 2026: moved from (42.2, 11.2), over the Horn of Africa, to the Yemen side, clear of the Djibouti point
    "p-bab-el-mandeb": (44.1, 14.65),
    # 13 Oct 2026: beside the Gibraltar point, running west over the Atlantic, without a leader (it was north-east
    # of the strait with a leader, where the 10 px label met the route at 900-1199 px)
    "p-gibraltar": (-7.2, 37.3),
    "p-malacca": (99.0, 1.9),  # 13 Oct 2026: from (99.2, 2.4), clear of the route at 900-1199 px
}
# Region label lines as route-map.tsx draws them (ROUTES[].label, set in capitals; centred on the anchor).
REGION_LINES = {
    "mediterranean": ["MEDITERRANEAN"],
    "west-africa": ["WEST COAST", "OF AFRICA"],
    "asia": ["ASIA"],
    "indian-ocean": ["INDIAN OCEAN"],
}
# Passage labels: key in LABELS, text, text-anchor.
PASSAGES = [
    ("p-suez", "SUEZ CANAL", "start"),
    ("p-bab-el-mandeb", "BAB-EL-MANDEB", "start"),
    ("p-gibraltar", "STRAIT OF GIBRALTAR", "end"),
    ("p-malacca", "STRAIT OF MALACCA", "end"),
]

# Major ports (owner's final changes, 13 Oct 2026; see the module docstring). Approximate harbour positions.
# The name is used only in the map's screen-reader text.
PORTS = [
    # id            name           lon      lat
    ("mumbai", "Mumbai", 72.84, 18.94),
    ("kochi", "Kochi", 76.26, 9.97),
    ("colombo", "Colombo", 79.85, 6.95),
    ("male", "Malé", 73.51, 4.18),
    ("salalah", "Salalah", 54.00, 16.94),
    ("jebel-ali", "Jebel Ali", 55.03, 25.01),
    ("djibouti", "Djibouti", 43.14, 11.60),
    ("jeddah", "Jeddah", 39.17, 21.48),
    ("port-said", "Port Said", 32.30, 31.26),
    ("valletta", "Valletta", 14.51, 35.90),
    ("gibraltar", "Gibraltar", -5.35, 36.14),
    ("dakar", "Dakar", -17.43, 14.69),
    ("abidjan", "Abidjan", -4.01, 5.30),
    ("lagos", "Lagos", 3.40, 6.44),
    ("mombasa", "Mombasa", 39.67, -4.06),
    ("singapore", "Singapore", 103.84, 1.26),
    ("chittagong", "Chittagong", 91.80, 22.33),
]
OPERATING_RADIUS_KM = 520  # illustrative, the same for every port; not published
PORT_COAST_KM = 25         # a port position must lie within this distance of 1:10m land

# Label geometry, mirroring route-map.tsx. Text is IBM Plex Mono in capitals: advance 0.6 em, cap height
# 0.7 em; letter-spacing in em.
MONO_ADV, CAP_EM, DESC_EM, PAD = 0.6, 0.72, 0.06, 1.6
# Points (owner, 13 Oct 2026: every point in the orange BNBSBD style). Solid extent (ring + stroke) in marker
# units, scaled by k; the soft glows around the points may sit under labels.
POINT_RING = 5.7     # port and route-end point: ring r 5.2
ORIGIN_RING = 9.2    # yard marker: inner ring r 8.5 (its faint outer ring and glow may sit under labels)
# Map breakpoints by container width, as set in the CSS of route-map.tsx: k scales the labels and the points;
# casing is the route casing width; small labels (passages, graticule) and the origin's second and third lines
# show only on the wider maps; edge is the margin kept clear at the sides (below 600 px the panning map fades
# out over its first and last 18 px).
BREAKPOINTS = [
    dict(name=">=1200 px", k=1.0, casing=4.5, passages=8.5, grat=8.5, subs=True, edge=3),
    dict(name="900-1199 px", k=1.35, casing=5.5, passages=10.0, grat=10.0, subs=True, edge=3),
    dict(name="600-899 px", k=1.6, casing=7.5, passages=None, grat=None, subs=False, edge=3),
    dict(name="<600 px", k=1.8, casing=9.0, passages=None, grat=None, subs=False, edge=36),
]

GRATICULE_STEP = 15


# ----------------------------------------------------------------------------- data
def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def natural_earth(ne_dir: Path, name: str) -> Path:
    path = ne_dir / f"{name}.geojson"
    if not path.exists():
        ne_dir.mkdir(parents=True, exist_ok=True)
        url = NE_URL.format(name=name)
        print(f"downloading {url}")
        with urllib.request.urlopen(url, timeout=300) as r:
            data = r.read()
        json.loads(data)  # must parse
        path.write_bytes(data)
    print(f"{path.name}: {path.stat().st_size:,} bytes, sha256 {sha256(path)}")
    return path


def load_land(path: Path, extent):
    """Land polygons (lon/lat) clipped to extent."""
    fc = json.loads(path.read_text(encoding="utf-8"))
    clip = box(*extent)
    parts = []
    for feat in fc["features"]:
        g = shape(feat["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        if g.intersects(clip):
            parts.append(g.intersection(clip))
    return unary_union(parts)


def polygons(g):
    if isinstance(g, Polygon):
        return [g]
    if isinstance(g, MultiPolygon):
        return list(g.geoms)
    return [p for p in getattr(g, "geoms", []) if isinstance(p, Polygon)]


def project_geom(g):
    return shapely.transform(g, lambda c: np.column_stack(project(c[:, 0], c[:, 1])))


# ----------------------------------------------------------------------------- svg helpers
def num(v: float) -> str:
    s = f"{v:.1f}"
    if s.endswith(".0"):
        s = s[:-2]
    if s.startswith("0.") and len(s) > 2:
        s = s[1:]
    elif s.startswith("-0.") and len(s) > 3:
        s = "-" + s[2:]
    if s == "-0":
        s = "0"
    return s


def ring_path(coords) -> str:
    """Closed ring as compact relative path data on a 0.1 px grid."""
    q = [(round(x * 10), round(y * 10)) for x, y in coords]
    pts = [q[0]]
    for p in q[1:]:
        if p != pts[-1]:
            pts.append(p)
    if len(pts) > 1 and pts[-1] == pts[0]:
        pts.pop()
    if len(pts) < 3:
        return ""
    out = [f"M{num(pts[0][0] / 10)} {num(pts[0][1] / 10)}l"]
    prev = pts[0]
    seq = []
    for p in pts[1:]:
        dx, dy = (p[0] - prev[0]) / 10, (p[1] - prev[1]) / 10
        seq.append(num(dx))
        seq.append(num(dy))
        prev = p
    body = ""
    for i, s in enumerate(seq):
        body += s if (i == 0 or s.startswith("-")) else " " + s
    out.append(body)
    out.append("z")
    return "".join(out)


# ----------------------------------------------------------------------------- curves
def catmull_rom_beziers(points, alpha=0.5):
    """Centripetal Catmull-Rom through points -> list of (p0, c1, c2, p1)."""
    P = [np.array(p, dtype=float) for p in points]
    n = len(P)
    segs = []
    for i in range(n - 1):
        p1, p2 = P[i], P[i + 1]
        p0 = P[i - 1] if i > 0 else 2 * p1 - p2
        p3 = P[i + 2] if i + 2 < n else 2 * p2 - p1
        d1 = max(np.linalg.norm(p1 - p0), 1e-6) ** alpha
        d2 = max(np.linalg.norm(p2 - p1), 1e-6) ** alpha
        d3 = max(np.linalg.norm(p3 - p2), 1e-6) ** alpha
        c1 = (d1 * d1 * p2 - d2 * d2 * p0 + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1) / (3 * d1 * (d1 + d2))
        c2 = (d3 * d3 * p1 - d2 * d2 * p3 + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2) / (3 * d3 * (d3 + d2))
        segs.append((p1, c1, c2, p2))
    return segs


def r1(v: float) -> float:
    return round(float(v), 1)


def route_d(segs) -> str:
    p0 = segs[0][0]
    d = [f"M{num(r1(p0[0]))} {num(r1(p0[1]))}"]
    for _, c1, c2, p1 in segs:
        d.append("C" + " ".join(f"{num(r1(a))} {num(r1(b))}" for a, b in (c1, c2, p1)))
    return "".join(d)


def parse_d(d: str):
    """Parse the M/C path written by route_d back into bezier segments (validates what is published)."""
    nums = [float(v) for v in re.findall(r"-?\d*\.?\d+", d)]
    start = np.array(nums[:2])
    segs = []
    rest = nums[2:]
    cur = start
    for i in range(0, len(rest), 6):
        c1 = np.array(rest[i:i + 2]); c2 = np.array(rest[i + 2:i + 4]); p1 = np.array(rest[i + 4:i + 6])
        segs.append((cur, c1, c2, p1))
        cur = p1
    return segs


def sample_segments(segs, target=2400, min_n=12):
    """Sample bezier segments densely: >= target points per route and >= 1.5 points per px."""
    hulls = [np.linalg.norm(c1 - p0) + np.linalg.norm(c2 - c1) + np.linalg.norm(p1 - c2) for p0, c1, c2, p1 in segs]
    per_px = max(1.5, target / max(sum(hulls), 1e-6))
    xs, ys, seg_idx = [], [], []
    for k, (p0, c1, c2, p1) in enumerate(segs):
        n = max(min_n, int(math.ceil(hulls[k] * per_px)))
        t = np.linspace(0, 1, n, endpoint=(k == len(segs) - 1))
        mt = 1 - t
        b = (mt ** 3)[:, None] * p0 + (3 * mt * mt * t)[:, None] * c1 + (3 * mt * t * t)[:, None] * c2 + (t ** 3)[:, None] * p1
        xs.append(b[:, 0]); ys.append(b[:, 1]); seg_idx.append(np.full(n, k))
    return np.concatenate(xs), np.concatenate(ys), np.concatenate(seg_idx)


# ----------------------------------------------------------------------------- ports, areas and labels
def text_box(x, y, text, size, ls, anchor):
    """Box (x0, y0, x1, y1) of a single line of capitals in the mono font, baseline at y."""
    w = len(text) * size * (MONO_ADV + ls)
    x0 = x if anchor == "start" else x - w if anchor == "end" else x - w / 2
    return (x0 - PAD, y - size * CAP_EM - PAD, x0 + w + PAD, y + size * DESC_EM + PAD)


def overlaps(a, b) -> bool:
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def hits_disc(b, x, y, r) -> bool:
    """Does box b intersect the disc of radius r at (x, y)?"""
    nx, ny = min(max(x, b[0]), b[2]), min(max(y, b[1]), b[3])
    return math.hypot(nx - x, ny - y) < r


def hits_route(b, route_pts, margin) -> bool:
    inside = (route_pts[:, 0] > b[0] - margin) & (route_pts[:, 0] < b[2] + margin) & (route_pts[:, 1] > b[1] - margin) & (route_pts[:, 1] < b[3] + margin)
    return bool(inside.any())


def port_radius_px(lat: float) -> float:
    return OPERATING_RADIUS_KM / R_EARTH_KM * K / math.cos(math.radians(lat))


def fixed_labels(bp, geometry):
    """Boxes of the labels drawn at this breakpoint: (group, box). Lines of one label share a group."""
    k = bp["k"]
    boxes = []
    for rid, lines in REGION_LINES.items():
        x, y = geometry["labels"][rid]
        boxes.append((f"region {rid}", text_box(x, y - 14 * k, "00", 10 * k, 0.16, "middle")))
        for i, line in enumerate(lines):
            boxes.append((f"region {rid}", text_box(x, y + i * 15 * k, line, 12.5 * k, 0.2, "middle")))
    ox, oy = geometry["labels"]["origin"]
    boxes.append(("origin label", text_box(ox, oy, "GOA · FOMAR, SHIRODA", 12 * k, 0.12, "start")))
    if bp["subs"]:
        boxes.append(("origin label", text_box(ox, oy + 14 * k, "BNBSBD SHIPYARD", 9.5 * k, 0.14, "start")))
        boxes.append(("origin label", text_box(ox, oy + 26 * k, "LOURDES NEWBUILD PROGRAMME", 9.5 * k, 0.14, "start")))
    if bp["passages"]:
        for key, text, anchor in PASSAGES:
            x, y = geometry["labels"][key]
            boxes.append((f"passage {key}", text_box(x, y, text, bp["passages"], 0.12, anchor)))
    return boxes


def check_labels(geometry, route_xy):
    """Region, origin and passage labels: clear of each other, the routes, every point and the map edges."""
    route_pts = np.concatenate([np.column_stack(xy) for xy in route_xy.values()])
    points = [(f"{pid} point", p["x"], p["y"], POINT_RING) for pid, p in geometry["ports"].items()]
    points += [(f"{rid} route end", *r["end"], POINT_RING) for rid, r in geometry["routes"].items()]
    points.append(("yard marker", *geometry["origin"], ORIGIN_RING))
    problems = 0
    print("\nlabels (region, origin, passages) at every breakpoint")
    for bp in BREAKPOINTS:
        k, e = bp["k"], bp["edge"]
        boxes = fixed_labels(bp, geometry)
        found = []
        for i, (name, b) in enumerate(boxes):
            if b[0] < e or b[2] > W - e or b[1] < 3 or b[3] > H - 3:
                found.append(f"{name} at the map edge")
            for other, ob in boxes[i + 1:]:
                if other != name and overlaps(b, ob):
                    found.append(f"{name} overlaps {other}")
            for pname, px, py, r in points:
                if hits_disc(b, px, py, r * k + 1):
                    found.append(f"{name} covers the {pname}")
            if hits_route(b, route_pts, bp["casing"] / 2 + 0.5):
                found.append(f"{name} crosses a route")
        found = sorted(set(found))
        print(f"  {bp['name']:12s} {'clear' if not found else ''}")
        for f in found:
            print(f"      CONFLICT: {f}")
        problems += len(found)
    return problems


def operating_areas(ports_px):
    """Operating circles around every port (Goa first); overlapping circles merge into one area."""
    circles = [(pid, x, y, port_radius_px(lat)) for pid, x, y, lat in ports_px]
    print(f"\noperating areas: radius {OPERATING_RADIUS_KM} km around each of {len(circles)} ports (illustrative)")
    for i, (a, ax, ay, ar) in enumerate(circles):
        for b, bx, by, br in circles[i + 1:]:
            dist = math.hypot(ax - bx, ay - by)
            gap = dist - (ar + br)
            # the point where the two circles (nearly) touch; no pinch shows if a third circle covers it
            t = (ar + gap / 2) / dist
            mx, my = ax + (bx - ax) * t, ay + (by - ay) * t
            covered = any(math.hypot(mx - cx, my - cy) < cr - 3 for c, cx, cy, cr in circles if c not in (a, b))
            if abs(gap) < 0.12 * min(ar, br) and not covered:
                print(f"  WARNING: the {a} and {b} circles nearly touch (gap {gap:+.1f} px)")
    discs = [Point(x, y).buffer(r, quad_segs=48) for _, x, y, r in circles]
    union = unary_union(discs).intersection(box(0, 0, W, H))
    areas = []
    for poly in sorted(polygons(union), key=lambda p: -p.area):
        members = [pid for (pid, x, y, _), d in zip(circles, discs) if poly.contains(Point(x, y))]
        d = ring_path(poly.exterior.coords) + "".join(ring_path(r.coords) for r in poly.interiors)
        areas.append({"ports": members, "d": d})
        print(f"  area {' + '.join(members)}")
    return areas


# ----------------------------------------------------------------------------- build
def build(ne_dir: Path, write: bool) -> int:
    pad = 4.0
    extent = (LON_W - pad, LAT_S - pad, LON_E + pad, LAT_N + pad)
    land50 = load_land(natural_earth(ne_dir, "ne_50m_land"), extent)
    land10 = load_land(natural_earth(ne_dir, "ne_10m_land"), extent)
    minor = load_land(natural_earth(ne_dir, "ne_10m_minor_islands"), extent)
    print(f"projection: Mercator, lon {LON_W}..{LON_E}, lat {LAT_S}..{LAT_N}, viewBox 0 0 {W} {H}")

    # ---------------- base map
    land_px = project_geom(land50).simplify(0.22, preserve_topology=True)
    land_px = land_px.intersection(box(-6, -6, W + 6, H + 6))
    paths = []
    kept = dropped = 0
    for poly in polygons(land_px):
        if poly.area < 0.35:
            dropped += 1
            continue
        kept += 1
        rings = [ring_path(poly.exterior.coords)] + [ring_path(r.coords) for r in poly.interiors if Polygon(r).area >= 0.35]
        paths.append("".join(r for r in rings if r))
    land_d = "".join(paths)

    grat = []
    for lon in range(-30, 121, GRATICULE_STEP):
        x, _ = pt(lon, 0)
        if 0 < x < W:
            grat.append(f"M{num(r1(x))} 0V{H}")
    for lat in range(-15, 46, GRATICULE_STEP):
        if lat:  # the equator is drawn separately (dashed)
            _, y = pt(0, lat)
            grat.append(f"M0 {num(r1(y))}H{W}")
    _, y_eq = pt(0, 0)
    grat_d = "".join(grat)

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
        "<!-- Base map for the Lourdes route-of-operation map. Land: Natural Earth 1:50m (public domain), "
        f"Mercator, lon {num(LON_W)} to {num(LON_E)}, lat {num(LAT_S)} to {num(LAT_N)}. "
        "Generated by scripts/create-route-map.py; the overlay in components/route-map.tsx uses the same viewBox. -->"
        "<defs>"
        '<linearGradient id="fx"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".07" stop-color="#fff"/>'
        '<stop offset=".93" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="fy" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".1" stop-color="#fff"/>'
        '<stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        f'<mask id="mx"><rect width="{W}" height="{H}" fill="url(#fx)"/></mask>'
        f'<mask id="my"><rect width="{W}" height="{H}" fill="url(#fy)"/></mask>'
        "</defs>"
        '<g mask="url(#mx)"><g mask="url(#my)">'
        f'<path d="{grat_d}" fill="none" stroke="#c9d4dc" stroke-opacity=".07" stroke-width=".6"/>'
        f'<path d="M0 {num(r1(y_eq))}H{W}" fill="none" stroke="#c9d4dc" stroke-opacity=".12" stroke-width=".6" stroke-dasharray="2 5"/>'
        f'<path d="{land_d}" fill="#c9d4dc" fill-opacity=".12" fill-rule="evenodd" stroke="#d5dee5" stroke-opacity=".4" '
        'stroke-width=".55" stroke-linejoin="round"/>'
        "</g></g></svg>\n"
    )

    # ---------------- routes and validation
    land10_ll = unary_union([land10, minor])  # 1:10m land + 1:10m minor islands
    land50_ll = land50
    shapely.prepare(land10_ll)
    shapely.prepare(land50_ll)
    coast_px = project_geom(land10_ll).boundary
    pieces = []
    for line in getattr(coast_px, "geoms", [coast_px]):
        c = np.asarray(line.coords)
        for i in range(0, len(c) - 1, 64):
            seg = c[i:i + 65]
            if len(seg) >= 2:
                pieces.append(LineString(seg))
    tree = shapely.STRtree(pieces)
    km_per_px_eq = R_EARTH_KM / K

    geometry = {"width": W, "height": H, "routes": {}, "labels": {}, "graticule": {}, "passages": [], "ports": {}, "areas": []}
    route_xy = {}
    ox, oy = pt(*ORIGIN)
    geometry["origin"] = [r1(ox), r1(oy)]
    failures = 0
    print("\nland/water check (published path data vs 1:10m land + minor islands and 1:50m land)")
    for rid, wps, nseg in ROUTES:
        pts_px = [pt(lon, lat) for lon, lat, _ in wps]
        tags = [tag for _, _, tag in wps]
        segs = catmull_rom_beziers(pts_px)
        if nseg is not None:
            segs = segs[:nseg]
        d = route_d(segs)
        psegs = parse_d(d)
        x, y, si = sample_segments(psegs)
        lon, lat = unproject(x, y)
        exempt = np.array([tags[k] is not None for k in si])
        on10 = shapely.contains_xy(land10_ll, lon, lat)
        on50 = shapely.contains_xy(land50_ll, lon, lat)
        bad = (on10 | on50) & ~exempt
        idx = tree.query_nearest(shapely.points(np.column_stack([x, y])), return_distance=True, all_matches=False)
        dist_px = np.full(len(x), np.inf)
        np.minimum.at(dist_px, idx[0][0], idx[1])
        dist_km = dist_px * km_per_px_eq * np.cos(np.radians(lat))
        free = ~exempt
        clear = dist_km[free & ~bad]
        ex_reasons = sorted({tags[k] for k in set(si[exempt].tolist())})
        length_px = float(np.sum(np.hypot(np.diff(x), np.diff(y))))
        print(
            f"  route-{rid:13s} samples {len(x):5d}  on land {int(bad.sum()):3d}  "
            f"exempt {int(exempt.sum()):3d} ({'; '.join(ex_reasons) or '-'})  "
            f"min clearance {clear.min():6.1f} km  length {length_px:6.0f} px"
        )
        if bad.any():
            failures += int(bad.sum())
            for j in np.flatnonzero(bad)[:12]:
                print(f"      on land at {lon[j]:.3f}, {lat[j]:.3f} (segment {si[j]})")
        # narrowest point once clear of Mormugao Bay (the first segments run along the Goa coast)
        sea = free & ~bad & (si >= len(GOA_OUT))
        j = int(np.argmin(np.where(sea, dist_km, np.inf)))
        print(f"      closest approach to land after Mormugao Bay: {dist_km[j]:.1f} km at {lon[j]:.2f}, {lat[j]:.2f}")
        end = psegs[-1][3]
        geometry["routes"][rid] = {"d": d, "end": [r1(end[0]), r1(end[1])]}
        route_xy[rid] = (x, y)

    for k, (lon, lat) in LABELS.items():
        x, y = pt(lon, lat)
        geometry["labels"][k] = [r1(x), r1(y)]
    geometry["graticule"]["lon"] = [[lon, r1(pt(lon, 0)[0])] for lon in range(0, 121, 30)]
    geometry["graticule"]["lat"] = [[lat, r1(pt(0, lat)[1])] for lat in (-15, 0, 15, 30, 45)]
    geometry["passages"] = [{"key": key, "text": text, "anchor": anchor} for key, text, anchor in PASSAGES]

    # ---------------- major ports, operating areas, label check
    print(f"\nports (distance to the 1:10m coastline; must be within {PORT_COAST_KM} km)")
    for pid, name, lon, lat in PORTS:
        x, y = pt(lon, lat)
        geometry["ports"][pid] = {"name": name, "x": r1(x), "y": r1(y)}
        nearest = tree.query_nearest(shapely.points([[x, y]]), return_distance=True, all_matches=False)
        coast_km = float(nearest[1][0]) * km_per_px_eq * math.cos(math.radians(lat))
        print(f"  {pid:11s} {lat:6.2f} {lon:7.2f}  {coast_km:5.1f} km from the coastline")
        if coast_km > PORT_COAST_KM:
            failures += 1
            print(f"      FAILED: {pid} is {coast_km:.1f} km from the coast")
    ports_px = [("goa", ox, oy, ORIGIN[1])] + [(pid, *pt(lon, lat), lat) for pid, _n, lon, lat in PORTS]
    geometry["areas"] = operating_areas(ports_px)
    label_problems = check_labels(geometry, route_xy)
    if label_problems:
        failures += label_problems
        print(f"  FAILED: {label_problems} label conflicts")

    print(f"\nbase map: {kept} land polygons kept, {dropped} below 0.35 px^2 dropped, {len(svg.encode()):,} bytes")
    if failures:
        print(f"FAILED: {failures} problems (routes on land, ports off the coast or label conflicts)")
        return 1
    if not write:
        print("--no-write: nothing written")
        return 0

    BASE_OUT.parent.mkdir(parents=True, exist_ok=True)
    BASE_OUT.write_text(svg, encoding="utf-8", newline="\n")
    print(f"wrote {BASE_OUT.relative_to(ROOT)}")

    src = TSX.read_text(encoding="utf-8")
    start, end = "// @generated:route-geometry:start", "// @generated:route-geometry:end"
    if start not in src or end not in src:
        print(f"{TSX} has no generated-geometry markers; overlay geometry not written")
        return 1
    block = (
        f"{start} (scripts/create-route-map.py — do not edit by hand)\n"
        f"const MAP = {json.dumps(geometry, separators=(',', ':'))} as const;\n"
    )
    head, rest = src.split(start, 1)
    _, tail = rest.split(end, 1)
    TSX.write_text(head + block + end + tail, encoding="utf-8", newline="\n")
    print(f"updated geometry block in {TSX.relative_to(ROOT)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ne-dir", type=Path, default=DEFAULT_NE_DIR, help="Natural Earth GeoJSON cache folder")
    ap.add_argument("--no-write", action="store_true", help="check only, write nothing")
    a = ap.parse_args()
    return build(a.ne_dir, not a.no_write)


if __name__ == "__main__":
    sys.exit(main())
