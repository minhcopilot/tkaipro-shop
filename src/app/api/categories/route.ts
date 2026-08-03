import { and, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/db";
import { productTable } from "~/db/schema";
import { getAllCategories } from "~/lib/queries/products";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const categories = await getAllCategories();
    const activeCategories = categories.filter(cat => cat.isActive);

    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    let categoriesWithNew = new Set<string>();
    try {
      const newProductCategories = await db
        .select({ category: productTable.category })
        .from(productTable)
        .where(and(
          gte(productTable.createdAt, sevenDaysAgo),
          eq(productTable.status, "active")
        ))
        .groupBy(productTable.category);

      categoriesWithNew = new Set(newProductCategories.map(r => r.category));
    } catch {
      // non-critical — still return categories without the new badge
    }

    const transformedCategories = activeCategories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      hasNewProducts: categoriesWithNew.has(category.id),
    }));

    return NextResponse.json(transformedCategories);

  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 