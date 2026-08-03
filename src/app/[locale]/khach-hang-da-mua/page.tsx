
import { eq, desc } from "drizzle-orm";
import { TrendingUp, Users, Award, Shield, Star, CheckCircle2, BadgeCheck, Lock, Verified, ShieldCheck, Clock, Zap, ThumbsUp } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { db } from "~/db";
import { socialProofs, PROOF_PRODUCT_TYPES } from "~/db/schema";
import { ProofGallery } from "./proof-gallery";
import { localizeSocialProof } from "~/lib/product-localization";
import { getRecentCompletedOrders } from "~/lib/queries/orders";
import { RecentPurchases } from "~/ui/components/recent-purchases";

// revalidate every 60 seconds for fresh data
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SocialProofPage.seo" });
  
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/khach-hang-da-mua`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      locale: locale === "vi" ? "vi_VN" : locale === "ru" ? "ru_RU" : locale === "zh" ? "zh_CN" : locale === "ar" ? "ar_SA" : locale === "es" ? "es_ES" : locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : locale === "ja" ? "ja_JP" : locale === "ko" ? "ko_KR" : locale === "pt" ? "pt_BR" : "en_US",
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/khach-hang-da-mua`,
        "en": `${baseUrl}/en/khach-hang-da-mua`,
        "ru": `${baseUrl}/ru/khach-hang-da-mua`,
        "zh": `${baseUrl}/zh/khach-hang-da-mua`,
        "ar": `${baseUrl}/ar/khach-hang-da-mua`,
        "es": `${baseUrl}/es/khach-hang-da-mua`,
        "fr": `${baseUrl}/fr/khach-hang-da-mua`,
        "de": `${baseUrl}/de/khach-hang-da-mua`,
        "ja": `${baseUrl}/ja/khach-hang-da-mua`,
        "ko": `${baseUrl}/ko/khach-hang-da-mua`,
        "pt": `${baseUrl}/pt/khach-hang-da-mua`,
        "x-default": `${baseUrl}/vi/khach-hang-da-mua`,
      },
    },
  };
}

async function getStats() {
  const allProofs = await db.query.socialProofs.findMany({
    where: eq(socialProofs.isActive, true),
  });

  return {
    total: allProofs.length,
    byProduct: {
      cursor: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K).length,
      github: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.GITHUB_COPILOT).length,
      figma: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.FIGMA_PRO).length,
      jetbrains: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.JETBRAINS_EDU).length,
    },
  };
}

async function getProofs() {
  return await db.query.socialProofs.findMany({
    where: eq(socialProofs.isActive, true),
    orderBy: [desc(socialProofs.isFeatured), desc(socialProofs.displayOrder), desc(socialProofs.createdAt)],
    columns: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      platform: true,
      productType: true,
      orderNumber: true,
      customerName: true,
      amount: true,
      orderDate: true,
      isFeatured: true,
      createdAt: true,
    },
  });
}

