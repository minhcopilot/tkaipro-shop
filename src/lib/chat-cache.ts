import "server-only";

import type { Product, ProductCategory } from "~/db/schema/products/types";

import { buildSystemPrompt, CHAT_SYSTEM_PROMPT_FALLBACK, type SupportedLocale } from "./chat-context";
import { getAllProducts, getAllCategories } from "./queries/products";

// cache TTL: 24 hours in milliseconds
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type ChatCache = {
  products: Product[];
  categories: ProductCategory[];
  lastUpdated: Date;
  expiresAt: Date;
};

// in-memory cache storage (stores only data, prompt is built per-request with locale)
let cache: ChatCache | null = null;

// check if cache is valid
function isCacheValid(): boolean {
  if (!cache) return false;
  return new Date() < cache.expiresAt;
}

// fetch fresh data from database
async function fetchProductData(): Promise<ChatCache> {
  const [productsResult, categories] = await Promise.all([
    getAllProducts({
      filters: { status: "active" },
      limit: 50,
      sortBy: "sortOrder",
      sortOrder: "asc",
    }),
    getAllCategories(),
  ]);

  const now = new Date();

  return {
    products: productsResult.products,
    categories,
    lastUpdated: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
  };
}

// ensure cache is populated
async function ensureCache(): Promise<ChatCache> {
  if (isCacheValid() && cache) {
    return cache;
  }

  try {
    cache = await fetchProductData();
    console.log("[ChatCache] Cache refreshed at:", cache.lastUpdated.toISOString());
    return cache;
  } catch (error) {
    console.error("[ChatCache] Failed to refresh cache:", error);
    if (cache) return cache;
    throw error;
  }
}

// get cached system prompt with locale support (auto-refresh if expired)
export async function getCachedSystemPrompt(locale: SupportedLocale = "vi"): Promise<string> {
  try {
    const data = await ensureCache();
    
    if (data.products.length > 0 || data.categories.length > 0) {
      return buildSystemPrompt(data.products, data.categories, locale);
    }
    
    return CHAT_SYSTEM_PROMPT_FALLBACK;
  } catch {
    return CHAT_SYSTEM_PROMPT_FALLBACK;
  }
}

// force refresh cache (for admin use)
export async function refreshChatCache(): Promise<{
  success: boolean;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  productCount: number;
  categoryCount: number;
  error?: string;
}> {
  try {
    cache = await fetchProductData();
    console.log("[ChatCache] Cache manually refreshed at:", cache.lastUpdated.toISOString());
    return {
      success: true,
      lastUpdated: cache.lastUpdated,
      expiresAt: cache.expiresAt,
      productCount: cache.products.length,
      categoryCount: cache.categories.length,
    };
  } catch (error) {
    console.error("[ChatCache] Failed to manually refresh cache:", error);
    return {
      success: false,
      lastUpdated: cache?.lastUpdated ?? null,
      expiresAt: cache?.expiresAt ?? null,
      productCount: cache?.products.length ?? 0,
      categoryCount: cache?.categories.length ?? 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// get cache status (for admin dashboard)
export function getCacheStatus(): {
  isCached: boolean;
  isValid: boolean;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  productCount: number;
  categoryCount: number;
  ttlMs: number;
} {
  return {
    isCached: cache !== null,
    isValid: isCacheValid(),
    lastUpdated: cache?.lastUpdated ?? null,
    expiresAt: cache?.expiresAt ?? null,
    productCount: cache?.products.length ?? 0,
    categoryCount: cache?.categories.length ?? 0,
    ttlMs: CACHE_TTL_MS,
  };
}

// clear cache (useful for testing or forced refresh)
export function clearChatCache(): void {
  cache = null;
  console.log("[ChatCache] Cache cleared");
}
