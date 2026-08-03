import { NextResponse } from "next/server";
import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { getUnrepliedReviewCount } from "~/lib/queries/reviews";

export async function GET() {
  try {
    const admin = await getCurrentAdminOrRedirect();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await getUnrepliedReviewCount();

    return NextResponse.json({ 
        unrepliedCount: count 
    });

  } catch (error) {
    console.error("Stats fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
