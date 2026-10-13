/**
 * POST /api/enquiries: the one implementation of the enquiry contract, used by
 * - production: the Vercel Function in api/enquiries.ts, which stores each enquiry in the private Vercel Blob store;
 * - local development: the dev-server middleware in vite.config.ts, which writes the same JSON to .dev-enquiries/.
 * Both then copy the stored enquiry to the owner's lead sheet when LEADS_WEBHOOK_URL and LEADS_WEBHOOK_SECRET are set
 * (forwardLead below; the receiving Google Apps Script is integrations/google-sheets-leads/Code.gs).
 * The contact form (components/contact-section.tsx) relies on these status codes and { error } / { reference } bodies.
 * Web-standard APIs only (Request, Response, crypto, fetch), so it runs unchanged in both places. It never reads
 * process.env itself: the form imports this module too, so it is also part of the browser bundle.
 */

/**
 * The subjects a visitor can pick in the form's "Enquiry about" list, stored as written. The form renders exactly this
 * list, so the browser and the server never disagree about what is allowed.
 */
export const ENQUIRY_INTERESTS = [
  "BNB SHOREBRIDGE 55 / LOURDES",
  "400–500 DWT design-to-order landing craft",
  "Shipyard / general",
] as const;
export type EnquiryInterest = (typeof ENQUIRY_INTERESTS)[number];

export function isEnquiryInterest(value: unknown): value is EnquiryInterest {
  return typeof value === "string" && (ENQUIRY_INTERESTS as readonly string[]).includes(value);
}

/**
 * Transition only: the form before 13 Oct 2026 always sent "Shipbuilding". A page left open from before the deployment
 * of the new subject list still sends it, so the server accepts it and stores it under today's general subject rather
 * than losing the enquiry. The form itself never offers it. Remove this once that deployment has been live for a few
 * weeks (SOURCE_CONFLICTS SB-10).
 */
export const RETIRED_INTERESTS: Readonly<Record<string, EnquiryInterest>> = { Shipbuilding: "Shipyard / general" };

/** The subject to store for a submitted value, or null when it is neither a current nor a retired subject. */
export function storedInterest(value: unknown): EnquiryInterest | null {
  if (isEnquiryInterest(value)) return value;
  if (typeof value === "string" && Object.hasOwn(RETIRED_INTERESTS, value)) return RETIRED_INTERESTS[value];
  return null;
}

export const INVALID_FIELDS_MESSAGE = "Please enter a name, valid email and an enquiry of 10–5,000 characters.";
/** Only a page that does not offer the current list can send an unknown subject: reloading it fixes that. */
export const INVALID_INTEREST_MESSAGE = "Please reload the page and choose what your enquiry is about.";

/** Longest accepted request body, in characters of raw JSON (the message itself is limited to 5,000). */
export const MAX_BODY_CHARS = 12_000;

export const UNAVAILABLE_MESSAGE = "Enquiries are temporarily unavailable. Your message is still here; please try again shortly.";

/** What is stored per enquiry: the submitted fields, the time received and the reference shown to the sender. No IP address. */
export interface StoredEnquiry {
  reference: string;
  receivedAt: string;
  name: string;
  email: string;
  organisation: string;
  interest: string;
  message: string;
}

/** Saves one enquiry (JSON text) at `pathname`. Must reject rather than overwrite an existing record. */
export type EnquiryStore = (pathname: string, json: string) => Promise<void>;

/**
 * enquiries/2026/10/2026-10-12T16-20-05.123Z-AB12CD34.json: grouped by year and month, sortable by time. The colons
 * of the ISO time become hyphens so the same name is also a valid file name on Windows (.dev-enquiries/).
 */
export function enquiryPathname({ receivedAt, reference }: Pick<StoredEnquiry, "receivedAt" | "reference">): string {
  const [year, month] = receivedAt.split("-");
  return `enquiries/${year}/${month}/${receivedAt.replace(/:/g, "-")}-${reference}.json`;
}

const reply = (body: { error: string } | { reference: string }, status: number) => Response.json(body, { status });

