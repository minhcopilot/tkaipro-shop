import type { Metadata } from "next";
import { ExternalLink, FileText, Folder, Home, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

type Props = {
  params: Promise<{ locale: string }>;
};

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SitemapPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/sitemap-html`;

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
        "vi": `${baseUrl}/vi/sitemap-html`,
        "en": `${baseUrl}/en/sitemap-html`,
        "ru": `${baseUrl}/ru/sitemap-html`,
        "zh": `${baseUrl}/zh/sitemap-html`,
        "ar": `${baseUrl}/ar/sitemap-html`,
        "es": `${baseUrl}/es/sitemap-html`,
        "fr": `${baseUrl}/fr/sitemap-html`,
        "de": `${baseUrl}/de/sitemap-html`,
        "ja": `${baseUrl}/ja/sitemap-html`,
        "ko": `${baseUrl}/ko/sitemap-html`,
        "pt": `${baseUrl}/pt/sitemap-html`,
        "x-default": `${baseUrl}/vi/sitemap-html`,
      },
    },
  };
}

export default async function SitemapPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("SitemapPage");

  const sitemapSections = [
    {
      title: t("sections.main.title"),
      icon: <Home className="h-5 w-5 text-blue-500" />,
      description: t("sections.main.description"),
      pages: [
        { name: t("sections.main.pages.home.name"), url: "/", description: t("sections.main.pages.home.desc") },
        { name: t("sections.main.pages.products.name"), url: "/products", description: t("sections.main.pages.products.desc") },
        { name: t("sections.main.pages.checkout.name"), url: "/checkout", description: t("sections.main.pages.checkout.desc") },
        { name: t("sections.main.pages.notifications.name"), url: "/notifications", description: t("sections.main.pages.notifications.desc") }
      ]
    },
    {
      title: t("sections.company.title"),
      icon: <Users className="h-5 w-5 text-green-500" />,
      description: t("sections.company.description"),
      pages: [
        { name: t("sections.company.pages.about.name"), url: "/about", description: t("sections.company.pages.about.desc") },
        { name: t("sections.company.pages.contact.name"), url: "/contact", description: t("sections.company.pages.contact.desc") },
        { name: t("sections.company.pages.careers.name"), url: "/careers", description: t("sections.company.pages.careers.desc") },
        { name: t("sections.company.pages.press.name"), url: "/press", description: t("sections.company.pages.press.desc") },
        { name: t("sections.company.pages.blog.name"), url: "/blog", description: t("sections.company.pages.blog.desc") }
      ]
    },
    {
      title: t("sections.support.title"),
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      description: t("sections.support.description"),
      pages: [
        { name: t("sections.support.pages.help.name"), url: "/help", description: t("sections.support.pages.help.desc") },
        { name: t("sections.support.pages.shipping.name"), url: "/shipping", description: t("sections.support.pages.shipping.desc") },
        { name: t("sections.support.pages.warranty.name"), url: "/warranty", description: t("sections.support.pages.warranty.desc") }
      ]
    },
    {
      title: t("sections.policy.title"),
      icon: <FileText className="h-5 w-5 text-orange-500" />,
      description: t("sections.policy.description"),
      pages: [
        { name: t("sections.policy.pages.terms.name"), url: "/terms", description: t("sections.policy.pages.terms.desc") },
        { name: t("sections.policy.pages.privacy.name"), url: "/privacy", description: t("sections.policy.pages.privacy.desc") },
        { name: t("sections.policy.pages.cookies.name"), url: "/cookies", description: t("sections.policy.pages.cookies.desc") }
      ]
    },
    {
      title: t("sections.account.title"),
      icon: <Users className="h-5 w-5 text-red-500" />,
      description: t("sections.account.description"),
      pages: [
        { name: t("sections.account.pages.signin.name"), url: "/auth/sign-in", description: t("sections.account.pages.signin.desc") },
        { name: t("sections.account.pages.signup.name"), url: "/auth/sign-up", description: t("sections.account.pages.signup.desc") },
        { name: t("sections.account.pages.dashboard.name"), url: "/dashboard", description: t("sections.account.pages.dashboard.desc") },
        { name: t("sections.account.pages.orders.name"), url: "/dashboard/orders", description: t("sections.account.pages.orders.desc") },
        { name: t("sections.account.pages.profile.name"), url: "/dashboard/profile", description: t("sections.account.pages.profile.desc") },
        { name: t("sections.account.pages.settings.name"), url: "/dashboard/settings", description: t("sections.account.pages.settings.desc") }
      ]
    }
  ];

  const quickLinks = [
    { name: t("quickLinks.buy"), url: "/products", highlight: true },
    { name: t("quickLinks.support"), url: "/contact", highlight: false },
    { name: t("quickLinks.guide"), url: "/help", highlight: false },
    { name: t("quickLinks.login"), url: "/auth/sign-in", highlight: false }
  ];

  const statistics = [
    { number: "80+", label: t("stats.pages") },
    { number: "10,000+", label: t("stats.customers") },
    { number: "24/7", label: t("stats.support") },
    { number: "99.9%", label: t("stats.uptime") }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
              <Folder className="h-4 w-4" />
              <span className="text-sm font-medium">{t("hero.badge")}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-6">{t("quickLinks.title")}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((link, index) => (
                <Link key={index} href={link.url}>
                  <Button 
                    size="lg"
                    variant={link.highlight ? "default" : "outline"}
                    className="px-6"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sitemap Sections */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sitemapSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="p-8">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.pages.map((page, pageIndex) => (
                      <Link key={pageIndex} href={page.url}>
                        <div className="group p-4 border rounded-lg hover:shadow-md hover:border-primary transition-all duration-200">
                          <div className="flex items-center gap-3 mb-2">
                            <ExternalLink className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {page.name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {page.description}
                          </p>
                          <div className="mt-2 text-xs text-primary font-mono">
                            {page.url}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-center text-2xl">
                {t("search.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 text-center">
              <p className="text-muted-foreground mb-6">
                {t("search.description")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button size="lg">
                  {t("search.button")}
                </Button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">📞 {t("search.support")}</h4>
                </div>
                {MESSENGER_URL && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">💬 {t("search.chat")}</h4>
                    <p className="text-muted-foreground">Messenger: {MESSENGER_URL}</p>
                  </div>
                )}
                {SUPPORT_EMAIL && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">📧 {t("search.email")}</h4>
                    <p className="text-muted-foreground">{SUPPORT_EMAIL}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technical Sitemap */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-center text-2xl">
                {t("technical.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">{t("technical.xmlTitle")}</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/sitemap.xml" className="text-primary hover:underline">
                        📄 sitemap.xml - Main sitemap
                      </Link>
                    </li>
                    <li>
                      <Link href="/robots.txt" className="text-primary hover:underline">
                        🤖 robots.txt - Crawler instructions
                      </Link>
                    </li>
                    <li>
                      <Link href="/manifest.json" className="text-primary hover:underline">
                        📱 manifest.json - PWA config
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">{t("technical.statsTitle")}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {t("technical.stats.pages")}: 80+</li>
                    <li>• {t("technical.stats.language")}: Tiếng Việt</li>
                    <li>• {t("technical.stats.framework")}: Next.js 14</li>
                    <li>• {t("technical.stats.update")}: Hàng ngày</li>
                    <li>• {t("technical.stats.ssl")}: Bảo mật 100%</li>
                    <li>• {t("technical.stats.mobile")}: Responsive</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>{t("technical.tip")}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
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
              <Link href="/products">
                <Button size="lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("cta.viewProducts")}
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  {t("cta.learnMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 