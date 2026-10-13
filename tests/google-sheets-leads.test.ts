/**
 * integrations/google-sheets-leads/Code.gs (the script deployed in the owner's lead sheet), run in a Node VM with
 * small in-memory stand-ins for the Apps Script services it uses.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(new URL("../integrations/google-sheets-leads/Code.gs", import.meta.url), "utf8");

function load(secret: string | null = null) {
  const rows: unknown[][] = [];
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === "LEADS_SECRET" ? secret : null) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (name: string) => (name === "Leads" ? { appendRow: (r: unknown[]) => rows.push(r) } : null) }) },
    ContentService: {
      MimeType: { JSON: "JSON" },
      createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }),
    },
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  const post = (body: unknown) =>
    (context as unknown as { doPost: (e: unknown) => Record<string, unknown> }).doPost({ postData: { contents: JSON.stringify(body) } });
  const raw = (text: string) =>
    (context as unknown as { doPost: (e: unknown) => Record<string, unknown> }).doPost({ postData: { contents: text } });
  return { rows, post, raw };
}

const lead = {
  reference: "AB12CD34",
  receivedAt: "2026-10-13T11:00:00.000Z",
  name: "Asha Rao",
  email: "asha@example.com",
  interest: "BNB SHOREBRIDGE 55 / LOURDES",
  message: "Please share availability.",
  source: "Website – Let’s talk (example.com)",
  secret: "",
};

describe("lead sheet script", () => {
  it("appends one row in the sheet's column order with Status New", () => {
    const sheet = load();
    expect(sheet.post(lead)).toEqual({ ok: true });
    expect(sheet.rows).toHaveLength(1);
    const [received, ...rest] = sheet.rows[0];
    // a Date from the script's VM realm
    expect(Object.prototype.toString.call(received)).toBe("[object Date]");
    expect(new Date(received as string).toISOString()).toBe(lead.receivedAt);
    expect(rest).toEqual([lead.reference, lead.name, lead.email, lead.interest, lead.message, lead.source, "New", "", "", ""]);
  });

  it("checks the secret only when a LEADS_SECRET property is set", () => {
    expect(load("s3cret").post(lead)).toEqual({ ok: false, error: "unauthorised" });
    const sheet = load("s3cret");
    expect(sheet.post({ ...lead, secret: "s3cret" })).toEqual({ ok: true });
    expect(sheet.rows).toHaveLength(1);
  });

  it("refuses leads without a name, email or message", () => {
    const sheet = load();
    expect(sheet.post({ ...lead, message: "  " })).toEqual({ ok: false, error: "missing fields" });
    expect(sheet.rows).toHaveLength(0);
  });

  it("stops values being read as formulas and caps their length", () => {
    const sheet = load();
    sheet.post({ ...lead, name: "=HYPERLINK(\"x\")", message: "+91 999", email: "-x@example.com" });
    expect(sheet.rows[0][2]).toBe("'=HYPERLINK(\"x\")");
    expect(sheet.rows[0][3]).toBe("'-x@example.com");
    expect(sheet.rows[0][5]).toBe("'+91 999");
    sheet.post({ ...lead, message: "x".repeat(6000) });
    expect(String(sheet.rows[1][5])).toHaveLength(5000);
  });

  it("answers a server error for a body that is not JSON", () => {
    const sheet = load();
    const context = sheet as unknown as { raw: (text: string) => unknown };
    expect(context.raw("{not json")).toEqual({ ok: false, error: "server error" });
    expect(sheet.rows).toHaveLength(0);
  });
});
