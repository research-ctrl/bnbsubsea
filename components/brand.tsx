/** Brand mark linking home. A plain anchor: next/link threw on click in the production build (review 12 Oct 2026). */
export function Brand({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- next/link threw on click in the production build
    <a href="/" className={"brand " + className} aria-label="Bennet and Bernard Subsea, home">
      <span className="brand-bb">Bennet and Bernard</span>
      <span className="brand-subsea">SUBSEA</span>
    </a>
  );
}
