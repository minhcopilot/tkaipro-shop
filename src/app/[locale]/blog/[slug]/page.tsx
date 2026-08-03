import type { Metadata } from "next";
import { Calendar, Clock, User, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { ArticleSchema, BreadcrumbSchema } from "~/ui/components/seo-schemas";
import { getBlogPostBySlug, getPublishedPosts } from "~/lib/queries/blogs";
import { formatBlogContent } from "~/lib/format-blog-content";
import { isBlogSlugTakenDown } from "~/lib/takedown";

const DEFAULT_BLOG_IMAGE = "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK";

const locales = ['vi', 'en', 'ru', 'zh', 'ar', 'es', 'fr', 'de', 'ja', 'ko', 'pt'] as const;

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const baseUrl = SEO_CONFIG.url;

  if (isBlogSlugTakenDown(slug)) {
    return {
      title: locale === "vi" ? "Bài viết không tìm thấy" : "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: locale === "vi" ? "Bài viết không tìm thấy" : "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${baseUrl}/${locale}/blog/${post.slug}`;
  
  // generate hreflang for all locales
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/blog/${post.slug}`;
  }
  languages['x-default'] = `${baseUrl}/vi/blog/${post.slug}`;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || "",
    keywords: Array.isArray(post.metaKeywords) ? post.metaKeywords.join(", ") : "",
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [],
      url: canonicalUrl,
      type: "article",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      siteName: SEO_CONFIG.name,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatReadTime(readTime: number | null | undefined): string {
  if (!readTime) return "5 phút đọc";
  return `${readTime} phút đọc`;
}

// unified post type
interface UnifiedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[] | null;
  featuredImage: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  readTime: number | null;
  status: string;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;

  if (isBlogSlugTakenDown(slug)) {
    notFound();
  }

  const dbPost = await getBlogPostBySlug(slug);

  if (!dbPost || dbPost.status !== "published") {
    notFound();
  }

  const post: UnifiedPost = {
    id: dbPost.id,
    title: dbPost.title,
    slug: dbPost.slug,
    excerpt: dbPost.excerpt,
    content: dbPost.content,
    category: dbPost.category,
    tags: dbPost.tags as string[] | null,
    featuredImage: dbPost.featuredImage,
    authorName: dbPost.authorName || dbPost.author?.name || null,
    publishedAt: dbPost.publishedAt,
    readTime: dbPost.readTime,
    status: dbPost.status,
  };

  // get related posts from same category
  const dbRelated = await getPublishedPosts({
    page: 1,
    limit: 4,
    filters: {
      category: post.category,
    },
  });

  const relatedPosts: UnifiedPost[] = dbRelated.posts
    .filter((p) => p.id !== post.id)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      tags: p.tags as string[] | null,
      featuredImage: p.featuredImage,
      authorName: p.authorName || p.author?.name || null,
      publishedAt: p.publishedAt,
      readTime: p.readTime,
      status: p.status,
    }));

  return (
    <>
      <ArticleSchema
        headline={post.title}
        description={post.excerpt || post.title}
        image={post.featuredImage || undefined}
        datePublished={post.publishedAt?.toISOString() || new Date().toISOString()}
        dateModified={post.publishedAt?.toISOString() || new Date().toISOString()}
        authorName={post.authorName || "Admin"}
        slug={post.slug}
        category={post.category}
        tags={post.tags || undefined}
      />
      <BreadcrumbSchema
        items={[
          { name: locale === "vi" ? "Trang Chủ" : "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
        locale={locale}
      />
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <section className="py-8 bg-background border-b">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại Blog
            </Button>
          </Link>
        </div>
      </section>

      {/* Article Header */}
      <article className="py-12 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Category & Date */}
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatReadTime(post.readTime)}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5" />
              <span className="font-medium">{post.authorName || "Admin"}</span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden bg-black">
            <Image
              src={post.featuredImage || DEFAULT_BLOG_IMAGE}
              alt={post.title}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:font-display prose-a:text-primary prose-table:text-sm"
            dangerouslySetInnerHTML={{ __html: formatBlogContent(post.content) }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12 pt-8 border-t">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-8">
              Bài Viết Liên Quan
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 w-full bg-black">
                    <Image
                      src={relatedPost.featuredImage || DEFAULT_BLOG_IMAGE}
                      alt={relatedPost.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">
                        {relatedPost.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(relatedPost.publishedAt)}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 leading-tight line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {relatedPost.excerpt || ""}
                    </p>
                    
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        Đọc Tiếp
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              Sẵn sàng mua tài khoản Google AI?
            </h2>
            <p className="text-muted-foreground mb-6">
              Áp dụng ngay những tips từ blog và bắt đầu thiết kế với Google AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg">
                  Mua Google AI ngay
                </Button>
              </Link>
              <Link href="/blog">
                <Button size="lg" variant="outline">
                  Xem Thêm Bài Viết
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
