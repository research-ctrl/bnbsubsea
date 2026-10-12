"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { Story } from "@/lib/site-content";
import { PosterPicture } from "@/components/poster-picture";
import {
  FrameStore,
  deviceHints,
  drawFitted,
  fetchManifest,
  frameUrl,
  setFrameList,
  type SequenceManifest,
  type SetName,
} from "@/lib/sequence-loader";

type Mode = "scroll" | "stills";
type ManifestState = "loading" | "ok" | "failed";

/** Frames the displayed image may trail the scroll position by (light smoothing only). */
const MAX_LAG = 6;
const SMOOTHING = 0.42;
const DPR_CAP = 1.5;

/* --------------------------------------------------------------- environment */

const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia(reducedQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(reducedQuery).matches;
const getReducedServer = () => false;

/**
 * Test hooks (harmless in production; they only change presentation):
 *   ?seq=_dev       use the dev fixture sequence for every story (development server only, and only when
 *                   the fixture has been put back in public/sequences/_dev; it is kept outside public/ so
 *                   no build lists it, and production builds ignore this value)
 *   ?seq=off        simulate a missing manifest
 *   ?motion=reduce  force the reduced-motion stills mode
 *   ?seqset=sm|lg   force a frame set
 *   ?seqclock=timer drive the player from timers instead of requestAnimationFrame and ignore page
 *                   visibility (only for automated checks in a hidden/background browser tab)
 */
function testOverrides() {
  const q = new URLSearchParams(window.location.search);
  return {
    seq: q.get("seq"),
    reduce: q.get("motion") === "reduce",
    set: q.get("seqset") as SetName | null,
    timer: q.get("seqclock") === "timer",
  };
}

function chooseSet(mediaWidth: number): SetName {
  const forced = testOverrides().set;
  if (forced === "lg" || forced === "sm") return forced;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  if (window.innerWidth <= 820 || deviceHints().lowMemory || mediaWidth * dpr <= 1100) return "sm";
  return "lg";
}

/* --------------------------------------------------------------- chapters */

type ResolvedChapter = { start: number; end: number; still?: Record<SetName, string> };

function resolveChapters(story: Story, manifest: SequenceManifest | null): { frames: number; chapters: ResolvedChapter[] } {
  const frames = manifest?.frames ?? story.frames;
  const scale = frames / story.frames;
  const chapters = story.chapters.map(c => {
    const m = manifest?.chapters.find(x => x.id === c.id);
    if (m) return { start: m.start, end: m.end, still: m.still };
    // manifest lacks this chapter id (or is unavailable): scale the default range
    return { start: Math.max(1, Math.round((c.start - 1) * scale) + 1), end: Math.max(1, Math.round(c.end * scale)) };
  });
  return { frames, chapters };
}

function chapterAt(chapters: ResolvedChapter[], frame: number): number {
  const f = Math.round(frame);
  for (let i = chapters.length - 1; i >= 0; i--) if (f >= chapters[i].start) return i;
  return 0;
}

const two = (n: number) => String(n).padStart(2, "0");

/** Set once the visitor scrolls, types or touches; used to avoid fighting their scroll position. */
let userInteracted = false;
if (typeof window !== "undefined") {
  const mark = () => {
    userInteracted = true;
  };
  for (const e of ["wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(e, mark, { once: true, passive: true });
}

/* --------------------------------------------------------------- component */

export function ScrollSequence({
  story,
  skipTo,
  skipLabel,
  vhPerFrame = 1.5,
  fit = "cover",
}: {
  story: Story;
  /** id of the element that follows the sequence */
  skipTo: string;
  skipLabel: string;
  vhPerFrame?: number;
  fit?: "cover" | "contain";
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const startedRef = useRef(false);
  const navRef = useRef<HTMLElement>(null);

  const prefersReduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);
  const [forcedStills, setForcedStills] = useState(false);
  const [manifest, setManifest] = useState<SequenceManifest | null>(null);
  const [manifestState, setManifestState] = useState<ManifestState>("loading");
  const [fatal, setFatal] = useState(false);
  const [setName, setSetName] = useState<SetName>("lg");
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [brokenStills, setBrokenStills] = useState<Record<string, true>>({});
  const [posterFailed, setPosterFailed] = useState(false);

  const mode: Mode = prefersReduced || forcedStills || fatal || manifestState === "failed" ? "stills" : "scroll";
  const { frames, chapters } = useMemo(() => resolveChapters(story, manifest), [story, manifest]);
  const count = story.chapters.length;

  // network / test-hook decisions and the manifest (tiny JSON) after mount
  useEffect(() => {
    const t = testOverrides();
    const hints = deviceHints();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only facts, unknown during SSR
    if (t.reduce || hints.saveData || hints.slow) setForcedStills(true);
    const url =
      t.seq === "_dev" && import.meta.env.DEV
        ? "/sequences/_dev/manifest.json"
        : t.seq === "off"
          ? "/sequences/__missing__/manifest.json"
          : story.manifest;
    const ctl = new AbortController();
    fetchManifest(url, ctl.signal)
      .then(m => {
        setManifest(m);
        setManifestState("ok");
      })
      .catch(() => {
        if (!ctl.signal.aborted) setManifestState("failed");
      });
    return () => ctl.abort();
  }, [story.manifest]);

  // pick the frame set from the stage size; re-pick only when crossing the breakpoint
  useEffect(() => {
    const update = () => setSetName(chooseSet(mediaRef.current?.clientWidth ?? window.innerWidth));
    update();
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(update, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // keep an anchor target in view if this section changes height after load (e.g. stills fallback)
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || userInteracted || performance.now() > 15000) return;
    const target = document.getElementById(id);
    const section = sectionRef.current;
    if (!target || !section || section.contains(target)) return;
    if (section.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) {
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  }, [mode]);

  // resizing or rotating while the stage is pinned: keep the visitor at the same point of the story. The
  // section height is in vh while scrollY is in px, so without this a resize lands in another chapter (or, on a
  // phone turned to landscape, past the story). Scroll anchoring cannot be relied on (it skips the sticky stage,
  // and iOS Safari has none).
  useEffect(() => {
    if (mode !== "scroll") return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const dist = () => Math.max(1, section.offsetHeight - stage.offsetHeight);
    let savedP = -1;
    let savedDist = dist();
    let restoring = false;
    let raf = 0;
    let timer = 0;
    const remember = () => {
      const d = dist();
      const p = -section.getBoundingClientRect().top / d;
      savedP = p > 0 && p < 1 ? p : -1;
      savedDist = d;
    };
    const onScroll = () => {
      if (!restoring) remember();
    };
    const onResize = () => {
      // only when the story's scroll length changed (a mobile URL bar showing or hiding changes neither the vh
      // units nor the svh stage, so the visitor's own scrolling is never interrupted)
      if (savedP < 0 || Math.abs(dist() - savedDist) < 1) return;
      restoring = true;
      const p = savedP;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = window.scrollY + section.getBoundingClientRect().top + p * dist();
        if (Math.abs(top - window.scrollY) > 2) window.scrollTo({ top: Math.round(top), behavior: "instant" });
      });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        restoring = false;
        remember();
      }, 250);
    };
    remember();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [mode]);

  // the scroll-scrubbed player
  useEffect(() => {
    if (mode !== "scroll" || !manifest) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!section || !stage || !media || !canvas || !ctx) return;
    const hints = deviceHints();
    const store = new FrameStore({
      manifest,
      set: setName,
      maxBitmaps: setName === "lg" ? (hints.lowMemory ? 10 : 18) : hints.lowMemory ? 14 : 24,
      maxBlobBytes: setName === "lg" ? 48e6 : 24e6,
      concurrency: setName === "lg" ? 5 : 4,
      onFrame: () => kick(),
      onFatal: () => setFatal(true),
    });
    const total = manifest.frames;
    const timer = testOverrides().timer;
    const request = timer ? (cb: () => void) => window.setTimeout(cb, 16) : (cb: () => void) => requestAnimationFrame(cb);
    const cancel = timer ? (id: number) => window.clearTimeout(id) : (id: number) => cancelAnimationFrame(id);
    const hidden = () => !timer && document.hidden;
    let cw = 0;
    let ch = 0;
    let drawn = -1;
    let display = -1;
    let raf = 0;
    let near = false;
    let first = true;
    // until the visitor reaches the story, only the opening frames are fetched (no coarse pass yet): a page
    // view that never scrolls to the story costs a few frames, not the whole coarse pass
    let entered = false;
    store.setWarm(true);

    const targetFrame = () => {
      const rect = section.getBoundingClientRect();
      const dist = section.offsetHeight - stage.offsetHeight;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, dist)));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      // "entered": the story fills most of the screen (an anchor link lands its top just under the header)
      if (!entered && rect.top < window.innerHeight * 0.5) {
        entered = true;
        store.setWarm(false);
      }
      return 1 + p * (total - 1);
    };

    const tick = () => {
      raf = 0;
      const target = targetFrame();
      if (display < 0 || first) display = target;
      else {
        display += (target - display) * SMOOTHING;
        if (Math.abs(target - display) > MAX_LAG) display = target - Math.sign(target - display) * MAX_LAG;
        if (Math.abs(target - display) < 0.08) display = target;
      }
      first = false;
      store.setTarget(target);
      const want = store.nearestAvailable(display);
      const got = store.nearestDecoded(want);
      if (got && got.frame !== drawn && cw > 0) {
        drawFitted(ctx, got.image, cw, ch, fit);
        drawn = got.frame;
        canvas.dataset.frame = String(got.frame);
        canvas.dataset.ready = "true";
      }
      section.dataset.target = String(Math.round(target));
      if (!startedRef.current && target > 1.5) {
        startedRef.current = true;
        setStarted(true);
      }
      const idx = chapterAt(chapters, display);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
      if (display !== target) raf = request(tick);
    };

    function kick() {
      if (!raf && near && !hidden()) raf = request(tick);
    }

    const resize = () => {
      const r = media.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = Math.min(Math.round(r.width * dpr), 2560);
      const h = Math.round((w / Math.max(1, r.width)) * r.height);
      if (w !== cw || h !== ch) {
        cw = canvas.width = Math.max(1, w);
        ch = canvas.height = Math.max(1, h);
        drawn = -1; // canvas was cleared
        delete canvas.dataset.ready;
      }
      kick();
    };

    const io = new IntersectionObserver(
      entries => {
        near = entries[0].isIntersecting;
        if (near) {
          store.resume();
          first = true;
          kick();
        } else {
          store.pause();
          store.trim(2);
          if (raf) cancel(raf);
          raf = 0;
        }
      },
      { rootMargin: "75% 0px 75% 0px" },
    );
    const ro = new ResizeObserver(resize);
    const onScroll = () => {
      if (timer) {
        // background tabs deliver no IntersectionObserver callbacks: derive proximity from the rect
        const r = section.getBoundingClientRect();
        const was = near;
        near = r.bottom > -window.innerHeight * 0.75 && r.top < window.innerHeight * 1.75;
        if (near && !was) store.resume();
      }
      kick();
    };
    const onVisibility = () => {
      if (hidden()) {
        store.pause();
        if (raf) cancel(raf);
        raf = 0;
      } else if (near) {
        store.resume();
        kick();
      }
    };

    resize();
    io.observe(section);
    if (timer) onScroll();
    ro.observe(media);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    section.dataset.set = setName;
    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancel(raf);
      store.dispose();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      delete canvas.dataset.ready;
    };
  }, [mode, manifest, setName, chapters, fit]);

  // on narrow screens the chapter list scrolls sideways: keep the active chapter in view
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const btn = nav.children[active] as HTMLElement | undefined;
    if (!btn) return;
    const nb = nav.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    if (bb.left < nb.left || bb.right > nb.right) nav.scrollLeft += bb.left - nb.left - (nb.width - bb.width) / 2;
  }, [active]);

  function jump(i: number) {
    if (mode === "stills") {
      setActive(i);
      activeRef.current = i;
      return;
    }
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const c = chapters[i];
    const p = i === 0 ? 0 : (c.start - 0.5) / (frames - 1);
    const dist = section.offsetHeight - stage.offsetHeight;
    const top = window.scrollY + section.getBoundingClientRect().top + p * dist;
    window.scrollTo({ top: Math.ceil(top), behavior: prefersReduced ? "instant" : "smooth" });
  }

  const current = story.chapters[active] ?? story.chapters[0];
  let stillSrc: string | null = null;
  if (mode === "stills" && manifest && !brokenStills[current.id]) {
    const rc = chapters[active];
    const own = rc?.still?.[setName];
    if (own) stillSrc = own;
    else if (rc) {
      const set = manifest.sets[setName];
      const list = setFrameList(set, manifest.frames);
      const mid = Math.round((rc.start + rc.end) / 2);
      const nearest = list.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a), list[0]);
      stillSrc = frameUrl(set, nearest);
    }
  }
  // stills mode uses the sequence's own poster; if that file fails, fall back to the site poster (normally cached)
  const manifestPoster = mode === "stills" && manifest && !posterFailed ? manifest.poster[setName] : null;
  const scrollPoster = story.scrollPoster ?? story.poster;

  const style = { "--seq-length": `${Math.round(frames * vhPerFrame + 100)}vh` } as CSSProperties;
  const headingId = `${story.id}-story-title`;

  return (
    <section
      ref={sectionRef}
      id={`${story.id}-story`}
      className="seq"
      data-mode={mode}
      data-manifest={manifestState}
      style={style}
      aria-labelledby={headingId}
    >
      <div ref={stageRef} className="seq-stage">
        <div ref={mediaRef} className="seq-media">
          {/* a poster is always underneath, so the stage is never blank */}
          {manifestPoster ? (
            <img
              key="manifest-poster"
              className="seq-poster"
              src={manifestPoster}
              alt=""
              width={story.poster.width}
              height={story.poster.height}
              decoding="async"
              onError={() => setPosterFailed(true)}
            />
          ) : mode === "scroll" ? (
            <PosterPicture poster={scrollPoster} className="seq-poster seq-poster--scroll" alt="" />
          ) : (
            <PosterPicture poster={story.poster} className="seq-poster" alt="" />
          )}
          {mode === "scroll" && <canvas ref={canvasRef} className="seq-canvas" aria-hidden="true" />}
          {stillSrc && (
            <img
              key={stillSrc}
              className="seq-still"
              src={stillSrc}
              alt=""
              width={1600}
              height={900}
              decoding="async"
              onError={() => setBrokenStills(b => ({ ...b, [current.id]: true }))}
            />
          )}
          <div className="seq-scrim" aria-hidden="true" />
          {/* honesty label pinned to the picture: always shown on phones (the tag above is hidden there) and
              whenever the poster stands in for the sequence */}
          <p className={"seq-caption" + (mode === "stills" && !stillSrc ? " is-poster" : "")} aria-hidden="true">
            {story.status}
          </p>
        </div>

        <div className="seq-ui">
          <div className="seq-top wrap">
            <div className="seq-label">
              <h2 id={headingId} className="sr-only">{story.title}</h2>
              <p className="eyebrow eyebrow--light">{story.eyebrow}</p>
              <span className="tag tag--dark">{story.status}</span>
            </div>
            <a className="seq-skip" href={`#${skipTo}`}>{skipLabel}</a>
          </div>

          <div className="seq-copy wrap">
            {story.chapters.map((c, i) => (
              <article key={c.id} className={"seq-chapter" + (i === active ? " is-active" : "")} aria-hidden={i !== active}>
                <p className="seq-count">
                  <span>{two(i + 1)}</span> / {two(count)} <span className="seq-count-label">{c.label}</span>
                </p>
                <h3>{c.title}</h3>
                <p className="seq-body">{c.body}</p>
                {c.fact && (
                  <p className="seq-fact">
                    <strong>
                      {c.fact.value}
                      {c.fact.unit && <small> {c.fact.unit}</small>}
                    </strong>
                    <span>{c.fact.label}</span>
                  </p>
                )}
                {c.note && <p className="seq-note">{c.note}</p>}
                {c.link && (
                  // a plain anchor: in-page links must not go through the router (next/link threw in production)
                  <a className="text-link text-link--light" href={c.link.href} tabIndex={i === active ? 0 : -1}>
                    {c.link.label}
                  </a>
                )}
                <p className="sr-only">Visual: {c.alt}</p>
              </article>
            ))}
            {mode === "scroll" && !started && active === 0 && (
              <p className="seq-hint" aria-hidden="true">
                <span /> Scroll to play
              </p>
            )}
          </div>

          <div className="seq-foot wrap">
            <nav ref={navRef} className="seq-nav" aria-label={`${story.title}: chapters`}>
              {story.chapters.map((c, i) => (
                <button key={c.id} type="button" aria-current={i === active ? "step" : undefined} onClick={() => jump(i)}>
                  <span>{two(i + 1)}</span>
                  {c.label}
                </button>
              ))}
            </nav>
            {mode === "scroll" && (
              <div className="seq-progress" aria-hidden="true">
                <span ref={barRef} />
              </div>
            )}
            <p className="seq-disclaimer">
              <span className="seq-disclaimer-full">{story.disclaimer}</span>
              <span className="seq-disclaimer-short" aria-hidden="true">
                {story.disclaimerShort}
              </span>
            </p>
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`Chapter ${active + 1} of ${count}: ${current.label}`}
        </p>
      </div>
    </section>
  );
}
