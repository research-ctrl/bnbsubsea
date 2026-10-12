/**
 * Frame streaming for scroll-scrubbed image sequences (see tools/encode_sequence.py for the format).
 *
 * Strategy
 *  - Only a window of frames around the current position is fetched (more ahead in the scroll
 *    direction than behind), followed by a coarse every-Nth pass so a fast scrub always has a nearby
 *    frame. Fetches run with limited concurrency and are aborted when they fall far out of range.
 *  - Fetched frames are kept as compressed Blobs (bounded by bytes). Only a few frames around the
 *    current position are decoded (createImageBitmap, off the main thread) into a bounded cache;
 *    evicted bitmaps are close()d, so decoded memory stays bounded.
 *  - The caller always draws the nearest decoded frame, so the stage is never blank once anything
 *    has loaded (and the poster sits underneath until then).
 *  - Warm mode (before the visitor reaches the story): only the first few frames are fetched; the full
 *    window and the coarse pass start when the caller leaves warm mode.
 *  - After a long jump, the stored blob nearest the target (usually a coarse frame) is decoded first, so
 *    a frame from another chapter never stays on screen while the window around the target loads.
 */

export type SequenceSet = { path: string; pad: number; step: number; width: number; height: number };
export type SetName = "lg" | "sm";

export type SequenceManifest = {
  id: string;
  frames: number;
  width: number;
  height: number;
  sets: Record<SetName, SequenceSet>;
  poster: Record<SetName, string>;
  chapters: { id: string; title?: string; start: number; end: number; still?: Record<SetName, string> }[];
  bytes?: Partial<Record<SetName, number>>;
};

type Drawable = ImageBitmap | HTMLImageElement;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function validSet(s: unknown): s is SequenceSet {
  return isObj(s) && typeof s.path === "string" && s.path.includes("{n}") && Number(s.pad) > 0 && Number(s.step) >= 1;
}

