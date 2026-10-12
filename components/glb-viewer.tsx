"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Status = "idle" | "loading" | "ready" | "fallback";
type Reason = "no-webgl" | "missing" | "error" | null;

/** WebGL availability, probed once per page; the probe's context is released straight away. */
let webglSupport: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** HEAD-check the model first, so three.js is only downloaded when there is something to show. */
async function modelAvailable(src: string): Promise<boolean> {
  try {
    const res = await fetch(src, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    return res.ok && !type.includes("text/html");
  } catch {
    return false;
  }
}

/**
 * Lazy GLB viewer: three.js, GLTFLoader, DRACOLoader and OrbitControls load only when the viewer is
 * near the viewport and the model exists. Damped orbit only (no zoom or pan). Vertical swipes scroll the
 * page (touch-action: pan-y), horizontal drags turn the model; the arrow keys turn it too. The camera is
 * fitted to the model's bounds with a margin and re-fitted on resize until the visitor turns the model.
 * Renders on demand, pauses offscreen, disposes (and releases its WebGL context) on unmount or failure,
 * and falls back to a still without WebGL or when the model is missing or fails.
 */
export function GlbViewer({
  src,
  poster,
  label,
}: {
  src: string;
  poster: { src: string; srcSet?: string; width: number; height: number; alt: string };
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<Reason>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let stopped = false;
    let dispose = () => {};

    async function start() {
      if (!hasWebGL()) {
        setReason("no-webgl");
        setStatus("fallback");
        return;
      }
      setStatus("loading");
      if (!(await modelAvailable(src))) {
        if (!stopped) {
          setReason("missing");
          setStatus("fallback");
        }
        return;
      }
      // created step by step; `release` frees whatever exists, on unmount and on every failure path
      let release = () => {};
      try {
        const [THREE, { GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/addons/loaders/GLTFLoader.js"),
          import("three/addons/loaders/DRACOLoader.js"),
          import("three/addons/controls/OrbitControls.js"),
          import("three/addons/environments/RoomEnvironment.js"),
        ]);
        if (stopped || !host) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        // shader-compiler info logs (ANGLE precision warnings) are noise in production
        renderer.debug.checkShaderErrors = !import.meta.env.PROD;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        const canvas = renderer.domElement;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", label);
        canvas.tabIndex = 0;
        host.appendChild(canvas);
        const draco = new DRACOLoader();
        let pmrem: import("three").PMREMGenerator | null = null;
        let envTex: import("three").Texture | null = null;
        release = () => {
          envTex?.dispose();
          pmrem?.dispose();
          draco.dispose();
          renderer.dispose();
          renderer.forceContextLoss(); // free the context now instead of waiting for garbage collection
          canvas.remove();
        };

        const scene = new THREE.Scene();
        pmrem = new THREE.PMREMGenerator(renderer);
        envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;

        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 2000);
        const controls = new OrbitControls(camera, canvas);
        // OrbitControls sets touch-action: none on connect(); restore pan-y so vertical swipes scroll the page
        canvas.style.touchAction = "pan-y";
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = 0.6;
        controls.minPolarAngle = Math.PI * 0.18;
        controls.maxPolarAngle = Math.PI * 0.49;

        draco.setDecoderPath("/draco/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);
        const gltf = await loader.loadAsync(src);
        if (stopped) {
          release();
          return;
        }
        const model = gltf.scene;
        // the export carries the translucent tank volumes used by the cutaway story; the exterior view
        // hides them (otherwise the forepeak tanks read through the open forecastle)
        const tanks = model.getObjectByName("SYS_TANKS");
        if (tanks) tanks.visible = false;
        model.traverse(o => {
          const mesh = o as import("three").Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        const radius = size.length() / 2;
        const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
          i => new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z),
        );

        const key = new THREE.DirectionalLight("#ffffff", 2.2);
        key.position.set(centre.x + radius, centre.y + radius * 1.6, centre.z + radius * 0.8);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        const sc = key.shadow.camera;
        sc.left = sc.bottom = -radius;
        sc.right = sc.top = radius;
        sc.near = 0.1;
        sc.far = radius * 6;
        key.target.position.copy(centre);
        scene.add(key, key.target);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(radius * 6, radius * 6), new THREE.ShadowMaterial({ opacity: 0.18 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = box.min.y;
        ground.receiveShadow = true;
        scene.add(ground);

        /**
         * Distance at which every corner of the model's box fits the view with `pad` margin (fraction of the
         * half-view) along direction `dir` from the centre. Binary search on the projected extents.
         */
        const PAD = 0.12;
        const fitDistance = (dir: import("three").Vector3) => {
          const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / (1 + PAD);
          const tanH = tanV * camera.aspect;
          const fwd = dir.clone().negate();
          const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
          const up = new THREE.Vector3().crossVectors(right, fwd);
          const fits = (d: number) =>
            corners.every(c => {
              const v = c.clone().sub(centre);
              const z = d + v.dot(fwd);
              return z > 0.1 && Math.abs(v.dot(right)) / z <= tanH && Math.abs(v.dot(up)) / z <= tanV;
            });
          let lo = radius * 0.5;
          let hi = radius * 12;
          for (let i = 0; i < 32; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) hi = mid;
            else lo = mid;
          }
          return hi;
        };

        let userMoved = false;
        const home = () => {
          // three-quarter bow view from starboard (+X bow in the export; glTF +Z = Blender starboard); on
          // narrow or squarer views a view closer to the profile, so the long hull still fills the frame
          const dir = (camera.aspect < 1.5 ? new THREE.Vector3(0.45, 0.34, 1.0) : new THREE.Vector3(0.85, 0.42, 1.0)).normalize();
          camera.position.copy(centre).addScaledVector(dir, fitDistance(dir));
          controls.target.copy(centre);
          controls.update();
          userMoved = false;
        };
        resetRef.current = () => {
          home();
          dirty = true;
          kick();
        };
        controls.addEventListener("start", () => {
          userMoved = true;
        });

        // keyboard: the arrow keys turn the model (left/right) and tilt it (up/down); Home resets the view
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3();
        const onKey = (e: KeyboardEvent) => {
          const step = THREE.MathUtils.degToRad(e.shiftKey ? 20 : 8);
          const turns: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step / 2], ArrowDown: [0, step / 2] };
          if (e.key === "Home") {
            e.preventDefault();
            resetRef.current();
            return;
          }
          const t = turns[e.key];
          if (!t) return;
          e.preventDefault();
          offset.copy(camera.position).sub(controls.target);
          spherical.setFromVector3(offset);
          spherical.theta += t[0];
          spherical.phi = THREE.MathUtils.clamp(spherical.phi + t[1], controls.minPolarAngle, controls.maxPolarAngle);
          offset.setFromSpherical(spherical);
          camera.position.copy(controls.target).add(offset);
          controls.update();
          userMoved = true;
          dirty = true;
          kick();
        };
        canvas.addEventListener("keydown", onKey);

        let raf = 0;
        let visible = true;
        let dirty = true;
        const render = () => {
          const moved = controls.update(); // may emit "change"; raf is still set, so kick() is a no-op
          raf = 0;
          if (moved || dirty) {
            renderer.render(scene, camera);
            dirty = false;
            raf = requestAnimationFrame(render); // keep going while damping settles
          }
        };
        const kick = () => {
          if (!raf && visible && !document.hidden) raf = requestAnimationFrame(render);
        };
        controls.addEventListener("change", () => {
          dirty = true;
          kick();
        });
        const resize = () => {
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          if (!userMoved) home(); // keep the model framed until the visitor turns it
          dirty = true;
          kick();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(host);
        const io = new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
          if (visible) kick();
        });
        io.observe(host);
        const onVisibility = () => {
          if (!document.hidden) kick();
        };
        document.addEventListener("visibilitychange", onVisibility);
        const lost = (e: Event) => {
          e.preventDefault();
          setReason("error");
          setStatus("fallback");
        };
        canvas.addEventListener("webglcontextlost", lost);
        resize();
        setStatus("ready");

        dispose = () => {
          if (raf) cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          canvas.removeEventListener("webglcontextlost", lost);
          canvas.removeEventListener("keydown", onKey);
          controls.dispose();
          scene.traverse(o => {
            const mesh = o as import("three").Mesh;
            if (!mesh.isMesh) return;
            mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
              m.dispose();
            }
          });
          release();
        };
      } catch {
        release();
        if (!stopped) {
          setReason("error");
          setStatus("fallback");
        }
      }
    }

    // start only when the viewer approaches the viewport
    const gate = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          gate.disconnect();
          start();
        }
      },
      { rootMargin: "300px 0px" },
    );
    gate.observe(host);
    return () => {
      stopped = true;
      gate.disconnect();
      dispose();
    };
  }, [src, label]);

  const message =
    status === "loading" || status === "idle"
      ? "Preparing the 3D view…"
      : reason === "no-webgl"
        ? "3D is unavailable on this device. A still of the model is shown instead."
        : reason === "missing"
          ? "The interactive model is being prepared. A still of the model is shown meanwhile."
          : "The 3D view could not be loaded. A still of the model is shown instead.";

  return (
    <div className="glb-viewer" data-status={status}>
      <div className="glb-canvas" ref={hostRef} />
      {status !== "ready" && (
        <div className="glb-fallback">
          <img
            src={poster.src}
            srcSet={poster.srcSet}
            sizes={poster.srcSet ? "(max-width: 760px) 100vw, 1320px" : undefined}
            alt={poster.alt}
            width={poster.width}
            height={poster.height}
            loading="lazy"
            decoding="async"
          />
          <p role="status" className="glb-message">
            {message}
          </p>
          <noscript>
            <p className="glb-message glb-message--noscript">The interactive 3D view needs JavaScript. A still of the model is shown.</p>
          </noscript>
        </div>
      )}
      {status === "ready" && (
        <div className="glb-tools">
          <span className="glb-hint-long">Drag or use the arrow keys to turn the vessel</span>
          <span className="glb-hint-short">Drag to turn</span>
          <button type="button" onClick={() => resetRef.current()}>
            <RotateCcw size={15} aria-hidden="true" />
            Reset view
          </button>
        </div>
      )}
    </div>
  );
}
