export const ANNOUNCEMENT_TYPES = {
  GENERAL: "general",
  PRODUCT: "product",
  PROMOTION: "promotion",
  UPDATE: "update",
} as const;

export type AnnouncementType = typeof ANNOUNCEMENT_TYPES[keyof typeof ANNOUNCEMENT_TYPES];

export const SUPPORTED_LOCALES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]["code"];
