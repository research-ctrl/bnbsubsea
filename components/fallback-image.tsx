"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * <img> that hides itself if it fails to load (data-failed, styled in globals.css), so a missing render or base
 * map leaves the designed placeholder of its container instead of the browser's broken-image icon and alt text.
 * The alt text stays in the accessibility tree. An image that failed before hydration is caught on mount.
 */
export function FallbackImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const img = ref.current;
    // the error may have fired before hydration
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true);
  }, []);
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through by the caller
  return <img ref={ref} {...props} data-failed={failed ? "" : undefined} onError={() => setFailed(true)} />;
}