export default async function SocialProofPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("SocialProofPage");

  const stats = await getStats();
  const rawProofs = await getProofs();
  const rawRecentOrders = await getRecentCompletedOrders(7, 50);

  // Sanitize public orders surface: strip credentials/PII + trademark leak tokens
  // (see src/app/[locale]/page.tsx for the same shape).
  const TRADEMARK_LEAK_RE =
    /\s*(?:[-–—()\[\]]*\s*)?(?:#?1\s+(?:trusted|tienda|leader|reseller|việt\s*nam|vietnam)|chính\s*hãng|chính\s*chủ|chính\s*thức|genuine|authentic(?:ity)?|official(?:le)?|officiel(?:le)?|offiziell|original|legítimo|autêntico|authentique|正品|正規品|정품|أصلي|оригинальн[а-я]*)\s*(?:[-–—()\[\]]*)?/gi;
  const cleanProductName = (raw: string): string =>
    !raw
      ? raw
      : raw
          .replace(TRADEMARK_LEAK_RE, " ")
          .replace(/\s{2,}/g, " ")
          .replace(/\s+([–—-])\s+/g, " $1 ")
          .trim();

  const recentOrders = rawRecentOrders.map((order: any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    customerName: order.customerName,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    userAvatar: order.userAvatar ?? null,
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      name: cleanProductName(item.name),
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
  }));
  const allProofs = rawProofs.map(proof => {
    const localized = localizeSocialProof(proof, locale);
    const formatDate = (date: Date | null): string => {
      if (!date) return "N/A";
      const localeMap: Record<string, string> = {
        'vi': 'vi-VN',
        'en': 'en-US',
        'ru': 'ru-RU',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'pt': 'pt-BR'
      };
      return date.toLocaleString(localeMap[locale] || 'en-US', {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    return {
      ...localized,
      formattedOrderDate: formatDate(localized.orderDate),
      formattedCreatedAt: formatDate(localized.createdAt),
    };
  });

  const figmaEduLabel = t("productTypes.figmaEdu");
  const productTypeLabels: Record<string, { label: string; color: string }> = {
    [PROOF_PRODUCT_TYPES.CURSOR_PRO]: { label: figmaEduLabel, color: "bg-primary" },
    [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL]: { label: figmaEduLabel, color: "bg-blue-600" },
    [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K]: { label: figmaEduLabel, color: "bg-blue-700" },
    [PROOF_PRODUCT_TYPES.GITHUB_COPILOT]: { label: figmaEduLabel, color: "bg-secondary" },
    [PROOF_PRODUCT_TYPES.FIGMA_PRO]: { label: figmaEduLabel, color: "bg-cyan-500" },
    [PROOF_PRODUCT_TYPES.JETBRAINS_EDU]: { label: figmaEduLabel, color: "bg-orange-500" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* hero */}
      <div className="border-b border-border py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="animate-fade-in-up space-y-6 text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              {SEO_CONFIG.name} · {t("hero.badge")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              {t("hero.title")}
              <span className="mt-2 block text-muted-foreground">
                {t("hero.highlight")}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t("hero.description")}
            </p>
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 pt-6 md:grid-cols-4">
              {[
                { icon: TrendingUp, value: `${stats.total}+`, label: t("hero.stats.orders") },
                { icon: Users, value: `${stats.byProduct.figma}+`, label: t("hero.stats.figma") },
                { icon: Award, value: "<5m", label: t("hero.stats.delivery") },
                { icon: Star, value: "4.9/5", label: t("hero.stats.reviews") },
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border p-4 text-center md:p-5"
                >
                  <Icon className="mx-auto mb-2 h-5 w-5 text-foreground" />
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* commitment banner */}
      <div className="border-b border-border bg-muted/40 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4 text-foreground md:flex-row md:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{t("commitment.bannerTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("commitment.bannerSubtitle")}
                </p>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: Lock, label: t("commitment.ssl") },
                { icon: BadgeCheck, label: t("commitment.verified") },
                { icon: Verified, label: t("commitment.trusted") },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RecentPurchases orders={recentOrders} locale={locale} />

      {/* why trust us */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-border bg-muted/30 p-8 md:p-12">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t("whyTrust.badge")}
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("whyTrust.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("whyTrust.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CheckCircle2, title: t("whyTrust.realOrdersTitle"), desc: t("whyTrust.realOrdersDesc") },
              { icon: Lock, title: t("whyTrust.dataSecurityTitle"), desc: t("whyTrust.dataSecurityDesc") },
              { icon: Zap, title: t("whyTrust.instantDeliveryTitle"), desc: t("whyTrust.instantDeliveryDesc") },
              { icon: Award, title: t("whyTrust.refundTitle"), desc: t("whyTrust.refundDesc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-border bg-background p-6 md:p-8">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-semibold text-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="mb-1 flex items-center justify-center gap-1 md:justify-start">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                  <span className="ml-2 font-semibold text-foreground">4.9/5</span>
                </div>
                <p className="text-muted-foreground">
                  {`"${t("whyTrust.quote", { count: stats.total })}"`}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <ThumbsUp className="h-4 w-4" />
                {t("whyTrust.satisfied")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* proofs */}
      <div className="container mx-auto max-w-6xl px-4 py-12" suppressHydrationWarning>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t("proofs.verifiedBadge")}
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            {t("proofs.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("proofs.description")}
          </p>
        </div>
        <div suppressHydrationWarning>
          <ProofGallery proofs={allProofs} productTypeLabels={productTypeLabels} />
        </div>
      </div>

      {/* trust CTA */}
      <div className="mt-8 border-t border-border bg-foreground py-16 text-background">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <p className="mb-4 text-sm font-medium text-background/70">
            {t("promise.badge")}
          </p>
          <h2 className="mb-10 text-4xl font-bold tracking-tight">{t("trust.title")}</h2>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => {
              const Icon = [CheckCircle2, Shield, Clock][i];
              return (
                <div key={i} className="rounded-lg border border-background/20 p-8 text-left">
                  <Icon className="mb-4 h-6 w-6" />
                  <h3 className="mb-2 text-lg font-semibold">{t(`trust.items.${i}.title`)}</h3>
                  <p className="text-sm text-background/70">
                    {t(`trust.items.${i}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-background/20 p-8">
            <p className="mb-2 text-xl font-semibold">{t("cta.title")}</p>
            <p className="mb-6 text-background/70">{t("cta.description")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" />
                {t("cta.buyNow")}
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-background/30 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10"
              >
                <Users className="h-4 w-4" />
                {t("cta.contact")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
