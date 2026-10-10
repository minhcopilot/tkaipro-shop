import { describe, expect, mock, test } from "bun:test";
import { createHmac } from "node:crypto";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createExchangeRateLoader, orderExchangeRate, selectLowestRate } from "../src/lib/exchange-rate";
import { ExchangeRateProvider, usePricing } from "../src/ui/components/exchange-rate-provider";

const payload = (prices: unknown[]) => ({ code: "000000", success: true, data: prices.map(price => ({ adv: { price } })) });
describe("Binance P2P exchange rate", () => {
  test("chooses the lowest of the first ten, not the first or eleventh", () => {
    expect(selectLowestRate(payload([26187, 25189, 25800]))).toBe(25189);
    expect(selectLowestRate(payload([...Array(10).fill(25189), 1]))).toBe(25189);
  });
  test("ignores invalid prices and rejects unsuccessful payloads", () => {
    expect(selectLowestRate(payload([null, true, "", "NaN", -1, 0, "25189"]))).toBe(25189);
    expect(selectLowestRate(payload([]))).toBeNull();
    expect(selectLowestRate({ ...payload([25189]), success: false })).toBeNull();
  });
  test("requests SELL USDT/VND and caches concurrent successful calls", async () => {
    let time = 0;
    const request = mock(async (_url: unknown, options: RequestInit) => {
      expect(JSON.parse(String(options.body))).toMatchObject({ tradeType: "SELL", asset: "USDT", fiat: "VND", rows: 10, page: 1 });
      return new Response(JSON.stringify(payload([26187, 25189])));
    });
    const load = createExchangeRateLoader(request as typeof fetch, () => time);
    expect(await Promise.all([load(), load()])).toEqual([{ rate: 25189, source: "binance-p2p" }, { rate: 25189, source: "binance-p2p" }]);
    await load();
    expect(request).toHaveBeenCalledTimes(1);
    time = 300_001;
    await load();
    expect(request).toHaveBeenCalledTimes(2);
  });
  test("uses exactly 25000 on HTTP errors, invalid JSON or missing prices", async () => {
    for (const response of [new Response("blocked", { status: 403 }), new Response("not json"), new Response(JSON.stringify(payload([])))]) {
      const load = createExchangeRateLoader((async () => response) as typeof fetch);
      expect(await load()).toEqual({ rate: 25000, source: "fallback" });
    }
  });
  test("uses 25000 on timeout/network failure instead of a stale successful rate", async () => {
    let time = 0, fail = false;
    const load = createExchangeRateLoader((async () => {
      if (fail) throw new Error("timeout");
      return new Response(JSON.stringify(payload([25189])));
    }) as typeof fetch, () => time);
    expect((await load()).rate).toBe(25189);
    fail = true; time = 300_001;
    expect((await load()).rate).toBe(25000);
  });
  test("retains the snapshot and preserves legacy orders at 24000", () => {
    expect(orderExchangeRate([{ exchangeRate: 25189 }])).toBe(25189);
    expect(orderExchangeRate([{}])).toBe(24000);
    expect(orderExchangeRate(null)).toBe(24000);
  });
});

mock.module("server-only", () => ({}));
const { getExchangeRateQuote, resolveCheckoutRate } = await import("../src/lib/exchange-rate-server");
describe("signed checkout quote", () => {
  test("accepts server signatures and rejects edited prices/signatures", async () => {
    const priorSecret = process.env.EXCHANGE_RATE_SECRET;
    const priorFetch = globalThis.fetch;
    process.env.EXCHANGE_RATE_SECRET = "test-secret-for-exchange-rate";
    globalThis.fetch = (async () => new Response(JSON.stringify(payload([26187, 25189])))) as typeof fetch;
    try {
      const quote = await getExchangeRateQuote();
      expect(quote.rate).toBe(25189);
      expect(await resolveCheckoutRate(quote.token)).toBe(25189);
      const [body, sig] = quote.token.split(".");
      const edited = JSON.parse(Buffer.from(body!, "base64url").toString());
      edited.rate = 1_000_000;
      expect(await resolveCheckoutRate(Buffer.from(JSON.stringify(edited)).toString("base64url") + "." + sig)).toBeNull();
      expect(await resolveCheckoutRate(quote.token + "extra")).toBeNull();
      const expiredBody = Buffer.from(JSON.stringify({ rate: quote.rate, expiresAt: 1 })).toString("base64url");
      const expiredSig = createHmac("sha256", process.env.EXCHANGE_RATE_SECRET!).update("exchange-rate:" + expiredBody).digest("base64url");
      expect(await resolveCheckoutRate(expiredBody + "." + expiredSig)).toBeNull();
      expect(await resolveCheckoutRate(25_000)).toBeNull();
      expect(await resolveCheckoutRate("invalid")).toBeNull();
    } finally {
      globalThis.fetch = priorFetch;
      if (priorSecret === undefined) delete process.env.EXCHANGE_RATE_SECRET;
      else process.env.EXCHANGE_RATE_SECRET = priorSecret;
    }
  });
});

describe("price rendering", () => {
  function Amount({ snapshot }: { snapshot?: number }) {
    const { formatPrice } = usePricing(snapshot);
    return createElement("span", null, formatPrice(250_000, "en"));
  }
  test("SSR uses the provider quote and does not leak between renders", () => {
    function render(rate: number, snapshot?: number) {
      return renderToString(createElement(ExchangeRateProvider, {
        initialQuote: { rate, source: "binance-p2p", expiresAt: Date.now() + 1000, token: "test" },
        children: createElement(Amount, { snapshot }),
      }));
    }
    expect(render(25_000)).toContain("$10.00");
    expect(render(26_000)).toContain("$9.62");
    expect(render(26_000, 25_000)).toContain("$10.00");
    expect(render(25_000)).toContain("$10.00");
  });
});
