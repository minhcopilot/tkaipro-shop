import { NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { getSubscriptionStats } from "~/lib/queries/subscriptions";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const stats = await getSubscriptionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get subscription stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 