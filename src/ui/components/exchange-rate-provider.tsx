"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { FALLBACK_EXCHANGE_RATE, type ExchangeRateQuote } from "~/lib/exchange-rate";
import { formatPrice as formatAtRate } from "~/lib/product-localization";

const RateContext = createContext<ExchangeRateQuote>({ rate: FALLBACK_EXCHANGE_RATE, source: "fallback", expiresAt: 0, token: "" });
export function ExchangeRateProvider({ children, initialQuote }: { children: ReactNode; initialQuote: ExchangeRateQuote }) {
  const [quote, setQuote] = useState(initialQuote);
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/exchange-rate", { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as ExchangeRateQuote;
        if (!cancelled && Number.isFinite(next.rate) && next.rate > 0 && typeof next.token === "string") setQuote(next);
      } catch { /* Keep the displayed, signed quote until a refresh succeeds. */ }
    }
    const timer = setInterval(refresh, 300_000);
    const onFocus = () => { if (Date.now() >= quote.expiresAt) void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [quote.expiresAt]);
  return <RateContext.Provider value={quote}>{children}</RateContext.Provider>;
}

export function usePricing(snapshotRate?: number) {
  const quote = useContext(RateContext);
  const exchangeRate = snapshotRate ?? quote.rate;
  const formatPrice = useCallback((amount: number, locale: string, overrideRate?: number) => formatAtRate(amount, locale, overrideRate ?? exchangeRate), [exchangeRate]);
  return {
    exchangeRate,
    exchangeRateToken: quote.token,
    formatPrice,
  };
}
