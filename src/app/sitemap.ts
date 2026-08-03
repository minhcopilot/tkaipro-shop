import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '~/app';
import { getPublishedPosts } from '~/lib/queries/blogs';
import { getAllProducts, getAllCategories } from '~/lib/queries/products';
import {
  TAKEDOWN_ABOUT,
  TAKEDOWN_HOMEPAGE,
  isBlogSlugTakenDown,
} from '~/lib/takedown';

const locales = ['vi', 'en', 'ru', 'zh', 'ar', 'es', 'fr', 'de', 'ja', 'ko', 'pt'] as const;
type Locale = typeof locales[number];

function generateAlternates(path: string, baseUrl: string) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  }
  languages['x-default'] = `${baseUrl}/vi${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.url;

  const staticPaths = [
    ...(TAKEDOWN_HOMEPAGE
      ? []
      : [{ path: '', changeFrequency: 'daily' as const, priority: 1 }]),
    { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
    ...(TAKEDOWN_ABOUT
      ? []
      : [{ path: '/about', changeFrequency: 'weekly' as const, priority: 0.8 }]),
    { path: '/contact', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/khach-hang-da-mua', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/help', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/careers', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: '/press', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: '/warranty', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/shipping', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/cookies', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/sitemap-html', changeFrequency: 'monthly' as const, priority: 0.4 },
    // auth pages removed - they have noindex and shouldn't be in sitemap
  ];

  // generate entries for each locale
  const staticPages: MetadataRoute.Sitemap = [];
  
  for (const { path, changeFrequency, priority } of staticPaths) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${path}`;
      staticPages.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: generateAlternates(path, baseUrl),
        },
      });
    }
  }

  // get dynamic product pages from database
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { products } = await getAllProducts({ 
      filters: { status: 'active' },
      limit: 500 
    });
    
    for (const product of products) {
      const productPath = `/products/${product.slug || product.id}`;
      for (const locale of locales) {
        const url = `${baseUrl}/${locale}${productPath}`;
        productPages.push({
          url,
          lastModified: new Date(product.updatedAt || product.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          alternates: {
            languages: generateAlternates(productPath, baseUrl),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // get dynamic category pages from database
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getAllCategories();
    
    for (const category of categories) {
      const categoryPath = `/products?category=${category.slug || category.id}`;
      for (const locale of locales) {
        const url = `${baseUrl}/${locale}${categoryPath}`;
        categoryPages.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
          alternates: {
            languages: generateAlternates(categoryPath, baseUrl),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // fetch published blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const { posts } = await getPublishedPosts({ limit: 100 });

    for (const post of posts) {
      if (isBlogSlugTakenDown(post.slug)) continue;
      const blogPath = `/blog/${post.slug}`;
      for (const locale of locales) {
        const url = `${baseUrl}/${locale}${blogPath}`;
        blogPages.push({
          url,
          lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
          alternates: {
            languages: generateAlternates(blogPath, baseUrl),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  return [...staticPages, ...productPages, ...categoryPages, ...blogPages];
} 