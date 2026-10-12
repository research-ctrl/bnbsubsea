"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wrapper that lets a wide figure scroll sideways when CSS makes it wider than its box (the route map on
 * phones), and starts it centred on `focus` (fraction of the width, e.g. the yard on the route map). On wider
 * screens nothing scrolls and this does nothing. `align`: where the focus point sits across the visible width
 * (0.4 leaves room for a label that runs to the right of it).
 */
export function MapPan({ focus, align = 0.5, className, children }: { focus: number; align?: number; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const centre = () => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      el.scrollLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, focus * el.scrollWidth - el.clientWidth * align));
    };
    centre();
    const ro = new ResizeObserver(centre);
    ro.observe(el);
    // stop re-centring once the visitor has panned
    const stop = () => ro.disconnect();
    el.addEventListener("pointerdown", stop, { once: true });
    el.addEventListener("touchstart", stop, { once: true, passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, [focus, align]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
