"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";

/** One-page navigation: every entry is an anchor on the home page. */
const links = [
  { id: "lourdes", label: "Lourdes" },
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
  const [solid, setSolid] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => setSolid(window.scrollY > 24);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  // highlight the section that crosses the middle band of the viewport
  useEffect(() => {
    const ids = [...links.map(l => l.id), ...Object.keys(aliases), contact.id];
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

  const mark = (id: string) => (current === id ? "location" : undefined);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={"site-header" + (solid || open ? " is-solid" : "")}>
        <div className="wrap header-inner">
          <Brand />
          <nav className="nav" aria-label="Main navigation">
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
