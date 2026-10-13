"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { brand, contactCopy, enquiryTopics } from "@/lib/site-content";
import { ENQUIRY_INTERESTS, isEnquiryInterest } from "@/lib/enquiry";

/** The topic named by a link or URL hash (#enquire-…), if any. A malformed hash (e.g. "#100%") names none. */
function topicFor(hash: string) {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return undefined;
  }
  return enquiryTopics.find(t => t.id === id);
}

/**
 * Enquiry form: POST /api/enquiries (lib/enquiry.ts; stored in a private Vercel Blob store in production).
 *
 * "Enquiry about" lists ENQUIRY_INTERESTS, the same list the server accepts. A link to one of the #enquire-… anchors
 * at the top of this section (enquiryTopics) preselects its subject: on arrival with that hash, on hashchange, and on
 * every click of such a link (a second click on the same link changes no hash).
 */
export function ContactSection() {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [interest, setInterest] = useState("");
  /** set synchronously, so two clicks in the same moment still send one request */
  const sending = useRef(false);

  useEffect(() => {
    const fromHash = () => {
      const topic = topicFor(window.location.hash);
      if (topic) setInterest(topic.interest);
    };
    const fromClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href*='#enquire-']");
      if (!(link instanceof HTMLAnchorElement)) return;
      const topic = topicFor(link.hash);
      if (topic) setInterest(topic.interest);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", fromClick);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", fromClick);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    // the server trims the fields before checking their length: check the same thing here
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (name.length < 2 || !isEnquiryInterest(interest) || message.length < 10) {
      setState("error");
      setFeedback(
        name.length < 2
          ? "Please enter your name."
          : !isEnquiryInterest(interest)
            ? "Please choose what your enquiry is about."
            : "Please write a message of at least 10 characters.",
      );
      return;
    }
    sending.current = true;
    setState("sending");
    setFeedback("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: data.get("email"),
          organisation: "",
          interest,
          message,
          website: data.get("website"),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; reference?: string };
      if (!response.ok) throw new Error(body.error || "Your enquiry could not be received. Please try again.");
      setState("success");
      setFeedback("Thank you. Your enquiry has been received." + (body.reference ? " Reference: " + body.reference + "." : ""));
      form.reset();
      setInterest("");
    } catch (error) {
      setState("error");
      // fetch() rejects with a TypeError ("Failed to fetch") when the network is down: never show that raw text
      setFeedback(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "Your enquiry could not be sent. Please check your connection and try again; your message is still here.",
      );
    } finally {
      sending.current = false;
    }
  }

  return (
    <section className="contact section" id="contact" aria-labelledby="contact-title">
      {/* deep-link targets: each preselects its subject in "Enquiry about" */}
      {enquiryTopics.map(t => (
        <span key={t.id} id={t.id} className="anchor-alias" aria-hidden="true" />
      ))}
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">Get in touch</p>
          <h2 id="contact-title">LET’S TALK.</h2>
          <p>{contactCopy.body}</p>
          <a className="contact-email" href={`mailto:${brand.email}`}>
            {brand.email}
          </a>
        </div>
        <form className="contact-form" onSubmit={submit} aria-busy={state === "sending"}>
          <div className="form-field">
            <label htmlFor="enquiry-name">Name</label>
            <input id="enquiry-name" name="name" autoComplete="name" required minLength={2} maxLength={120} className="field-input" />
          </div>
          <div className="form-field">
            <label htmlFor="enquiry-email">Email</label>
            <input id="enquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} className="field-input" />
          </div>
          <div className="form-field full">
            <label htmlFor="enquiry-interest">Enquiry about</label>
            <select
              id="enquiry-interest"
              name="interest"
              required
              className="field-input field-select"
              value={interest}
              onChange={event => setInterest(event.target.value)}
            >
              <option value="" disabled>
                Choose a subject
              </option>
              {ENQUIRY_INTERESTS.map(i => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field full">
            <label htmlFor="enquiry-message">Message</label>
            <textarea id="enquiry-message" name="message" required minLength={10} maxLength={5000} rows={4} className="field-input" />
          </div>
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="enquiry-website">Website</label>
            <input id="enquiry-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="form-bottom full">
            <button type="submit" disabled={state === "sending"} className="button button--dark">
              {state === "sending" ? "Sending…" : "Send enquiry"}
            </button>
            <p className={"form-feedback" + (state === "error" ? " error" : "")} role={state === "error" ? "alert" : "status"} aria-live="polite">
              {feedback}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
