"use client";

import { ArrowRight, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  featuredImage: string | null;
  publishedAt: Date | string | null;
  readTime: number | null;
}

interface HomepageBlogSectionProps {
  posts: BlogPost[];
  locale: string;
}

const DEFAULT_BLOG_IMAGE = "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNVihUAJKOrAUwIgQbELGM0XT4l3sRoeyzFkuK";

function formatDate(date: Date | string | null, locale: string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function HomepageBlogSection({ posts, locale }: HomepageBlogSectionProps) {
  if (!posts || posts.length === 0) return null;

  const isVi = locale === "vi";

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            {isVi ? "Bài Viết Hướng Dẫn" : "Helpful Guides"}
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          <p className="mt-4 max-w-2xl text-center text-muted-foreground md:text-lg">
            {isVi
              ? "Khám phá các bài viết hữu ích về Cursor AI Pro, hướng dẫn sử dụng và tips tối ưu coding"
              : "Explore helpful articles about Cursor AI Pro, usage guides and coding optimization tips"}
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {posts.slice(0, 4).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                {/* Image */}
                <div className="relative h-40 w-full bg-black overflow-hidden">
                  <Image
                    src={post.featuredImage || DEFAULT_BLOG_IMAGE}
                    alt={post.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt, locale)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime || 5} {isVi ? "phút" : "min"}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 flex justify-center">
          <Link href="/blog">
            <Button variant="outline" size="lg" className="group">
              {isVi ? "Xem tất cả bài viết" : "View all articles"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
