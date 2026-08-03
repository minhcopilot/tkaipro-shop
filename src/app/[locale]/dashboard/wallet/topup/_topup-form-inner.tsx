"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "~/i18n/navigation";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { CRYPTO_METHODS } from "~/lib/payment/crypto-methods";

const VND_PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 5_000_000];
// USD presets in cents: $5, $10, $20, $50, $100, $500
const USD_PRESETS = [500, 1_000, 2_000, 5_000, 10_000, 50_000];

const ALLOWED_RETURN_PATHS = ["/checkout"] as const;

const formatVnd = (amount: number) =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatUsd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export function TopupFormInner() {
  const t = useTranslations("Wallet");
  const router = useRouter();
  const params = useSearchParams();

  const initialCurrency = (params.get("currency") === "usd" ? "usd" : "vnd") as
    | "vnd"
    | "usd";

  const returnPath = params.get("return");
  const returnUrl =
    returnPath &&
    (ALLOWED_RETURN_PATHS as readonly string[]).includes(returnPath)
      ? returnPath
      : null;

  const parseInitialAmount = React.useCallback(
    (currency: "vnd" | "usd") => {
      const raw = params.get("amount");
      if (!raw) return null;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) return null;
      const min = currency === "vnd" ? 50_000 : 500;
      const max = currency === "vnd" ? 50_000_000 : 500_000;
      if (parsed < min || parsed > max) return null;
      if (currency === "vnd" && parsed % 1000 !== 0) return null;
      return parsed;
    },
    [params],
  );

  const initialAmountFromQuery = parseInitialAmount(initialCurrency);
  const initialPresetList =
    initialCurrency === "vnd" ? VND_PRESETS : USD_PRESETS;

  const [currency, setCurrency] = React.useState<"vnd" | "usd">(initialCurrency);
  const [amount, setAmount] = React.useState<number>(
    initialAmountFromQuery ??
      (initialCurrency === "vnd" ? 100_000 : 1_000),
  );
  const [customMode, setCustomMode] = React.useState(
    initialAmountFromQuery != null &&
      !initialPresetList.includes(initialAmountFromQuery),
  );
  const [cryptoMethodId, setCryptoMethodId] = React.useState<string>("binance");
  const [submitting, setSubmitting] = React.useState(false);

  const presets = currency === "vnd" ? VND_PRESETS : USD_PRESETS;
  const formatter = currency === "vnd" ? formatVnd : formatUsd;
  const method = currency === "vnd" ? "sepay" : "crypto";

  React.useEffect(() => {
    const presetList = currency === "vnd" ? VND_PRESETS : USD_PRESETS;
    const fromQuery = parseInitialAmount(currency);
    if (fromQuery != null) {
      setAmount(fromQuery);
      setCustomMode(!presetList.includes(fromQuery));
      return;
    }
    setAmount(currency === "vnd" ? 100_000 : 1_000);
    setCustomMode(false);
  }, [currency, parseInitialAmount]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          amount,
          method,
          cryptoMethodId: method === "crypto" ? cryptoMethodId : undefined,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        toast.error(t(`errors.${data.error}`) || data.error || t("errors.generic"));
        return;
      }
      if (returnUrl && typeof window !== "undefined") {
        window.sessionStorage.setItem("walletTopupReturn", returnUrl);
      }
      const detailUrl = returnUrl
        ? `/dashboard/wallet/topup/${data.id}?return=${encodeURIComponent(returnUrl)}`
        : `/dashboard/wallet/topup/${data.id}`;
      router.push(detailUrl);
    } catch (err) {
      console.error(err);
      toast.error(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Link
        href="/dashboard/wallet"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToWallet")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("topupTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Currency tabs */}
            <div>
              <Label>{t("currency")}</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={currency === "vnd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("vnd")}
                  className="flex-1"
                >
                  {t("vnd")}
                </Button>
                <Button
                  type="button"
                  variant={currency === "usd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("usd")}
                  className="flex-1"
                >
                  {t("usd")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currency === "vnd"
                  ? t("vndDescription")
                  : t("usdDescription")}
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label>{t("selectAmount")}</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={!customMode && amount === p ? "default" : "outline"}
                    onClick={() => {
                      setCustomMode(false);
                      setAmount(p);
                    }}
                  >
                    {formatter(p)}
                  </Button>
                ))}
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => setCustomMode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{t("customAmount")}</span>
                </label>
                {customMode && (
                  <Input
                    type="number"
                    min={currency === "vnd" ? 50_000 : 500}
                    max={currency === "vnd" ? 50_000_000 : 500_000}
                    step={currency === "vnd" ? 1000 : 1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-2"
                    placeholder={
                      currency === "vnd"
                        ? "VND (≥ 50,000, bội của 1000)"
                        : "USD cents (vd 1000 = $10.00)"
                    }
                  />
                )}
              </div>
            </div>

            {/* Crypto method (chỉ USD) */}
            {currency === "usd" && (
              <div>
                <Label>{t("selectCryptoMethod")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CRYPTO_METHODS.map((m) => (
                    <Button
                      key={m.id}
                      type="button"
                      size="sm"
                      variant={cryptoMethodId === m.id ? "default" : "outline"}
                      onClick={() => setCryptoMethodId(m.id)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">{t("youWillTopup")}</span>
                <span className="font-bold text-lg">{formatter(amount)}</span>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("continueToPay")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
