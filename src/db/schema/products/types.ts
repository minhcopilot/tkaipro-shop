import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { productTable, productCategoryTable } from "./tables";

// Product types
export type Product = InferSelectModel<typeof productTable>;
export type ProductInsert = InferInsertModel<typeof productTable>;
export type ProductUpdate = Partial<ProductInsert>;

// Product Category types
export type ProductCategory = InferSelectModel<typeof productCategoryTable>;
export type ProductCategoryInsert = InferInsertModel<typeof productCategoryTable>;
export type ProductCategoryUpdate = Partial<ProductCategoryInsert>;

// Extended types for frontend
export interface ProductWithCategory extends Product {
  categoryInfo?: ProductCategory;
}

export interface ProductFormData {
  name: string;
  category: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  inStock: boolean;
  stockQuantity?: number;
  isPopular?: boolean;
  isFeatured?: boolean;
  features?: string[];
  specs?: Record<string, string>;
  tags?: string[];
  status?: string;
  accountCredentials?: string[]; // username|password format
}

// Filter và search types
export interface ProductFilters {
  category?: string;
  categoryIds?: string[]; // filter theo nhiều categories
  status?: string;
  inStock?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  search?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface ProductListOptions {
  page?: number;
  limit?: number;
  sortBy?: "name" | "price" | "createdAt" | "rating" | "sortOrder";
  sortOrder?: "asc" | "desc";
  filters?: ProductFilters;
} 