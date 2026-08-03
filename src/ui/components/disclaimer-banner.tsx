"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "~/lib/cn";

const COOKIE_NAME = "shop_disclaimer_dismissed_v1";
const DISMISS_DAYS = 30;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(target))
      ?.slice(target.length) ?? null
  );
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Sitewide trademark-safety banner. Sticky strip above the top navbar:
 * technical-support framing (not agent/distributor). Dismissed by cookie
 * for 30 days. Required disclosure for nominative-fair-use compliance.
 */
export function DisclaimerBanner({ className }: { className?: string }) {
  const t = useTranslations("DisclaimerBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookie(COOKIE_NAME) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Trademark disclaimer"
      className={cn(
        "w-full border-b border-border bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex items-start gap-3">
        <p className="flex-1 text-xs sm:text-sm leading-snug font-medium text-secondary-foreground">
          <span className="font-semibold">⚠ </span>
          {t("message")}
        </p>
        <button
          type="button"
          onClick={() => {
            writeCookie(COOKIE_NAME, "1", DISMISS_DAYS);
            setVisible(false);
          }}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-secondary-foreground/40 px-2 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary-foreground/10"
          aria-label={t("dismiss")}
        >
          <span>{t("dismiss")}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
