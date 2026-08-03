"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Megaphone } from "lucide-react";

import { Link } from "~/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Button } from "~/ui/primitives/button";

const COOKIE_NAME = "shop_legal_notice_dismissed_v1";
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
 * Compliance "Thông Báo" modal (matkhau-style). Always shown until dismissed;
 * cookie lasts ~30 days. Independent of admin announcements.
 */
export function LegalNoticePopup() {
  const t = useTranslations("LegalNoticePopup");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readCookie(COOKIE_NAME) !== "1");
  }, []);

  const dismiss = () => {
    writeCookie(COOKIE_NAME, "1", DISMISS_DAYS);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-lg sm:max-w-xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t("title")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
          <p>
            <Link
              href="/terms"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-90"
              onClick={dismiss}
            >
              {t("termsLink")}
            </Link>
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button type="button" onClick={dismiss} className="w-full sm:w-auto">
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
