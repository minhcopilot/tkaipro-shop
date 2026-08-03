import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { markSubscriptionsAsExpired } from "~/lib/queries/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json() as any;
    const { subscriptionIds } = body;

    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid subscription IDs" },
        { status: 400 }
      );
    }

    const success = await markSubscriptionsAsExpired(subscriptionIds as string[]);
    
    if (success) {
      return NextResponse.json({ 
        message: `Successfully expired ${subscriptionIds.length} subscriptions` 
      });
    } else {
      return NextResponse.json(
        { error: "Failed to expire subscriptions" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to expire subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 