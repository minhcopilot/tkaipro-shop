import type { Metadata } from "next";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { Jost, Overpass_Mono } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { extractRouterConfig } from "uploadthing/server";

import { routing } from "~/i18n/navigation";

import { SEO_CONFIG } from "~/app";
import { ourFileRouter } from "~/app/api/uploadthing/core";
import { CartProvider } from "~/lib/hooks/use-cart";
import { isRequestIpBanned } from "~/lib/security/ban-guard";
import { isPathnameTakenDown } from "~/lib/takedown";
import "~/css/globals.css";
import { Footer } from "~/ui/components/footer";
import { HeaderWrapper } from "~/ui/components/header/header-wrapper";
import { LayoutWidgets } from "~/ui/components/layout-widgets";
import { ThemeProvider } from "~/ui/components/theme-provider";
import { WarningMarquee } from "~/ui/components/warning-marquee";
import { DisclaimerBanner } from "~/ui/components/disclaimer-banner";
import { CookieConsentBanner } from "~/ui/components/cookie-consent-banner";
import { AnalyticsLoader } from "~/ui/components/analytics-loader";
import { Toaster } from "~/ui/primitives/sonner";
import { ServerActionRecovery } from "~/ui/components/server-action-recovery";
import { FingerprintTracker } from "~/ui/components/security/fingerprint-tracker";
import { AntiInspect } from "~/ui/components/security/anti-inspect";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
  preload: true,
});

