import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { getTopSpenders } from "~/lib/queries/analytics";

/**
 * GET /api/admin/stats/top-spenders
 * Query: productId? (optional), limit? (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;

    const spenders = await getTopSpenders({
      productId,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json({ spenders });
  } catch (error) {
    console.error("Error fetching top spenders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
