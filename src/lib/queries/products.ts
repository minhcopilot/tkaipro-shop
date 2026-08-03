import "server-only";
import { eq, ilike, or, desc, asc, and, gte, lte, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { 
  Product, 
  ProductInsert, 
  ProductUpdate, 
  ProductWithCategory,
  ProductCategory,
  ProductCategoryInsert,
  ProductListOptions,
  ProductFilters
} from "~/db/schema/products/types";

import { db } from "~/db";
import { productTable, productCategoryTable } from "~/db/schema";
import type { OrderItem } from "~/db/schema/orders/tables";
import {
  decryptAccountCredential,
  encryptAccountCredential,
  normalizeAccountPoolEmail,
} from "~/lib/security/crypto";
import { notifyRestockSubscribers } from "~/lib/queries/restock-alerts";

// SECURITY: kho `accountCredentials` (email / license key) duoc ma hoa at-rest.
// Account pool chi luu email — Cursor password o manager vault. Ma hoa khi GHI,
// giai ma khi DOC qua cac query trung tam ben duoi.
function encryptProductCredsInPlace<
  T extends { accountCredentials?: unknown; productType?: string | null },
>(data: T): T {
  if (Array.isArray(data?.accountCredentials)) {
    const productType = data.productType || "account";
    data.accountCredentials = (data.accountCredentials as string[]).map((c) => {
      if (typeof c !== "string") return c;
      if (productType === "account") {
        const email = normalizeAccountPoolEmail(c);
        return email ? encryptAccountCredential(email) : c;
      }
      return encryptAccountCredential(c);
    }) as unknown as T["accountCredentials"];
  }
  return data;
}

function decryptProductCreds<
  T extends { accountCredentials?: unknown; productType?: string | null } | null,
>(product: T): T {
  if (product && Array.isArray((product as any).accountCredentials)) {
    const productType = (product as any).productType || "account";
    (product as any).accountCredentials = (
      (product as any).accountCredentials as string[]
    ).map((c) => {
      if (typeof c !== "string") return c;
      const plain = decryptAccountCredential(c);
      if (productType === "account") {
        return normalizeAccountPoolEmail(plain) || plain;
      }
      return plain;
    });
  }
  return product;
}

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

// PRODUCT QUERIES

/**
 * lấy tất cả products với filter và pagination
 */
export async function getAllProducts(options: ProductListOptions & { includeDeleted?: boolean; includeHidden?: boolean } = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    filters = {},
    includeDeleted = false, // mặc định ẩn sản phẩm đã xóa
    includeHidden = false // mặc định ẩn sản phẩm hidden (linked upgrade option)
  } = options;

  const offset = (page - 1) * limit;

  // build where conditions
  const whereConditions = [];

  // mặc định loại bỏ sản phẩm đã xóa (status = "deleted")
  if (!includeDeleted) {
    whereConditions.push(sql`${productTable.status} != 'deleted'`);
  }

  // mặc định ẩn sản phẩm chỉ dùng làm option nâng cấp (linked upgrade product)
  if (!includeHidden) {
    whereConditions.push(sql`${productTable.hiddenFromListing} IS NOT TRUE`);
  }
  
  if (filters.search) {
    whereConditions.push(
      or(
        ilike(productTable.name, `%${filters.search}%`),
        ilike(productTable.description, `%${filters.search}%`),
        ilike(productTable.category, `%${filters.search}%`)
      )
    );
  }

  if (filters.category) {
    whereConditions.push(eq(productTable.category, filters.category));
  }

  // hỗ trợ filter theo nhiều categories (parent + children)
  if (filters.categoryIds && Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) {
    const categoryConditions = filters.categoryIds.map((id: string) => eq(productTable.category, id));
    whereConditions.push(or(...categoryConditions));
  }

  if (filters.status) {
    whereConditions.push(eq(productTable.status, filters.status));
  }

  if (filters.inStock !== undefined) {
    whereConditions.push(eq(productTable.inStock, filters.inStock));
  }

  if (filters.isPopular !== undefined) {
    whereConditions.push(eq(productTable.isPopular, filters.isPopular));
  }

  if (filters.isFeatured !== undefined) {
    whereConditions.push(eq(productTable.isFeatured, filters.isFeatured));
  }

  if (filters.priceMin) {
    whereConditions.push(gte(productTable.price, filters.priceMin));
  }

  if (filters.priceMax) {
    whereConditions.push(lte(productTable.price, filters.priceMax));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // determine sort order
  const orderBy = sortOrder === "asc" ? asc : desc;
  let sortColumn;
  switch (sortBy) {
    case "name":
      sortColumn = productTable.name;
      break;
    case "price":
      sortColumn = productTable.price;
      break;
    case "rating":
      sortColumn = productTable.rating;
      break;
    case "sortOrder":
      sortColumn = productTable.sortOrder;
      break;
    default:
      sortColumn = productTable.createdAt;
  }

  // get products with pagination
  const products = await db.query.productTable.findMany({
    where: whereClause,
    orderBy: [orderBy(sortColumn)],
    limit,
    offset,
    with: {
      categoryInfo: true,
    },
  });

  // get total count
  const totalResult = await db
    .select({ count: count() })
    .from(productTable)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    products: (products as ProductWithCategory[]).map((p) =>
      decryptProductCreds(p),
    ),
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * lấy product theo ID (mặc định ẩn sản phẩm đã xóa)
 */
export async function getProductById(id: string, includeDeleted = false): Promise<ProductWithCategory | null> {
  try {
    const product = await db.query.productTable.findFirst({
      where: includeDeleted 
        ? eq(productTable.id, id)
        : and(eq(productTable.id, id), sql`${productTable.status} != 'deleted'`),
      with: {
        categoryInfo: true,
      },
    });
    
    return decryptProductCreds((product as ProductWithCategory) || null);
  } catch (error) {
    console.error("Failed to fetch product by ID:", error);
    return null;
  }
}

/**
 * lấy product theo slug (mặc định ẩn sản phẩm đã xóa)
 */
export async function getProductBySlug(slug: string, includeDeleted = false): Promise<ProductWithCategory | null> {
  try {
    const product = await db.query.productTable.findFirst({
      where: includeDeleted
        ? eq(productTable.slug, slug)
        : and(eq(productTable.slug, slug), sql`${productTable.status} != 'deleted'`),
      with: {
        categoryInfo: true,
      },
    });
    
    return decryptProductCreds((product as ProductWithCategory) || null);
  } catch (error) {
    console.error("Failed to fetch product by slug:", error);
    return null;
  }
}

/**
 * tạo product mới
 */
export async function createProduct(data: Omit<ProductInsert, "id" | "slug" | "createdAt" | "updatedAt">): Promise<Product | null> {
  try {
    const id = nanoid();
    const slug = createSlug(data.name);

    // SECURITY: ma hoa pool credential truoc khi luu.
    const secured = encryptProductCredsInPlace({ ...data });

    const result = await db
      .insert(productTable)
      .values({
        ...secured,
        id,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] ? decryptProductCreds(result[0]) : null;
  } catch (error) {
    console.error("Failed to create product:", error);
    return null;
  }
}

/**
 * cập nhật product
 */
export async function updateProduct(id: string, data: ProductUpdate): Promise<Product | null> {
  try {
    const prev = await getProductById(id, true);

    // if name is being updated, update slug too
    const updateData: ProductUpdate = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.name) {
      updateData.slug = createSlug(data.name);
    }

    // SECURITY: ma hoa pool credential truoc khi luu (neu co trong payload).
    // Khi update chi gui accountCredentials (khong gui productType), lay type tu prev.
    if (Array.isArray((updateData as { accountCredentials?: unknown }).accountCredentials)) {
      const productType =
        (updateData as { productType?: string }).productType ||
        prev?.productType ||
        "account";
      const secured = encryptProductCredsInPlace({
        accountCredentials: (
          updateData as { accountCredentials: unknown[] }
        ).accountCredentials,
        productType,
      });
      (updateData as { accountCredentials?: unknown }).accountCredentials =
        secured.accountCredentials;
    }

    const result = await db
      .update(productTable)
      .set(updateData)
      .where(eq(productTable.id, id))
      .returning();

    const updated = result[0] ? decryptProductCreds(result[0]) : null;

    if (
      prev &&
      updated &&
      !prev.inStock &&
      updated.inStock &&
      updated.status === "active"
    ) {
      void notifyRestockSubscribers(id).catch(console.error);
    }

    return updated;
  } catch (error) {
    console.error("Failed to update product:", error);
    return null;
  }
}

export type DeleteProductResult = 
  | { success: true }
  | { success: false; error: string; code: "NOT_FOUND" | "UNKNOWN" };

/**
 * soft delete product - đánh dấu status = "deleted" thay vì xóa thật
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  try {
    const result = await db
      .update(productTable)
      .set({
        status: "deleted",
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, id))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        error: "Không tìm thấy sản phẩm",
        code: "NOT_FOUND"
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return {
      success: false,
      error: "Lỗi khi xóa sản phẩm",
      code: "UNKNOWN"
    };
  }
}

/**
 * hard delete product - xóa thật sự (chỉ dùng khi cần thiết)
 */
export async function hardDeleteProduct(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(productTable)
      .where(eq(productTable.id, id))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Failed to hard delete product:", error);
    return false;
  }
}

/**
 * cập nhật trạng thái product (active/inactive/draft)
 */
export async function updateProductStatus(id: string, status: string): Promise<Product | null> {
  try {
    const result = await db
      .update(productTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, id))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to update product status:", error);
    return null;
  }
}