/** True when the Origin header is absent or names this site. "null" or an unparsable value is rejected (403). */
function sameOrigin(origin: string | null, url: string): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(url).origin;
  } catch {
    return false;
  }
}

/**
 * The body as text, or null once it is certainly longer than MAX_BODY_CHARS. One character takes at most 3 bytes of
 * UTF-8, so a body over 3 × MAX_BODY_CHARS bytes always fails the character check: stop reading there.
 */
async function readBody(request: Request): Promise<string | null> {
  const maxBytes = MAX_BODY_CHARS * 3;
  if (Number(request.headers.get("content-length")) > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * The owner's lead sheet ("Website Leads — Let's Talk" in Google Sheets): a Google Apps Script web app that appends one
 * row per enquiry (integrations/google-sheets-leads). The website holds no Google credentials, only the web app's URL
 * and a shared secret that the script checks.
 */
export interface LeadsWebhook {
  url: string;
  secret: string;
}

/** The longest the visitor waits for the lead sheet. The enquiry is already stored by then; only the sheet row is at stake. */
export const LEADS_WEBHOOK_TIMEOUT_MS = 5_000;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The lead-sheet forward configured in `env` (LEADS_WEBHOOK_URL and LEADS_WEBHOOK_SECRET), or null when it is off.
 * Callers pass their environment: process.env in the Vercel Function, Vite's loadEnv in local development.
 * The URL turns it on; the secret is optional (sent only if set, for a script that checks a LEADS_SECRET property).
 * No URL: off (logged if a secret is set without one). A URL that is not https:// (plain http only to this machine): off,
 * and the misconfiguration is logged (never the secret).
 */
export function leadsWebhookFromEnv(env: Record<string, string | undefined>): LeadsWebhook | null {
  const url = env.LEADS_WEBHOOK_URL?.trim() ?? "";
  const secret = env.LEADS_WEBHOOK_SECRET?.trim() ?? "";
  if (!url && !secret) return null;
  const off = (reason: string) => {
    console.error(`Lead sheet forward is off: ${reason}`);
    return null;
  };
  if (!url) return off("LEADS_WEBHOOK_SECRET is set but LEADS_WEBHOOK_URL is not.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return off("LEADS_WEBHOOK_URL is not a URL.");
  }
  // the secret travels in the request body: never over plain http, except to a test server on this machine
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && LOCAL_HOSTNAMES.has(parsed.hostname))) {
    return off("LEADS_WEBHOOK_URL must start with https://.");
  }
  return { url: parsed.href, secret };
}

/** The sheet's Source column: the form, and the site that received the enquiry (production, a preview or local dev). */
export function leadSource(requestUrl: string): string {
  return `Website – Let’s talk (${new URL(requestUrl).host})`;
}

/** The JSON body sent to the lead sheet: the stored enquiry without `organisation` (the form does not ask for one). */
export interface LeadPayload {
  secret: string;
  reference: string;
  receivedAt: string;
  name: string;
  email: string;
  interest: string;
  message: string;
  source: string;
}

/** A short code from the script's { ok: false, error } answer, reduced to characters that are safe to log. */
const logCode = (value: unknown) => String(value).replace(/[^\w:.-]/g, "").slice(0, 60) || "unknown";

/**
 * Best effort: POSTs the stored enquiry to the lead sheet and resolves true once the script answers { ok: true }.
 * Never throws, and gives up after LEADS_WEBHOOK_TIMEOUT_MS. A failure is logged with the enquiry's reference (to find
 * it in the store) and the reason, never with the enquiry's contents; the visitor's answer does not change.
 */