/** Fetch and validate a manifest. Throws on any problem (missing file, HTML fallback page, bad shape). */
export async function fetchManifest(url: string, signal?: AbortSignal): Promise<SequenceManifest> {
  const res = await fetch(url, { signal, cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html")) throw new Error("manifest missing (html response)");
  const m: unknown = await res.json();
  if (!isObj(m) || !(Number(m.frames) >= 2) || !isObj(m.sets) || !validSet(m.sets.lg) || !validSet(m.sets.sm) || !Array.isArray(m.chapters)) {
    throw new Error("manifest invalid");
  }
  return m as unknown as SequenceManifest;
}

export function frameUrl(set: SequenceSet, n: number): string {
  return set.path.replace("{n}", String(n).padStart(set.pad, "0"));
}

/** Timeline frame numbers available in a set: 1, 1+step, ... plus the final frame. */
export function setFrameList(set: SequenceSet, frames: number): number[] {
  const out: number[] = [];
  for (let f = 1; f <= frames; f += set.step) out.push(f);
  if (out[out.length - 1] !== frames) out.push(frames);
  return out;
}

export type StoreOptions = {
  manifest: SequenceManifest;
  set: SetName;
  /** decoded frames kept in memory */
  maxBitmaps: number;
  /** compressed bytes kept in memory */
  maxBlobBytes: number;
  concurrency: number;
  onFrame: (frame: number) => void;
  onFatal: () => void;
};

export class FrameStore {
  readonly frames: number[];
  readonly set: SequenceSet;
  readonly setName: SetName;
  private opts: StoreOptions;
  private blobs = new Map<number, Blob>(); // insertion order = LRU order
  private blobBytes = 0;
  private bitmaps = new Map<number, Drawable>();
  private inflight = new Map<number, AbortController>();
  private decoding = new Set<number>();
  private failures = new Map<number, number>();
  private successes = 0;
  private cur = 0; // index into frames
  private dir: 1 | -1 = 1;
  private paused = true;
  private disposed = false;
  private warm = false;
  private coarse: number[];

  constructor(opts: StoreOptions) {
    this.opts = opts;
    this.setName = opts.set;
    this.set = opts.manifest.sets[opts.set];
    this.frames = setFrameList(this.set, opts.manifest.frames);
    const every = Math.max(2, Math.round(this.frames.length / 24));
    this.coarse = this.frames.map((_, i) => i).filter(i => i % every === 0 || i === this.frames.length - 1);
  }

  /** Index of the available frame nearest to a timeline frame. */
  indexOf(frame: number): number {
    const step = this.set.step;
    const n = this.frames.length;
    const i = Math.round((frame - 1) / step);
    if (i >= n - 1) return n - 1;
    if (i <= 0) return 0;
    // the final frame may be closer than the last regular step
    if (i === n - 2 && Math.abs(this.frames[n - 1] - frame) < Math.abs(this.frames[i] - frame)) return n - 1;
    return i;
  }

  nearestAvailable(frame: number): number {
    return this.frames[this.indexOf(frame)];
  }

  /** Decoded frame nearest to `frame` (exact if present). */
  nearestDecoded(frame: number): { frame: number; image: Drawable } | null {
    const exact = this.bitmaps.get(frame);
    if (exact) return { frame, image: exact };
    let best: number | null = null;
    let bestD = Infinity;
    for (const f of this.bitmaps.keys()) {
      const d = Math.abs(f - frame);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best === null ? null : { frame: best, image: this.bitmaps.get(best)! };
  }

  get loadedCount(): number {
    return this.blobs.size;
  }

  /** Move the loading window. `frame` is a timeline frame number. */
  setTarget(frame: number): void {
    const idx = this.indexOf(frame);
    if (idx !== this.cur) this.dir = idx > this.cur ? 1 : -1;
    this.cur = idx;
    this.pump();
  }

  pause(): void {
    this.paused = true;
  }

  /** Warm mode: fetch only the opening window (no coarse pass) until the visitor enters the story. */
  setWarm(on: boolean): void {
    if (this.warm === on) return;
    this.warm = on;
    if (!on) this.pump();
  }

  resume(): void {
    if (this.disposed) return;
    this.paused = false;
    this.pump();
  }

  /** Release decoded frames except those right around the current position (used when offscreen). */
  trim(keep = 2): void {
    for (const [f, img] of this.bitmaps) {
      if (Math.abs(this.indexOf(f) - this.cur) > keep) {
        this.bitmaps.delete(f);
        close(img);
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.paused = true;
    for (const c of this.inflight.values()) c.abort();
    this.inflight.clear();
    for (const img of this.bitmaps.values()) close(img);
    this.bitmaps.clear();
    this.blobs.clear();
    this.blobBytes = 0;
  }

  private windowIndices(): number[] {
    const big = this.setName === "lg";
    const ahead = this.warm ? 6 : big ? 18 : 14;
    const behind = this.warm ? 0 : big ? 6 : 5;
    const n = this.frames.length;
    const out: number[] = [this.cur];
    for (let d = 1; d <= ahead; d++) {
      const a = this.cur + d * this.dir;
      if (a >= 0 && a < n) out.push(a);
      if (d <= behind) {
        const b = this.cur - d * this.dir;
        if (b >= 0 && b < n) out.push(b);
      }
    }
    return out;
  }

  private pump(): void {
    if (this.paused || this.disposed) return;
    const win = this.windowIndices();
    const coarse = this.warm ? [] : [...this.coarse].sort((a, b) => Math.abs(a - this.cur) - Math.abs(b - this.cur));
    const wanted = new Set<number>([...win, ...coarse].map(i => this.frames[i]));

    // abort fetches that are no longer wanted (user jumped far away)
    for (const [f, ctl] of this.inflight) {
      if (!wanted.has(f)) {
        ctl.abort();
        this.inflight.delete(f);
      }
    }

    // fetch: window first, then the coarse pass
    for (const i of [...win, ...coarse]) {
      if (this.inflight.size >= this.opts.concurrency) break;
      const f = this.frames[i];
      if (this.blobs.has(f) || this.inflight.has(f) || (this.failures.get(f) ?? 0) >= 2) continue;
      this.fetchFrame(f);
    }

    // decode: after a long jump nothing decoded is near the target: decode the nearest stored blob first
    // (usually a coarse frame), so the canvas shows something from the right part of the story at once
    if (this.decoding.size < 2 && this.nearestDecodedDistance() > 3) {
      let bestF = -1;
      let bestD = Infinity;
      for (const f of this.blobs.keys()) {
        const d = Math.abs(this.indexOf(f) - this.cur);
        if (d < bestD && !this.bitmaps.has(f) && !this.decoding.has(f)) {
          bestD = d;
          bestF = f;
        }
      }
      if (bestF >= 0 && bestD < this.nearestDecodedDistance()) this.decodeFrame(bestF);
    }

    // decode: a small window around the current frame, nearest first
    const decodeWin = win.slice(0, 10);
    for (const i of decodeWin) {
      if (this.decoding.size >= 2) break;
      const f = this.frames[i];
      if (this.bitmaps.has(f) || this.decoding.has(f) || !this.blobs.has(f)) continue;
      this.decodeFrame(f);
    }
  }

  /** Distance (in set indices) from the current position to the nearest decoded frame. */
  private nearestDecodedDistance(): number {
    let best = Infinity;
    for (const f of this.bitmaps.keys()) best = Math.min(best, Math.abs(this.indexOf(f) - this.cur));
    return best;
  }

  private fetchFrame(f: number): void {
    const ctl = new AbortController();
    this.inflight.set(f, ctl);
    fetch(frameUrl(this.set, f), { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        const type = res.headers.get("content-type") || "";
        if (type.includes("text/html")) throw new Error("html");
        return res.blob();
      })
      .then(blob => {
        if (this.disposed) return;
        if (this.inflight.get(f) === ctl) this.inflight.delete(f);
        this.successes++;
        this.storeBlob(f, blob);
        this.pump();
      })
      .catch((err: unknown) => {
        if (this.inflight.get(f) === ctl) this.inflight.delete(f);
        if (this.disposed || (err instanceof DOMException && err.name === "AbortError")) return;
        this.failures.set(f, (this.failures.get(f) ?? 0) + 1);
        const failed = this.failures.size;
        if (this.successes === 0 && failed >= 6) {
          this.opts.onFatal();
          return;
        }
        // retry later, gently
        window.setTimeout(() => this.pump(), 800);
      });
  }

  private storeBlob(f: number, blob: Blob): void {
    this.blobs.set(f, blob);
    this.blobBytes += blob.size;
    // evict least-recently-stored blobs that are far from the current position
    if (this.blobBytes > this.opts.maxBlobBytes) {
      for (const [k, b] of this.blobs) {
        if (this.blobBytes <= this.opts.maxBlobBytes * 0.9) break;
        if (Math.abs(this.indexOf(k) - this.cur) < 24) continue;
        this.blobs.delete(k);
        this.blobBytes -= b.size;
      }
    }
  }

  private decodeFrame(f: number): void {
    const blob = this.blobs.get(f);
    if (!blob) return;
    this.decoding.add(f);
    decodeBlob(blob)
      .then(img => {
        this.decoding.delete(f);
        if (this.disposed) {
          close(img);
          return;
        }
        this.bitmaps.set(f, img);
        this.evictBitmaps();
        this.opts.onFrame(f);
        this.pump();
      })
      .catch(() => {
        this.decoding.delete(f);
        // a corrupt blob: drop it so it can be fetched again
        this.blobs.delete(f);
        this.blobBytes -= blob.size;
        this.failures.set(f, (this.failures.get(f) ?? 0) + 1);
      });
  }

  private evictBitmaps(): void {
    while (this.bitmaps.size > this.opts.maxBitmaps) {
      let far = -1;
      let farD = -1;
      for (const f of this.bitmaps.keys()) {
        const d = Math.abs(this.indexOf(f) - this.cur);
        if (d > farD) {
          farD = d;
          far = f;
        }
      }
      const img = this.bitmaps.get(far);
      this.bitmaps.delete(far);
      if (img) close(img);
    }
  }
}

function close(img: Drawable): void {
  if ("close" in img && typeof img.close === "function") img.close();
}

async function decodeBlob(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draw `img` into a canvas of size w x h using cover/contain fitting. */
export function drawFitted(ctx: CanvasRenderingContext2D, img: Drawable, w: number, h: number, fit: "cover" | "contain"): void {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  const s = fit === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  if (fit === "contain") ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Network/device hints. Everything is optional: unknown means "fine". */
export function deviceHints(): { saveData: boolean; slow: boolean; lowMemory: boolean } {
  const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number };
  const c = nav.connection;
  const saveData = !!c?.saveData;
  const slow = !!c?.effectiveType && ["slow-2g", "2g", "3g"].includes(c.effectiveType);
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  return { saveData, slow, lowMemory };
}
