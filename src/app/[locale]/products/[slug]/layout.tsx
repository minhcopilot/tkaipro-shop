import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "~/lib/queries/products";
import { SEO_CONFIG } from "~/app";

const locales = ['vi', 'en', 'ru', 'zh', 'ar', 'es', 'fr', 'de', 'ja', 'ko', 'pt'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const baseUrl = SEO_CONFIG.url;
  
  try {
    const product = await getProductBySlug(slug);
    
    if (!product || product.status !== "active") {
      return {
        title: locale === "vi" ? "Sản Phẩm Không Tìm Thấy" : "Product Not Found",
        description: SEO_CONFIG.description,
        robots: { index: false, follow: false },
      };
    }

    const title = `${product.name} | ${SEO_CONFIG.name}`;
    const description = product.shortDescription || product.description || SEO_CONFIG.description;
    const imageUrl = product.image || `${baseUrl}${SEO_CONFIG.image}`;
    const price = product.price || 0;
    const originalPrice = product.originalPrice || null;
    const discount = originalPrice 
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
    
    const canonicalUrl = `${baseUrl}/${locale}/products/${slug}`;

    // generate hreflang for all locales
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      languages[loc] = `${baseUrl}/${loc}/products/${slug}`;
    }
    languages['x-default'] = `${baseUrl}/vi/products/${slug}`;

    return {
      title,
      description,
      keywords: `${product.name}, ${product.category}, Google AI, Antigravity, Gemini, mua tài khoản Google AI, ${SEO_CONFIG.keywords}`,
      openGraph: {
        title,
        description,
        type: "website",
        locale: locale === "vi" ? "vi_VN" : "en_US",
        url: canonicalUrl,
        siteName: SEO_CONFIG.name,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
        languages,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "VND",
        ...(originalPrice && {
          "product:original_price:amount": originalPrice.toString(),
          "product:original_price:currency": "VND",
        }),
        ...(discount > 0 && {
          "product:discount": discount.toString(),
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata for product:", error);
    return {
      title: `${locale === "vi" ? "Sản Phẩm" : "Product"} | ${SEO_CONFIG.name}`,
      description: SEO_CONFIG.description,
    };
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  
  // check if product exists and is active, return 404 if not
  try {
    const product = await getProductBySlug(slug);
    if (!product || product.status !== "active") {
      notFound();
    }
  } catch {
    notFound();
  }
  
  return <>{children}</>;
}

