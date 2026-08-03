"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Clock,
  DollarSign,
  Plus,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "~/i18n/navigation";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Badge } from "~/ui/primitives/badge";

interface WalletTransaction {
  id: string;
  currency: "vnd" | "usd";
  type: "topup" | "debit" | "refund" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: string;
}

const formatVnd = (amount: number) =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatUsd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (amount: number, currency: "vnd" | "usd") =>
  currency === "vnd" ? formatVnd(amount) : formatUsd(amount);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function WalletInner() {
  const t = useTranslations("Wallet");
  const [balances, setBalances] = React.useState<{ vnd: number; usd: number } | null>(
    null,
  );
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const [balRes, txRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/wallet/transactions?limit=30"),
      ]);
      if (balRes.ok) {
        const data = (await balRes.json()) as { vnd: number; usd: number };
        setBalances({ vnd: data.vnd ?? 0, usd: data.usd ?? 0 });
      }
      if (txRes.ok) {
        const data = (await txRes.json()) as { items: WalletTransaction[] };
        setTransactions(data.items ?? []);
      }
    } catch (err) {
      console.error("Load wallet failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <WalletIcon className="h-7 w-7 text-foreground" />
          <h1 className="font-display text-2xl font-black tracking-tight">{t("title")}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("refresh")}
        </Button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("vndBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !balances ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatVnd(balances.vnd)}
              </p>
            )}
            <Link href="/dashboard/wallet/topup?currency=vnd" className="block mt-3">
              <Button size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                {t("topupVnd")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("usdBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !balances ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatUsd(balances.usd)}
              </p>
            )}
            <Link href="/dashboard/wallet/topup?currency=usd" className="block mt-3">
              <Button size="sm" variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                {t("topupUsd")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("transactionHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("noTransactions")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <li key={tx.id} className="py-3 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border ${
                        isCredit
                          ? "bg-muted text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownToLine className="h-4 w-4" />
                      ) : (
                        <ArrowUpToLine className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {t(`txType.${tx.type}`)}
                        </span>
                        <Badge variant="outline" className="text-xs uppercase">
                          {tx.currency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.note || formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isCredit ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {isCredit ? "+" : ""}
                        {formatAmount(tx.amount, tx.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("balanceAfter")}: {formatAmount(tx.balanceAfter, tx.currency)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