export async function forwardLead(enquiry: StoredEnquiry, webhook: LeadsWebhook, source: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEADS_WEBHOOK_TIMEOUT_MS);
  const failed = (reason: string) => {
    console.error(`Lead sheet forward failed for enquiry ${enquiry.reference}: ${reason}`);
    return false;
  };
  try {
    const { reference, receivedAt, name, email, interest, message } = enquiry;
    const payload: LeadPayload = { secret: webhook.secret, reference, receivedAt, name, email, interest, message, source };
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      // an Apps Script web app answers a POST with a redirect to its output, which is then fetched with GET
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    let answer: unknown = null;
    try {
      answer = JSON.parse(text);
    } catch {
      // not JSON (e.g. a Google sign-in page): reported below
    }
    const result = answer && typeof answer === "object" && !Array.isArray(answer) ? (answer as Record<string, unknown>) : null;
    if (response.ok && result?.ok === true) return true;
    if (!response.ok) return failed(`HTTP ${response.status}`);
    if (result && "error" in result) return failed(`the sheet answered "${logCode(result.error)}"`);
    return failed('the answer was not the lead sheet\'s JSON (is the web app deployed with access "Anyone"?)');
  } catch (error) {
    if (controller.signal.aborted) return failed(`no answer within ${LEADS_WEBHOOK_TIMEOUT_MS / 1000} s`);
    const cause = error instanceof Error && error.cause && typeof error.cause === "object" && "code" in error.cause ? ` (${logCode(error.cause.code)})` : "";
    return failed(error instanceof Error ? `${error.name}: ${error.message}${cause}` : "unknown error");
  } finally {
    clearTimeout(timer);
  }
}

export interface EnquiryOptions {
  /** Where to copy each stored enquiry (leadsWebhookFromEnv); null or absent: nowhere. */
  leads?: LeadsWebhook | null;
  now?: () => Date;
}

export async function handleEnquiry(request: Request, store: EnquiryStore, { leads, now = () => new Date() }: EnquiryOptions = {}): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
  }
  if (!sameOrigin(request.headers.get("origin"), request.url)) return reply({ error: "Please send the enquiry from this website." }, 403);
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "The enquiry format is invalid." }, 415);
    const raw = await readBody(request);
    if (raw === null || raw.length > MAX_BODY_CHARS) return reply({ error: "Please keep your enquiry within 5,000 characters." }, 413);
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw);
    } catch {
      return reply({ error: "The enquiry format is invalid." }, 400);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply({ error: "The enquiry format is invalid." }, 400);
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const organisation = typeof payload.organisation === "string" ? payload.organisation.trim() : "";
    const interest = storedInterest(payload.interest);
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    // honeypot: a field people never see, which form-filling bots do fill in
    if (payload.website) return reply({ error: "Your enquiry could not be received." }, 400);
    if (
      name.length < 2 ||
      name.length > 120 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      organisation.length > 180 ||
      message.length < 10 ||
      message.length > 5000
    ) {
      return reply({ error: INVALID_FIELDS_MESSAGE }, 400);
    }
    if (!interest) return reply({ error: INVALID_INTEREST_MESSAGE }, 400);
    const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
    const enquiry: StoredEnquiry = { reference, receivedAt: now().toISOString(), name, email, organisation, interest, message };
    // Two destinations: the private store and the owner's lead sheet. The enquiry is received if either keeps it, so a
    // store that is not configured (or is down) does not lose a lead the sheet accepted, and vice versa.
    let stored = false;
    try {
      await store(enquiryPathname(enquiry), JSON.stringify(enquiry, null, 2) + "\n");
      stored = true;
    } catch (error) {
      // never log the enquiry itself: only what went wrong with the storage
      console.error(`Enquiry ${reference} was not stored:`, error instanceof Error ? `${error.name}: ${error.message}` : "Unknown storage error");
    }
    const copied = leads ? await forwardLead(enquiry, leads, leadSource(request.url)) : false; // forwardLead never throws
    if (stored || copied) return reply({ reference }, 201);
    return reply({ error: UNAVAILABLE_MESSAGE }, 503);
  } catch (error) {
    // never log the enquiry itself: only what went wrong with the storage
    console.error("Enquiry submission failed:", error instanceof Error ? `${error.name}: ${error.message}` : "Unknown storage error");
    return reply({ error: UNAVAILABLE_MESSAGE }, 503);
  }
}
