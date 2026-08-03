import "server-only";
import { eq, ilike, or, desc, asc, and, count, ne } from "drizzle-orm";

import type { BlogPost, NewBlogPost } from "~/db/schema/blogs/tables";

import { db } from "~/db";
import { blogPosts } from "~/db/schema";

// helper function to create slug
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 -]/g, "") // remove special chars
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // replace multiple hyphens with single
    .trim();
};

// helper function to calculate read time (rough estimate: 200 words per minute)
const calculateReadTime = (content: string): number => {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
};

export interface BlogListOptions {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "publishedAt" | "title" | "viewCount";
  sortOrder?: "asc" | "desc";
  locale?: string; // filter by locale (vi, en)
  filters?: {
    search?: string;
    category?: string;
    status?: string;
    isFeatured?: boolean;
  };
}

/**
 * lấy tất cả blog posts với filter và pagination
 */
export async function getAllBlogPosts(options: BlogListOptions = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    locale,
    filters = {}
  } = options;

  const offset = (page - 1) * limit;

  // build where conditions
  const whereConditions = [];
  
  // filter by locale if specified
  if (locale) {
    whereConditions.push(eq(blogPosts.locale, locale));
  }
  
  if (filters.search) {
    whereConditions.push(
      or(
        ilike(blogPosts.title, `%${filters.search}%`),
        ilike(blogPosts.excerpt, `%${filters.search}%`),
        ilike(blogPosts.content, `%${filters.search}%`)
      )
    );
  }

  if (filters.category) {
    whereConditions.push(eq(blogPosts.category, filters.category));
  }

  if (filters.status) {
    whereConditions.push(eq(blogPosts.status, filters.status));
  }

  if (filters.isFeatured !== undefined) {
    whereConditions.push(eq(blogPosts.isFeatured, filters.isFeatured));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // determine sort order
  const orderBy = sortOrder === "asc" ? asc : desc;
  let sortColumn;
  switch (sortBy) {
    case "title":
      sortColumn = blogPosts.title;
      break;
    case "publishedAt":
      sortColumn = blogPosts.publishedAt;
      break;
    case "viewCount":
      sortColumn = blogPosts.viewCount;
      break;
    default:
      sortColumn = blogPosts.createdAt;
  }

  // get posts with pagination
  const posts = await db.query.blogPosts.findMany({
    where: whereClause,
    orderBy: [orderBy(sortColumn)],
    limit,
    offset,
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  // get total count
  const totalResult = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    posts,
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * lấy blog post theo ID
 */
export async function getBlogPostById(id: string) {
  try {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    return post || null;
  } catch (error) {
    console.error("Failed to fetch blog post by ID:", error);
    return null;
  }
}

/**
 * lấy blog post theo slug
 */
export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    // increment view count
    if (post) {
      await db
        .update(blogPosts)
        .set({ viewCount: (post.viewCount || 0) + 1 })
        .where(eq(blogPosts.id, post.id));
    }
    
    return post || null;
  } catch (error) {
    console.error("Failed to fetch blog post by slug:", error);
    return null;
  }
}

/**
 * tạo blog post mới
 */
export async function createBlogPost(
  data: Omit<NewBlogPost, "id" | "createdAt" | "updatedAt" | "readTime" | "viewCount"> & { slug?: string }
): Promise<BlogPost | null> {
  try {
    const slug = data.slug || createSlug(data.title);
    const readTime = calculateReadTime(data.content);
    
    // check if slug already exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });
    
    let finalSlug = slug;
    if (existingPost) {
      // add timestamp to make it unique
      finalSlug = `${slug}-${Date.now()}`;
    }
    
    const result = await db
      .insert(blogPosts)
      .values({
        ...data,
        slug: finalSlug,
        readTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return null;
  }
}

/**
 * cập nhật blog post
 */
export async function updateBlogPost(
  id: string,
  data: Partial<Omit<NewBlogPost, "id" | "createdAt" | "readTime">>
): Promise<BlogPost | null> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // chỉ cập nhật các trường được cung cấp
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.slug !== undefined) {
      // kiểm tra xem slug có trùng với bài viết khác không (trừ bài viết hiện tại)
      const existingPost = await db
        .select()
        .from(blogPosts)
        .where(and(
          eq(blogPosts.slug, data.slug),
          ne(blogPosts.id, id)
        ))
        .limit(1);
      
      if (existingPost.length > 0) {
        // nếu slug trùng, thêm timestamp vào slug
        updateData.slug = `${data.slug}-${Date.now()}`;
      } else {
        updateData.slug = data.slug;
      }
    } else if (data.title) {
      // nếu có title nhưng không có slug, tự động tạo slug
      const newSlug = createSlug(data.title);
      // kiểm tra slug mới có trùng không
      const existingPost = await db
        .select()
        .from(blogPosts)
        .where(and(
          eq(blogPosts.slug, newSlug),
          ne(blogPosts.id, id)
        ))
        .limit(1);
      
      if (existingPost.length > 0) {
        updateData.slug = `${newSlug}-${Date.now()}`;
      } else {
        updateData.slug = newSlug;
      }
    }
    
    if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt;
    }
    if (data.content !== undefined) {
      updateData.content = data.content;
      // tính lại read time khi content thay đổi
      updateData.readTime = calculateReadTime(data.content);
    }
    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    }
    if (data.featuredImage !== undefined) {
      updateData.featuredImage = data.featuredImage;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.isFeatured !== undefined) {
      updateData.isFeatured = data.isFeatured;
    }
    if (data.metaTitle !== undefined) {
      updateData.metaTitle = data.metaTitle;
    }
    if (data.metaDescription !== undefined) {
      updateData.metaDescription = data.metaDescription;
    }
    if (data.metaKeywords !== undefined) {
      updateData.metaKeywords = Array.isArray(data.metaKeywords) ? data.metaKeywords : [];
    }
    if (data.publishedAt !== undefined) {
      // convert string ISO date to Date object nếu cần
      updateData.publishedAt = data.publishedAt instanceof Date 
        ? data.publishedAt 
        : data.publishedAt 
          ? new Date(data.publishedAt as any)
          : null;
    }
    if (data.viewCount !== undefined) {
      updateData.viewCount = data.viewCount;
    }
    if (data.sortOrder !== undefined) {
      updateData.sortOrder = data.sortOrder;
    }

    const result = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to update blog post:", error);
    console.error("Update data:", JSON.stringify(data, null, 2));
    console.error("Post ID:", id);
    return null;
  }
}

/**
 * xóa blog post
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return false;
  }
}

/**
 * lấy featured posts
 */
export async function getFeaturedPosts(limit = 3, locale?: string) {
  try {
    const whereConditions = [
      eq(blogPosts.isFeatured, true),
      eq(blogPosts.status, "published")
    ];
    
    if (locale) {
      whereConditions.push(eq(blogPosts.locale, locale));
    }
    
    return await db.query.blogPosts.findMany({
      where: and(...whereConditions),
      orderBy: [desc(blogPosts.publishedAt)],
      limit,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured posts:", error);
    return [];
  }
}

/**
 * lấy published posts (для публичной страницы)
 */
export async function getPublishedPosts(options: BlogListOptions = {}) {
  return getAllBlogPosts({
    ...options,
    filters: {
      ...options.filters,
      status: "published",
    },
  });
}

