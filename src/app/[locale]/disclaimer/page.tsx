import type { Metadata } from "next";
import { AlertTriangle, ExternalLink, Scale, Shield } from "lucide-react";
import { Link } from "~/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DisclaimerPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/disclaimer`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: `${t("title")} - ${SEO_CONFIG.name}`,
      description: t("description"),
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: `${baseUrl}/vi/disclaimer`,
        en: `${baseUrl}/en/disclaimer`,
        "x-default": `${baseUrl}/vi/disclaimer`,
      },
    },
  };
}

export default async function DisclaimerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("DisclaimerPage");

  const risks = t.raw("sections.risks.items") as string[];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t("hero.title")}{" "}
              <span className="text-foreground">
                {t("hero.highlight")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("hero.description")}
            </p>
          </div>

          <Card className="p-8 mb-8 border-2 border-amber-200">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                {t("sections.reseller.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-4">
              <p className="text-muted-foreground">{t("sections.reseller.body")}</p>
              <p className="text-sm text-muted-foreground">{t("sections.reseller.referral")}</p>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-500" />
                {t("sections.trademark.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <p className="text-muted-foreground">{t("sections.trademark.body")}</p>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                {t("sections.risks.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                {risks.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.official.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-4">
              <p className="text-muted-foreground">{t("sections.official.body")}</p>
              <a
                href="https://cursor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                cursor.com
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">{t("cta.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("cta.description")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/terms">
              <Button size="lg" variant="outline">
                {t("cta.terms")}
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg">{t("cta.shop")}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
