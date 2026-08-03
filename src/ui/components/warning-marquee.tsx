"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function WarningMarquee() {
  const pathname = usePathname();
  const t = useTranslations("WarningMarquee");
  const isAdminPage = pathname.startsWith("/admin");
  const isViLocale = pathname.startsWith("/vi");
  const workingHoursText = isViLocale
    ? "Giờ làm việc: 08:00-23:00 (T2-CN), buổi tối và cuối tuần có thể rep chậm, ưu tiên Telegram để phản hồi nhanh."
    : "Working hours: 08:00-23:00 (Mon-Sun), prioritize Telegram for faster response.";

  if (isAdminPage) {
    return null;
  }

  const warningContent = (
    <>
      {t.rich("text", {
        contact: (chunks) => (
          <Link
            href="/contact"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {chunks}
          </Link>
        ),
        products: (chunks) => (
          <Link
            href="/products"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {chunks}
          </Link>
        ),
      })}
    </>
  );

  return (
    <div
      className="relative z-50 w-full overflow-hidden border-b border-border bg-gradient-brand py-2.5 text-primary-foreground"
      suppressHydrationWarning
    >
      <div className="flex animate-marquee whitespace-nowrap" suppressHydrationWarning>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-shrink-0 items-center gap-3 px-8"
            suppressHydrationWarning
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-bold md:text-base" suppressHydrationWarning>
              {warningContent} <span className="mx-1 opacity-60">•</span>{" "}
              {workingHoursText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
