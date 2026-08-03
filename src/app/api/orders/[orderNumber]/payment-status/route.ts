import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "~/lib/queries/orders";

// public endpoint - không cần authentication
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    
    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Same-origin (trang thanh toán gọi trên cùng domain) -> KHÔNG mở CORS `*`.
    // Chỉ trả trạng thái thanh toán, không kèm CORS header cho site ngoài.
    return NextResponse.json({
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status,
      paidAt: order.paidAt,
    });

  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}