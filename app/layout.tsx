import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Bennet and Bernard Subsea | Lourdes, Ro-Ro / Landing Craft", template: "%s | Bennet and Bernard Subsea" },
  description:
    "Bennet and Bernard Subsea: Lourdes, our 52.68 m Ro-Ro / landing craft, to be built under Bureau Veritas classification at our shipyard in Fomar, Shiroda, Goa. Specifications, general arrangement, shipyard and route of operation.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
