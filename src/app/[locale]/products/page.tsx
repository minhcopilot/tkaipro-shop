import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { BreadcrumbSchema, OfferCatalogSchema } from "~/ui/components/seo-schemas";
import { ProductsClient } from "./products-client";

// revalidate every 60 seconds for product updates
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProductsPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/products`;

  const title = t("title");
  const description = t("description");
  const keywords = t("keywords");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: locale === "vi" ? "vi_VN" : locale === "ru" ? "ru_RU" : locale === "zh" ? "zh_CN" : locale === "ar" ? "ar_SA" : locale === "es" ? "es_ES" : locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : locale === "ja" ? "ja_JP" : locale === "ko" ? "ko_KR" : locale === "pt" ? "pt_BR" : "en_US",
      siteName: SEO_CONFIG.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}${SEO_CONFIG.image}`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/products`,
        "en": `${baseUrl}/en/products`,
        "ru": `${baseUrl}/ru/products`,
        "zh": `${baseUrl}/zh/products`,
        "ar": `${baseUrl}/ar/products`,
        "es": `${baseUrl}/es/products`,
        "fr": `${baseUrl}/fr/products`,
        "de": `${baseUrl}/de/products`,
        "ja": `${baseUrl}/ja/products`,
        "ko": `${baseUrl}/ko/products`,
        "pt": `${baseUrl}/pt/products`,
        "x-default": `${baseUrl}/vi/products`,
      },
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProductsPage.breadcrumb" });

  const breadcrumbItems = [
    { name: t("home"), href: "/" },
    { name: t("products"), href: "/products" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} locale={locale} />
      <OfferCatalogSchema locale={locale} />
      <ProductsClient />
    </>
  );
}
