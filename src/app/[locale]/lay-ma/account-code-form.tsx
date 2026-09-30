"use client";

import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

const ERROR_CODES = [
  "INVALID",
  "NO_CODE",
  "TOO_MANY_REQUESTS",
  "UNAVAILABLE",
  "NETWORK",
  "UNKNOWN",
] as const;
type ErrorCode = (typeof ERROR_CODES)[number];

function toErrorCode(value: unknown): ErrorCode {
  return ERROR_CODES.includes(value as ErrorCode)
    ? (value as ErrorCode)
    : "UNKNOWN";
}

interface AccountCodeFormProps {
  defaultEmail?: string;
}

export function AccountCodeForm({ defaultEmail = "" }: AccountCodeFormProps) {
  const t = useTranslations("AccountCode");
  const locale = useLocale();
  const [email, setEmail] = React.useState(defaultEmail);
  const [accessKey, setAccessKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    code: string;
    receivedAt: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    if (!email.trim() || !accessKey.trim()) {
      setError(t("form.requireBoth"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/account-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), accessKey: accessKey.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        code?: string;
        receivedAt?: string;
      };
      if (res.ok && data?.success && data.code) {
        setResult({ code: String(data.code), receivedAt: String(data.receivedAt ?? "") });
        return;
      }
      setError(t(`errors.${toErrorCode(data?.code)}`));
    } catch {
      setError(t("errors.NETWORK"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      toast.success(t("result.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard có thể bị chặn (http / quyền trình duyệt)
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleString(locale);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="account-code-email">{t("form.email")}</Label>
          <Input
            id="account-code-email"
            type="email"
            autoComplete="email"
            placeholder={t("form.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-code-key">{t("form.key")}</Label>
          <Input
            id="account-code-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("form.keyPlaceholder")}
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            disabled={loading}
            className="font-mono"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("form.loading")}
            </>
          ) : (
            <>
              <KeyRound className="mr-2 size-4" />
              {t("form.submit")}
            </>
          )}
        </Button>
      </form>

      {result && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/40">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t("result.title")}
          </p>
          <p className="my-3 font-mono text-4xl font-bold tracking-[0.3em]">
            {result.code}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            {copied ? t("result.copied") : t("result.copy")}
          </Button>
          {result.receivedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("result.receivedAt", { time: formatTime(result.receivedAt) })}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p>{t("notice.line1")}</p>
          <p>{t("notice.line2")}</p>
        </div>
      </div>
    </div>
  );
}
