import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AccountCodeForm } from "./account-code-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AccountCode.meta" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountCodePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "AccountCode.page" });
  const rawEmail = Array.isArray(sp.email) ? sp.email[0] : sp.email;
  const defaultEmail = (rawEmail ?? "").trim().slice(0, 254);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AccountCodeForm defaultEmail={defaultEmail} />
    </div>
  );
}
