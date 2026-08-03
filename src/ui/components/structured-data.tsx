import { SEO_CONFIG } from "~/app";

interface StructuredDataProps {
  type: 'organization' | 'website' | 'product' | 'breadcrumbList';
  data?: any;
}

// Chỉ liệt kê kênh đã cấu hình trong env, tránh sameAs rỗng.
const SOCIAL_PROFILES = [
  SEO_CONFIG.supportContacts.facebook,
  SEO_CONFIG.supportContacts.telegram
    ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
    : "",
].filter(Boolean);

export function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": SEO_CONFIG.name,
          "url": SEO_CONFIG.url,
          "logo": `${SEO_CONFIG.url}/logo-v2.png`,
          "description": SEO_CONFIG.description,
          ...(SOCIAL_PROFILES.length > 0 ? { "sameAs": SOCIAL_PROFILES } : {}),
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "hoursAvailable": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              "opens": "08:00",
              "closes": "23:00"
            },
            "availableLanguage": ["Vietnamese"],
            "areaServed": "VN"
          }
        };

      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SEO_CONFIG.name,
          "url": SEO_CONFIG.url,
          "description": SEO_CONFIG.description,
          "publisher": {
            "@type": "Organization",
            "name": SEO_CONFIG.name
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${SEO_CONFIG.url}/products?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data?.name || "Google AI Account — Resale",
          "description":
            data?.description ||
            `Resold Google AI account from ${SEO_CONFIG.name}, an independent reseller. Not affiliated with Google LLC`,
          // We are NOT the Brand authoring the underlying product. Figma is.
          // Emit `manufacturer` for the underlying product; brand the offer surface
          // as our reseller brand.
          "brand": {
            "@type": "Organization",
            "name": SEO_CONFIG.name
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "Google LLC",
            "url": "https://www.figma.com/"
          },
          "offers": {
            "@type": "Offer",
            "url": `${SEO_CONFIG.url}/products/${data?.slug || ''}`,
            "priceCurrency": "VND",
            "price": data?.price || "79000",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": SEO_CONFIG.name
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "150"
          }
        };

      case 'breadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data?.items?.map((item: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": `${SEO_CONFIG.url}${item.href}`
          })) || []
        };

      default:
        return null;
    }
  };

  const schema = getSchema();

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
} 