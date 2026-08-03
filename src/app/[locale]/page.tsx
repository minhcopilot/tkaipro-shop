import { AlertCircle, ArrowRight, Clock, Shield, Star, Zap } from "lucide-react";
import { CustomRequestBanner } from "~/ui/components/custom-request-banner";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { eq, desc, sql } from "drizzle-orm";

import { SEO_CONFIG } from "~/app";
import { db } from "~/db";
import { getCurrentUser } from "~/lib/auth";
import { socialProofs, PROOF_PRODUCT_TYPES, productTable, blogPosts } from "~/db/schema";
import { getLocalizedProduct, localizeSocialProof } from "~/lib/product-localization";
import { TAKEDOWN_HOMEPAGE } from "~/lib/takedown";
import {
  ServiceUnavailableNotice,
  buildServiceUnavailableMetadata,
} from "~/ui/components/service-unavailable-notice";
import { StructuredData } from "~/ui/components/structured-data";
import { LocalBusinessSchema, VideoSchema, OfferCatalogSchema, AggregateRatingSchema } from "~/ui/components/seo-schemas";
import { getRecentCompletedOrders } from "~/lib/queries/orders";
import { getAggregateRatingStats } from "~/lib/queries/reviews";
import { LazyYouTube } from "~/ui/components/lazy-youtube";
import { HomepageBlogSection } from "~/ui/components/homepage-blog-section";

// lazy load below-fold sections to reduce initial bundle
const FeaturedProductsSection = nextDynamic(
  () => import("~/ui/components/featured-products-section").then(mod => ({ default: mod.FeaturedProductsSection })),
  { ssr: true }
);
const PricingComparisonTable = nextDynamic(
  () => import("~/ui/components/pricing-comparison-table").then(mod => ({ default: mod.PricingComparisonTable })),
  { ssr: true }
);
const RecentPurchases = nextDynamic(
  () => import("~/ui/components/recent-purchases").then(mod => ({ default: mod.RecentPurchases })),
  { ssr: true }
);
const TrustSocialProofSection = nextDynamic(
  () => import("~/ui/components/trust-social-proof-section").then(mod => ({ default: mod.TrustSocialProofSection })),
  { ssr: true }
);
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";

// lazy load heavy below-the-fold components to reduce initial JS bundle
const TestimonialsSection = nextDynamic(
  () => import("~/ui/components/testimonials/testimonials-with-marquee").then(mod => ({ default: mod.TestimonialsSection })),
  { ssr: true }
);
const CompetitorComparison = nextDynamic(
  () => import("~/ui/components/competitor-comparison").then(mod => ({ default: mod.CompetitorComparison })),
  { ssr: true }
);
const SuccessStories = nextDynamic(
  () => import("~/ui/components/success-stories").then(mod => ({ default: mod.SuccessStories })),
  { ssr: true }
);
const TutorialSection = nextDynamic(
  () => import("~/ui/components/tutorial-section").then(mod => ({ default: mod.TutorialSection })),
  { ssr: true }
);
const FAQSection = nextDynamic(
  () => import("~/ui/components/faq-section").then(mod => ({ default: mod.FAQSection })),
  { ssr: true }
);
const CommunitySection = nextDynamic(
  () => import("~/ui/components/community-section").then(mod => ({ default: mod.CommunitySection })),
  { ssr: true }
);



