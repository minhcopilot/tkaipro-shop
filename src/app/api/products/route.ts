import { NextResponse } from "next/server";
import { getAllProducts, getAllCategories } from "~/lib/queries/products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const categorySlug = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const featured = searchParams.get("featured") === "true";
    const popular = searchParams.get("popular") === "true";
    const status = "active";

    const VALID_SORT_BY = ["price", "createdAt", "rating", "sortOrder"] as const;
    type SortByValue = (typeof VALID_SORT_BY)[number];
    const rawSortBy = searchParams.get("sortBy");
    const sortBy: SortByValue = rawSortBy && VALID_SORT_BY.includes(rawSortBy as SortByValue)
      ? (rawSortBy as SortByValue)
      : "sortOrder";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc" as const;

    const rawPriceMin = searchParams.get("priceMin");
    const rawPriceMax = searchParams.get("priceMax");
    const priceMin = rawPriceMin ? parseInt(rawPriceMin) : undefined;
    const priceMax = rawPriceMax ? parseInt(rawPriceMax) : undefined;
    
    // nếu có category slug, lấy category ID (và child categories nếu là parent)
    let categoryIds: string[] = [];
    if (categorySlug) {
      const { getAllCategories } = await import("~/lib/queries/products");
      const categories = await getAllCategories();
      const category = categories.find(c => c.slug === categorySlug);
      
      if (category) {
        // thêm category ID
        categoryIds.push(category.id);
        
        // nếu là parent category, thêm tất cả child categories
        const childCategories = categories.filter(c => c.parentId === category.id);
        categoryIds.push(...childCategories.map(c => c.id));
      }
    }
    
    // build filters
    const filters: any = { status };
    if (categoryIds.length > 0) {
      filters.categoryIds = categoryIds; // pass mảng IDs
    }
    if (search) filters.search = search;
    if (featured) filters.isFeatured = true;
    if (popular) filters.isPopular = true;
    if (priceMin !== undefined && !isNaN(priceMin)) filters.priceMin = priceMin;
    if (priceMax !== undefined && !isNaN(priceMax)) filters.priceMax = priceMax;
    
    const result = await getAllProducts({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
    
    // transform data cho frontend
    const transformedProducts = result.products.map(product => {
      const categoryInfo = (product as any).categoryInfo;
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category, // ID
        categoryName: categoryInfo?.name || "Unknown", // tên danh mục
        categorySlug: categoryInfo?.slug || "",
        productType: (product as any).productType || "account", // account hoặc license
        upgradeEmailOnly: (product as any).upgradeEmailOnly ?? false,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        images: product.images,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        isPopular: product.isPopular,
        isFeatured: product.isFeatured,
        rating: product.rating,
        reviewCount: product.reviewCount,
        purchaseCount: (product as any).salesCount ?? 0,
        features: product.features,
        specs: product.specs,
        tags: product.tags,
        nameLocales: product.nameLocales,
        descriptionLocales: product.descriptionLocales,
        shortDescriptionLocales: product.shortDescriptionLocales,
        featuresLocales: product.featuresLocales,
      };
    });

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page: result.page,
        limit: limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      }
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 