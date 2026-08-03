import { NextRequest, NextResponse } from "next/server";
import { getAllOrdersPaginated, updateOrderStatus } from "~/lib/queries/orders";
import { getCurrentUser } from "~/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // check admin permission
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const search = searchParams.get('search') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const accountType = searchParams.get('accountType') || undefined;

    const result = await getAllOrdersPaginated({
      page,
      limit,
      status: status as any,
      paymentStatus: paymentStatus as any,
      search,
      productId,
      accountType: accountType as any,
    });

    if (Array.isArray(result?.orders)) {
      // SECURITY: strip passwords from list response. Admin UI still gets
      // username/email; password reveal (if needed) is a follow-up.
      for (const o of result.orders as any[]) {
        if (Array.isArray(o.assignedCredentials)) {
          o.assignedCredentials = o.assignedCredentials.map((c: any) => {
            if (!c || typeof c !== "object") return c;
            const { password: _pw, ...rest } = c;
            return rest;
          });
        }
        if (Array.isArray(o.items)) {
          o.items = o.items.map((item: any) => {
            if (!item?.upgradeCredentials || typeof item.upgradeCredentials !== "object") {
              return item;
            }
            const { password: _pw, ...upgradeRest } = item.upgradeCredentials;
            return { ...item, upgradeCredentials: upgradeRest };
          });
        }
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // check admin permission
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json() as any;
    const { orderId, status, paymentStatus, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // update order status/payment status
    const updatedOrder = await updateOrderStatus(orderId, {
      status,
      paymentStatus,
      notes,
      updatedBy: user.id,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: (() => {
        const o: any = { ...updatedOrder };
        if (Array.isArray(o.assignedCredentials)) {
          o.assignedCredentials = o.assignedCredentials.map((c: any) => {
            if (!c || typeof c !== "object") return c;
            const { password: _pw, ...rest } = c;
            return rest;
          });
        }
        if (Array.isArray(o.items)) {
          o.items = o.items.map((item: any) => {
            if (!item?.upgradeCredentials || typeof item.upgradeCredentials !== "object") {
              return item;
            }
            const { password: _pw, ...upgradeRest } = item.upgradeCredentials;
            return { ...item, upgradeCredentials: upgradeRest };
          });
        }
        return o;
      })(),
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 