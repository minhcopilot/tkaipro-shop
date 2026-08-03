"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { ArrowDownUp, Loader2, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { getLocalizedProduct, localizeCategory } from "~/lib/product-localization";
import { Breadcrumbs } from "~/ui/components/breadcrumbs";
import { CustomRequestBanner } from "~/ui/components/custom-request-banner";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/ui/primitives/select";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Slider } from "~/ui/primitives/slider";

const HIGHLIGHTED_SLUGS = new Set(["cursor-pro", "claude-ai-chinh-hang", "antigravity-pro"]);

const PRICE_MAX_LIMIT = 2_000_000;
const PRICE_STEP = 50_000;

interface SortOption {
  value: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS: SortOption[] = [
  { value: "default", sortBy: "sortOrder", sortOrder: "asc" },
  { value: "priceLowToHigh", sortBy: "price", sortOrder: "asc" },
  { value: "priceHighToLow", sortBy: "price", sortOrder: "desc" },
  { value: "newest", sortBy: "createdAt", sortOrder: "desc" },
  { value: "topRated", sortBy: "rating", sortOrder: "desc" },
];

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  hasNewProducts?: boolean;
}

interface Product {
  category: string;
  categoryName?: string;
  id: string;
  image: string;
  inStock: boolean;
  name: string;
  originalPrice?: number;
  price: number;
  rating: number;
  isPopular?: boolean;
  slug?: string;
  productType?: "account" | "license" | "upgrade" | "login_link";
  upgradeEmailOnly?: boolean;
  purchaseCount?: number;
}