// ISR: revalidate homepage every 60 seconds for better TTFB
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (TAKEDOWN_HOMEPAGE) {
    return buildServiceUnavailableMetadata(locale);
  }

  const t = await getTranslations({ locale, namespace: "HomePage" });
  const seoT = await getTranslations({ locale, namespace: "SEO" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}`;

  return {
    title: t.rich("heroTitle", {
      highlight: (chunks) => chunks
    }) as string,
    description: seoT("defaultDescription"),
    keywords: seoT("keywords"),
    openGraph: {
      title: seoT("defaultTitle"),
      description: seoT("defaultDescription"),
      url: canonicalUrl,
      type: "website",
      locale: {
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
      }[locale] || "vi_VN",
      images: [
        {
          url: `${baseUrl}${SEO_CONFIG.image}`,
          width: 1200,
          height: 630,
          alt: seoT("defaultTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoT("defaultTitle"),
      description: seoT("defaultDescription"),
      images: [`${baseUrl}${SEO_CONFIG.image}`],
    },
    alternates: {
      canonical: canonicalUrl,
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



// cached DB queries for better TTFB
const getCachedSocialProofs = unstable_cache(
  async () => {
    try {
      const proofs = await db.query.socialProofs.findMany({
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
      return proofs.slice(0, 6);
    } catch (error) {
      console.error("[HomePage] Error fetching social proofs:", error);
      return [];
    }
  },
  ["homepage-social-proofs"],
  { revalidate: 60, tags: ["social-proofs"] }
);

const getCachedSocialProofsStats = unstable_cache(
  async () => {
    try {
      const allProofs = await db.query.socialProofs.findMany({
        where: eq(socialProofs.isActive, true),
        columns: {
          productType: true,
        },
      });

      const stats = {
        total: allProofs.length,
        byProduct: {
          cursor: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K).length,
          github: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.GITHUB_COPILOT).length,
          figma: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.FIGMA_PRO).length,
          jetbrains: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.JETBRAINS_EDU).length,
        },
      };
      return stats;
    } catch (error) {
      console.error("[HomePage] Error fetching social proofs stats:", error);
      return null;
    }
  },
  ["homepage-social-proofs-stats"],
  { revalidate: 60, tags: ["social-proofs"] }
);

const getCachedBlogPosts = unstable_cache(
  async (locale: string) => {
    try {
      const posts = await db.query.blogPosts.findMany({
        where: sql`${blogPosts.status} = 'published' AND ${blogPosts.locale} = ${locale}`,
        orderBy: [desc(blogPosts.publishedAt)],
        columns: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          featuredImage: true,
          publishedAt: true,
          readTime: true,
        },
        limit: 4,
      });
      return posts;
    } catch (error) {
      console.error("[HomePage] Error fetching blog posts:", error);
      return [];
    }
  },
  ["homepage-blog-posts"],
  { revalidate: 60, tags: ["blog-posts"] }
);

const getCachedFeaturedProducts = unstable_cache(
  async () => {
    try {
      const products = await db.query.productTable.findMany({
        where: eq(productTable.status, "active"),
        orderBy: [desc(productTable.isFeatured), desc(productTable.sortOrder), desc(productTable.createdAt)],
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          shortDescription: true,
          price: true,
          originalPrice: true,
          image: true,
          images: true,
          inStock: true,
          stockQuantity: true,
          isPopular: true,
          isFeatured: true,
          rating: true,
          reviewCount: true,
          features: true,
          specs: true,
          tags: true,
        },
        with: {
          categoryInfo: {
            columns: {
              name: true,
            },
          },
        },
        limit: 4,
      });
      
      return products.map(p => ({
        ...p,
        categoryName: p.categoryInfo?.name || p.category,
      }));
    } catch (error) {
      console.error("[HomePage] Error fetching featured products:", error);
      return [];
    }
  },
  ["homepage-featured-products"],
  { revalidate: 60, tags: ["products"] }
);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (TAKEDOWN_HOMEPAGE) {
    return (
      <ServiceUnavailableNotice
        locale={locale}
        supportEmail={SEO_CONFIG.supportContacts.email}
        supportTelegram={SEO_CONFIG.supportContacts.telegram}
      />
    );
  }

  const t = await getTranslations("HomePage");
  const tMock = await getTranslations("MockData");
  const tTestimonials = await getTranslations("Testimonials");

  const testimonialsList = [0, 1, 2, 3, 4, 5].map((index) => ({
    text: tTestimonials(`items.${index}.text`),
    author: {
      name: tTestimonials(`items.${index}.author.name`),
      handle: tTestimonials(`items.${index}.author.handle`),
      avatar: `https://avatar.vercel.sh/${index}`,
    },
    href: "#",
  }));

  // get current user for personalized greeting
  const currentUser = await getCurrentUser();
  const visitorName = currentUser?.name || currentUser?.firstName || null;

  const featuresList = [
    {
      key: "transparentConsulting",
      icon: <Shield className="h-6 w-6 text-primary" />,
    },
    {
      key: "reasonableSavings",
      icon: <Zap className="h-6 w-6 text-primary" />,
    },
    {
      key: "support247",
      icon: <Clock className="h-6 w-6 text-primary" />,
    },
    {
      key: "longTermCompanion",
      icon: <Star className="h-6 w-6 text-primary" />,
    },
  ];

  // fetch data trực tiếp từ DB

  let featuredProductsHomepage: any[] = [];
  let socialProofsData: any[] = [];
  let socialProofsStats: any = null;
  let recentOrders: any[] = [];
  let latestBlogPosts: any[] = [];

  try {
    // use cached queries for products, social proofs, blog posts
    // keep recentOrders fresh since it needs real-time data
    [featuredProductsHomepage, socialProofsData, socialProofsStats, recentOrders, latestBlogPosts] = await Promise.all([
      getCachedFeaturedProducts(),
      getCachedSocialProofs(),
      getCachedSocialProofsStats(),
      getRecentCompletedOrders(7, 50),
      getCachedBlogPosts(locale),
    ]);

    // Localize fetched products
    featuredProductsHomepage = featuredProductsHomepage.map(p => getLocalizedProduct(p, locale));
    
    // Localize social proofs
    socialProofsData = socialProofsData.map(p => localizeSocialProof(p, locale));

    // Sanitize recent orders for public display:
    // - Strip credentials / PII (assignedCredentials, customerEmail, customerPhone, notes, adminNotes)
    // - Strip trademark-sensitive tokens from product names ("Chính Hãng", "Genuine", "Official", etc.)
    // - Only expose the minimum fields required by <RecentPurchases />.
    const TRADEMARK_LEAK_RE =
      /\s*(?:[-–—()\[\]]*\s*)?(?:#?1\s+(?:trusted|tienda|leader|reseller|việt\s*nam|vietnam)|chính\s*hãng|chính\s*chủ|chính\s*thức|genuine|authentic(?:ity)?|official(?:le)?|officiel(?:le)?|offiziell|original|legítimo|autêntico|authentique|正品|正規品|정품|أصلي|оригинальн[а-я]*)\s*(?:[-–—()\[\]]*)?/gi;
    const cleanProductName = (raw: string): string => {
      if (!raw) return raw;
      return raw
        .replace(TRADEMARK_LEAK_RE, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([–—-])\s+/g, " $1 ")
        .trim();
    };

    recentOrders = recentOrders.map((order: any) => {
      const safeItems = (order.items ?? []).map((item: any) => {
        const tempProduct = { name: item.name };
        const localized = getLocalizedProduct(tempProduct, locale);
        return {
          id: item.id,
          name: cleanProductName(localized.name),
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        };
      });
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        customerName: order.customerName,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        userAvatar: order.userAvatar ?? null,
        items: safeItems,
      };
    });

  } catch (error) {
    console.error("Error fetching homepage data:", error);
  }

  // fallback với mock data nếu vẫn không có products
  if (featuredProductsHomepage.length === 0) {
    featuredProductsHomepage = [
      {
        id: "mock-1",
        name: tMock("fallbackProducts.mock-1.name"),
        slug: "figma-education-1-month",
        category: "Google AI",
        description: tMock("fallbackProducts.mock-1.description"),
        shortDescription: tMock("fallbackProducts.mock-1.shortDescription"),
        price: 99000,
        originalPrice: 149000,
        image: "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK",
        inStock: true,
        isPopular: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 25
      },
      {
        id: "mock-2", 
        name: tMock("fallbackProducts.mock-2.name"),
        slug: "figma-education-3-months",
        category: "Google AI",
        description: tMock("fallbackProducts.mock-2.description"),
        shortDescription: tMock("fallbackProducts.mock-2.shortDescription"),
        price: 279000,
        originalPrice: 297000,
        image: "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK",
        inStock: true,
        isPopular: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 48
      },
      {
        id: "mock-3",
        name: tMock("fallbackProducts.mock-3.name"),
        slug: "figma-education-6-months",
        category: "Google AI",
        description: tMock("fallbackProducts.mock-3.description"),
        shortDescription: tMock("fallbackProducts.mock-3.shortDescription"),
        price: 499000,
        originalPrice: 594000,
        image: "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK",
        inStock: true,
        isPopular: false,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 32
      },
      {
        id: "mock-4",
        name: tMock("fallbackProducts.mock-4.name"),
        slug: "figma-education-12-months",
        category: "Google AI",
        description: tMock("fallbackProducts.mock-4.description"),
        shortDescription: tMock("fallbackProducts.mock-4.shortDescription"),
        price: 649000,
        originalPrice: 999000,
        image: "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK",
        inStock: true,
        isPopular: false,
        isFeatured: true,
        rating: 5.0,
        reviewCount: 15
      }
    ];

    // Localize mock products (currency handling will be done by components using getLocalizedProduct logic inside them or if they use raw price they need formatPrice)
    // Actually, getLocalizedProduct handles name/desc translation for known items or generic logic.
    // For mocks, we just translated them directly above using tMock.
    // However, they still have raw VND prices. The components (FeatureProductsSection -> ProductCard) 
    // should use formatPrice. We need to check FeatureProductsSection.

  }

  // fetch aggregate rating from database for SEO
  let aggregateRating = { ratingValue: 4.8, reviewCount: 150 };
  try {
    aggregateRating = await getAggregateRatingStats();
  } catch {
    // fallback to default values
  }

  return (
    <>
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <LocalBusinessSchema />
      <OfferCatalogSchema locale={locale} />
      <AggregateRatingSchema 
        ratingValue={aggregateRating.ratingValue}
        reviewCount={aggregateRating.reviewCount}
        itemName={`${SEO_CONFIG.name} — Google AI Account Reseller`}
      />
      <VideoSchema
        name="Hướng dẫn dùng Google AI"
        description="Video hướng dẫn làm quen Google AI — thiết kế UI collaboratively. TKAIPro là nhà bán lẻ độc lập, không liên kết với Google LLC"
        thumbnailUrl="https://img.youtube.com/vi/4aWPJGsTveU/maxresdefault.jpg"
        uploadDate="2024-01-15"
        duration="PT10M"
        embedUrl="https://www.youtube.com/embed/4aWPJGsTveU"
        contentUrl="https://www.youtube.com/watch?v=4aWPJGsTveU"
      />
      <main className="flex min-h-screen flex-col gap-y-20 bg-background">
        {/* Hero — brand + headline + CTA + video only in first viewport */}
        <section className="relative overflow-hidden border-b border-border bg-background py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-tech-grid opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 10% 20%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, color-mix(in oklab, var(--secondary) 14%, transparent), transparent 50%)",
            }}
          />
          <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="animate-fade-in-up flex flex-col justify-center space-y-8">
                <div className="space-y-5">
                  <p className="inline-block rounded-md bg-gradient-brand px-3.5 py-1 font-display text-sm tracking-tight text-primary-foreground shadow-soft-sm">
                    {SEO_CONFIG.name}
                  </p>
                  <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
                    {t.rich("heroTitle", {
                      highlight: (chunks) => (
                        <span className="bg-gradient-brand bg-clip-text text-transparent">{chunks}</span>
                      ),
                    })}
                  </h1>
                  <p className="max-w-xl text-lg font-medium text-muted-foreground md:text-xl">
                    {t("heroDescription")}
                  </p>
                </div>
                <div className="animate-slide-in-soft flex flex-col gap-3 sm:flex-row">
                  <Link href="/products">
                    <Button className="h-12 w-full gap-1.5 bg-gradient-brand px-8 sm:w-auto" size="lg">
                      {t("ctaRegister")} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#pricing">
                    <Button
                      className="h-12 w-full px-8 sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      {t("ctaPricing")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="animate-fade-in-up-delayed relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg lg:block">
                <div className="relative aspect-video">
                  <LazyYouTube
                    videoId="4aWPJGsTveU"
                    title="Demo: Google AI preview"
                    priority
                  />
                </div>
                <p className="border-t border-border bg-muted/70 px-3 py-2 text-[11px] leading-snug font-medium text-muted-foreground">
                  Third-party video, not produced by {SEO_CONFIG.name}.
                  Independent reseller — not affiliated with Google LLC
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Below-fold notices — kept for content, out of hero clutter */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid gap-4 md:grid-cols-2">
            <CustomRequestBanner />
            <div className="flex items-start gap-3 rounded-xl border border-border bg-accent p-4 shadow-soft-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("urgency.title")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.rich("urgency.subtitle", {
                    bold: (chunks) => (
                      <span className="font-bold text-foreground">{chunks}</span>
                    ),
                  })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("disclaimer")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products - Gói Google AI Nổi Bật */}
        <FeaturedProductsSection products={featuredProductsHomepage} />

        {/* Pricing Comparison Table */}
        {/* <PricingComparisonTable /> */}

        <RecentPurchases orders={recentOrders} locale={locale} visitorName={visitorName} />

        {/* Trust & Social Proof Section */}
        {socialProofsData.length > 0 && (
          <TrustSocialProofSection proofs={socialProofsData} stats={socialProofsStats} />
        )}

        {/* Features Section */}
        <section
          className={`
            py-12
            md:py-16
          `}
          id="features"
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {t("featuresTitle")}
              </h2>
              <p className="mt-4 max-w-2xl text-center text-muted-foreground md:text-lg">
                {t("featuresDescription")}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuresList.map((feature) => (
                <Card
                  className="bg-background transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
                  key={feature.key}
                >
                  <CardHeader className="pb-2">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-gradient-brand text-primary-foreground shadow-soft-sm">
                      {feature.icon}
                    </div>
                    <CardTitle>{t(`features.${feature.key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {t(`features.${feature.key}.description`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Google AI Benefits Section */}
        <section className="border-y border-border bg-gradient-brand py-16 text-primary-foreground md:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col items-center text-center">
              <h2 className="font-display text-3xl tracking-tight text-primary-foreground md:text-5xl">
                {t("benefitsTitle")}
              </h2>
              <p className="mt-4 max-w-2xl text-center text-primary-foreground/85 md:text-lg">
                {t("benefitsDescription")}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-background/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {t("benefits.unlimitedCompletion.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t("benefits.unlimitedCompletion.description")}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {t("benefits.fastRequests.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t("benefits.fastRequests.description")}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("benefits.maxMode.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t("benefits.maxMode.description")}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <CompetitorComparison />

        {/* Success Stories */}
        <SuccessStories />

        {/* Tutorial Section */}
        <TutorialSection />

        {/* Blog Section - SEO boost */}
        {latestBlogPosts.length > 0 && (
          <HomepageBlogSection posts={latestBlogPosts} locale={locale} />
        )}

        {/* Testimonials */}
        <section
          className={`
            py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <TestimonialsSection
              className="py-0"
              description={tTestimonials("description")}
              testimonials={testimonialsList}
              title={tTestimonials("title")}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Community Section */}
        <CommunitySection />

        {/* CTA Section */}
        <section
          className={`
            py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <div className="relative overflow-hidden rounded-lg bg-gradient-brand px-8 py-16 text-primary-foreground shadow-soft-lg md:px-12 md:py-20">
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="font-display text-3xl tracking-tight text-primary-foreground md:text-5xl">
                  {t("finalCta.title")}
                </h2>
                <p className="mt-4 text-lg font-medium text-primary-foreground/90 md:text-xl">
                  {t("finalCta.description")}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/auth/sign-up" className="w-full sm:w-auto">
                    <Button
                      className="h-12 w-full bg-background px-8 text-foreground sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      {t("finalCta.register")}
                    </Button>
                  </Link>
                  <Link href="/products" className="w-full sm:w-auto">
                    <Button
                      className="h-12 w-full border-primary-foreground/30 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      {t("finalCta.viewPackages")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
