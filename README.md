# Bennet and Bernard Subsea — website

The single-page site for Lourdes, our Ro-Ro / landing craft, our shipyard at Fomar, Shiroda, Goa, and her route of
operation. Built with [vinext](https://github.com/cloudflare/vinext) (the Next.js App Router API on Vite) and published
as a **static export** on Vercel, with one Vercel Function for the enquiry form.

## Requirements

- Node.js 24 (`engines.node` is `24.x`)
- pnpm 11.25.0 through Corepack (pinned in `package.json` → `packageManager`): `corepack pnpm@11.25.0 install`

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with HMR on http://127.0.0.1:5173 (`pnpm dev --port <port> --hostname <host>` to change) |
| `pnpm build` | Static export: pre-renders every page into `dist/client` (the folder Vercel publishes) |
| `pnpm test` | Unit tests (Vitest): the enquiry endpoint (Blob client and `fetch` mocked) and the lead-sheet Apps Script |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |

## Layout

- `app/` — the page (`page.tsx`), the root layout and the branded 404 (`not-found.tsx`, exported as `404.html`)
- `components/`, `lib/site-content.ts` — sections and all copy; `public/` — frames, images, fonts, the 3D model
- `api/enquiries.ts` — the Vercel Function behind `POST /api/enquiries`
- `lib/enquiry.ts` — the enquiry contract (validation, limits, responses, the lead-sheet copy), shared by production and
  the dev server
- `integrations/google-sheets-leads/` — the Google Apps Script that adds each enquiry to the owner's lead sheet, and its
  setup steps (pasted into the sheet by hand; not part of the build)
- `vercel.json` — build settings, security and cache headers, the `/lourdes` redirect, function limits
- `next.config.ts` — `output: "export"`; `vite.config.ts` — vinext, the dev-only enquiry endpoint, the dev-fixture exclusion

## Enquiries

The contact form posts JSON to `/api/enquiries`. `lib/enquiry.ts` checks that the request comes from this site, its
size, the honeypot field and every field, then stores the enquiry and answers `201 { reference }`; errors answer
`400`/`403`/`405`/`413`/`415` with `{ error }`, or `503` when storage is unavailable.

Each enquiry is one JSON file holding the submitted fields, the time received and the reference (no IP address), at
`enquiries/YYYY/MM/<time>-<reference>.json`:

- **Production:** in the project's **private** Vercel Blob store (`put()` with `access: "private"`; never readable by
  URL). The function reads the store's token from `BLOB_READ_WRITE_TOKEN`; without it, or if the upload fails, the form
  shows "temporarily unavailable" and nothing is lost on the visitor's side. Read enquiries in the Vercel dashboard
  (Storage → the Blob store) or with `vercel blob list`.
- **Local development:** `pnpm dev` serves the same endpoint and writes to `.dev-enquiries/` (git-ignored).

### Lead sheet (Google Sheets)

After storing an enquiry, the endpoint also copies it to the owner's Google Sheet "Website Leads — Let's Talk" (tab
Leads, one row per enquiry, Status "New"), when `LEADS_WEBHOOK_URL` and `LEADS_WEBHOOK_SECRET` are set. It POSTs
`{ secret, reference, receivedAt, name, email, interest, message, source }` as JSON to the Apps Script web app in
[`integrations/google-sheets-leads/`](integrations/google-sheets-leads/README.md), which checks the secret and appends
the row; the website has no Google credentials. The copy is best effort: the Blob store stays the record, and if the
variables are missing, the sheet refuses, or it does not answer within 5 s, the visitor still gets `201 { reference }`
and the log gets one line naming the reference and the reason (`Lead sheet forward failed for enquiry …`), never the
enquiry's contents. The dev server copies enquiries too, but only when both variables are set in the shell or in a
git-ignored `.env.local`.

## Deploying on Vercel

Project settings (most are also fixed in `vercel.json`):

- Framework Preset: **Other** (`"framework": null`; `next` is installed only for the Next.js API that vinext implements)
- Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm run build`, Output Directory `dist/client`
- Node.js Version: **24.x**
- Environment variable **`ENABLE_EXPERIMENTAL_COREPACK=1`** (all environments): Vercel's built-in pnpm detection stops
  at pnpm 10; with Corepack enabled it uses the pinned pnpm 11.25.0
- Storage: create a **private** Blob store and connect it to the project, which adds `BLOB_READ_WRITE_TOKEN`

Environment variables:

| Variable | Environments | Set by | Purpose |
| --- | --- | --- | --- |
| `ENABLE_EXPERIMENTAL_COREPACK` | all | you: `1` | pnpm 11.25.0 through Corepack (above) |
| `BLOB_READ_WRITE_TOKEN` | all | Vercel, when the Blob store is connected | Stores enquiries (required: without it the form answers 503) |
| `LEADS_WEBHOOK_URL` | Production (Preview optional) | you: the Apps Script **Web app URL** (`https://script.google.com/macros/s/…/exec`) | Copies each enquiry to the lead sheet (optional) |
| `LEADS_WEBHOOK_SECRET` | same as the URL | you: the same long random value as the script property `LEADS_SECRET` | Proves the copy comes from this site (optional; set both or neither) |

Secrets are read from the environment only; none is in the repository. After adding or changing a variable,
redeploy. Setup of the lead sheet, step by step: `integrations/google-sheets-leads/README.md`.

Unknown paths get the branded 404 page with status 404. Hashed bundles under `/_next/static/` are cached for a year;
frames, images, fonts, the model and the Draco decoder (file names not content-hashed) for a day, then revalidated.
