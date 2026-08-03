"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";

import { usePathname, useRouter } from "~/i18n/navigation";
import { Button } from "~/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";

type SupportedLocale = "vi" | "en" | "ru" | "zh" | "ar" | "es" | "fr" | "de" | "ja" | "ko" | "pt";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (nextLocale: SupportedLocale) => {
    // save preference to cookie (expires in 1 year)
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Languages className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSelectChange("vi")}>
          <span className="mr-2 text-base">🇻🇳</span>
          <span className={locale === "vi" ? "font-bold" : ""}>Tiếng Việt</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("en")}>
          <span className="mr-2 text-base">🇺🇸</span>
          <span className={locale === "en" ? "font-bold" : ""}>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("ru")}>
          <span className="mr-2 text-base">🇷🇺</span>
          <span className={locale === "ru" ? "font-bold" : ""}>Русский</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("zh")}>
          <span className="mr-2 text-base">🇨🇳</span>
          <span className={locale === "zh" ? "font-bold" : ""}>中文</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("ar")}>
          <span className="mr-2 text-base">🇸🇦</span>
          <span className={locale === "ar" ? "font-bold" : ""}>العربية</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("es")}>
          <span className="mr-2 text-base">🇪🇸</span>
          <span className={locale === "es" ? "font-bold" : ""}>Español</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("fr")}>
          <span className="mr-2 text-base">🇫🇷</span>
          <span className={locale === "fr" ? "font-bold" : ""}>Français</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("de")}>
          <span className="mr-2 text-base">🇩🇪</span>
          <span className={locale === "de" ? "font-bold" : ""}>Deutsch</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("ja")}>
          <span className="mr-2 text-base">🇯🇵</span>
          <span className={locale === "ja" ? "font-bold" : ""}>日本語</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("ko")}>
          <span className="mr-2 text-base">🇰🇷</span>
          <span className={locale === "ko" ? "font-bold" : ""}>한국어</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange("pt")}>
          <span className="mr-2 text-base">🇧🇷</span>
          <span className={locale === "pt" ? "font-bold" : ""}>Português</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
