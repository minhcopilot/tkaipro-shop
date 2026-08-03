import type { Metadata } from "next";
import { FileText, Scale, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
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
  const t = await getTranslations({ locale, namespace: "TermsPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/terms`;

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
        "vi": `${baseUrl}/vi/terms`,
        "en": `${baseUrl}/en/terms`,
        "ru": `${baseUrl}/ru/terms`,
        "zh": `${baseUrl}/zh/terms`,
        "ar": `${baseUrl}/ar/terms`,
        "es": `${baseUrl}/es/terms`,
        "fr": `${baseUrl}/fr/terms`,
        "de": `${baseUrl}/de/terms`,
        "ja": `${baseUrl}/ja/terms`,
        "ko": `${baseUrl}/ko/terms`,
        "pt": `${baseUrl}/pt/terms`,
        "x-default": `${baseUrl}/vi/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("TermsPage");

  const termsHighlights = [
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: t("highlights.transparent.title"),
      description: t("highlights.transparent.desc"),
    },
    {
      icon: <Scale className="h-8 w-8 text-blue-500" />,
      title: t("highlights.fair.title"),
      description: t("highlights.fair.desc"),
    },
    {
      icon: <RefreshCw className="h-8 w-8 text-primary" />,
      title: t("highlights.flexible.title"),
      description: t("highlights.flexible.desc"),
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-500" />,
      title: t("highlights.updated.title"),
      description: t("highlights.updated.desc"),
    },
  ];

  const legalProhibited = t.raw("legalSafety.prohibited") as string[];
  const legalDisclaimer = t.raw("legalSafety.disclaimer") as string[];
  const legalIndemnity = t.raw("legalSafety.indemnity") as string[];
  const scopeItems = t.raw("sections.1.items") as string[];
  const packageItems = t.raw("sections.3.packageItems") as string[];
  const commitmentItems = t.raw("sections.3.commitmentItems") as string[];
  const durationItems = t.raw("sections.3.durationItems") as string[];
  const cursorItems = t.raw("sections.3.cursorItems") as string[];
  const afterDeliveryItems = t.raw("sections.4.items") as string[];
  const orderItems = t.raw("sections.5.orderItems") as string[];
  const paymentItems = t.raw("sections.5.paymentItems") as string[];
  const warrantyItems = t.raw("sections.6.warrantyItems") as string[];
  const replacementItems = t.raw("sections.6.replacementItems") as string[];
  const exclusionItems = t.raw("sections.6.exclusionItems") as string[];
  const customerCommitItems = t.raw("sections.7.commitItems") as string[];
  const customerForbidItems = t.raw("sections.7.forbidItems") as string[];
  const shopCommitItems = t.raw("sections.8.commitItems") as string[];
  const shopLimitItems = t.raw("sections.8.limitItems") as string[];
  const ipItems = t.raw("sections.9.items") as string[];
  const suspensionItems = t.raw("sections.10.items") as string[];
  const changeReasonItems = t.raw("sections.11.reasonItems") as string[];
  const disputeProcessItems = t.raw("sections.12.processItems") as string[];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t("hero.title")}{" "}
              <span className="text-foreground">
                {t("hero.highlight")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t("hero.description")}
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{t("hero.effective")}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {termsHighlights.map((item, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.1.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("sections.1.intro")}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  {scopeItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-700 text-sm">{t("sections.1.trademarkNote")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.2.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("sections.2.content")}</p>
                <p className="text-muted-foreground text-sm">{t("sections.2.paymentMeans")}</p>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>{t("sections.2.note")}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.3.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">{t("sections.3.package")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {packageItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h4 className="font-semibold mt-6">{t("sections.3.commitment")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {commitmentItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-700 text-sm">{t("sections.3.note")}</p>
                </div>

                <h4 className="font-semibold mt-6">{t("sections.3.durationTitle")}</h4>
                <p className="text-muted-foreground text-sm mb-2">{t("sections.3.durationIntro")}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {durationItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-sm">{t("sections.3.durationNote")}</p>

                <h4 className="font-semibold mt-6">{t("sections.3.cursorTitle")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {cursorItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8 border border-blue-200">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.4.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <p className="text-muted-foreground mb-4">{t("sections.4.intro")}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                {afterDeliveryItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.5.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">{t("sections.5.order")}</h4>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  {orderItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ol>

                <h4 className="font-semibold">{t("sections.5.payment")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {paymentItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">
                    <strong>{t("sections.5.time")}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.6.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-orange-900 text-sm font-medium">{t("sections.6.noRefundNote")}</p>
                </div>

                <h4 className="font-semibold">{t("sections.6.replacement")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {replacementItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h4 className="font-semibold">{t("sections.6.warranty")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {warrantyItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">{t("sections.6.exclusion")}</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {exclusionItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.7.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">{t("sections.7.commit")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {customerCommitItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h4 className="font-semibold">{t("sections.7.forbid")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {customerForbidItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.8.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">{t("sections.8.commit")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {shopCommitItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h4 className="font-semibold">{t("sections.8.limit")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {shopLimitItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8 border-2 border-red-200">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-6 w-6" />
                {t("legalSafety.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-amber-800 text-sm font-medium">
                    {t("legalSafety.highlight")}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">
                    {t("legalSafety.prohibitedTitle")}
                  </h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {legalProhibited.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    {t("legalSafety.disclaimerTitle")}
                  </h4>
                  <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1">
                    {legalDisclaimer.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">
                    {t("legalSafety.indemnityTitle")}
                  </h4>
                  <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                    {legalIndemnity.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.9.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                {ipItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.10.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("sections.10.intro")}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {suspensionItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-amber-800 text-sm">{t("sections.10.note")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.11.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("sections.11.content")}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {changeReasonItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">{t("sections.11.note")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.12.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">{t("sections.12.process")}</h4>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  {disputeProcessItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ol>
                <p className="text-muted-foreground">
                  <strong>{t("sections.12.law")}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("sections.13.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t("sections.13.brand")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t("sections.13.email")}</li>
                    <li>{t("sections.13.messenger")}</li>
                    <li>{t("sections.13.telegram")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">{t("sections.13.support")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t("sections.13.time")}</li>
                    <li>{t("sections.13.resp")}</li>
                    <li>{t("sections.13.web")}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("cta.description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg">{t("cta.buy")}</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  {t("cta.contact")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
