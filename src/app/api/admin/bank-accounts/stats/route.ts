import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { getBankAccountStats } from "~/lib/queries/bank-accounts";

/** GET /api/admin/bank-accounts/stats — aggregate theo TK */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getBankAccountStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching bank account stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank account stats" },
      { status: 500 },
    );
  }
}
