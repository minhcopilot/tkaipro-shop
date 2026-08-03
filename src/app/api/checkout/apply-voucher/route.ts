import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";

import { db } from "~/db";
import { productTable } from "~/db/schema";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { getCurrentUser } from "~/lib/auth";
import { validateVoucherPreview } from "~/lib/queries/vouchers";

interface RequestBody {
  code: string;
  items: { id: string; quantity: number }[];
  customerEmail?: string;
}

// Public preview endpoint — KHÔNG consume voucher.
// Khách nhập mã ở giỏ hàng → gọi endpoint này để xem trước số tiền giảm.
// Voucher được consume (mark used) ở /api/orders POST trong cùng tx tạo order.
export async function POST(request: Request) {
  try {
    // Rate limit: max 10 lần / IP / phút (kể cả thành công lẫn thất bại)
    // Đủ để khách thử mã, đủ chặn brute-force scan code.
    const ip = getClientIp(request);
    const limit = rateLimit(`apply-voucher:${ip}`, 10, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: `Bạn nhập quá nhanh, vui lòng thử lại sau ${Math.ceil(limit.resetInMs / 1000)}s`,
        },
        { status: 429 },
      );
    }

    const body = (await request.json()) as RequestBody;
    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "code_required",
          message: "Vui lòng nhập mã voucher",
        },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "empty_cart",
          message: "Giỏ hàng đang trống",
        },
        { status: 400 },
      );
    }

    // SECURITY: tra giá từ DB chứ không tin client gửi giá.
    const productIds = body.items.map((i) => i.id);
    const products = await db
      .select({
        id: productTable.id,
        price: productTable.price,
        category: productTable.category,
      })
      .from(productTable)
      .where(inArray(productTable.id, productIds));
    const priceMap = new Map(products.map((p) => [p.id, p.price]));

    const subtotal = body.items.reduce((sum, item) => {
      const price = priceMap.get(item.id) ?? 0;
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return sum + price * qty;
    }, 0);

    if (subtotal <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_subtotal",
          message: "Giỏ hàng không hợp lệ",
        },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();

    const result = await validateVoucherPreview({
      code: body.code,
      subtotal,
      productIds,
      customerEmail: body.customerEmail,
      userId: user?.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          message: result.message,
        },
        { status: 200 }, // 200 — đây là response hợp lệ "không áp dụng được", không phải lỗi server
      );
    }

    return NextResponse.json({
      ok: true,
      voucherId: result.voucher.id,
      code: result.voucher.code,
      discountType: result.voucher.discountType,
      discountValue: result.voucher.discountValue,
      maxDiscountAmount: result.voucher.maxDiscountAmount,
      discountApplied: result.discountApplied,
      subtotal,
      totalAfter: subtotal - result.discountApplied,
    });
  } catch (err) {
    console.error("POST /api/checkout/apply-voucher error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: "Có lỗi xảy ra, vui lòng thử lại",
      },
      { status: 500 },
    );
  }
}
