import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Bennet and Bernard Subsea | BNB SHOREBRIDGE 55, Landing Craft / Cargo Ro-Ro", template: "%s | Bennet and Bernard Subsea" },
  description:
    "Bennet and Bernard Subsea: the BNB SHOREBRIDGE 55 landing craft / cargo Ro-Ro and its reference newbuild LOURDES, our current newbuild programme at our shipyard in Fomar, Shiroda, Goa, under Bureau Veritas (BV) classification. Specifications, general arrangement, shipyard and route of operation.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b1621",
};

const NOSCRIPT_CSS = [
  ".seq{height:auto!important}",
  ".seq-stage{position:relative!important;display:flex!important;flex-direction:column;height:auto!important;overflow:visible!important;padding:calc(var(--header-h) + 32px) 0 56px}",
  ".seq-ui{display:contents!important}",
  ".seq-top{order:0;padding-bottom:20px}",
  ".seq-media{order:1;position:relative!important;inset:auto!important;top:auto!important;z-index:0!important;width:min(1320px,calc(100% - 2 * var(--gutter)));height:auto!important;margin-inline:auto;aspect-ratio:16/9!important}",
  ".seq-copy{order:2;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px;padding-top:32px!important}",
  ".seq-foot{order:3;padding-top:28px}",
  ".seq-chapter{grid-area:auto!important;opacity:1!important;visibility:visible!important;transform:none!important;max-width:none!important}",
  ".seq-chapter h3{font-size:2rem!important}",
  ".seq-scrim,.seq-canvas,.seq-hint,.seq-nav,.seq-progress{display:none!important}",
  ".seq-caption{display:block!important}",
  ".glb-message:not(.glb-message--noscript){display:none}",
].join("");

/** Runs before hydration; a fragment that decodes cleanly (every real anchor) is left alone. */
const DROP_MALFORMED_HASH =
  "try{decodeURIComponent(location.hash)}catch(e){history.replaceState(history.state,'',location.pathname+location.search)}";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* self-hosted fonts (OFL); preload only the weights used above the fold */}
        <link rel="preload" href="/fonts/barlow-condensed-500-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/barlow-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* without JavaScript the scroll story cannot play: lay it out like its stills mode (picture, then every
            chapter), and drop the controls that need a script */}
        <noscript dangerouslySetInnerHTML={{ __html: `<style>${NOSCRIPT_CSS}</style>` }} />
        {/* a malformed URL fragment (e.g. "/#100%") would make the page's anchor handling throw on load and replace
            the page with an error screen: drop it before the page starts, so the visitor simply lands at the top */}
        <script dangerouslySetInnerHTML={{ __html: DROP_MALFORMED_HASH }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
