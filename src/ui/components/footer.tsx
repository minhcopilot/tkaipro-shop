import { Clock, Facebook } from "lucide-react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import { useTranslations } from "next-intl";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

const { facebook: FACEBOOK_URL, messenger: MESSENGER_URL } = SEO_CONFIG.supportContacts;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

export function Footer({ className }: { className?: string }) {
  const t = useTranslations("Footer");

  return (
    <footer className={cn("border-t-2 border-border bg-background", className)}>
      <div
        className={`
          container mx-auto max-w-7xl px-4 py-12
          sm:px-6
          lg:px-8
        `}
      >
        <div
          className={`
            grid grid-cols-1 gap-8
            md:grid-cols-4
          `}
        >
          <div className="space-y-4">
            <Link className="flex items-center gap-2" href="/">
              <Image
                alt=""
                className="h-8 w-8 shrink-0 rounded-md"
                height={32}
                src="/tkaipro-icon.png"
                width={32}
              />
              <span className="font-display text-xl font-black tracking-tight text-foreground">
                {SEO_CONFIG.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
            <div className="rounded-md border-2 border-border bg-primary/20 p-3 text-xs text-foreground shadow-hard-sm">
              <p className="mb-2 flex items-center gap-1.5 font-bold text-foreground">
                <Clock className="h-3.5 w-3.5" />
                {t("schedule.title")}
              </p>
              <p>{t("schedule.mainHours")}</p>
              <p>{t("schedule.fastHours")}</p>
              <p>{t("schedule.telegramPriority")}</p>
              <p>{t("schedule.emergency")}</p>
            </div>
            <div className="flex space-x-4">
              {FACEBOOK_URL && (
              <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  size="icon"
                  variant="ghost"
                >
                  <Facebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </Button>
              </Link>
              )}
              {MESSENGER_URL && (
              <Link href={MESSENGER_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  size="icon"
                  variant="ghost"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.732 8l-6.541 6.963z"/>
                  </svg>
                  <span className="sr-only">Messenger</span>
                </Button>
              </Link>
              )}
              {TELEGRAM_URL && (
              <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  size="icon"
                  variant="ghost"
                  title="Telegram Channel"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="sr-only">Telegram</span>
                </Button>
              </Link>
              )}
              <Link href="https://zalo.me/g/zdddrp402" target="_blank" rel="noopener noreferrer">
                <Button
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  size="icon"
                  variant="ghost"
                  title="Zalo Group"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm10.667 14.667H13.333c-.733 0-1.333.6-1.333 1.333v8c0 .733.6 1.333 1.333 1.333h7.454l-2.12 5.307c-.24.6.08 1.227.68 1.36.12.027.24.04.36.04.48 0 .92-.293 1.1-.76l2.526-6.32h.667v5.04c0 .733.6 1.333 1.333 1.333.733 0 1.333-.6 1.333-1.333v-5.04h.667l2.527 6.32c.18.467.62.76 1.1.76.12 0 .24-.013.36-.04.6-.133.92-.76.68-1.36l-2.12-5.307h4.787c.733 0 1.333-.6 1.333-1.333v-8c0-.733-.6-1.333-1.333-1.333z"/>
                  </svg>
                  <span className="sr-only">Zalo Group</span>
                </Button>
              </Link>
              <Link href="https://www.facebook.com/share/g/16qjrs4XeH/" target="_blank" rel="noopener noreferrer">
                <Button
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  size="icon"
                  variant="ghost"
                  title="Facebook Group"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  <span className="sr-only">Facebook Group</span>
                </Button>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("columns.products")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products"
                >
                  {t("links.allPackages")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=cursor-pro-1m"
                >
                  {t("links.cursorPro1m")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=cursor-pro-3m"
                >
                  {t("links.cursorPro3m")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=cursor-pro-6m"
                >
                  {t("links.cursorPro6m")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=cursor-pro-12m"
                >
                  {t("links.cursorPro12m")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("columns.company")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/about"
                >
                  {t("links.about")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/careers"
                >
                  {t("links.careers")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/blog"
                >
                  {t("links.blog")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/press"
                >
                  {t("links.press")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/contact"
                >
                  {t("links.contact")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/khach-hang-da-mua"
                >
                  {t("links.customers")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("columns.support")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/help"
                >
                  {t("links.help")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/shipping"
                >
                  {t("links.shipping")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/warranty"
                >
                  {t("links.warranty")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/return-policy"
                >
                  {t("links.returnPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/disclaimer"
                >
                  {t("links.disclaimer")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/privacy"
                >
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/terms"
                >
                  {t("links.terms")}
                </Link>
              </li>
      
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/sitemap-html"
                >
                  {t("links.sitemap")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Trademark disclaimer — required for nominative-fair-use safety. */}
        <div className="mt-12 border-t pt-6 text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1">
            {t("legal.disclaimerTitle")}
          </p>
          <p>{t("legal.disclaimerBody")}</p>
        </div>
        <div className="mt-6 border-t pt-8">
          <div
            className={`
              flex flex-col items-center justify-between gap-4
              md:flex-row
            `}
          >
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {SEO_CONFIG.name}. {t("copyright")}
            </p>
            <div
              className={
                "flex items-center gap-4 text-sm text-muted-foreground"
              }
            >
              <Link className="hover:text-foreground" href="/privacy">
                {t("links.privacy")}
              </Link>
              <Link className="hover:text-foreground" href="/terms">
                {t("links.terms")}
              </Link>
              <Link className="hover:text-foreground" href="/cookies">
                {t("links.cookies")}
              </Link>
              <Link className="hover:text-foreground" href="/sitemap-html">
                {t("links.sitemap")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