// CATEGORY QUERIES

/**
 * lấy tất cả categories
 * @param includeInactive - nếu true, trả về cả danh mục không hoạt động (dùng cho admin)
 */
export async function getAllCategories(includeInactive = false): Promise<ProductCategory[]> {
  try {
    return await db.query.productCategoryTable.findMany({
      where: includeInactive ? undefined : eq(productCategoryTable.isActive, true),
      orderBy: [asc(productCategoryTable.sortOrder), asc(productCategoryTable.name)],
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

/**
 * tạo category mới
 */
export async function createCategory(data: Omit<ProductCategoryInsert, "id" | "slug" | "createdAt" | "updatedAt">): Promise<ProductCategory | null> {
  try {
    const id = nanoid();
    const slug = createSlug(data.name);
    
    const result = await db
      .insert(productCategoryTable)
      .values({
        ...data,
        id,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to create category:", error);
    return null;
  }
}

/**
 * cập nhật category
 */
export async function updateCategory(id: string, data: Partial<ProductCategoryInsert>): Promise<ProductCategory | null> {
  try {
    const updateData: Partial<ProductCategoryInsert> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.name) {
      updateData.slug = createSlug(data.name);
    }

    const result = await db
      .update(productCategoryTable)
      .set(updateData)
      .where(eq(productCategoryTable.id, id))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to update category:", error);
    return null;
  }
}

/**
 * xóa category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(productCategoryTable)
      .where(eq(productCategoryTable.id, id))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Failed to delete category:", error);
    return false;
  }
}

// SALES COUNTER

/**
 * Tăng salesCount cho từng product trong order items.
 * Gộp quantity theo productId trước khi update để giảm số round-trip.
 * Bỏ qua item không có id hoặc quantity <= 0.
 */
export async function incrementProductSales(items: OrderItem[] | unknown): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const totals = new Map<string, number>();
  for (const it of items as OrderItem[]) {
    if (!it?.id) continue;
    const q = Number(it.quantity) || 0;
    if (q <= 0) continue;
    totals.set(it.id, (totals.get(it.id) ?? 0) + q);
  }

  if (totals.size === 0) return;

  await Promise.all(
    Array.from(totals.entries()).map(([id, qty]) =>
      db
        .update(productTable)
        .set({ salesCount: sql`${productTable.salesCount} + ${qty}` })
        .where(eq(productTable.id, id))
    )
  );
}
