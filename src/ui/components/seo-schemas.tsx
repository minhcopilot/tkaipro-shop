import { SEO_CONFIG } from "~/app";

// Chỉ liệt kê kênh đã cấu hình trong env, tránh sameAs rỗng.
const SOCIAL_PROFILES = [
  SEO_CONFIG.supportContacts.facebook,
  SEO_CONFIG.supportContacts.telegram
    ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
    : "",
].filter(Boolean);

// localBusiness schema. Branding intentionally neutral — we are an
// independent third-party reseller, not a Google channel.
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SEO_CONFIG.url}/#localbusiness`,
    "name": SEO_CONFIG.name,
    "description":
      "Independent third-party reseller of Google AI / Antigravity subscriptions. Not affiliated with Google LLC. Save up to 90%, 1-to-1 warranty, 24/7 support.",
    "alternateName": [SEO_CONFIG.fullName],
    "url": SEO_CONFIG.url,
    ...(SEO_CONFIG.supportContacts.email ? { "email": SEO_CONFIG.supportContacts.email } : {}),
    "image": `${SEO_CONFIG.url}/logo-v2.png`,
    "logo": `${SEO_CONFIG.url}/logo-v2.png`,
    "priceRange": "₫₫",
    "currenciesAccepted": "VND",
    "paymentAccepted": "Bank Transfer, MoMo, ZaloPay, VietQR",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ho Chi Minh City",
      "addressRegion": "Ho Chi Minh",
      "addressCountry": "VN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "10.8231",
      "longitude": "106.6297"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "23:00"
    },
    ...(SOCIAL_PROFILES.length > 0 ? { "sameAs": SOCIAL_PROFILES } : {}),
    "areaServed": [
      {
        "@type": "Country",
        "name": "Vietnam"
      },
      {
        "@type": "Country",
        "name": "Worldwide"
      }
    ],
    "serviceType": "Google AI subscription reseller"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// service schema for figma pro packages
interface ServiceSchemaProps {
  name: string;
  description: string;
  price: number;
  duration: string;
  slug: string;
  locale?: string;
}

export function ServiceSchema({ name, description, price, duration, slug, locale = "vi" }: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": SEO_CONFIG.name,
      "url": SEO_CONFIG.url
    },
    "areaServed": {
      "@type": "Country",
      "name": "Vietnam"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Google AI Subscription Resale Plans",
      "itemListElement": [{
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": name,
          "description": description
        },
        "price": price,
        "priceCurrency": "VND",
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": "https://schema.org/InStock",
        "url": `${SEO_CONFIG.url}/${locale}/products/${slug}`,
        "validFrom": new Date().toISOString().split('T')[0]
      }]
    },
    "termsOfService": `${SEO_CONFIG.url}/${locale}/terms`,
    "serviceOutput": {
      "@type": "Thing",
      "name": "Google AI subscription activation"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// video schema for youtube embeds
interface VideoSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate?: string;
  duration?: string;
  embedUrl: string;
  contentUrl?: string;
}

export function VideoSchema({ 
  name, 
  description, 
  thumbnailUrl, 
  uploadDate = "2024-01-01",
  duration = "PT5M",
  embedUrl,
  contentUrl
}: VideoSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": name,
    "description": description,
    "thumbnailUrl": thumbnailUrl,
    "uploadDate": uploadDate,
    "duration": duration,
    "embedUrl": embedUrl,
    "contentUrl": contentUrl || embedUrl,
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONFIG.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${SEO_CONFIG.url}/logo-v2.png`
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// article schema for blog posts
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  slug: string;
  category?: string;
  tags?: string[];
  locale?: string;
}

export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  slug,
  category,
  tags,
  locale = "vi"
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": image || `${SEO_CONFIG.url}/logo-v2.png`,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": SEO_CONFIG.url
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONFIG.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${SEO_CONFIG.url}/logo-v2.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SEO_CONFIG.url}/${locale}/blog/${slug}`
    },
    ...(category && { "articleSection": category }),
    ...(tags && tags.length > 0 && { "keywords": tags.join(", ") })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// enhanced breadcrumb schema
interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  locale?: string;
}

export function BreadcrumbSchema({ items, locale = "vi" }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.href.startsWith("http") 
        ? item.href 
        : `${SEO_CONFIG.url}/${locale}${item.href}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// aggregate rating schema with real data
interface AggregateRatingSchemaProps {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
  itemName?: string;
}

export function AggregateRatingSchema({
  ratingValue,
  reviewCount,
  bestRating = 5,
  worstRating = 1,
  itemName = `${SEO_CONFIG.name} Services`
}: AggregateRatingSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": itemName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toFixed(1),
      "reviewCount": reviewCount,
      "bestRating": bestRating,
      "worstRating": worstRating
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// NOTE: `SoftwareApplicationSchema` was REMOVED.
// It used to publish a SoftwareApplication schema typed as the vendor's
// own product with our shop's pricing + aggregateRating, which is
// trademark impersonation when emitted from our domain. We do not author
// the Google product; only Google LLC does. Our offers are catalogued as
// neutral reseller services below.

// Offer catalog: reseller services for Google AI accounts.
// Intentionally neutral — no "Chính Hãng"/"Genuine"/"Authentic"/"official" claims,
// no Google brand spoofing. Product mentions ("Google AI")
// are factual nominative fair use.
export function OfferCatalogSchema({ locale = "vi" }: { locale?: string } = {}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "name": `Google AI Account Resale — ${SEO_CONFIG.name}`,
    "description":
      "Independent reseller plans for Google AI accounts (Google LLC). Save up to 90%, 1-to-1 warranty. Not affiliated with Google LLC",
    "url": `${SEO_CONFIG.url}/${locale}/products`,
    "numberOfItems": 4,
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "Google AI Account — 1 Month Resale",
        "description":
          "Resold Google AI account (1 month). Email delivery after payment, 1-to-1 warranty.",
        "price": "99000",
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Google AI Account — 3 Months Resale",
        "description":
          "Resold Google AI account (3 months). Save 30% vs monthly.",
        "price": "279000",
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Google AI Account — 6 Months Resale",
        "description":
          "Resold Google AI account (6 months) for design students. Save 40%.",
        "price": "499000",
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Google AI Account — 12 Months Resale",
        "description":
          "Resold Google AI account (12 months). Best value, save up to 50%.",
        "price": "649000",
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

