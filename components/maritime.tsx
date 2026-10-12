import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactSection } from "@/components/contact-section";
import { ScrollSequence } from "@/components/scroll-sequence";
import { Drawings } from "@/components/drawings";
import { ShipyardSection } from "@/components/shipyard-section";
import { RoutesSection } from "@/components/routes-section";
import { PosterPicture } from "@/components/poster-picture";
import { company, lourdes, lourdesStory, type Figure } from "@/lib/site-content";

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

function LourdesHero() {
  const p = lourdes.hero;
  return (
    <section className={"hero" + (p.treatment === "sketch" ? " hero--sketch" : "")} id="lourdes" aria-labelledby="lourdes-title">
      <PosterPicture poster={p} className="hero-media" priority />
      <div className="hero-shade" aria-hidden="true" />
      <div className="wrap hero-inner">
        <div className="hero-top">
          <p className="eyebrow eyebrow--light">{lourdes.edition}</p>
          <span className="tag tag--dark">{lourdes.status}</span>
        </div>
        <div className="hero-title">
          <p className="hero-type">{lourdes.type}</p>
          <h1 id="lourdes-title">{lourdes.name}</h1>
          <p className="hero-tagline">{lourdes.tagline}</p>
          <div className="hero-actions">
            <a className="button button--light" href="#lourdes-story">
              Explore the vessel
            </a>
            <a className="button button--outline-light" href="#contact">
              Enquire about Lourdes
            </a>
          </div>
        </div>
        <Figures items={lourdes.heroFigures} className="figures--hero" />
      </div>
      <p className="hero-caption">{p.caption}</p>
    </section>
  );
}

function Specifications() {
  return (
    <section className="specs section" id="specifications" aria-labelledby="specifications-title">
      <div className="wrap specs-grid">
        <div className="specs-intro">
          <p className="eyebrow">The vessel at a glance</p>
          <h2 id="specifications-title">
            PURPOSE IN
            <br />
            EVERY DETAIL.
          </h2>
          <p>{lourdes.specsIntro}</p>
          <a className="text-link" href="#capabilities">
            Explore its capabilities
          </a>
          <p className="source-note">{lourdes.specsSource}</p>
        </div>
        <dl className="spec-table">
          {lourdes.specs.map(s => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>
                {s.value}
                {s.note && <small>{s.note}</small>}
              </dd>
            </div>
          ))}
        </dl>
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
        <ScrollSequence story={lourdesStory} skipTo="drawings" skipLabel="Skip the vessel story" />
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
