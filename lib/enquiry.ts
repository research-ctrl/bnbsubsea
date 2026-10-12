/**
 * POST /api/enquiries: the one implementation of the enquiry contract, used by
 * - production: the Vercel Function in api/enquiries.ts, which stores each enquiry in the private Vercel Blob store;
 * - local development: the dev-server middleware in vite.config.ts, which writes the same JSON to .dev-enquiries/.
 * The contact form (components/contact-section.tsx) relies on these status codes and { error } / { reference } bodies.
 * Web-standard APIs only (Request, Response, crypto), so it runs unchanged in both places.
 */

export const ENQUIRY_INTERESTS: readonly string[] = ["Shipbuilding", "Lourdes vessel programme", "Research collaboration"];

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

export async function handleEnquiry(request: Request, store: EnquiryStore, now: () => Date = () => new Date()): Promise<Response> {
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
    const interest = typeof payload.interest === "string" ? payload.interest : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    // honeypot: a field people never see, which form-filling bots do fill in
    if (payload.website) return reply({ error: "Your enquiry could not be received." }, 400);
    if (
      name.length < 2 ||
      name.length > 120 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      organisation.length > 180 ||
      !ENQUIRY_INTERESTS.includes(interest) ||
      message.length < 10 ||
      message.length > 5000
    ) {
      return reply({ error: "Please enter a name, valid email and an enquiry of 10–5,000 characters." }, 400);
    }
    const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
    const enquiry: StoredEnquiry = { reference, receivedAt: now().toISOString(), name, email, organisation, interest, message };
    await store(enquiryPathname(enquiry), JSON.stringify(enquiry, null, 2) + "\n");
    return reply({ reference }, 201);
  } catch (error) {
    // never log the enquiry itself: only what went wrong with the storage
    console.error("Enquiry submission failed:", error instanceof Error ? `${error.name}: ${error.message}` : "Unknown storage error");
    return reply({ error: UNAVAILABLE_MESSAGE }, 503);
  }
}
