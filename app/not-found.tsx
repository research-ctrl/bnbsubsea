import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Branded 404: the site is a single page, so every way out leads back to it. */
export default function NotFound() {
  return (
    <>
      <SiteHeader base="/" />
      <main id="main" className="not-found section section--dark">
        <div className="wrap">
          <p className="eyebrow eyebrow--light">404 / Page not found</p>
          <h1>THIS PAGE IS NOT HERE.</h1>
          <p>The page you asked for does not exist or has moved. Everything about the BNB SHOREBRIDGE 55 and LOURDES, our shipyard and her route of operation is on the home page.</p>
          <div className="not-found-actions">
            {/* plain anchors: next/link threw on click in the production build (a full page load is intended) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="button button--light" href="/">
              Go to the home page
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="button button--outline-light" href="/#contact">
              Contact us
            </a>
          </div>
        </div>
      </main>
      <SiteFooter base="/" />
    </>
  );
}
