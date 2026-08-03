import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { getUserOrders } from "~/lib/queries/orders";

export async function GET(request: NextRequest) {
  try {
    // check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;

    const result = await getUserOrders(user.id, {
      page,
      limit,
      status: status as any,
      paymentStatus: paymentStatus as any,
    });

    if (Array.isArray(result?.orders)) {
      // SECURITY: loai bo password khoi credentials truoc khi tra ve web.
      // Mat khau chi gui qua email. Web chi hien thi username/account.
      // Align với [orderNumber]: strip upgradeCredentials.password, giữ email/contactInfo.
      for (const o of result.orders as any[]) {
        if (Array.isArray(o.assignedCredentials)) {
          o.assignedCredentials = o.assignedCredentials.map((c: any) => ({
            productId: c.productId,
            productName: c.productName,
            username: c.username,
            assignedAt: c.assignedAt,
          }));
        }
        if (Array.isArray(o.items)) {
          o.items = o.items.map((item: any) => {
            if (!item || typeof item !== "object") return item;
            const { upgradeCredentials, ...rest } = item;
            if (!upgradeCredentials) return rest;
            return {
              ...rest,
              upgradeCredentials: {
                email: upgradeCredentials.email,
                contactInfo: upgradeCredentials.contactInfo,
                // password: intentionally omitted
              },
            };
          });
        }
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 