import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPublishedPosts } from "~/lib/queries/blogs";

// публичный endpoint для получения опубликованных постов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const sortBy = searchParams.get("sortBy") as any || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") as any || "desc";
    
    // filters
    const filters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      isFeatured: searchParams.get("isFeatured") ? searchParams.get("isFeatured") === "true" : undefined,
    };

    const result = await getPublishedPosts({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

