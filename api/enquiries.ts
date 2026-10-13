// Vercel Function: POST /api/enquiries. The site itself is static (dist/client on Vercel's CDN); this is its only
// server code. Validation and responses live in lib/enquiry.ts, shared with the local dev server (vite.config.ts).
// The relative import names the compiled file (.js): Vercel runs this as an ES module, where extensions are required.
import { put } from "@vercel/blob";
import { handleEnquiry, leadsWebhookFromEnv, type EnquiryStore } from "../lib/enquiry.js";

/**
 * Each enquiry becomes one JSON file in the project's private Vercel Blob store (readable only with the store's token,
 * never by URL). Vercel sets BLOB_READ_WRITE_TOKEN when the store is connected to the project.
 */
const blobStore: EnquiryStore = async (pathname, json) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set (connect the private Blob store to the project)");
  await put(pathname, json, {
    access: "private",
    contentType: "application/json",
    // the pathname is already unique (time + reference); never replace an enquiry that is already stored
    addRandomSuffix: false,
    allowOverwrite: false,
    token,
  });
};

const enquiries = {
  fetch(request: Request) {
    // After storing, each enquiry is also copied to the owner's Google Sheet when LEADS_WEBHOOK_URL and
    // LEADS_WEBHOOK_SECRET are set in the project's environment variables (integrations/google-sheets-leads).
    return handleEnquiry(request, blobStore, { leads: leadsWebhookFromEnv(process.env) });
  },
};

export default enquiries;
