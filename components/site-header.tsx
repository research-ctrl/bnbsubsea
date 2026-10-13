"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { shorebridge55, vesselRange } from "@/lib/site-content";

/**
 * "Commercial Vessels" menu: the vessel range and its two entries. On wide screens it is a disclosure (a button that
 * shows a list of links; Escape, a click outside or tabbing away closes it); in the mobile menu it is a labelled group.
 * The second entry leads with the invitation, so it never reads as a second model of the range.
 */
const vessels = {
  label: vesselRange.category,
  range: { id: vesselRange.id, label: vesselRange.name },
  entries: [
    { id: vesselRange.model.id, label: shorebridge55.model, detail: `${shorebridge55.referenceLabel}: ${shorebridge55.vessel}` },
    { id: vesselRange.designToOrder.id, label: "Design-to-order enquiries", detail: "400–500\u00a0DWT landing craft" },
  ],
};

/** One-page navigation: every entry is an anchor on the home page. */
const links = [
  { id: "lourdes-story", label: "The vessel in layers" },
  { id: "drawings", label: "Drawings" },
  { id: "specifications", label: "Specifications" },
  { id: "shipyard", label: "Shipyard" },
  { id: "routes", label: "Routes" },
  { id: "about", label: "About" },
];
const contact = { id: "contact", label: "Contact" };
/** sections without a nav entry that keep a neighbouring entry current */
const aliases: Record<string, string> = { capabilities: "specifications" };

/**
 * @param base prefix for the anchors: "" on the home page, "/" elsewhere (e.g. the 404 page), so every
 *             entry still leads to its section of the home page
 */
export function SiteHeader({ base = "" }: { base?: string }) {
  const [open, setOpen] = useState(false);
  const [vesselsOpen, setVesselsOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const vesselsRef = useRef<HTMLDivElement>(null);
  const vesselsButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => setSolid(window.scrollY > 24);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  // highlight the section that crosses the middle band of the viewport
  useEffect(() => {
    const ids = [vessels.range.id, ...links.map(l => l.id), ...Object.keys(aliases), contact.id];
    const targets = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const hit = targets.find(t => visible.get(t.id));
        setCurrent(hit ? (aliases[hit.id] ?? hit.id) : null);
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus(); // keep keyboard focus on the control that opened the menu
      }
    };
    const wide = window.matchMedia("(min-width: 1101px)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("keydown", close);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", close);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  // the Commercial Vessels menu: Escape returns focus to its button; a click outside closes it
  useEffect(() => {
    if (!vesselsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVesselsOpen(false);
        vesselsButton.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!vesselsRef.current?.contains(event.target as Node)) setVesselsOpen(false);
    };
    const narrow = window.matchMedia("(max-width: 1100px)");
    const onNarrow = () => narrow.matches && setVesselsOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    narrow.addEventListener("change", onNarrow);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      narrow.removeEventListener("change", onNarrow);
    };
  }, [vesselsOpen]);

  const mark = (id: string) => (current === id ? "location" : undefined);
  const vesselsCurrent = current === vessels.range.id;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={"site-header" + (solid || open ? " is-solid" : "")}>
        <div className="wrap header-inner">
          <Brand />
          <nav className="nav" aria-label="Main navigation">
            <div
              ref={vesselsRef}
              className="nav-group"
              // tabbing out of the menu closes it. A blur without a new focus target (Safari does not focus a clicked
              // link) is left to the pointer handler, so a click on a menu link is never cut short.
              onBlur={event => {
                const next = event.relatedTarget as Node | null;
                if (next && !event.currentTarget.contains(next)) setVesselsOpen(false);
              }}
            >
              <button
                ref={vesselsButton}
                type="button"
                className={"nav-group-button" + (vesselsCurrent ? " is-current" : "")}
                aria-expanded={vesselsOpen}
                aria-controls="nav-vessels"
                onClick={() => setVesselsOpen(!vesselsOpen)}
              >
                {vessels.label}
                <ChevronDown aria-hidden="true" size={15} />
              </button>
              <div className="nav-menu" id="nav-vessels" hidden={!vesselsOpen}>
                <a className="nav-menu-range" href={base + "#" + vessels.range.id} aria-current={mark(vessels.range.id)} onClick={() => setVesselsOpen(false)}>
                  {vessels.range.label}
                </a>
                <ul>
                  {vessels.entries.map(e => (
                    <li key={e.id}>
                      <a href={base + "#" + e.id} onClick={() => setVesselsOpen(false)}>
                        <strong>{e.label}</strong>
                        <span>{e.detail}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {links.map(link => (
              <a key={link.id} href={base + "#" + link.id} aria-current={mark(link.id)}>
                {link.label}
              </a>
            ))}
            <a className="nav-cta" href={base + "#" + contact.id} aria-current={mark(contact.id)}>
              {contact.label}
            </a>
          </nav>
          <button
            ref={menuButton}
            type="button"
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {/* always mounted (aria-controls must point at an element); hidden while closed */}
        <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden={!open}>
          <div className="wrap">
            <div className="mobile-nav-group" role="group" aria-labelledby="mobile-nav-vessels">
              <p className="mobile-nav-label" id="mobile-nav-vessels">
                {vessels.label}
              </p>
              <a href={base + "#" + vessels.range.id} onClick={() => setOpen(false)} aria-current={mark(vessels.range.id)}>
                {vessels.range.label}
              </a>
              {vessels.entries.map(e => (
                <a key={e.id} className="mobile-nav-sub" href={base + "#" + e.id} onClick={() => setOpen(false)}>
                  {e.label}
                  <span>{e.detail}</span>
                </a>
              ))}
            </div>
            {[...links, contact].map(link => (
              <a key={link.id} href={base + "#" + link.id} onClick={() => setOpen(false)} aria-current={mark(link.id)}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
