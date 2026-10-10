import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { FALLBACK_EXCHANGE_RATE, createExchangeRateLoader, type ExchangeRateQuote } from "./exchange-rate";

const loadRate = createExchangeRateLoader();
export const getExchangeRate = loadRate;
function signingSecret() {
  return process.env.EXCHANGE_RATE_SECRET || process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
}
function signature(payload: string) {
  const secret = signingSecret();
  return secret ? createHmac("sha256", secret).update("exchange-rate:" + payload).digest("base64url") : "";
}
export const getExchangeRateQuote = cache(async (): Promise<ExchangeRateQuote> => {
  const { rate, source } = signingSecret() ? await loadRate() : { rate: FALLBACK_EXCHANGE_RATE, source: "fallback" as const };
  const expiresAt = Date.now() + 30 * 60_000;
  const payload = Buffer.from(JSON.stringify({ rate, expiresAt })).toString("base64url");
  const sig = signature(payload);
  return { rate, source, expiresAt, token: sig ? payload + "." + sig : "" };
});

// Only a server-signed rate can be accepted from the checkout. Never trust a
// client-supplied numeric rate; older clients receive the current server rate.
export async function resolveCheckoutRate(token: unknown): Promise<number | null> {
  if (token === undefined || token === "") return signingSecret() ? (await loadRate()).rate : FALLBACK_EXCHANGE_RATE;
  if (typeof token !== "string" || token.length > 512) return null;
  try {
    const [payload, sig, extra] = token.split(".");
    if (!payload || !sig || extra !== undefined) return null;
    const expected = signature(payload);
    const a = Buffer.from(sig); const b = Buffer.from(expected);
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const quote = JSON.parse(Buffer.from(payload, "base64url").toString()) as { rate: number; expiresAt: number };
    if (!Number.isFinite(quote.rate) || quote.rate <= 0 || !Number.isFinite(quote.expiresAt) || quote.expiresAt <= Date.now()) return null;
    return quote.rate;
  } catch { return null; }
}
