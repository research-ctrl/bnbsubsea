import { Brand } from "@/components/brand";
import { brand, shorebridge55, vesselRange } from "@/lib/site-content";

/** @param base anchor prefix: "" on the home page, "/" on other pages (the 404 page) */
export function SiteFooter({ base = "" }: { base?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>Shipbuilding at our own shipyard in Fomar, Shiroda, Goa, home of the LOURDES newbuild programme ({shorebridge55.model}).</p>
          <p className="footer-place">{brand.location}</p>
          <a className="footer-email" href={`mailto:${brand.email}`}>
            {brand.email}
          </a>
        </div>
        <nav className="footer-links" aria-label={vesselRange.category}>
          <p className="footer-title">{vesselRange.category}</p>
          <a href={base + "#" + vesselRange.id}>{vesselRange.name}</a>
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
          Design visualisations, site plans and route maps are illustrations and are labelled as such. {shorebridge55.model} / LOURDES
          particulars follow the Nirmon general arrangement, Rev 0, 07.10.2026, except the cargo payload (company figure). 55 is the
          model’s nominal length in metres.
        </p>
      </div>
    </footer>
  );
}
