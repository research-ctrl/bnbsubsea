import type { Poster } from "@/lib/site-content";

/**
 * The Lourdes poster as a <picture>: a portrait-composed source for portrait screens (when the poster has one)
 * and the landscape srcSet otherwise. No hooks, so it renders in server and client components alike. The hero
 * and the story stage use the same markup and `sizes`, so the browser picks the same file for both (one
 * download).
 */
export function PosterPicture({
  poster,
  className,
  alt,
  priority = false,
}: {
  poster: Poster;
  className: string;
  /** defaults to the poster's alt text; pass "" for a decorative copy */
  alt?: string;
  priority?: boolean;
}) {
  const p = poster.portrait;
  return (
    <picture>
      {p && <source media={p.media} srcSet={p.srcSet} sizes={p.sizes} width={p.width} height={p.height} />}
      <img
        className={className + (poster.treatment === "sketch" ? " is-sketch" : "")}
        src={poster.src}
        srcSet={poster.srcSet}
        sizes={poster.srcSet ? (poster.sizes ?? "100vw") : undefined}
        alt={alt ?? poster.alt}
        width={poster.width}
        height={poster.height}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? undefined : "lazy"}
        decoding="async"
      />
    </picture>
  );
}
