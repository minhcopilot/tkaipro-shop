import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const {
  extractConfirmationLink,
  getLatestConfirmationLink,
  pollLatestConfirmationLink,
} = await import("../src/lib/otp-inbox/client");
const { hashAccessKey } = await import("../src/lib/account-otp-keys");

const link = "https://cursor.com/confirm-action#t=synthetic-token";
const priorFetch = globalThis.fetch;
const priorKey = process.env.OTP_INBOX_API_KEY;
afterEach(() => {
  globalThis.fetch = priorFetch;
  if (priorKey === undefined) delete process.env.OTP_INBOX_API_KEY;
  else process.env.OTP_INBOX_API_KEY = priorKey;
});

function email(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    address: "user@example.com",
    envelope_from: "pm_bounces@pm-bounces.cursor.com",
    subject: "Confirm a change to your Cursor account",
    received_at: new Date().toISOString(),
    ...overrides,
  };
}

function mockInbox(
  items: ReturnType<typeof email>[],
  raw = `<a href="${link}">Confirm in that browser</a>`,
) {
  process.env.OTP_INBOX_API_KEY = "test-api-key";
  const rawIds: number[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/raw")) {
      rawIds.push(Number(path.split("/").at(-2)));
      return new Response(raw);
    }
    return Response.json({ items });
  }) as typeof fetch;
  return rawIds;
}

describe("Cursor confirmation email", () => {
  test("extracts HTML, quoted-printable, base64 and multipart action links", () => {
    expect(extractConfirmationLink(`<a href="${link}">Confirm</a>`)).toBe(link);
    expect(
      extractConfirmationLink(
        'Content-Type: text/html\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<a href=3D"https://cursor.com/confirm-action#t=3Dsynthetic-=\r\ntoken">Confirm</a>',
      ),
    ).toBe(link);
    expect(
      extractConfirmationLink(
        `Content-Type: text/html\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(`<a href="${link}">Confirm</a>`).toString("base64")}`,
      ),
    ).toBe(link);
    expect(
      extractConfirmationLink(
        `Content-Type: multipart/alternative; boundary="part"\r\n\r\n--part\r\nContent-Type: text/html\r\n\r\n<a href="${link}">Confirm</a>\r\n--part--`,
      ),
    ).toBe(link);
    expect(
      extractConfirmationLink(
        "Content-Type: text/html\r\n\r\nhttps://cursor.com/confirm-action#t=abc=AB",
      ),
    ).toBe("https://cursor.com/confirm-action#t=abc=AB");
    for (const bad of [
      "https://cursor.com.evil.test/confirm-action#t=x",
      "http://cursor.com/confirm-action#t=x",
      "https://evil@cursor.com/confirm-action#t=x",
      "https://cursor.com/reset-password#t=x",
      "https://cursor.com/confirm-action",
    ]) {
      expect(extractConfirmationLink(bad)).toBeNull();
    }
  });

  test("isolates the mailbox and selects only fresh Cursor confirmation emails", async () => {
    const ids = mockInbox([
      email(1, { address: "other@example.com" }),
      email(2, { envelope_from: "attacker@cursor.com.evil.test" }),
      email(3, { subject: "Reset your password" }),
      email(4, { received_at: new Date(Date.now() - 610_000).toISOString() }),
      email(5, { received_at: "invalid" }),
      email(6, { received_at: new Date(Date.now() + 600_000).toISOString() }),
      email(7, { received_at: new Date(Date.now() - 60_000).toISOString() }),
      email(8),
    ]);
    expect(
      (await getLatestConfirmationLink(" USER@example.com "))?.messageId,
    ).toBe(8);
    expect(ids).toEqual([8]);
    expect(
      await pollLatestConfirmationLink("missing@example.com", {
        attempts: 2,
        intervalMs: 0,
      }),
    ).toBeNull();
  });
});

let active = true;
let updates = 0;
mock.module("~/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            {
              id: "test-account",
              keyHash: hashAccessKey("test-password"),
              isActive: active,
            },
          ],
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => {
          updates++;
        },
      }),
    }),
  },
}));
const { POST } = await import("../src/app/api/public/account-code/route");
function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/public/account-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("account code API confirmation option", () => {
  test("requires the account password and an active access key before reading mail", async () => {
    let fetched = false;
    globalThis.fetch = (async () => {
      fetched = true;
      throw new Error("must not fetch");
    }) as typeof fetch;
    const credentials = { email: "user@example.com", type: "confirm-link" };
    expect(
      (await POST(request({ ...credentials, accessKey: "wrong" }))).status,
    ).toBe(400);
    active = false;
    try {
      expect(
        (await POST(request({ ...credentials, accessKey: "test-password" })))
          .status,
      ).toBe(400);
    } finally {
      active = true;
    }
    expect(
      (
        await POST(
          request({
            ...credentials,
            accessKey: "test-password",
            type: "unknown",
          }),
        )
      ).status,
    ).toBe(400);
    expect(fetched).toBe(false);
  });

  test("returns a copyable link with no-store caching and no OTP", async () => {
    mockInbox([email(1)]);
    const response = await POST(
      request({
        email: "user@example.com",
        accessKey: "test-password",
        type: "confirm-link",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.json();
    expect(data.link).toBe(link);
    expect(data.code).toBeUndefined();
    expect(updates).toBe(1);
  });

  test("preserves code retrieval for existing callers without a type", async () => {
    mockInbox(
      [email(1, { subject: "Sign-in code" })],
      "Your one-time code is: 123456",
    );
    const response = await POST(
      request({ email: "user@example.com", password: "test-password" }),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.code).toBe("123456");
    expect(data.link).toBeUndefined();
  });
});
