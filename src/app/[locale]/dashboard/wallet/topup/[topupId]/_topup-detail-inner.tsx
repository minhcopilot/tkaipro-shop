"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Upload,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "~/i18n/navigation";
import { CRYPTO_METHODS } from "~/lib/payment/crypto-methods";
import { buildVietQrUrl } from "~/lib/payment/vietqr";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";

interface BankInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

interface Topup {
  id: string;
  userId: string;
  currency: "vnd" | "usd";
  amount: number;
  method: "sepay" | "crypto";
  cryptoMethodId: string | null;
  status: "pending" | "pending_review" | "paid" | "expired" | "rejected";
  transferContent: string;
  proofImageUrl: string | null;
  rejectedReason: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string;
}

const ALLOWED_RETURN_PATHS = ["/checkout"] as const;

const formatVnd = (amount: number) =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatUsd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Bank info lấy từ API /api/payment/bank-info?topupId=... (snapshot gắn lúc tạo)

export function TopupDetailInner() {
  const t = useTranslations("Wallet");
  const tPayment = useTranslations("PaymentResult");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topupId = params.topupId as string;

  const returnUrl = React.useMemo(() => {
    const fromQuery = searchParams.get("return");
    if (
      fromQuery &&
      (ALLOWED_RETURN_PATHS as readonly string[]).includes(fromQuery)
    ) {
      return fromQuery;
    }
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("walletTopupReturn");
      if (
        stored &&
        (ALLOWED_RETURN_PATHS as readonly string[]).includes(stored)
      ) {
        return stored;
      }
    }
    return null;
  }, [searchParams]);

  const [topup, setTopup] = React.useState<Topup | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [bankAccount, setBankAccount] = React.useState<BankInfo | null>(null);
  const [proofUrl, setProofUrl] = React.useState("");
  const [submittingProof, setSubmittingProof] = React.useState(false);

  const formatAmount = React.useCallback(
    (amount: number, currency: "vnd" | "usd") =>
      currency === "vnd" ? formatVnd(amount) : formatUsd(amount),
    [],
  );

  const cryptoMethod = React.useMemo(() => {
    if (!topup?.cryptoMethodId) return null;
    return (
      CRYPTO_METHODS.find((m) => m.id === topup.cryptoMethodId) ?? null
    );
  }, [topup?.cryptoMethodId]);

  const fetchTopup = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/wallet/topup/${topupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(t("notFound"));
          router.push("/dashboard/wallet");
          return;
        }
        throw new Error("Fetch failed");
      }
      const data = (await res.json()) as { topup: Topup };
      setTopup(data.topup);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [topupId, router, t]);

  React.useEffect(() => {
    fetchTopup();
  }, [fetchTopup]);

  // Fetch TK đã gắn vào topup (snapshot) cho VietQR (VND)
  React.useEffect(() => {
    if (!topupId) return;
    fetch(`/api/payment/bank-info?topupId=${encodeURIComponent(topupId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("bank info fetch failed");
        return res.json() as Promise<BankInfo>;
      })
      .then(setBankAccount)
      .catch((err) => console.error("Error fetching bank info:", err));
  }, [topupId]);

  // Polling status mỗi 8s khi còn pending
  React.useEffect(() => {
    if (!topup) return;
    if (topup.status !== "pending" && topup.status !== "pending_review") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet/topup/${topupId}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as Pick<
          Topup,
          "status" | "paidAt" | "rejectedReason"
        >;
        if (data.status !== topup.status) {
          // Trạng thái đổi → reload chi tiết
          fetchTopup();
          if (data.status === "paid") {
            toast.success(t("paidToast"));
          } else if (data.status === "rejected") {
            toast.error(t("rejectedToast"));
          } else if (data.status === "expired") {
            toast.error(t("expiredToast"));
          }
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 8000);
    return () => clearInterval(id);
  }, [topup, topupId, fetchTopup, t]);

  React.useEffect(() => {
    if (topup?.status === "paid" && returnUrl) {
      const timer = window.setTimeout(() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("walletTopupReturn");
        }
        router.push(returnUrl);
      }, 1500);
      return () => window.clearTimeout(timer);
    }
  }, [topup?.status, returnUrl, router]);

  const onCopy = React.useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text).then(
        () => toast.success(t("copied", { label })),
        () => toast.error(t("copyFailed")),
      );
    },
    [t],
  );

  const onSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = proofUrl.trim();
    // Proof URL is optional. If provided, must be http(s).
    if (trimmed && !/^https?:\/\//.test(trimmed)) {
      toast.error(t("errors.INVALID_PROOF_URL"));
      return;
    }
    setSubmittingProof(true);
    try {
      const res = await fetch(`/api/wallet/topup/${topupId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofImageUrl: trimmed }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(t(`errors.${data.error}`) || data.error || t("errors.generic"));
        return;
      }
      toast.success(t("proofSubmitted"));
      setProofUrl("");
      fetchTopup();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }
  if (!topup) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4 text-center text-muted-foreground">
        {t("notFound")}
      </div>
    );
  }

  // STATUS render: paid / rejected / expired => terminal screens
  if (topup.status === "paid") {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("topupPaidTitle")}</h2>
            <p className="text-muted-foreground mb-2">
              {t("topupPaidDescription", {
                amount: formatAmount(topup.amount, topup.currency),
              })}
            </p>
            {topup.paidAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(topup.paidAt).toLocaleString()}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {returnUrl ? (
                <Link href={returnUrl}>
                  <Button>{t("returnToCheckout")}</Button>
                </Link>
              ) : null}
              <Link href="/dashboard/wallet">
                <Button variant={returnUrl ? "outline" : "default"}>
                  {t("backToWallet")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (topup.status === "rejected") {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("topupRejectedTitle")}</h2>
            {topup.rejectedReason && (
              <p className="text-sm text-muted-foreground mb-4">
                {topup.rejectedReason}
              </p>
            )}
            <Link href="/dashboard/wallet/topup">
              <Button>{t("topupAgain")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (topup.status === "expired") {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("topupExpiredTitle")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("topupExpiredDescription")}
            </p>
            <Link href="/dashboard/wallet/topup">
              <Button>{t("topupAgain")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PENDING / PENDING_REVIEW
  const isVnd = topup.currency === "vnd";
  const qrUrl =
    isVnd && bankAccount
      ? buildVietQrUrl({
          bankCode: bankAccount.bankCode,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
          amount: topup.amount,
          content: topup.transferContent,
        })
      : null;

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
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>{t("topupDetailTitle")}</span>
            {topup.status === "pending_review" ? (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {t("status.pendingReview")}
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {t("status.pending")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t("amount")}:</span>
              <span className="font-bold text-xl">
                {formatAmount(topup.amount, topup.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("expiresAt")}:</span>
              <span className="font-medium">
                {new Date(topup.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* VND - QR chuyển khoản ngân hàng */}
          {isVnd && qrUrl && bankAccount && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group relative rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary/60 bg-white p-4 cursor-zoom-in"
                    >
                      <Image
                        src={qrUrl}
                        alt={t("bankQrAlt", { bank: bankAccount.bankName })}
                        width={300}
                        height={300}
                        className="w-72 h-72 object-contain"
                        priority
                        unoptimized
                      />
                      <div className="absolute top-3 right-3 rounded-full bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[min(90vw,640px)] p-0 bg-white border-0">
                    <DialogTitle className="sr-only">{t("qrZoom")}</DialogTitle>
                    <div className="p-6">
                      <Image
                        src={qrUrl}
                        alt={t("bankQrAlt", { bank: bankAccount.bankName })}
                        width={1024}
                        height={1024}
                        className="w-full h-auto object-contain max-h-[80vh]"
                        unoptimized
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2 text-sm">
                <RowCopy
                  label={t("bank")}
                  value={bankAccount.bankName}
                  onCopy={(v) => onCopy(v, t("bank"))}
                />
                <RowCopy
                  label={t("accountNumber")}
                  value={bankAccount.accountNumber}
                  onCopy={(v) => onCopy(v, t("accountNumber"))}
                />
                <RowCopy
                  label={t("accountName")}
                  value={bankAccount.accountName}
                  onCopy={(v) => onCopy(v, t("accountName"))}
                />
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {tPayment("transfer.content")}:
                      </p>
                      <p className="font-mono font-medium text-primary break-all">
                        {topup.transferContent}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tPayment("transfer.contentNote")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() =>
                        onCopy(topup.transferContent, tPayment("transfer.content"))
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USD - crypto */}
          {!isVnd && cryptoMethod && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group relative rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary/60 bg-white p-4 cursor-zoom-in"
                    >
                      <Image
                        src={cryptoMethod.qr}
                        alt={cryptoMethod.label}
                        width={512}
                        height={512}
                        className="w-72 h-72 object-contain"
                        priority
                      />
                      <div className="absolute top-3 right-3 rounded-full bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[min(90vw,640px)] p-0 bg-white border-0">
                    <DialogTitle className="sr-only">{cryptoMethod.label}</DialogTitle>
                    <div className="p-6">
                      <Image
                        src={cryptoMethod.qr}
                        alt={cryptoMethod.label}
                        width={1024}
                        height={1024}
                        className="w-full h-auto object-contain max-h-[80vh]"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-center text-base mb-2">
                  {cryptoMethod.label}
                </p>
                {cryptoMethod.kind === "exchange" ? (
                  <>
                    <RowCopy
                      label={t("payId")}
                      value={cryptoMethod.payId}
                      onCopy={(v) => onCopy(v, t("payId"))}
                    />
                    <RowCopy
                      label={t("accountName")}
                      value={cryptoMethod.accountName}
                      onCopy={(v) => onCopy(v, t("accountName"))}
                    />
                  </>
                ) : (
                  <>
                    <RowCopy
                      label={t("network")}
                      value={cryptoMethod.network}
                      onCopy={(v) => onCopy(v, t("network"))}
                    />
                    <RowCopy
                      label={t("walletAddress")}
                      value={cryptoMethod.address}
                      onCopy={(v) => onCopy(v, t("walletAddress"))}
                      mono
                    />
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{t("onchainWarning", { network: cryptoMethod.network })}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Proof upload (USD crypto only, before submitted). Proof URL
                  is OPTIONAL — user can also just click "I have transferred"
                  to flip status to pending_review without attaching a URL. */}
              {topup.status === "pending" && (
                <form onSubmit={onSubmitProof} className="border-t pt-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm mb-1">
                      {t("submitProofTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("submitProofDescription")}
                    </p>
                  </div>
                  <Input
                    type="url"
                    placeholder="https://imgur.com/abc.png"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                  />
                  <Button type="submit" disabled={submittingProof} className="w-full gap-2">
                    {submittingProof ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {proofUrl.trim() ? t("submitProof") : t("submitWithoutProof")}
                  </Button>
                </form>
              )}
              {topup.status === "pending_review" && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm text-blue-700 dark:text-blue-300">
                    {t("pendingReviewMessage")}
                  </div>
                  {topup.proofImageUrl && (
                    <a
                      href={topup.proofImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      {t("viewProof")}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Auto-confirm note (VND) */}
          {isVnd && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3 text-sm text-emerald-700 dark:text-emerald-300">
              {t("autoConfirmNote")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RowCopy({
  label,
  value,
  onCopy,
  mono,
  boldValue,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
  mono?: boolean;
  boldValue?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-muted-foreground">{label}:</span>}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`truncate ${mono ? "font-mono text-xs" : ""} ${
            boldValue ? "font-bold text-base" : ""
          }`}
        >
          {value}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => onCopy(value)}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
