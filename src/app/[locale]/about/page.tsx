import type { Metadata } from "next";
import { Award, CheckCircle, Globe, Shield, Users, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { TAKEDOWN_ABOUT } from "~/lib/takedown";
import {
  ServiceUnavailableNotice,
  buildServiceUnavailableMetadata,
} from "~/ui/components/service-unavailable-notice";
import { BreadcrumbSchema } from "~/ui/components/seo-schemas";
import { CommunitySection } from "~/ui/components/community-section";
import { Button } from "~/ui/primitives/button";
import { Card } from "~/ui/primitives/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (TAKEDOWN_ABOUT) {
    return buildServiceUnavailableMetadata(locale);
  }

  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/about`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("metaKeywords"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonicalUrl,
      locale: locale === "vi" ? "vi_VN" : locale,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: `${baseUrl}/vi/about`,
        en: `${baseUrl}/en/about`,
        ru: `${baseUrl}/ru/about`,
        zh: `${baseUrl}/zh/about`,
        ar: `${baseUrl}/ar/about`,
        es: `${baseUrl}/es/about`,
        fr: `${baseUrl}/fr/about`,
        de: `${baseUrl}/de/about`,
        ja: `${baseUrl}/ja/about`,
        ko: `${baseUrl}/ko/about`,
        pt: `${baseUrl}/pt/about`,
        "x-default": `${baseUrl}/vi/about`,
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (TAKEDOWN_ABOUT) {
    return (
      <ServiceUnavailableNotice
        locale={locale}
        supportEmail={SEO_CONFIG.supportContacts.email}
        supportTelegram={SEO_CONFIG.supportContacts.telegram}
      />
    );
  }

  return (
    <>
      <AboutPageClient locale={locale} />
    </>
  );
}

function AboutPageClient({ locale }: { locale: string }) {
  const t = useTranslations("AboutPage");

  const stats = [
    { number: t("stats.customers.number"), label: t("stats.customers.label") },
    { number: t("stats.years.number"), label: t("stats.years.label") },
    { number: t("stats.satisfaction.number"), label: t("stats.satisfaction.label") },
    { number: t("stats.support.number"), label: t("stats.support.label") },
  ];

  const values = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: t("values.transparency.title"),
      description: t("values.transparency.description"),
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: t("values.efficiency.title"),
      description: t("values.efficiency.description"),
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: t("values.customerFirst.title"),
      description: t("values.customerFirst.description"),
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-500" />,
      title: t("values.sustainability.title"),
      description: t("values.sustainability.description"),
    },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.about"), href: "/about" },
        ]}
        locale={locale}
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t("hero.titlePrefix")}{" "}
                <span className="text-foreground">
                  {SEO_CONFIG.name}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                {t("hero.subtitle")}
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 max-w-3xl mx-auto mb-8 text-sm text-amber-900 dark:text-amber-200 text-left">
                <strong>{t("hero.disclaimerLabel")}:</strong> {t("hero.disclaimer")}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/products`}>
                  <Button size="lg" className="px-8">
                    {t("hero.ctaProducts")}
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" variant="outline" className="px-8">
                    {t("hero.ctaContact")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight mb-6">
                  {t("mission.title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {t("mission.paragraph1")}
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  {t("mission.paragraph2")}
                </p>
                <div className="flex items-center gap-4">
                  <Award className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("mission.independenceTitle")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("mission.independenceDescription")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center p-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("mission.cards.process.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("mission.cards.process.description")}
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("mission.cards.warranty.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("mission.cards.warranty.description")}
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("mission.cards.delivery.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("mission.cards.delivery.description")}
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("mission.cards.support.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("mission.cards.support.description")}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
                {t("values.title")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("values.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="font-semibold text-lg mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* NOTE: Fabricated timeline (2021..2024) removed during trademark
            remediation. Cursor (Anysphere) was founded in 2023 — predating
            our shop's operation invalidates any prior-art claim. */}

        {/* Community */}
        <CommunitySection />

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-muted/40 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/products`}>
                  <Button size="lg" className="px-8">
                    {t("cta.ctaPrimary")}
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" variant="outline" className="px-8">
                    {t("cta.ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
