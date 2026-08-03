import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { 
  getRevenueReport, 
  getAvailableCategories,
  type ReportFilters 
} from "~/lib/queries/analytics";

export async function GET(request: NextRequest) {
  try {
    // check admin permission
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // parse filters
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const periodType = searchParams.get("periodType") as "day" | "week" | "month" | null;
    const category = searchParams.get("category") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const filters: ReportFilters = {
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      periodType: periodType || "day",
      category,
      productId,
      limit,
    };

    // get report data
    const [report, categories] = await Promise.all([
      getRevenueReport(filters),
      getAvailableCategories(),
    ]);

    return NextResponse.json({
      ...report,
      availableCategories: categories,
    });

  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

