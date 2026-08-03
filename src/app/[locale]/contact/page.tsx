import type { Metadata } from "next";
import { Clock, Facebook, MapPin, MessageCircle, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { BreadcrumbSchema } from "~/ui/components/seo-schemas";
import { CommunitySection } from "~/ui/components/community-section";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

type Props = {
  params: Promise<{ locale: string }>;
};

const FACEBOOK_URL = SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_HANDLE = SEO_CONFIG.supportContacts.telegram;
const TELEGRAM_URL = TELEGRAM_HANDLE
  ? `https://t.me/${TELEGRAM_HANDLE.replace(/^@/, "")}`
  : "";
const FACEBOOK_HANDLE = FACEBOOK_URL
  ? `@${FACEBOOK_URL.replace(/\/$/, "").split("/").pop()}`
  : "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/contact`;

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
        "vi": `${baseUrl}/vi/contact`,
        "en": `${baseUrl}/en/contact`,
        "ru": `${baseUrl}/ru/contact`,
        "zh": `${baseUrl}/zh/contact`,
        "ar": `${baseUrl}/ar/contact`,
        "es": `${baseUrl}/es/contact`,
        "fr": `${baseUrl}/fr/contact`,
        "de": `${baseUrl}/de/contact`,
        "ja": `${baseUrl}/ja/contact`,
        "ko": `${baseUrl}/ko/contact`,
        "pt": `${baseUrl}/pt/contact`,
        "x-default": `${baseUrl}/vi/contact`,
      },
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("ContactPage");
  const isVi = locale === "vi";
  const primaryHoursLabel = isVi
    ? "08:00 - 23:00 (Thứ 2 - Chủ nhật)"
    : "08:00 - 23:00 (Monday - Sunday)";
  const emergencyHoursLabel = isVi
    ? "Khẩn cấp: 24/7 qua Telegram/Facebook"
    : "Emergency: 24/7 via Telegram/Facebook";
  const telegramPriorityLabel = isVi
    ? "ưu tiên nhắn Telegram để được phản hồi nhanh hơn."
    : "prioritize Telegram for faster response.";
  const workingScheduleRows = isVi
    ? [
        { label: "Lịch hỗ trợ", value: "Thứ 2 - Chủ nhật: 08:00 - 23:00" },
        { label: "Giờ phản hồi nhanh", value: "Thứ 2 - Thứ 6: 08:00-12:00; 13:30-17:00" },
        { label: "Giờ nghỉ trưa", value: "12:00-13:30 (có thể phản hồi chậm hoặc tới chiều)" },
        { label: "Buổi tối/Cuối tuần", value: "Có thể phản hồi chậm hơn bình thường" },
      ]
    : [
        { label: "Support schedule", value: "Monday - Sunday: 08:00 - 23:00" },
        { label: "Fast response hours", value: "Monday - Friday: 08:00-12:00; 13:30-17:00" },
        { label: "Lunch break", value: "12:00-13:30 (replies may be slower)" },
        { label: "Evening/Weekend", value: "Replies may be slower than usual" },
      ];

  const contactMethods = [
    ...(FACEBOOK_URL
      ? [
          {
            icon: <Facebook className="h-7 w-7" />,
            title: t("methods.facebook.title"),
            description: t("methods.facebook.description"),
            value: FACEBOOK_HANDLE,
            action: t("methods.facebook.action"),
            href: FACEBOOK_URL,
            available: primaryHoursLabel,
            bgGradient: "from-indigo-500/10 to-purple-500/10",
            borderColor: "border-indigo-500/20",
            iconColor: "text-indigo-600",
            buttonColor: "bg-indigo-600 hover:bg-indigo-700"
          }
        ]
      : []),
    ...(TELEGRAM_URL
      ? [
          {
            icon: <MessageCircle className="h-7 w-7" />,
            title: t("methods.telegram.title"),
            description: t("methods.telegram.description"),
            value: TELEGRAM_HANDLE,
            action: t("methods.telegram.action"),
            href: TELEGRAM_URL,
            available: primaryHoursLabel,
            bgGradient: "from-sky-500/10 to-cyan-500/10",
            borderColor: "border-sky-500/20",
            iconColor: "text-sky-600",
            buttonColor: "bg-sky-600 hover:bg-sky-700"
          }
        ]
      : [])
  ];

  const faqQuick = [
    {
      question: t("info.faq.items.0.question"),
      answer: t("info.faq.items.0.answer")
    },
    {
      question: t("info.faq.items.1.question"),
      answer: t("info.faq.items.1.answer")
    },
    {
      question: t("info.faq.items.2.question"),
      answer: t("info.faq.items.2.answer")
    }
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: locale === "vi" ? "Trang Chủ" : "Home", href: "/" },
          { name: locale === "vi" ? "Liên Hệ" : "Contact", href: "/contact" },
        ]}
        locale={locale}
      />
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-transparent" />
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-4 inline-block border-2 border-border bg-primary px-3 py-1 text-sm font-black tracking-tight text-primary-foreground shadow-hard-sm">
              {SEO_CONFIG.name} · {t("hero.badge")}
            </p>
            <h1 className="mb-6 font-display text-4xl font-black tracking-tight md:text-6xl">
              {t("hero.title")}{" "}
              <span className="bg-primary px-1 text-primary-foreground">{t("hero.highlight")}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed font-medium">
              {t("hero.description")} <strong className="text-foreground">{primaryHoursLabel}</strong>. 
              <br className="hidden md:block" />
              {emergencyHoursLabel}
            </p>
            <div className="mx-auto mb-8 max-w-3xl overflow-hidden rounded-md border-2 border-border bg-background shadow-hard-lg">
              <div className="border-b-2 border-border bg-secondary px-4 py-3 text-left text-secondary-foreground">
                <p className="text-sm font-black">
                  {isVi ? "Bảng giờ làm việc" : "Working hours table"}
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {workingScheduleRows.map((row, index) => (
                    <tr
                      key={`hero-${row.label}`}
                      className={index !== workingScheduleRows.length - 1 ? "border-b border-border/60" : ""}
                    >
                      <td className="w-[38%] bg-muted/35 px-3 py-2 font-medium text-foreground">{row.label}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 px-4 py-3 text-left">
                <p className="text-sm text-muted-foreground">
                  {isVi ? "Ưu tiên nhắn Telegram để được phản hồi nhanh hơn Facebook." : "Prioritize Telegram for faster response than Facebook."}
                </p>
                <p className="text-sm font-medium text-foreground">{emergencyHoursLabel}</p>
              </div>
            </div>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Clock, label: t("hero.stats.response") },
                { icon: Users, label: t("hero.stats.customers") },
                { icon: Zap, label: t("hero.stats.support") },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <Icon className="h-4 w-4 text-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("methods.title")}{" "}
              <span className="text-foreground">
                {t("methods.highlight")}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("methods.description")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border border-border bg-background p-6 text-center transition-colors hover:bg-muted/40"
              >
                <div className="relative z-10">
                  <div className="mb-5 flex justify-center text-foreground">
                    {method.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{method.title}</h3>
                  <p className="mb-3 min-h-[40px] text-sm text-muted-foreground">{method.description}</p>
                  <p className="mb-4 text-sm font-medium text-foreground">{method.value}</p>
                  <Link href={method.href} target="_blank" rel="noopener noreferrer">
                    <Button 
                      className={`w-full mb-3 ${method.buttonColor} text-white shadow-lg transform group-hover:shadow-xl transition-all duration-300`} 
                      size="sm"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      {method.action}
                    </Button>
                  </Link>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    {method.available}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mx-auto mb-16 max-w-4xl rounded-2xl border border-sky-300/30 bg-muted/40 p-4 text-center ">
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
              {isVi ? "mẹo hỗ trợ nhanh:" : "faster support tip:"} <strong>{telegramPriorityLabel}</strong>
            </p>
          </div>

          {/* Quick Contact Banner */}
          <div className="bg-muted/40 rounded-3xl p-8 md:p-12 text-center border-2 border-primary/20">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
              {t("quickBanner.title")}{" "}
              <span className="text-indigo-600">{t("quickBanner.facebook")}</span> {t("quickBanner.or")}{" "}
              <span className="text-sky-600">{t("quickBanner.telegram")}</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("quickBanner.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {FACEBOOK_URL && (
                <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Facebook className="h-5 w-5 mr-2" />
                    {t("quickBanner.buttons.facebook")}
                  </Button>
                </Link>
              )}
              {TELEGRAM_URL && (
                <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {t("quickBanner.buttons.telegram")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Methods Card */}
            <Card className="p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-bold mb-2">
                  {t("info.title")}
                </CardTitle>
                <p className="text-muted-foreground">
                  {t("info.description")}
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-6">
                <div className="space-y-4">
                  {FACEBOOK_URL && (
                    <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full" size="lg" variant="outline">
                        <Facebook className="h-5 w-5 mr-2 text-indigo-600" />
                        Fanpage Facebook: {FACEBOOK_HANDLE}
                      </Button>
                    </Link>
                  )}
                  {TELEGRAM_URL && (
                    <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full" size="lg" variant="outline">
                        <MessageCircle className="h-5 w-5 mr-2 text-sky-600" />
                        Telegram: {TELEGRAM_HANDLE}
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    {t("info.note")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <div className="space-y-8">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("info.company.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">{t("info.company.name")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("info.company.description")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("info.company.addressTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("info.company.address")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("info.company.hoursTitle")}</h4>
                    <div className="overflow-hidden rounded-xl border border-border/70">
                      <table className="w-full text-sm">
                        <tbody>
                          {workingScheduleRows.map((row, index) => (
                            <tr key={row.label} className={index !== workingScheduleRows.length - 1 ? "border-b border-border/60" : ""}>
                              <td className="w-[40%] bg-muted/40 px-3 py-2 font-medium text-foreground">{row.label}</td>
                              <td className="px-3 py-2 text-muted-foreground">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-sm text-sky-700 dark:text-sky-300">
                      {isVi ? "Ưu tiên nhắn Telegram để được phản hồi nhanh hơn Facebook." : "Prioritize Telegram for faster response than Facebook."}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {emergencyHoursLabel}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("info.company.responseTitle")}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {t("info.company.response")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>{t("info.faq.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  {faqQuick.map((faq, index) => (
                    <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <h4 className="font-semibold mb-2 text-sm">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                  <Link href="/help" className="block">
                    <Button variant="outline" className="w-full">
                      {t("info.faq.viewAll")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <CommunitySection />

      {/* Emergency Contact */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-muted/40 rounded-3xl p-8 md:p-14 text-center border border-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-300/20 to-orange-300/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-300/20 to-red-300/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6 animate-bounce">
                <span className="text-4xl">{t("emergency.badge")}</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4 text-red-800 dark:text-red-400">
                {t("emergency.title")}
              </h2>
              <p className="text-lg md:text-xl text-red-700 dark:text-red-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t("emergency.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {FACEBOOK_URL && (
                  <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                    <Button 
                      size="lg" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 text-lg px-8 py-6"
                    >
                      <Facebook className="h-6 w-6 mr-3" />
                      {t("quickBanner.buttons.facebook")}
                    </Button>
                  </Link>
                )}
                {TELEGRAM_URL && (
                  <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <Button 
                      size="lg" 
                      className="bg-sky-600 hover:bg-sky-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 text-lg px-8 py-6"
                    >
                      <MessageCircle className="h-6 w-6 mr-3" />
                      {t("quickBanner.buttons.telegram")}
                    </Button>
                  </Link>
                )}
              </div>
              <p className="mt-6 text-sm text-red-600 dark:text-red-400 font-medium">
                {t("emergency.note")}
              </p>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6 text-lg">
              {t("social.title")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {FACEBOOK_URL && (
                <Link href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-500 transition-all duration-300"
                  >
                    <Facebook className="h-5 w-5 mr-2 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span>{t("methods.facebook.title")}</span>
                  </Button>
                </Link>
              )}
              {TELEGRAM_URL && (
                <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-500 transition-all duration-300"
                  >
                    <MessageCircle className="h-5 w-5 mr-2 text-sky-600 group-hover:scale-110 transition-transform" />
                    <span>{t("methods.telegram.title")}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}