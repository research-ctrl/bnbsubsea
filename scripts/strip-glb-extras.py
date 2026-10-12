"""Strip builder metadata ("extras") from a glTF binary for web delivery.

The Blender export of Lourdes (blender/lourdes/exports/Lourdes_web.glb, written by
blender/lourdes/scripts/lourdes_export_glb.py) carries every object's custom properties as glTF
"extras": explode groups, rest positions and builder notes that cite internal source drawings. The
viewer needs none of it, and the notes should not be published, so the web copy drops them.

Only the JSON chunk changes; the binary chunk (Draco geometry, accessors) is copied byte for byte,
and node, mesh and material names are kept.

usage: python scripts/strip-glb-extras.py <in.glb> <out.glb>
(in and out may be the same file)
"""

import hashlib
import json
import struct
import sys

GLB_MAGIC = 0x46546C67  # "glTF"
CHUNK_JSON = 0x4E4F534A
CHUNK_BIN = 0x004E4942


def read_glb(data: bytes):
    magic, version, length = struct.unpack_from("<III", data, 0)
    if magic != GLB_MAGIC or version != 2 or length != len(data):
        raise SystemExit("not a glTF 2.0 binary (or truncated)")
    chunks = []
    off = 12
    while off < length:
        clen, ctype = struct.unpack_from("<II", data, off)
        chunks.append((ctype, data[off + 8 : off + 8 + clen]))
        off += 8 + clen
    if not chunks or chunks[0][0] != CHUNK_JSON:
        raise SystemExit("first chunk is not JSON")
    return chunks


def strip(node, counter):
    if isinstance(node, dict):
        if "extras" in node:
            del node["extras"]
            counter[0] += 1
        for v in node.values():
            strip(v, counter)
    elif isinstance(node, list):
        for v in node:
            strip(v, counter)


def write_glb(gltf: dict, others) -> bytes:
    js = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    js += b" " * ((4 - len(js) % 4) % 4)
    body = struct.pack("<II", len(js), CHUNK_JSON) + js
    for ctype, payload in others:
        pad = (4 - len(payload) % 4) % 4
        payload = payload + (b"\x00" * pad if ctype == CHUNK_BIN else b" " * pad)
        body += struct.pack("<II", len(payload), ctype) + payload
    return struct.pack("<III", GLB_MAGIC, 2, 12 + len(body)) + body


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    data = open(src, "rb").read()
    chunks = read_glb(data)
    gltf = json.loads(chunks[0][1].decode("utf-8"))
    counter = [0]
    strip(gltf, counter)
    out = write_glb(gltf, chunks[1:])
    # verify: parses again, same binary payload, no extras left
    again = read_glb(out)
    assert [c for c in again[1:]] == [c for c in chunks[1:]], "binary chunk changed"
    assert '"extras"' not in again[0][1].decode("utf-8"), "extras left"
    open(dst, "wb").write(out)
    print(f"{src}: {len(data):,} bytes, sha256 {hashlib.sha256(data).hexdigest()}")
    print(f"removed {counter[0]} extras objects; JSON chunk {len(chunks[0][1]):,} -> {len(again[0][1]):,} bytes")
    print(f"{dst}: {len(out):,} bytes, sha256 {hashlib.sha256(out).hexdigest()}")


if __name__ == "__main__":
    main()
