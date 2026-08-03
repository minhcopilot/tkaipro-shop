import type { Metadata } from "next";
import { Calendar, Clock, User, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { BreadcrumbSchema } from "~/ui/components/seo-schemas";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { getFeaturedPosts, getPublishedPosts } from "~/lib/queries/blogs";
import { isBlogSlugTakenDown } from "~/lib/takedown";

const DEFAULT_BLOG_IMAGE = "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK";

// revalidate every 60 seconds for new blog posts
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage.seo" });

  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/blog`;

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
        "vi": `${baseUrl}/vi/blog`,
        "en": `${baseUrl}/en/blog`,
        "ru": `${baseUrl}/ru/blog`,
        "zh": `${baseUrl}/zh/blog`,
        "ar": `${baseUrl}/ar/blog`,
        "es": `${baseUrl}/es/blog`,
        "fr": `${baseUrl}/fr/blog`,
        "de": `${baseUrl}/de/blog`,
        "ja": `${baseUrl}/ja/blog`,
        "ko": `${baseUrl}/ko/blog`,
        "pt": `${baseUrl}/pt/blog`,
        "x-default": `${baseUrl}/vi/blog`,
      },
    },
  };
}

// unified post type for rendering
interface UnifiedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[] | null;
  featuredImage: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  readTime: number | null;
}

function formatDate(date: Date | null | undefined, locale: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(locale === 'vi' ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatReadTime(readTime: number | null | undefined, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const time = readTime || 5;
  return t("featured.readTime", { minutes: time });
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category: selectedCategory, page: pageParam } = await searchParams;
  const t = await getTranslations("BlogPage");
  const currentPage = pageParam ? Number.parseInt(pageParam, 10) : 1;

  // fetch all posts first to get category counts (without category filter, but with locale)
  const allPostsForCounts = await getPublishedPosts({ page: 1, limit: 100, locale });

  // calculate category counts from all posts (excluding taken-down slugs)
  const categoryCounts: Record<string, number> = {};
  allPostsForCounts.posts.forEach((post) => {
    if (isBlogSlugTakenDown(post.slug)) return;
    categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
  });

  // fetch posts with category filter if selected (and locale filter)
  const [dbFeaturedPosts, dbPostsResult] = await Promise.all([
    getFeaturedPosts(1, locale),
    getPublishedPosts({
      page: currentPage,
      limit: 12,
      locale,
      filters: selectedCategory ? { category: selectedCategory } : undefined,
    }),
  ]);

  // convert db posts to unified format
  // only show featured post if no category filter or featured post matches filter,
  // and the featured post isn't on the takedown list
  const featuredDbPost = dbFeaturedPosts.find((p) => !isBlogSlugTakenDown(p.slug));
  const showFeaturedPost = featuredDbPost && (!selectedCategory || featuredDbPost.category === selectedCategory);
  
  const featuredPost: UnifiedPost | undefined = showFeaturedPost ? {
    id: featuredDbPost.id,
    title: featuredDbPost.title,
    slug: featuredDbPost.slug,
    excerpt: featuredDbPost.excerpt,
    category: featuredDbPost.category,
    tags: featuredDbPost.tags as string[] | null,
    featuredImage: featuredDbPost.featuredImage,
    authorName: featuredDbPost.authorName || featuredDbPost.author?.name || null,
    publishedAt: featuredDbPost.publishedAt,
    readTime: featuredDbPost.readTime,
  } : undefined;

  const allPosts: UnifiedPost[] = dbPostsResult.posts
    .filter((p) => p.id !== featuredPost?.id && !isBlogSlugTakenDown(p.slug))
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      category: p.category,
      tags: p.tags as string[] | null,
      featuredImage: p.featuredImage,
      authorName: p.authorName || p.author?.name || null,
      publishedAt: p.publishedAt,
      readTime: p.readTime,
    }));

  const allLabel = t("categories.all");
  const categories = [
    { name: allLabel, slug: null, count: allPostsForCounts.total },
    ...Object.entries(categoryCounts).map(([name, count]) => ({ name, slug: name, count })),
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: locale === "vi" ? "Trang Chủ" : "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
        locale={locale}
      />
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="mb-6 font-display text-4xl font-black tracking-tight md:text-5xl">
              {t("hero.title")}{" "}
              <span className="text-foreground">
                {t("hero.highlight")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t("hero.description")}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => {
              const isActive = category.slug === null 
                ? !selectedCategory 
                : selectedCategory === category.slug;
              const href = category.slug === null 
                ? "/blog" 
                : `/blog?category=${encodeURIComponent(category.slug)}`;
              
              return (
                <Link key={category.slug ?? "all"} href={href}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                  >
                    {category.name} ({category.count})
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16 bg-background">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="font-display text-3xl font-bold tracking-tight mb-8">
                {t("featured.title")}
              </h2>
              
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-8 lg:p-12 flex items-center">
                    <div className="relative w-full h-64 lg:h-full min-h-[200px] rounded-lg overflow-hidden bg-black">
                      <Image
                        src={featuredPost.featuredImage || DEFAULT_BLOG_IMAGE}
                        alt={featuredPost.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="p-8 lg:p-12">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
                        {featuredPost.category}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featuredPost.publishedAt, locale)}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 leading-tight">
                      {featuredPost.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {featuredPost.excerpt || ""}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {featuredPost.authorName || t("featured.author")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatReadTime(featuredPost.readTime, t)}
                        </div>
                      </div>
                      
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <Button className="group">
                          {t("featured.readMore")}
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              {selectedCategory ? selectedCategory : t("posts.title")}
            </h2>
            {selectedCategory && (
              <p className="text-muted-foreground">
                {locale === "vi" 
                  ? `Hiển thị ${dbPostsResult.total} bài viết trong danh mục "${selectedCategory}"`
                  : `Showing ${dbPostsResult.total} posts in "${selectedCategory}"`}
              </p>
            )}
          </div>

          {allPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 w-full bg-black">
                    <Image
                      src={post.featuredImage || DEFAULT_BLOG_IMAGE}
                      alt={post.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt, locale)}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 leading-tight line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {post.excerpt || ""}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.authorName || t("featured.author")}</span>
                        <span>•</span>
                        <span>{formatReadTime(post.readTime, t)}</span>
                      </div>
                      
                      <Link href={`/blog/${post.slug}`}>
                        <Button size="sm" variant="outline">
                          {t("posts.readMore")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("posts.empty")}</p>
            </div>
          )}

          {/* Pagination */}
          {dbPostsResult.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {dbPostsResult.hasPrevPage && (
                <Link 
                  href={`/blog?${selectedCategory ? `category=${encodeURIComponent(selectedCategory)}&` : ""}page=${currentPage - 1}`}
                >
                  <Button variant="outline">
                    {locale === "vi" ? "← Trước" : "← Previous"}
                  </Button>
                </Link>
              )}
              
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {locale === "vi" 
                  ? `Trang ${currentPage} / ${dbPostsResult.totalPages}`
                  : `Page ${currentPage} of ${dbPostsResult.totalPages}`}
              </span>
              
              {dbPostsResult.hasNextPage && (
                <Link 
                  href={`/blog?${selectedCategory ? `category=${encodeURIComponent(selectedCategory)}&` : ""}page=${currentPage + 1}`}
                >
                  <Button variant="outline">
                    {locale === "vi" ? "Sau →" : "Next →"}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-4">
                {t("newsletter.title")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("newsletter.description")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={t("newsletter.placeholder")}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
                <Button size="lg" className="px-8">
                  {t("newsletter.button")}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                {t("newsletter.privacy")}
              </p>
            </div>
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
                  {t("cta.buyNow")}
                </Button>
              </Link>
              <Link href="/help">
                <Button size="lg" variant="outline">
                  {t("cta.guide")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
