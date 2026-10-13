import { FallbackImage } from "@/components/fallback-image";
import { drawings, shorebridge55, vesselRange } from "@/lib/site-content";

/*
 * Commercial Vessels — Landing Craft & Cargo Ro-Ro (owner's presentation email, 13 Oct 2026).
 *
 *  1. BNB SHOREBRIDGE 55: the four-line model block exactly as written (shorebridge55.lines), with the LOURDES
 *     3D still (current project material, labelled a design visualisation), its enquiry button (preselects the
 *     model in the contact form) and links to the story and the specifications.
 *  2. 400–500 DWT design-to-order: an invitation to enquire, text only. It is not a design, so it has no model
 *     number, no specifications and no picture; its button preselects the subject in the contact form.
 */
export function RangeSection() {
  const m = vesselRange.model;
  const d = vesselRange.designToOrder;
  const still = drawings.model.poster;
  const [model, descriptor, reference, status] = shorebridge55.lines;
  return (
    <section className="range section" id={vesselRange.id} aria-labelledby="range-title">
      <div className="wrap">
        <div className="section-heading">
          <h2 id="range-title" className="range-title">
            <span className="eyebrow">{vesselRange.category}</span>
            <span className="sr-only"> — </span>
            {vesselRange.name}
          </h2>
          <p>{vesselRange.convention}</p>
        </div>

        <div className="range-grid">
          <article className="range-card range-card--model" id={m.id} aria-labelledby={`${m.id}-title`}>
            <figure className="range-media">
              <FallbackImage
                src={still.src}
                srcSet={still.srcSet}
                sizes="(max-width: 860px) 100vw, 780px"
                alt={still.alt}
                width={still.width}
                height={still.height}
                loading="lazy"
                decoding="async"
              />
              <figcaption>Design visualisation</figcaption>
            </figure>
            <div className="range-card-body">
              <h3 id={`${m.id}-title`}>{model}</h3>
              <p className="range-descriptor">{descriptor}</p>
              <p className="range-line">{reference}</p>
              <p className="range-line">{status}</p>
              <a className="button button--dark range-enquire" href={m.enquire.href}>
                {m.enquire.label}
              </a>
              <div className="range-links">
                {m.links.map(l => (
                  <a key={l.href} className="text-link" href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </article>

          <article className="range-card range-card--order" id={d.id} aria-labelledby={`${d.id}-title`}>
            <h3 id={`${d.id}-title`}>{d.title}</h3>
            <div className="range-order-text">
              <p className="range-order-body">{d.body}</p>
              <p className="range-order-note">{d.note}</p>
              <a className="button button--light" href={d.href}>
                {d.cta}
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
