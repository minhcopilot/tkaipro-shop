import "server-only";
import { getTranslations, getFormatter } from "next-intl/server";

import { routing } from "~/i18n/navigation";
import { EXCHANGE_RATE } from "~/lib/product-localization";

export type SupportedLocale =
  | "vi"
  | "en"
  | "ru"
  | "zh"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "pt";

const SUPPORTED = new Set<string>(routing.locales);

// chuẩn hoá locale: dùng routing.locales làm whitelist; rơi mặc định về defaultLocale (vi)
export function normalizeLocale(input?: string | null): SupportedLocale {
  if (input && SUPPORTED.has(input)) return input as SupportedLocale;
  return routing.defaultLocale as SupportedLocale;
}

// BCP-47 cho Intl: vi -> vi-VN, en -> en-US, zh -> zh-CN, ja -> ja-JP, ko -> ko-KR,
// de -> de-DE, fr -> fr-FR, es -> es-ES, pt -> pt-BR, ru -> ru-RU, ar -> ar-SA
const INTL_TAG: Record<SupportedLocale, string> = {
  vi: "vi-VN",
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  ru: "ru-RU",
  ar: "ar-SA",
};

// định dạng tiền: vi giữ "100.000đ" (VND); mọi locale khác convert sang USD format en-US ($4.17).
export function formatPrice(amount: number, locale: string): string {
  const loc = normalizeLocale(locale);
  if (loc === "vi") {
    return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
  }
  const usd = amount / EXCHANGE_RATE;
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// định dạng datetime đầy đủ theo locale (cho timestamp trong email)
export function formatDateTime(date: Date, locale: string): string {
  const loc = normalizeLocale(locale);
  return new Intl.DateTimeFormat(INTL_TAG[loc], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// định dạng date dài (weekday + ngày + giờ) — dùng cho email reminder
export function formatDateLong(date: Date, locale: string): string {
  const loc = normalizeLocale(locale);
  return new Intl.DateTimeFormat(INTL_TAG[loc], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// tạo URL đầy đủ với locale prefix (vì routing localePrefix='always' ở app)
export function urlFor(path: string, locale: string): string {
  const base = process.env.NEXT_SERVER_APP_URL || "";
  const loc = normalizeLocale(locale);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/${loc}${cleanPath}`;
}

// shortcut lấy translator + formatter cho 1 namespace email
export async function getEmailT(
  locale: string,
  namespace: string,
) {
  const loc = normalizeLocale(locale);
  const t = await getTranslations({ locale: loc, namespace });
  const formatter = await getFormatter({ locale: loc });
  return {
    t,
    formatter,
    locale: loc,
    formatPrice: (amount: number) => formatPrice(amount, loc),
    formatDateTime: (date: Date) => formatDateTime(date, loc),
    formatDateLong: (date: Date) => formatDateLong(date, loc),
    urlFor: (path: string) => urlFor(path, loc),
  };
}
