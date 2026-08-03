import { NextResponse } from "next/server";
import { db } from "~/db";
import { getAllProducts } from "~/lib/queries/products";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    console.log("🔍 Testing database connection...");
    
    // test original getAllProducts function
    console.log("Testing getAllProducts...");
    const result = await getAllProducts({
      page: 1,
      limit: 12,
      sortBy: "sortOrder",
      sortOrder: "asc",
      filters: { status: "active" },
    });
    
    console.log("✅ getAllProducts result:", {
      productCount: result.products.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        productCount: result.products.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        products: result.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          status: p.status,
          categoryInfo: p.categoryInfo
        }))
      }
    });
    
  } catch (error) {
    console.error("❌ Database test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
} 