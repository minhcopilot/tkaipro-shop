import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";

import { db } from "~/db";
import { productTable } from "~/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Missing 'ids' query parameter" },
        { status: 400 },
      );
    }

    const ids = idsParam.split(",").filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ prices: {} });
    }

    if (ids.length > 50) {
      return NextResponse.json(
        { error: "Too many IDs (max 50)" },
        { status: 400 },
      );
    }

    const products = await db
      .select({ id: productTable.id, price: productTable.price })
      .from(productTable)
      .where(inArray(productTable.id, ids));

    const prices: Record<string, number> = {};
    for (const p of products) {
      prices[p.id] = p.price;
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Failed to fetch product prices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
