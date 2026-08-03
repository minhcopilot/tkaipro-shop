import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  varchar,
  json,
  integer,
} from "drizzle-orm/pg-core";

import { userTable } from "../users/tables";

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // thông tin bài viết
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"), // mô tả ngắn
  content: text("content").notNull(), // nội dung HTML/Markdown
  
  // phân loại
  category: varchar("category", { length: 100 }).notNull().default("General"),
  tags: json("tags").$type<string[]>().default([]), // mảng tags
  
  // hình ảnh
  featuredImage: text("featured_image"), // url hình ảnh nổi bật
  
  // tác giả
  authorId: text("author_id").references(() => userTable.id).notNull(),
  authorName: varchar("author_name", { length: 255 }), // tên tác giả (cached)
  
  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: json("meta_keywords").$type<string[]>().default([]),
  
  // trạng thái
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
  isFeatured: boolean("is_featured").default(false).notNull(), // bài viết nổi bật
  
  // ngôn ngữ
  locale: varchar("locale", { length: 10 }).notNull().default("vi"), // vi, en
  
  // thời gian
  publishedAt: timestamp("published_at", { withTimezone: true }), // thời gian publish
  readTime: integer("read_time"), // thời gian đọc (phút)
  
  // metadata
  viewCount: integer("view_count").default(0), // số lượt xem
  sortOrder: integer("sort_order").default(0), // thứ tự sắp xếp
  
  // timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

