import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { 
  getAllSubscriptionsPaginated,
  type SubscriptionsFilter 
} from "~/lib/queries/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    const filter: SubscriptionsFilter = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: searchParams.get("status") as any || undefined,
      productId: searchParams.get("productId") || undefined,
      customerEmail: searchParams.get("customerEmail") || undefined,
      username: searchParams.get("username") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await getAllSubscriptionsPaginated(filter);

    // SECURITY: never return Cursor password (ciphertext) to admin web.
    // Account passwords live in manager vault; license keys stay server-side only.
    if (Array.isArray(result.subscriptions)) {
      result.subscriptions = result.subscriptions.map((s: any) => {
        if (!s || typeof s !== "object") return s;
        const { password: _pw, ...rest } = s;
        return rest;
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to get subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 