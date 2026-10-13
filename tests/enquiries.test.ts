import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Blob client is mocked: these tests never reach a real store.
const { put } = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@vercel/blob", () => ({ put }));

import enquiries from "../api/enquiries";
import { ENQUIRY_INTERESTS, INVALID_FIELDS_MESSAGE, INVALID_INTEREST_MESSAGE, UNAVAILABLE_MESSAGE } from "../lib/enquiry";
import { enquiryTopics } from "../lib/site-content";

const SITE = "https://bnb.example";
const valid = {
  name: "Test Sender",
  email: "sender@example.com",
  organisation: "",
  interest: "BNB SHOREBRIDGE 55 / LOURDES",
  message: "A test enquiry about LOURDES.",
  website: "",
};

function post(body: unknown, { origin = SITE, contentType = "application/json" }: { origin?: string | null; contentType?: string } = {}) {
  const headers = new Headers({ "content-type": contentType });
  if (origin !== null) headers.set("origin", origin);
  return new Request(`${SITE}/api/enquiries`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function send(request: Request) {
  const response = await enquiries.fetch(request);
  return { status: response.status, body: (await response.json()) as { error?: string; reference?: string } };
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  put.mockReset();
  put.mockResolvedValue({ pathname: "stored" });
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  consoleError.mockRestore();
});

describe("POST /api/enquiries", () => {
  it("stores a valid enquiry in the private Blob store and returns its reference", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-12T16:20:05.123Z"));

    const { status, body } = await send(post({ ...valid, name: "  Test Sender  ", message: "  A test enquiry about LOURDES.  " }));

    expect(status).toBe(201);
    expect(body.reference).toMatch(/^[0-9A-F]{8}$/);
    expect(put).toHaveBeenCalledTimes(1);
    const [pathname, json, options] = put.mock.calls[0];
    expect(pathname).toBe(`enquiries/2026/10/2026-10-12T16-20-05.123Z-${body.reference}.json`);
    expect(options).toEqual({
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false,
      token: "test-token",
    });
    // only the submitted fields (trimmed), the time and the reference: nothing else, no IP address
    expect(JSON.parse(json)).toEqual({
      reference: body.reference,
      receivedAt: "2026-10-12T16:20:05.123Z",
      name: "Test Sender",
      email: "sender@example.com",
      organisation: "",
      interest: "BNB SHOREBRIDGE 55 / LOURDES",
      message: "A test enquiry about LOURDES.",
    });
  });

  it("offers exactly the three subjects of the contact form", () => {
    expect(ENQUIRY_INTERESTS).toEqual(["BNB SHOREBRIDGE 55 / LOURDES", "400–500 DWT design-to-order landing craft", "Shipyard / general"]);
  });

  it.each(ENQUIRY_INTERESTS.map((interest) => [interest]))("accepts and stores the subject %s", async (interest) => {
    const { status } = await send(post({ ...valid, interest }));
    expect(status).toBe(201);
    expect(JSON.parse(put.mock.calls[0][1]).interest).toBe(interest);
  });

  it("stores the retired subject Shipbuilding (sent by pages loaded before the new list) as Shipyard / general", async () => {
    const { status } = await send(post({ ...valid, interest: "Shipbuilding" }));
    expect(status).toBe(201);
    expect(JSON.parse(put.mock.calls[0][1]).interest).toBe("Shipyard / general");
  });

  it("deep-links every enquiry topic to a subject the server accepts", () => {
    expect(enquiryTopics.map((t) => t.interest).sort()).toEqual([...ENQUIRY_INTERESTS].sort());
    for (const t of enquiryTopics) expect(t.id).toMatch(/^enquire-[a-z0-9-]+$/);
  });

  it("accepts a request without an Origin header", async () => {
    expect((await send(post(valid, { origin: null }))).status).toBe(201);
  });

  it("gives every enquiry its own reference and path", async () => {
    await send(post(valid));
    await send(post(valid));
    const [first, second] = put.mock.calls.map((call) => call[0]);
    expect(first).not.toBe(second);
  });

  it.each([
    ["a one-letter name", { name: "A" }],
    ["a name over 120 characters", { name: "N".repeat(121) }],
    ["an invalid email", { email: "not-an-email" }],
    ["an email over 254 characters", { email: `${"e".repeat(250)}@example.com` }],
    ["an organisation over 180 characters", { organisation: "O".repeat(181) }],
    ["a message under 10 characters", { message: "Too short" }],
    ["a message over 5,000 characters", { message: "M".repeat(5001) }],
    ["an invalid email and an unknown interest", { email: "not-an-email", interest: "Unknown" }],
  ])("rejects %s with 400", async (_label, change) => {
    const { status, body } = await send(post({ ...valid, ...change }));
    expect(status).toBe(400);
    expect(body.error).toBe(INVALID_FIELDS_MESSAGE);
    expect(put).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown interest", { interest: "Drones" }],
    ["another retired interest", { interest: "Research collaboration" }],
    ["no interest", { interest: "" }],
    ["a missing interest", { interest: undefined }],
    ["a non-string interest", { interest: 55 }],
    ["an interest that only differs in case", { interest: "bnb shorebridge 55 / lourdes" }],
    ["an inherited property name", { interest: "toString" }],
  ])("rejects %s with 400 and asks for a reload", async (_label, change) => {
    const { status, body } = await send(post({ ...valid, ...change }));
    expect(status).toBe(400);
    expect(body.error).toBe(INVALID_INTEREST_MESSAGE);
    expect(put).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", "{name:"],
    ["a JSON array", "[]"],
    ["JSON null", "null"],
  ])("rejects %s with 400", async (_label, raw) => {
    const { status, body } = await send(post(raw));
    expect(status).toBe(400);
    expect(body.error).toBe("The enquiry format is invalid.");
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a filled-in honeypot with 400 and stores nothing", async () => {
    const { status, body } = await send(post({ ...valid, website: "https://spam.example" }));
    expect(status).toBe(400);
    expect(body.error).toBe("Your enquiry could not be received.");
    expect(put).not.toHaveBeenCalled();
  });

  it.each([["another site", "https://elsewhere.example"], ["an opaque origin", "null"]])(
    "rejects a request from %s with 403",
    async (_label, origin) => {
      const { status, body } = await send(post(valid, { origin }));
      expect(status).toBe(403);
      expect(body.error).toBe("Please send the enquiry from this website.");
      expect(put).not.toHaveBeenCalled();
    },
  );

  it("rejects a body over 12,000 characters with 413", async () => {
    const { status, body } = await send(post({ ...valid, message: "M".repeat(12_001) }));
    expect(status).toBe(413);
    expect(body.error).toBe("Please keep your enquiry within 5,000 characters.");
    expect(put).not.toHaveBeenCalled();
  });

  it("stops reading a very large body and answers 413", async () => {
    const { status } = await send(post({ ...valid, message: "M".repeat(200_000) }));
    expect(status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON with 415", async () => {
    const { status, body } = await send(post("name=Test", { contentType: "application/x-www-form-urlencoded" }));
    expect(status).toBe(415);
    expect(body.error).toBe("The enquiry format is invalid.");
  });

  it("answers other methods with 405", async () => {
    const response = await enquiries.fetch(new Request(`${SITE}/api/enquiries`));
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("answers 503 without calling the store when BLOB_READ_WRITE_TOKEN is missing, and logs no personal data", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const { status, body } = await send(post(valid));
    expect(status).toBe(503);
    expect(body.error).toBe(UNAVAILABLE_MESSAGE);
    expect(put).not.toHaveBeenCalled();
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).toContain("BLOB_READ_WRITE_TOKEN");
    for (const value of [valid.name, valid.email, valid.message]) expect(logged).not.toContain(value);
  });

  it("answers 503 when the Blob store rejects the upload", async () => {
    put.mockRejectedValueOnce(new Error("Vercel Blob: service unavailable"));
    const { status, body } = await send(post(valid));
    expect(status).toBe(503);
    expect(body.error).toBe(UNAVAILABLE_MESSAGE);
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(consoleError.mock.calls);
    for (const value of [valid.name, valid.email, valid.message]) expect(logged).not.toContain(value);
  });
});
