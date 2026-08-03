"use client";

import { Link } from "~/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

const COOKIE_NAME = "shop_cookie_consent_v1";
const CONSENT_DAYS = 365;

type ConsentValue = "essential" | "all";

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
 * Cookie consent banner — essential cookies always on; analytics opt-in.
 * Preference stored 12 months. Analytics scripts in layout should respect
 * consent value (essential = no optional analytics).
 */
export function CookieConsentBanner({ className }: { className?: string }) {
  const t = useTranslations("CookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookie(COOKIE_NAME) === null);
  }, []);

  const save = (value: ConsentValue) => {
    writeCookie(COOKIE_NAME, value, CONSENT_DAYS);
    setVisible(false);
    if (value === "all" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shop:analytics-consent"));
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 shadow-lg",
        className,
      )}
    >
      <div className="container mx-auto max-w-4xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("title")}</p>
          <p>{t("description")}</p>
          <p className="text-xs">
            <Link href="/cookies" className="underline hover:text-foreground">
              {t("learnMore")}
            </Link>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => save("essential")}>
            {t("essentialOnly")}
          </Button>
          <Button size="sm" onClick={() => save("all")}>
            {t("acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
