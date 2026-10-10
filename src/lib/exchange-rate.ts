export const FALLBACK_EXCHANGE_RATE = 25_000;
export const LEGACY_EXCHANGE_RATE = 24_000;
export interface ExchangeRateQuote {
  rate: number;
  source: "binance-p2p" | "fallback";
  expiresAt: number;
  token: string;
}

export function selectLowestRate(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const result = payload as { code?: string; success?: boolean; data?: unknown[] };
  if (result.code !== "000000" || result.success !== true || !Array.isArray(result.data)) return null;
  const prices = result.data.slice(0, 10).flatMap((entry) => {
    const value = (entry as { adv?: { price?: unknown } } | null)?.adv?.price;
    if (typeof value !== "string" && typeof value !== "number") return [];
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? [price] : [];
  });
  return prices.length ? Math.min(...prices) : null;
}

// Cache successful quotes for five minutes; failed reads use exactly 25,000.
// Deduplicate concurrent requests, including when the upstream is unavailable.
export function createExchangeRateLoader(
  request: (input: string, init: RequestInit) => Promise<Response> = (input, init) => fetch(input, init),
  now: () => number = Date.now,
) {
  let cached: { rate: number; source: ExchangeRateQuote["source"]; until: number } | undefined;
  let pending: Promise<{ rate: number; source: ExchangeRateQuote["source"] }> | undefined;
  return async function load() {
    if (cached && now() < cached.until) return { rate: cached.rate, source: cached.source };
    if (pending) return pending;
    pending = (async () => {
      let rate = FALLBACK_EXCHANGE_RATE;
      let source: ExchangeRateQuote["source"] = "fallback";
      try {
        const response = await request("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asset: "USDT", fiat: "VND", tradeType: "SELL", page: 1, rows: 10, payTypes: [], publisherType: null }),
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (response.ok) {
          const selected = selectLowestRate(await response.json());
          if (selected !== null) { rate = selected; source = "binance-p2p"; }
        }
      } catch { /* Timeout, invalid JSON or upstream failure: use the fixed fallback. */ }
      cached = { rate, source, until: now() + (source === "binance-p2p" ? 300_000 : 60_000) };
      return { rate, source };
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}

export function orderExchangeRate(items?: readonly { exchangeRate?: number }[] | null) {
  return items?.[0]?.exchangeRate ?? LEGACY_EXCHANGE_RATE;
}
