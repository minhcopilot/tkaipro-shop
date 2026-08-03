"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { SEO_CONFIG } from "~/app";

const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

interface CustomRequestBannerProps {
  className?: string;
  href?: string;
}

/**
 * Banner inviting customers to inbox for accounts outside the website list.
 * Light Figma-style: border, muted surface, black CTA — no gradient glow.
 */
export function CustomRequestBanner({
  className = "",
  href = TELEGRAM_URL,
}: CustomRequestBannerProps) {
  const t = useTranslations("HomePage.customRequest");

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("title")}
      className={`
        group flex h-full flex-col justify-between rounded-lg border border-border
        bg-background p-5 transition-colors
        hover:bg-muted/50
        ${className}
      `}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("badge")}
        </p>
        <p className="mt-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {t("title")}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t.rich("subtitle", {
            highlight: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          })}
        </p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        {t("cta")}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}
