import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SEO_CONFIG } from "~/app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProductsPage" });
  
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/products`;

  return {
    title: t("title"),
    description: t("subtitle"),
    keywords: `${SEO_CONFIG.keywords}, tài khoản Google AI, mua Google AI Pro, Antigravity, Gemini`,
    openGraph: {
      title: `${t("title")} | ${SEO_CONFIG.name}`,
      description: t("subtitle"),
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      url: canonicalUrl,
      siteName: SEO_CONFIG.name,
      images: [
        {
          url: `${baseUrl}${SEO_CONFIG.image}`,
          width: 1200,
          height: 630,
          alt: `${SEO_CONFIG.name} - ${t("title")}`,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/products`,
        "en": `${baseUrl}/en/products`,
        "x-default": `${baseUrl}/vi/products`,
      },
    },
  };
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

