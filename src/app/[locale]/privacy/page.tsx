import type { Metadata } from "next";
import { Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";
import { Link } from "~/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

interface Props {
  params: Promise<{ locale: string }>;
}

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/privacy`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: "privacy policy cursor pro shop, data protection",
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/privacy`,
        "en": `${baseUrl}/en/privacy`,
        "ru": `${baseUrl}/ru/privacy`,
        "zh": `${baseUrl}/zh/privacy`,
        "ar": `${baseUrl}/ar/privacy`,
        "es": `${baseUrl}/es/privacy`,
        "fr": `${baseUrl}/fr/privacy`,
        "de": `${baseUrl}/de/privacy`,
        "ja": `${baseUrl}/ja/privacy`,
        "ko": `${baseUrl}/ko/privacy`,
        "pt": `${baseUrl}/pt/privacy`,
        "x-default": `${baseUrl}/vi/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("PrivacyPage");

  const privacyHighlights = [
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: t("highlights.ssl.title"),
      description: t("highlights.ssl.desc")
    },
    {
      icon: <Lock className="h-8 w-8 text-blue-500" />,
      title: t("highlights.noCard.title"),
      description: t("highlights.noCard.desc")
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-500" />,
      title: t("highlights.transparent.title"),
      description: t("highlights.transparent.desc")
    },
    {
      icon: <UserCheck className="h-8 w-8 text-orange-500" />,
      title: t("highlights.rights.title"),
      description: t("highlights.rights.desc")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">{t("hero.update")}</span>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {privacyHighlights.map((item, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {t("sections.collection.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("sections.collection.basic")}</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("sections.collection.basicItems.1")}</li>
                      <li>{t("sections.collection.basicItems.2")}</li>
                      <li>{t("sections.collection.basicItems.3")}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{t("sections.collection.payment")}</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("sections.collection.paymentItems.1")}</li>
                      <li>{t("sections.collection.paymentItems.2")}</li>
                      <li>{t("sections.collection.paymentItems.3")}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {t("sections.usage.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("sections.usage.purpose")}</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("sections.usage.purposeItems.1")}</li>
                      <li>{t("sections.usage.purposeItems.2")}</li>
                      <li>{t("sections.usage.purposeItems.3")}</li>
                      <li>{t("sections.usage.purposeItems.4")}</li>
                      <li>{t("sections.usage.purposeItems.5")}</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      <strong>Cam kết:</strong> {t("sections.usage.commitment")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {t("sections.security.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("sections.security.measures")}</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("sections.security.measuresItems.1")}</li>
                      <li>{t("sections.security.measuresItems.2")}</li>
                      <li>{t("sections.security.measuresItems.3")}</li>
                      <li>{t("sections.security.measuresItems.4")}</li>
                      <li>{t("sections.security.measuresItems.5")}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{t("sections.security.paymentSec")}</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("sections.security.paymentSecItems.1")}</li>
                      <li>{t("sections.security.paymentSecItems.2")}</li>
                      <li>{t("sections.security.paymentSecItems.3")}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {t("sections.rights.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {t("sections.rights.desc")}
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>{t("sections.rights.items.access")}</strong></li>
                    <li><strong>{t("sections.rights.items.edit")}</strong></li>
                    <li><strong>{t("sections.rights.items.delete")}</strong></li>
                    <li><strong>{t("sections.rights.items.object")}</strong></li>
                    <li><strong>{t("sections.rights.items.complain")}</strong></li>
                  </ul>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800 text-sm">
                      {t("sections.rights.contact")}{" "}
                      {SUPPORT_EMAIL && <strong> {SUPPORT_EMAIL}</strong>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.cookies.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {t("sections.cookies.desc")}
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>{t("sections.cookies.items.1")}</li>
                    <li>{t("sections.cookies.items.2")}</li>
                    <li>{t("sections.cookies.items.3")}</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    {t("sections.cookies.note")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.sharing.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {t("sections.sharing.desc")}
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>{t("sections.sharing.items.1")}</li>
                    <li>{t("sections.sharing.items.2")}</li>
                    <li>{t("sections.sharing.items.3")}</li>
                    <li>{t("sections.sharing.items.4")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.storage.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>{t("sections.storage.items.1")}</li>
                    <li>{t("sections.storage.items.2")}</li>
                    <li>{t("sections.storage.items.3")}</li>
                    <li>{t("sections.storage.items.4")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.minors.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <p className="text-muted-foreground">{t("sections.minors.desc")}</p>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.international.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <p className="text-muted-foreground">{t("sections.international.desc")}</p>
              </CardContent>
            </Card>

            <Card className="p-8 mb-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>{t("sections.contact.title")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {t("sections.contact.desc")}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">{t("sections.contact.direct")}</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {SUPPORT_EMAIL && <li>📧 Email: {SUPPORT_EMAIL}</li>}
                        {MESSENGER_URL && <li>💬 Messenger: {MESSENGER_URL}</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t("sections.contact.company")}</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>{t("sections.contact.supportTime")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg">
                  {t("cta.contact")}
                </Button>
              </Link>
              <Link href="/terms">
                <Button size="lg" variant="outline">
                  {t("cta.terms")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}