interface ProductsApiResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function ProductsClient() {
  const { addItem } = useCart();
  const t = useTranslations("ProductsPage");
  const locale = useLocale();
  
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sortValue, setSortValue] = React.useState("default");
  const [tempPriceRange, setTempPriceRange] = React.useState<[number, number]>([0, PRICE_MAX_LIMIT]);
  const [appliedPriceRange, setAppliedPriceRange] = React.useState<[number, number] | null>(null);
  const [showPriceFilter, setShowPriceFilter] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = React.useCallback(async (
    page = 1,
    categorySlug = "",
    search = "",
    sort = "default",
    priceRange: [number, number] | null = null,
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      
      if (categorySlug) params.set("category", categorySlug);
      if (search) params.set("search", search);

      const sortOption = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0];
      if (sortOption.value !== "default") {
        params.set("sortBy", sortOption.sortBy);
        params.set("sortOrder", sortOption.sortOrder);
      }

      if (priceRange) {
        if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
        if (priceRange[1] < PRICE_MAX_LIMIT) params.set("priceMax", priceRange[1].toString());
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json() as ProductsApiResponse;
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const categoriesData = await response.json() as Category[];
        // localize category names
        const localizedCategories = categoriesData.map(cat => localizeCategory(cat, locale));
        const allCategory: Category = {
          id: "all",
          name: t("allCategories"),
          slug: "",
          sortOrder: -1
        };
        setCategories([allCategory, ...localizedCategories]);
        setSelectedCategory(allCategory);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [t, locale]);

  React.useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  React.useEffect(() => {
    if (selectedCategory) {
      setCurrentPage(1);
      fetchProducts(1, selectedCategory.slug, debouncedSearch, sortValue, appliedPriceRange);
    }
  }, [selectedCategory, fetchProducts, debouncedSearch, sortValue, appliedPriceRange]);

  const handleAddToCart = React.useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addItem(
          {
            category: product.category,
            id: product.id,
            image: product.image,
            name: product.name,
            price: product.price,
            productType: product.productType,
            upgradeEmailOnly: product.upgradeEmailOnly,
          },
          1,
        );
        toast.success(t("toast.added", { name: product.name }));
      }
    },
    [addItem, products, t],
  );

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
    fetchProducts(page, selectedCategory?.slug || "", debouncedSearch, sortValue, appliedPriceRange);
  }, [selectedCategory, fetchProducts, debouncedSearch, sortValue, appliedPriceRange]);

  const handleAddToWishlist = React.useCallback((productId: string) => {
    console.log(`Added ${productId} to wishlist`);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            md:px-6
          `}
        >
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: t("breadcrumbs.home"), href: "/" },
                { name: t("breadcrumbs.products"), href: "/products" }
              ]}
            />
          </div>
          
          <div
            className={`
              mb-8 flex flex-col gap-6 text-center
              md:text-left
            `}
          >
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-black tracking-tight">{t("title")}</h1>
              <p className="text-lg font-medium text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>

            {/* Banner: tài khoản KHÁC ngoài danh sách trên website */}
            <CustomRequestBanner />

            <div className={cn(
              "flex flex-col gap-3",
              "md:flex-row md:items-center"
            )}>
              <div className="group relative flex-1 md:max-w-lg">
                <div className="relative flex items-center overflow-hidden rounded-md border-2 border-border bg-background shadow-hard">
                  <div className="flex shrink-0 items-center justify-center pl-4">
                    {isLoading && searchQuery ? (
                      <Loader2 className="size-[18px] animate-spin text-foreground" />
                    ) : (
                      <Search className={cn(
                        "size-[18px] transition-colors duration-200",
                        searchQuery ? "text-foreground" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  <input
                    className={cn(
                      "h-11 w-full bg-transparent px-3 text-sm outline-none",
                      "placeholder:text-muted-foreground",
                      "md:h-12 md:text-base"
                    )}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("search.placeholder")}
                    type="text"
                    value={searchQuery}
                  />
                  {searchQuery && (
                    <button
                      className="mr-2 flex shrink-0 items-center justify-center rounded-md border-2 border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortValue} onValueChange={setSortValue}>
                  <SelectTrigger className="h-11 w-full gap-2 rounded-xl md:h-12 md:w-[220px]">
                    <ArrowDownUp className="size-4 shrink-0 text-muted-foreground" />
                    <SelectValue>
                      {t(`sort.${sortValue}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`sort.${option.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showPriceFilter ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "size-11 shrink-0 rounded-xl md:size-12",
                    appliedPriceRange && "ring-2 ring-primary/30"
                  )}
                  onClick={() => setShowPriceFilter(prev => !prev)}
                  title={t("priceFilter.label")}
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            {showPriceFilter && (
              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {t("priceFilter.label")}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatVND(tempPriceRange[0])} — {formatVND(tempPriceRange[1])}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={PRICE_MAX_LIMIT}
                  step={PRICE_STEP}
                  value={tempPriceRange}
                  onValueChange={(val) => setTempPriceRange(val as [number, number])}
                  className="py-2"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setAppliedPriceRange(tempPriceRange);
                    }}
                    className="rounded-lg"
                  >
                    {t("priceFilter.apply")}
                  </Button>
                  {appliedPriceRange && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTempPriceRange([0, PRICE_MAX_LIMIT]);
                        setAppliedPriceRange(null);
                      }}
                      className="rounded-lg"
                    >
                      {t("priceFilter.clear")}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {categories.map((category) => {
                const isHighlighted = HIGHLIGHTED_SLUGS.has(category.slug);
                const isSelected = category.id === selectedCategory?.id;

                if (isHighlighted) {
                  return (
                    <div key={category.id} className="relative">
                      <div className={cn(
                        "absolute -inset-[2px] rounded-full bg-gradient-to-r from-violet-500 via-primary to-cyan-400 blur-[2px] transition-opacity",
                        isSelected ? "opacity-100" : "opacity-60"
                      )} />
                      <Button
                        aria-pressed={isSelected}
                        className={cn(
                          "relative rounded-full font-semibold",
                          isSelected
                            ? "bg-gradient-to-r from-violet-600 to-primary text-white  border-0 hover:from-violet-500 hover:to-primary/90"
                            : "bg-background hover:bg-gradient-to-r hover:from-violet-600 hover:to-primary hover:text-white hover:border-0"
                        )}
                        onClick={() => setSelectedCategory(category)}
                        size="sm"
                        title={t("filterTitle", { name: category.name })}
                        variant={isSelected ? "default" : "outline"}
                      >
                        <Sparkles className="size-3.5" />
                        {category.name}
                      </Button>
                      {category.hasNewProducts && (
                        <span className="absolute -right-1.5 -top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white ring-2 ring-background">
                          {t("newBadge")}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={category.id} className="relative">
                    <Button
                      aria-pressed={isSelected}
                      className="rounded-full"
                      onClick={() => setSelectedCategory(category)}
                      size="sm"
                      title={t("filterTitle", { name: category.name })}
                      variant={isSelected ? "default" : "outline"}
                    >
                      {category.name}
                    </Button>
                    {category.hasNewProducts && (
                      <span className="absolute -right-1.5 -top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white ring-2 ring-background">
                        {t("newBadge")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`
              mx-auto grid grid-cols-1 gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              2xl:max-w-6xl
            `}
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  product={getLocalizedProduct(product, locale)}
                />
              ))
            )}
          </div>

          {!isLoading && products.length === 0 && (
            <div className="mt-12 text-center">
              <div className="mx-auto max-w-md space-y-3">
                <p className="text-lg font-medium text-muted-foreground">
                  {searchQuery
                    ? t("search.noResults", { query: searchQuery })
                    : t("emptyState.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? t("search.noResultsHint")
                    : selectedCategory?.id !== "all" 
                      ? t("emptyState.categoryEmpty", { category: selectedCategory?.name || "" })
                      : t("emptyState.genericEmpty")}
                </p>
              </div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-16 flex items-center justify-center gap-2"
            >
              <Button
                disabled={!pagination.hasPrev || isLoading}
                onClick={() => handlePageChange(currentPage - 1)}
                variant="outline"
              >
                {t("pagination.prev")}
              </Button>
              
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                    onClick={() => handlePageChange(pageNum)}
                    variant={pageNum === currentPage ? "default" : "outline"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                disabled={!pagination.hasNext || isLoading}
                onClick={() => handlePageChange(currentPage + 1)}
                variant="outline"
              >
                {t("pagination.next")}
              </Button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}

