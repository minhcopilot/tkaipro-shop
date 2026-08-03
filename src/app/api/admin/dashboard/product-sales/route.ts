import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import {
  getProductSalesForRange,
  type ProductSalesRange,
} from "~/lib/queries/dashboard";

const VALID_RANGES: ProductSalesRange[] = ["today", "yesterday", "7d"];

/**
 * GET /api/admin/dashboard/product-sales?range=today|yesterday|7d
 *
 * Trả về list sản phẩm bán được trong range, sắp theo orderCount giảm dần.
 * Phục vụ widget "Chuẩn bị hàng cho hôm sau" trên Dashboard Tổng Quan.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") as ProductSalesRange | null;
    const range: ProductSalesRange = rangeParam && VALID_RANGES.includes(rangeParam)
      ? rangeParam
      : "today";

    const data = await getProductSalesForRange(range);

    return NextResponse.json({ range, data });
  } catch (error) {
    console.error("Error fetching product sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
