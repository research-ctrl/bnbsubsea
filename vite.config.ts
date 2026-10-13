import { rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import vinext from "vinext";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { handleEnquiry, leadsWebhookFromEnv, type EnquiryStore } from "./lib/enquiry";

/** The dev-only fixture sequence (public/sequences/_dev, see tools/make_dev_fixture.py) must never be published. */
const excludeDevFixture: Plugin = {
  name: "exclude-dev-fixture",
  apply: "build",
  closeBundle() {
    rmSync(new URL("./dist/client/sequences/_dev", import.meta.url), { recursive: true, force: true });
  },
};

/**
 * Local development only: POST /api/enquiries runs the production handler (lib/enquiry.ts) and writes each enquiry
 * to .dev-enquiries/<same path as in the Blob store>. In production the Vercel Function in api/enquiries.ts serves
 * this path instead; nothing of this plugin is part of the build.
 * Like production, it also copies each enquiry to the lead sheet, but only when LEADS_WEBHOOK_URL and
 * LEADS_WEBHOOK_SECRET are set here: in the shell, or in a git-ignored .env.local (read once at server start).
 */
const devEnquiries: Plugin = {
  name: "dev-enquiries",
  apply: "serve",
  configureServer(server) {
    const leads = leadsWebhookFromEnv(loadEnv(server.config.mode, server.config.envDir, "LEADS_WEBHOOK_"));
    if (leads) server.config.logger.info("  dev-enquiries: also copying each enquiry to the lead sheet (LEADS_WEBHOOK_URL)");
    const folder = path.join(server.config.root, ".dev-enquiries");
    const fileStore: EnquiryStore = async (pathname, json) => {
      const file = path.join(folder, ...pathname.split("/"));
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, json, { flag: "wx" }); // like the Blob store: never overwrite
    };
    server.middlewares.use((req, res, next) => {
      if ((req.url ?? "").split("?")[0] !== "/api/enquiries") return next();
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const request = new Request(`http://${req.headers.host ?? "localhost"}${req.url}`, {
        method: req.method,
        headers,
        body: hasBody ? (Readable.toWeb(req) as unknown as ReadableStream<Uint8Array>) : undefined,
        duplex: "half",
      } as RequestInit);
      handleEnquiry(request, fileStore, { leads })
        .then(async (response) => {
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        })
        .catch(next);
    });
  },
};

export default defineConfig({
  plugins: [devEnquiries, vinext(), excludeDevFixture],
});
