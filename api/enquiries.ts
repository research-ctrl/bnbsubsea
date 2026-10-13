// Vercel Function: POST /api/enquiries. The site itself is static (dist/client on Vercel's CDN); this is its only
// server code. Validation and responses live in lib/enquiry.ts, shared with the local dev server (vite.config.ts).
// The relative import names the compiled file (.js): Vercel runs this as an ES module, where extensions are required.
import { put } from "@vercel/blob";
import { handleEnquiry, leadsWebhookFromEnv, type EnquiryStore } from "../lib/enquiry.js";

/**
 * Each enquiry becomes one JSON file in the project's private Vercel Blob store (readable only with the store's token,
 * never by URL), and is copied to the owner's lead sheet when LEADS_WEBHOOK_URL is set. Either one is enough for the
 * visitor's "Thank you"; only when both fail does the form ask them to try again.
 */
const blobStore: EnquiryStore = async (pathname, json) => {
  // BLOB_READ_WRITE_TOKEN when Vercel provides one; otherwise @vercel/blob uses the project's own store connection,
  // and throws if there is none (the enquiry then still reaches the lead sheet, see handleEnquiry)
  const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;
  await put(pathname, json, {
    access: "private",
    contentType: "application/json",
    // the pathname is already unique (time + reference); never replace an enquiry that is already stored
    addRandomSuffix: false,
    allowOverwrite: false,
    ...(token ? { token } : {}),
  });
};

const enquiries = {
  fetch(request: Request) {
    // The lead sheet: LEADS_WEBHOOK_URL (and optional LEADS_WEBHOOK_SECRET), see integrations/google-sheets-leads.
    return handleEnquiry(request, blobStore, { leads: leadsWebhookFromEnv(process.env) });
  },
};

export default enquiries;
