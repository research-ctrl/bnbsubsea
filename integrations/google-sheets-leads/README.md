# Website leads → Google Sheet

Every enquiry sent through the website's **Let's talk** form becomes a new row in the Google Sheet
**"Website Leads — Let's Talk"** (Drive: Shipping → Website → Leads), tab **Leads**, with Status **New**.

The website first stores the enquiry in its private Vercel Blob store (the system of record), then sends a copy to the
Google Apps Script attached to the sheet ([`Code.gs`](Code.gs)), which appends the row. The website holds no Google
password, key or token, only the script's web-app URL (a server-side environment variable, never sent to browsers).
If the sheet can't be reached, the visitor still gets the normal "Thank you" and the enquiry is still in the Blob store.

## Setup (done 13 Oct 2026)

1. Sheet → **Extensions → Apps Script** → paste [`Code.gs`](Code.gs) → **Save**.
2. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access **Anyone** → **Deploy** → authorise.
3. Copy the **Web app URL** (`…/exec`). After any code change: **Deploy → Manage deployments → Edit → New version**.
4. Website environment (Vercel → Settings → Environment Variables, and `.env.local` for local development):
   `LEADS_WEBHOOK_URL` = the Web app URL. Keep it private: anyone with the URL could add rows.

Optional hardening: add a script property `LEADS_SECRET` (Project Settings → Script properties) and set the same value
as `LEADS_WEBHOOK_SECRET` on the website; the script then refuses requests without it.
