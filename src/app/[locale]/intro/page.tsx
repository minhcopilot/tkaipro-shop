import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import {
  CheckCircle,
  Shield,
  Zap,
  CreditCard,
  Send,
  Lock,
  MessageCircle,
  Heart,
  ArrowRight,
} from "lucide-react";

import { SEO_CONFIG } from "~/app";

const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "IntroPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/intro`;

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
        vi: `${baseUrl}/vi/intro`,
        en: `${baseUrl}/en/intro`,
        ru: `${baseUrl}/ru/intro`,
        zh: `${baseUrl}/zh/intro`,
        ar: `${baseUrl}/ar/intro`,
        es: `${baseUrl}/es/intro`,
        fr: `${baseUrl}/fr/intro`,
        de: `${baseUrl}/de/intro`,
        ja: `${baseUrl}/ja/intro`,
        ko: `${baseUrl}/ko/intro`,
        pt: `${baseUrl}/pt/intro`,
        "x-default": `${baseUrl}/vi/intro`,
      },
    },
  };
}

export default function IntroPage() {
  const t = useTranslations("IntroPage");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero — brand first, one composition */}
      <section className="relative border-b border-border py-24 md:py-32">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <div className="animate-fade-in-up flex flex-col items-center space-y-8 text-center">
            <p className="inline-block rounded-full bg-gradient-brand px-3.5 py-1 font-display text-sm font-semibold tracking-tight text-primary-foreground shadow-soft-sm">
              {SEO_CONFIG.name}
            </p>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto max-w-xl text-lg font-medium text-muted-foreground md:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 w-full px-8 sm:w-auto">
                  {t("hero.ctaBuy")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full px-8 sm:w-auto"
                >
                  {t("hero.ctaConfig")}
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t("hero.trustBadges.authentic")}
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t("hero.trustBadges.fast")}
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("hero.trustBadges.warranty")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-y border-border py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t("about.sectionLabel")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("about.title")}
            </h2>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {t("about.description")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                t("about.features.price"),
                t("about.features.support"),
                t("about.features.warranty"),
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground"
                >
                  <CheckCircle className="h-4 w-4" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-14 space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t("whyChoose.sectionLabel")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("whyChoose.title")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "fast", icon: Zap },
              { key: "cheap", icon: Heart },
              { key: "privacy", icon: Lock },
              { key: "support", icon: MessageCircle },
            ].map(({ key, icon: Icon }) => (
              <Card key={key} className="border-border bg-background">
                <CardHeader className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {t(`whyChoose.items.${key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="leading-relaxed text-muted-foreground">
                    {t(`whyChoose.items.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-14 space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t("products.sectionLabel")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("products.title")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="flex flex-col border-border text-center">
              <CardHeader className="pb-6 pt-8">
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {t("products.trial.label")}
                </div>
                <CardTitle className="text-2xl font-bold">
                  {t("products.trial.name")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <p className="mb-6 text-muted-foreground">
                  {t("products.trial.description")}
                </p>
              </CardContent>
              <div className="mt-auto p-6 pt-0">
                <Link href="/products" className="block w-full">
                  <Button variant="outline" className="h-11 w-full">
                    {t("hero.ctaBuy")}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="relative flex flex-col border-foreground text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {t("products.shared.badge")}
              </div>
              <CardHeader className="pb-6 pt-10">
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {t("products.shared.label")}
                </div>
                <CardTitle className="text-2xl font-bold">
                  {t("products.shared.name")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <p className="mb-6 text-muted-foreground">
                  {t("products.shared.description")}
                </p>
              </CardContent>
              <div className="mt-auto p-6 pt-0">
                <Link href="/products" className="block w-full">
                  <Button className="h-11 w-full">{t("hero.ctaBuy")}</Button>
                </Link>
              </div>
            </Card>

            <Card className="flex flex-col border-border text-center">
              <CardHeader className="pb-6 pt-8">
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {t("products.private.label")}
                </div>
                <CardTitle className="text-2xl font-bold">
                  {t("products.private.name")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <p className="mb-6 text-muted-foreground">
                  {t("products.private.description")}
                </p>
              </CardContent>
              <div className="mt-auto p-6 pt-0">
                <Link href="/products" className="block w-full">
                  <Button variant="outline" className="h-11 w-full">
                    {t("hero.ctaBuy")}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="border-y border-border bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-14 flex flex-col items-center space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t("payment.sectionLabel")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("payment.title")}
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {t("payment.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-10 md:gap-16">
            {[
              { icon: CreditCard, label: t("payment.methods.bank") },
              { icon: Zap, label: t("payment.methods.crypto") },
              { icon: Shield, label: t("payment.methods.momo") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="h-7 w-7 text-foreground" />
                </div>
                <span className="max-w-[150px] text-center text-sm font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-sm text-muted-foreground">
            {t("payment.support")}
          </p>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-14 space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t("commitment.sectionLabel")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("commitment.title")}
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["1", "2", "3", "4"].map((item) => (
              <div
                key={item}
                className="flex flex-col items-center rounded-lg border border-border p-6 text-center"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {t(`commitment.items.${item}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-foreground py-20 text-background md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t("ctaSection.title")}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-background/70">
            {t("ctaSection.subtitle")}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/products" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full bg-background px-8 text-foreground hover:bg-background/90 sm:w-auto"
              >
                {t("ctaSection.buyNow")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {TELEGRAM_URL && (
              <Link href={TELEGRAM_URL} target="_blank" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-background/30 bg-transparent px-8 text-background hover:bg-background/10 sm:w-auto"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t("ctaSection.contact")}
                </Button>
              </Link>
            )}
          </div>
          <div className="mt-14 flex flex-col justify-center gap-4 border-t border-background/20 pt-8 text-sm text-background/60 md:flex-row md:gap-8">
            <span>{t("contact.website")}</span>
            <span>{t("contact.telegram")}</span>
            <span>{t("contact.fanpage")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
