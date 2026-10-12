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
  Region end points are positions at sea inside each region's halo, not ports or port calls.

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
from shapely.geometry import LineString, MultiPolygon, Polygon, box, shape
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

# Soft region halos: centre lon/lat, radii in degrees of lon/lat, rotation (deg, screen space).
HALOS = {
    "mediterranean": dict(c=(18.0, 37.0), r=(21.0, 6.6), rot=-4),
    "west-africa": dict(c=(-15.0, 11.0), r=(8.0, 10.5), rot=18),
    "asia": dict(c=(105.5, 7.0), r=(12.5, 11.0), rot=0),
    "indian-ocean": dict(c=(62.5, -2.0), r=(15.0, 11.0), rot=-18),
}

# Label anchors (lon, lat) for the region labels; text-anchor chosen per label in the component.
LABELS = {
    "mediterranean": (20.0, 39.25),
    "west-africa": (-12.5, 0.6),
    "asia": (112.6, 9.6),
    "indian-ocean": (58.6, -5.4),
    "origin": (76.6, 16.6),
    # passages named on the map (small labels, wide screens only)
    "p-suez": (34.3, 30.9),
    "p-bab-el-mandeb": (42.2, 11.2),
    # review 12 Oct 2026: just north-east of the strait over the Spanish coast, with a short leader to the
    # strait (was (-6.3, 37.2) with the text running west over the open Atlantic)
    "p-gibraltar": (-4.3, 37.75),
    "p-gibraltar-from": (-5.45, 36.15),
    "p-malacca": (99.2, 2.4),
}

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

    geometry = {"width": W, "height": H, "routes": {}, "halos": {}, "labels": {}, "graticule": {}}
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

    for rid, h in HALOS.items():
        cx, cy = pt(*h["c"])
        x0, _ = pt(h["c"][0] - h["r"][0], h["c"][1])
        x1, _ = pt(h["c"][0] + h["r"][0], h["c"][1])
        _, y0 = pt(h["c"][0], h["c"][1] + h["r"][1])
        _, y1 = pt(h["c"][0], h["c"][1] - h["r"][1])
        geometry["halos"][rid] = {"cx": r1(cx), "cy": r1(cy), "rx": r1((x1 - x0) / 2), "ry": r1((y1 - y0) / 2), "rot": h["rot"]}
    for k, (lon, lat) in LABELS.items():
        x, y = pt(lon, lat)
        geometry["labels"][k] = [r1(x), r1(y)]
    geometry["graticule"]["lon"] = [[lon, r1(pt(lon, 0)[0])] for lon in range(0, 121, 30)]
    geometry["graticule"]["lat"] = [[lat, r1(pt(0, lat)[1])] for lat in (-15, 0, 15, 30, 45)]

    print(f"\nbase map: {kept} land polygons kept, {dropped} below 0.35 px^2 dropped, {len(svg.encode()):,} bytes")
    if failures:
        print(f"FAILED: {failures} samples on land outside the exempt waterways")
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
