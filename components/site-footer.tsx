import { Brand } from "@/components/brand";
import { brand } from "@/lib/site-content";

/** @param base anchor prefix: "" on the home page, "/" on other pages (the 404 page) */
export function SiteFooter({ base = "" }: { base?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>Shipbuilding at our own shipyard in Fomar, Shiroda, where Lourdes, our first vessel, will be built.</p>
          <p className="footer-place">{brand.location}</p>
          <a className="footer-email" href={`mailto:${brand.email}`}>
            {brand.email}
          </a>
        </div>
        <nav className="footer-links" aria-label="Lourdes">
          <p className="footer-title">Lourdes</p>
          <a href={base + "#lourdes-story"}>The vessel in layers</a>
          <a href={base + "#drawings"}>Drawings</a>
          <a href={base + "#specifications"}>Specifications</a>
          <a href={base + "#capabilities"}>Capabilities</a>
        </nav>
        <nav className="footer-links" aria-label="Company">
          <p className="footer-title">Company</p>
          <a href={base + "#shipyard"}>Our shipyard</a>
          <a href={base + "#routes"}>Route of operation</a>
          <a href={base + "#about"}>About</a>
          <a href={base + "#contact"}>Contact</a>
        </nav>
      </div>
      <div className="wrap footer-base">
        <p>
          © {year} {brand.name} · {brand.location}
        </p>
        <p>
          Design visualisations, site plans and route maps are illustrations and are labelled as such. Lourdes particulars follow the Nirmon
          general arrangement, Rev 0, 07.10.2026.
        </p>
      </div>
    </footer>
  );
}
