import type { Metadata } from "next";
import { Cookie, Settings, Shield, Eye, BarChart, Target } from "lucide-react";
import { Link } from "~/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "CookiesPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/cookies`;

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
        "vi": `${baseUrl}/vi/cookies`,
        "en": `${baseUrl}/en/cookies`,
        "ru": `${baseUrl}/ru/cookies`,
        "zh": `${baseUrl}/zh/cookies`,
        "ar": `${baseUrl}/ar/cookies`,
        "es": `${baseUrl}/es/cookies`,
        "fr": `${baseUrl}/fr/cookies`,
        "de": `${baseUrl}/de/cookies`,
        "ja": `${baseUrl}/ja/cookies`,
        "ko": `${baseUrl}/ko/cookies`,
        "pt": `${baseUrl}/pt/cookies`,
        "x-default": `${baseUrl}/vi/cookies`,
      },
    },
  };
}

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("CookiesPage");

  const cookieTypes = [
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: t("types.items.essential.title"),
      description: t("types.items.essential.description"),
      purpose: t("types.items.essential.purpose"),
      canDisable: false,
      examples: [
        "Session management",
        "Security tokens", 
        "Load balancing",
        "CSRF protection"
      ]
    },
    {
      icon: <BarChart className="h-8 w-8 text-blue-500" />,
      title: t("types.items.analytics.title"),
      description: t("types.items.analytics.description"),
      purpose: t("types.items.analytics.purpose"),
      canDisable: true,
      examples: [
        "Google Analytics",
        "Page views tracking",
        "User behavior analysis",
        "Performance monitoring"
      ]
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: t("types.items.marketing.title"),
      description: t("types.items.marketing.description"),
      purpose: t("types.items.marketing.purpose"),
      canDisable: true,
      examples: [
        "Facebook Pixel",
        "Google Ads tracking",
        "Retargeting pixels",
        "Conversion tracking"
      ]
    },
    {
      icon: <Settings className="h-8 w-8 text-orange-500" />,
      title: t("types.items.functional.title"),
      description: t("types.items.functional.description"),
      purpose: t("types.items.functional.purpose"),
      canDisable: true,
      examples: [
        "Language preferences",
        "Theme settings",
        "Cart contents",
        "User preferences"
      ]
    }
  ];

  const cookieList = [
    {
      name: "_ga",
      provider: "Google Analytics",
      purpose: "Phân biệt người dùng unique", // Kept somewhat hardcoded or could be generalized if needed, but mostly technical
      duration: "2 năm",
      type: "Analytics"
    },
    {
      name: "_ga_*",
      provider: "Google Analytics 4",
      purpose: "Lưu trữ session state",
      duration: "2 năm", 
      type: "Analytics"
    },
    {
      name: "sessionid",
      provider: SEO_CONFIG.name,
      purpose: "Quản lý session đăng nhập",
      duration: "2 tuần",
      type: "Essential"
    },
    {
      name: "csrftoken",
      provider: SEO_CONFIG.name,
      purpose: "Bảo vệ CSRF attacks",
      duration: "1 năm",
      type: "Essential"
    },
    {
      name: "_fbp",
      provider: "Facebook",
      purpose: "Tracking cho Facebook Ads",
      duration: "3 tháng",
      type: "Marketing"
    },
    {
      name: "preferences",
      provider: SEO_CONFIG.name,
      purpose: "Lưu cài đặt giao diện",
      duration: "1 năm",
      type: "Functional"
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
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
              <Cookie className="h-4 w-4" />
              <span className="text-sm font-medium">{t("hero.update")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* What are Cookies */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                {t("definition.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t("definition.description")}
                </p>
                
                <h4 className="font-semibold">{t("definition.whyTitle")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>{t("definition.reasons.1")}</li>
                  <li>{t("definition.reasons.2")}</li>
                  <li>{t("definition.reasons.3")}</li>
                  <li>{t("definition.reasons.4")}</li>
                  <li>{t("definition.reasons.5")}</li>
                </ul>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">
                    <strong>{t("definition.commitment")}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              {t("types.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("types.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {cookieTypes.map((type, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {type.icon}
                  <div>
                    <h3 className="font-semibold text-lg">{type.title}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("types.purpose")}</h4>
                    <p className="text-sm text-muted-foreground">{type.purpose}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">{t("types.examples")}</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.examples.map((example, i) => (
                        <li key={i}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm font-medium">
                      {t("types.canDisable")} {type.canDisable ? t("types.yes") : t("types.no")}
                    </span>
                    {type.canDisable && (
                      <Button size="sm" variant="outline">
                        {t("types.settings")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Details Table */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              {t("details.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("details.description")}
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">{t("details.headers.name")}</th>
                    <th className="text-left p-4 font-semibold">{t("details.headers.provider")}</th>
                    <th className="text-left p-4 font-semibold">{t("details.headers.purpose")}</th>
                    <th className="text-left p-4 font-semibold">{t("details.headers.duration")}</th>
                    <th className="text-left p-4 font-semibold">{t("details.headers.type")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieList.map((cookie, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="p-4 font-mono text-sm">{cookie.name}</td>
                      <td className="p-4 text-sm">{cookie.provider}</td>
                      <td className="p-4 text-sm text-muted-foreground">{cookie.purpose}</td>
                      <td className="p-4 text-sm">{cookie.duration}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          cookie.type === 'Essential' ? 'bg-green-100 text-green-800' :
                          cookie.type === 'Analytics' ? 'bg-blue-100 text-blue-800' :
                          cookie.type === 'Marketing' ? 'bg-blue-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {cookie.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Cookie Settings */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t("manage.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  {t("manage.description")}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">{t("manage.browser")}</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Chrome: Settings → Privacy → Cookies</li>
                      <li>• Firefox: Options → Privacy → Cookies</li>
                      <li>• Safari: Preferences → Privacy → Cookies</li>
                      <li>• Edge: Settings → Privacy → Cookies</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">{t("manage.options")}</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Chấp nhận tất cả cookies</li>
                      <li>• Chỉ cookies cần thiết</li>
                      <li>• Tùy chỉnh từng loại</li>
                      <li>• Xóa cookies hiện có</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">{t("manage.warning")}</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>{t("manage.warningItems.1")}</li>
                    <li>{t("manage.warningItems.2")}</li>
                    <li>{t("manage.warningItems.3")}</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("manage.buttons.settings")}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    {t("manage.buttons.view")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("thirdParty.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t("thirdParty.description")}
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Google Services</h4>
                    <p className="text-sm text-muted-foreground">Analytics, Maps, Fonts</p>
                    <Link href="https://policies.google.com/privacy" target="_blank" className="text-xs text-primary underline">
                      Privacy Policy
                    </Link>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Facebook</h4>
                    <p className="text-sm text-muted-foreground">Social plugins, Ads</p>
                    <Link href="https://www.facebook.com/privacy/policy" target="_blank" className="text-xs text-primary underline">
                      Privacy Policy
                    </Link>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">YouTube</h4>
                    <p className="text-sm text-muted-foreground">Video embeds</p>
                    <Link href="https://www.youtube.com/privacy" target="_blank" className="text-xs text-primary underline">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Contact & Updates */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t("contact.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t("contact.changes")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Thông báo qua email đã đăng ký</li>
                    <li>• Banner thông báo trên website</li>
                    <li>• Cập nhật ngày hiệu lực</li>
                    <li>• 30 ngày notice trước khi áp dụng</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">{t("contact.info")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {SUPPORT_EMAIL && <li>📧 <strong>Email:</strong> {SUPPORT_EMAIL}</li>}
                    {MESSENGER_URL && <li>💬 <strong>Messenger:</strong> {MESSENGER_URL}</li>}
                    <li>📱 <strong>Support:</strong> 24/7 availability</li>
                  </ul>
                </div>
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
              <Link href="/contact">
                <Button size="lg">
                  {t("cta.contact")}
                </Button>
              </Link>
              <Link href="/privacy">
                <Button size="lg" variant="outline">
                  {t("cta.privacy")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}