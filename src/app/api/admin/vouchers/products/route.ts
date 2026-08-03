import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "~/db";
import { productTable } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

// GET danh sách product (status='active') để dropdown chọn sản phẩm khi
// admin tạo voucher (1 voucher = 1 CTV + 1 sản phẩm).
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        nameLocales: productTable.nameLocales,
        price: productTable.price,
        image: productTable.image,
        category: productTable.category,
      })
      .from(productTable)
      .where(eq(productTable.status, "active"))
      .orderBy(asc(productTable.name));

    return NextResponse.json({ products });
  } catch (err) {
    console.error("GET /api/admin/vouchers/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
