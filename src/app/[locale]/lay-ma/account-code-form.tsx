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
  "NO_LINK",
  "TOO_MANY_REQUESTS",
  "UNAVAILABLE",
  "NETWORK",
  "UNKNOWN",
] as const;
interface AccountCodeFormProps {
  defaultEmail?: string;
}

type ErrorCode = (typeof ERROR_CODES)[number];

export function AccountCodeForm({ defaultEmail = "" }: AccountCodeFormProps) {
  const t = useTranslations("AccountCode");
  const locale = useLocale();
  const [email, setEmail] = React.useState(defaultEmail);
  const [accessKey, setAccessKey] = React.useState("");
  const [type, setType] = React.useState<"code" | "confirm-link">("code");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);
  const [result, setResult] = React.useState<null | {
    receivedAt: string;
    type: "code" | "confirm-link";
    value: string;
  }>(null);
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
        body: JSON.stringify({
          accessKey: accessKey.trim(),
          email: email.trim(),
          type,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        link?: string;
        receivedAt?: string;
        success?: boolean;
      };
      const value = type === "confirm-link" ? data.link : data.code;
      if (res.ok && data?.success && value) {
        setResult({ receivedAt: String(data.receivedAt ?? ""), type, value });
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
      await navigator.clipboard.writeText(result.value);
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
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <fieldset className="space-y-2" disabled={loading}>
          <legend className="mb-2 text-sm font-medium">
            {t("confirmation.typeLabel")}
          </legend>
          {(["code", "confirm-link"] as const).map((option) => (
            <label
              className={`
                flex cursor-pointer items-center gap-3 rounded-md border p-3
                text-sm
                focus-within:ring-2 focus-within:ring-ring
              `}
              key={option}
            >
              <input
                checked={type === option}
                name="account-code-type"
                onChange={() => {
                  setType(option);
                  setResult(null);
                  setError(null);
                  setCopied(false);
                }}
                type="radio"
                value={option}
              />
              {t(
                option === "code"
                  ? "confirmation.codeOption"
                  : "confirmation.linkOption",
              )}
            </label>
          ))}
        </fieldset>
        {type === "confirm-link" && (
          <p className="text-sm text-muted-foreground">
            {t("confirmation.instructions")}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="account-code-email">{t("form.email")}</Label>
          <Input
            autoComplete="email"
            disabled={loading}
            id="account-code-email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("form.emailPlaceholder")}
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-code-key">{t("form.key")}</Label>
          <Input
            autoComplete="off"
            className="font-mono"
            disabled={loading}
            id="account-code-key"
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder={t("form.keyPlaceholder")}
            spellCheck={false}
            type="password"
            value={accessKey}
          />
        </div>

        {error && (
          <p className={`
            text-sm text-red-600
            dark:text-red-400
          `} role="alert">
            {error}
          </p>
        )}

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t(
                type === "confirm-link"
                  ? "confirmation.loading"
                  : "form.loading",
              )}
            </>
          ) : (
            <>
              <KeyRound className="mr-2 size-4" />
              {t(
                type === "confirm-link" ? "confirmation.submit" : "form.submit",
              )}
            </>
          )}
        </Button>
      </form>

      {result && (
        <div
          className={`
            rounded-xl border border-green-300 bg-green-50 p-6 text-center
            dark:border-green-800 dark:bg-green-950/40
          `}
          role="status"
        >
          <p className={`
            text-sm font-medium text-green-800
            dark:text-green-300
          `}>
            {t(
              result.type === "confirm-link"
                ? "confirmation.resultTitle"
                : "result.title",
            )}
          </p>
          {result.type === "confirm-link" ? (
            <Input
              aria-label={t("confirmation.resultTitle")}
              className="my-3 font-mono text-sm"
              onFocus={(event) => event.target.select()}
              readOnly
              value={result.value}
            />
          ) : (
            <p className="my-3 font-mono text-4xl font-bold tracking-[0.3em]">
              {result.value}
            </p>
          )}
          <Button
            onClick={handleCopy}
            size="sm"
            type="button"
            variant="outline"
          >
            {copied ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            {copied ? t("result.copied") : t("result.copy")}
          </Button>
          {result.type === "confirm-link" && (
            <p className="mt-3 text-sm">{t("confirmation.instructions")}</p>
          )}
          {result.receivedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("result.receivedAt", { time: formatTime(result.receivedAt) })}
            </p>
          )}
        </div>
      )}

      <div className={`
        flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm
        text-amber-900
        dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200
      `}>
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          {type === "confirm-link" ? (
            <p>{t("confirmation.expiry")}</p>
          ) : (
            <>
              <p>{t("notice.line1")}</p>
              <p>{t("notice.line2")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function toErrorCode(value: unknown): ErrorCode {
  return ERROR_CODES.includes(value as ErrorCode)
    ? (value as ErrorCode)
    : "UNKNOWN";
}