const overpassMono = Overpass_Mono({
  subsets: ["latin"],
  variable: "--font-overpass-mono",
  display: "swap",
  preload: true,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // For takedown URLs, return minimal metadata: no brand keywords, no OG.
  const requestHeaders = await headers();
  const currentPathname = requestHeaders.get("x-pathname") ?? "";
  if (isPathnameTakenDown(currentPathname)) {
    return {
      title: "Service temporarily unavailable",
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
      alternates: { canonical: undefined, languages: {} },
      openGraph: undefined,
      twitter: undefined,
    };
  }

  const t = await getTranslations({ locale, namespace: "SEO" });

  const localeMap: Record<string, string> = {
    vi: "vi_VN",
    en: "en_US",
    ru: "ru_RU",
    zh: "zh_CN",
    ar: "ar_SA",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    ja: "ja_JP",
    ko: "ko_KR",
    pt: "pt_BR",
  };

  const baseUrl = SEO_CONFIG.url;

  return {
    title: {
      default: t("defaultTitle"),
      template: `%s | ${SEO_CONFIG.name}`,
    },
    description: t("defaultDescription"),
    keywords: t("keywords"),
    authors: [{ name: SEO_CONFIG.name }],
    creator: SEO_CONFIG.name,
    publisher: SEO_CONFIG.name,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/tkaipro-icon.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: localeMap[locale] || "vi_VN",
      url: `${baseUrl}/${locale}`,
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      siteName: SEO_CONFIG.name,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(t("defaultTitle"))}&description=${encodeURIComponent(t("slogan"))}&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: t("defaultTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      images: [`${baseUrl}/api/og?title=${encodeURIComponent(t("defaultTitle"))}&description=${encodeURIComponent(t("slogan"))}&locale=${locale}`],
      ...(process.env.NEXT_PUBLIC_TWITTER_HANDLE
        ? { creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE }
        : {}),
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
      other: {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
      },
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        "vi": `${baseUrl}/vi`,
        "en": `${baseUrl}/en`,
        "ru": `${baseUrl}/ru`,
        "zh": `${baseUrl}/zh`,
        "ar": `${baseUrl}/ar`,
        "es": `${baseUrl}/es`,
        "fr": `${baseUrl}/fr`,
        "de": `${baseUrl}/de`,
        "ja": `${baseUrl}/ja`,
        "ko": `${baseUrl}/ko`,
        "pt": `${baseUrl}/pt`,
        "x-default": `${baseUrl}/vi`,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Detect takedown URLs via the x-pathname header set in middleware.
  // For these URLs we render a minimal layout (no header / footer / analytics
  // / JSON-LD / brand mentions) so that automated trademark abuse scanners do
  // not pick up impersonating markup that lives in the shared shell.
  const requestHeaders = await headers();
  const currentPathname = requestHeaders.get("x-pathname") ?? "";
  const isTakedown = isPathnameTakenDown(currentPathname);

  // Hard-ban IP: render trang 403 đơn giản, không header/footer/i18n. Cache
  // 30s ở memory nên chi phí cho user thường ~0. Vẫn trả HTML để browser hiển
  // thị thông báo (response.status không set được ở layout).
  const { banned: ipBanned } = await isRequestIpBanned(requestHeaders);
  if (ipBanned) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Access denied</title>
        </head>
        <body
          suppressHydrationWarning
          className={`
            ${jost.variable}
            ${overpassMono.variable}
            min-h-screen bg-neutral-950 text-neutral-100 antialiased
            flex items-center justify-center
          `}
        >
          <div className="max-w-md p-8 text-center">
            <h1 className="text-3xl font-bold mb-3">403 — Access denied</h1>
            <p className="text-neutral-400 leading-relaxed">
              Yêu cầu của bạn đã bị từ chối. Nếu bạn cho rằng đây là nhầm lẫn,
              vui lòng liên hệ shop với mã đơn / email mua hàng để được hỗ trợ.
            </p>
          </div>
        </body>
      </html>
    );
  }

  if (isTakedown) {
    // Intentionally do NOT include NextIntlClientProvider / ThemeProvider /
    // analytics / brand schemas / i18n message dump. The notice component
    // uses its own hardcoded copy map and no client components consume
    // useTranslations(), so a minimal HTML shell is sufficient and keeps
    // trademarked terms out of the rendered HTML.
    return (
      <html lang={locale} suppressHydrationWarning>
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body
          suppressHydrationWarning
          className={`
            ${jost.variable}
            ${overpassMono.variable}
            min-h-screen bg-white text-neutral-900 antialiased
            dark:bg-neutral-950 dark:text-neutral-100
          `}
        >
          {children}
        </body>
      </html>
    );
  }

  // Providing all messages to the client side is the easiest way to get
  // started. Pass `locale` explicitly so this works even when middleware
  // bypassed next-intl (e.g. for takedown URLs that need x-pathname header).
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* CRITICAL: inline script to detect server action cache mismatch and force reload
            this runs BEFORE any bundled JS, so it works for users with old cached JavaScript */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var originalFetch = window.fetch;
  var reloading = false;
  window.fetch = function(url, options) {
    var isPost = options && options.method && options.method.toUpperCase() === 'POST';
    return originalFetch.apply(this, arguments).then(function(response) {
      if (!reloading && isPost && response.status >= 500) {
        response.clone().text().then(function(text) {
          if (text.indexOf('Failed to find Server Action') !== -1 || 
              text.indexOf('older or newer deployment') !== -1 ||
              text.indexOf('Cannot read properties of undefined') !== -1) {
            reloading = true;
            console.warn('[ServerAction] Cache mismatch detected, reloading...');
            setTimeout(function() { location.reload(); }, 100);
          }
        }).catch(function(){});
      }
      return response;
    });
  };
})();
            `.trim(),
          }}
        />
        {/* preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://46t4h475b1.ufs.sh" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://46t4h475b1.ufs.sh" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://img.vietqr.io" />
        {/* preload LCP image - YouTube thumbnail */}
        <link 
          rel="preload" 
          as="image" 
          href="https://img.youtube.com/vi/4aWPJGsTveU/maxresdefault.jpg"
          fetchPriority="high"
        />
        {/* Google Ads Conversion Tracking */}
        <Script
          id="google-ads"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-17841867231"
        />
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17841867231');
            `,
          }}
        />
        {/* Microsoft Clarity — loaded only after analytics opt-in (see AnalyticsLoader) */}
        <AnalyticsLoader />
      </head>
      <body
        suppressHydrationWarning
        className={`
          ${jost.variable}
          ${overpassMono.variable}
          min-h-screen bg-background text-foreground antialiased
          selection:bg-primary/15
        `}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
            enableSystem
          >
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            <FingerprintTracker />
            <AntiInspect />
            <CartProvider>
              <ServerActionRecovery />
              <div suppressHydrationWarning>
                <DisclaimerBanner />
                <HeaderWrapper showAuth={true} />
                <WarningMarquee />
                <main className={`flex min-h-screen flex-col`}>{children}</main>
                <Footer />
                <CookieConsentBanner />
                <Toaster />
                <LayoutWidgets />
              </div>
            </CartProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
