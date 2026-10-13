import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactSection } from "@/components/contact-section";
import { ScrollSequence } from "@/components/scroll-sequence";
import { Drawings } from "@/components/drawings";
import { ShipyardSection } from "@/components/shipyard-section";
import { RoutesSection } from "@/components/routes-section";
import { RangeSection } from "@/components/range-section";
import { PosterPicture } from "@/components/poster-picture";
import { company, lourdes, lourdesStory, shorebridge55, vesselRange, type Figure, type SpecRow } from "@/lib/site-content";

function Figures({ items, className = "" }: { items: Figure[]; className?: string }) {
  return (
    <dl className={"figures " + className}>
      {items.map(f => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>
            {f.value}
            {f.unit && <span> {f.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** "Label: value" lines of the model block, with the value emphasised (the text reads exactly as written) */
function LabelledLine({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <p className={className}>
      {label}: <strong>{value}</strong>
    </p>
  );
}

/**
 * Hero: leads with the model (owner's email, 13 Oct 2026). The title block reads, in order: BNB SHOREBRIDGE 55 /
 * 55-metre Landing Craft / Cargo Ro-Ro / Reference newbuild: LOURDES / Status: Current newbuild programme. The
 * classification is a separate tag; the figures are GA values plus the owner's cargo payload.
 */
function LourdesHero() {
  const p = lourdes.hero;
  return (
    <section className={"hero" + (p.treatment === "sketch" ? " hero--sketch" : "")} id="lourdes" aria-labelledby="hero-title">
      <PosterPicture poster={p} className="hero-media" priority />
      <div className="hero-shade" aria-hidden="true" />
      <div className="wrap hero-inner">
        <div className="hero-top">
          <p className="eyebrow eyebrow--light">{lourdes.eyebrow}</p>
          <span className="tag tag--dark">{shorebridge55.classification}</span>
        </div>
        <div className="hero-title">
          <h1 id="hero-title">{shorebridge55.model}</h1>
          <p className="hero-descriptor">{shorebridge55.descriptor}</p>
          <div className="hero-identity">
            <LabelledLine label={shorebridge55.referenceLabel} value={shorebridge55.vessel} />
            <LabelledLine label={shorebridge55.statusLabel} value={shorebridge55.status} />
          </div>
          <div className="hero-actions">
            <a className="button button--light" href="#lourdes-story">
              Explore the vessel
            </a>
            <a className="button button--outline-light" href={vesselRange.model.enquire.href}>
              {vesselRange.model.enquire.label}
            </a>
          </div>
        </div>
        <Figures items={lourdes.heroFigures} className="figures--hero" />
      </div>
      <p className="hero-caption">{p.caption}</p>
    </section>
  );
}

function SpecTable({ rows, labelledBy }: { rows: SpecRow[]; labelledBy: string }) {
  return (
    <dl className="spec-table" aria-labelledby={labelledBy}>
      {rows.map(s => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>
            {s.value}
            {s.note && <small>{s.note}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Specifications, headed by the model: identity rows, then the GA particulars, then classification on its own. */
function Specifications() {
  return (
    <section className="specs section" id="specifications" aria-labelledby="specifications-title">
      <div className="wrap specs-grid">
        <div className="specs-intro">
          <p className="eyebrow">Specifications</p>
          <h2 id="specifications-title">{shorebridge55.model}</h2>
          <LabelledLine className="specs-reference" label={shorebridge55.referenceLabel} value={shorebridge55.vessel} />
          <p className="specs-lead">{lourdes.specsIntro}</p>
          <p className="specs-nominal">{lourdes.specsNominal}</p>
          <a className="text-link" href="#capabilities">
            Explore its capabilities
          </a>
          <p className="source-note">{lourdes.specsSource}</p>
        </div>
        <div className="spec-groups">
          {lourdes.specGroups.map(g => (
            <div className="spec-group" key={g.id}>
              <h3 className="spec-group-title" id={`spec-${g.id}`}>
                {g.title}
              </h3>
              <SpecTable rows={g.rows} labelledBy={`spec-${g.id}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="capabilities section section--dark" id="capabilities" aria-labelledby="capabilities-title">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow--light">Designed for its purpose</p>
            <h2 id="capabilities-title">CAPABLE BY DESIGN.</h2>
          </div>
          <p>{lourdes.tagline}</p>
        </div>
        <div className="capability-grid">
          {lourdes.capabilities.map((c, i) => (
            <article key={c.id} id={c.id}>
              <span className="capability-number">{String(i + 1).padStart(2, "0")}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              {c.status && <span className="tag tag--dark">{c.status}</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="about section section--dark" aria-labelledby="about-title">
      <div className="wrap">
        <div className="about-head">
          <p className="eyebrow eyebrow--light">About us</p>
          <h2 id="about-title">Bennet and Bernard Subsea.</h2>
        </div>
        <div className="about-grid">
          {company.map(c => (
            <div className="about-item" key={c.title}>
              <p className="eyebrow eyebrow--light">{c.eyebrow}</p>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeExperience() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <LourdesHero />
        <span id="inside-lourdes" className="anchor-alias" aria-hidden="true" />
        <ScrollSequence story={lourdesStory} skipTo={vesselRange.id} skipLabel="Skip the vessel story" />
        <RangeSection />
        <Drawings />
        <Specifications />
        <Capabilities />
        <ShipyardSection />
        <RoutesSection />
        <About />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
