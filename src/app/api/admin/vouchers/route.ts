import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import {
  affiliateVoucherTable,
  productTable,
  userTable,
  VOUCHER_DISCOUNT_TYPE,
  VOUCHER_STATUS,
} from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";
import {
  generateVoucherCode,
  listVouchers,
  logAuditAction,
} from "~/lib/queries/vouchers";

function getIp(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") || undefined;
}

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const ownerUserId = searchParams.get("ownerUserId") || undefined;

    const vouchers = await listVouchers({ search, status, ownerUserId });
    return NextResponse.json({ vouchers });
  } catch (err) {
    console.error("GET /api/admin/vouchers error:", err);
    return NextResponse.json(
      { error: "Failed to list vouchers" },
      { status: 500 },
    );
  }
}

interface CreatePayload {
  // Nếu có ownerUserId → voucher CTV (bind cho user đó).
  // Nếu null/undefined → voucher CÔNG KHAI (khách thường ai nhập cũng dùng được).
  ownerUserId?: string | null;
  isPublic?: boolean;
  note?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderSubtotal?: number | null;
  maxUses?: number;
  boundUserId?: string | null;
  boundEmail?: string | null;
  allowedProductIds?: string[];
  allowedCategoryIds?: string[];
  validFrom?: string | null;
  validUntil?: string | null;
  // bulk: nếu set, tạo `bulkCount` voucher có cùng cấu hình
  bulkCount?: number;
  codePrefix?: string;
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePayload;

    // Mô hình mới: 1 voucher = 1 CTV + 1 sản phẩm, discount FIXED VND only.
    // Reject percent ngay tại API.
    if (body.discountType !== VOUCHER_DISCOUNT_TYPE.FIXED) {
      return NextResponse.json(
        {
          error:
            "Chỉ hỗ trợ discountType='fixed' (số tiền VND). Loại percent đã bị bỏ.",
        },
        { status: 400 },
      );
    }
    if (!body.discountValue || body.discountValue <= 0) {
      return NextResponse.json(
        { error: "Số tiền giảm (discountValue) phải > 0 VND" },
        { status: 400 },
      );
    }

    // 2 chế độ:
    //   - VOUCHER CTV: ownerUserId set + role AFFILIATE/ADMIN, voucher tự bind
    //     vào user đó (chỉ chính CTV checkout mới redeem được).
    //   - VOUCHER CÔNG KHAI: ownerUserId=null hoặc isPublic=true, không bind user
    //     → ai nhập đúng code đều dùng được (subject to maxUses + expiry).
    const isPublic = body.isPublic === true || !body.ownerUserId;
    if (!isPublic) {
      const owner = await db.query.userTable.findFirst({
        where: eq(userTable.id, body.ownerUserId!),
      });
      if (!owner) {
        return NextResponse.json(
          { error: "CTV không tồn tại" },
          { status: 400 },
        );
      }
      if (owner.role !== "AFFILIATE" && owner.role !== "ADMIN") {
        return NextResponse.json(
          { error: "User được chọn chưa có role AFFILIATE" },
          { status: 400 },
        );
      }
    }

    // BẮT BUỘC đúng 1 sản phẩm
    const productIds = (body.allowedProductIds ?? []).filter(
      (s) => typeof s === "string" && s.trim().length > 0,
    );
    if (productIds.length !== 1) {
      return NextResponse.json(
        {
          error:
            "Phải chọn đúng 1 sản phẩm — 1 voucher chỉ áp dụng cho 1 sản phẩm",
        },
        { status: 400 },
      );
    }
    const product = await db.query.productTable.findFirst({
      where: eq(productTable.id, productIds[0]!),
    });
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 400 },
      );
    }

    const bulkCount = Math.max(1, Math.min(body.bulkCount ?? 1, 200));
    const ip = getIp(request);

    const baseValues = {
      ownerUserId: isPublic ? null : body.ownerUserId!,
      issuedByAdminId: admin.id,
      note: body.note?.trim() || null,
      discountType: VOUCHER_DISCOUNT_TYPE.FIXED,
      discountValue: Math.round(body.discountValue),
      // Cap không cần khi fixed
      maxDiscountAmount: null,
      minOrderSubtotal: body.minOrderSubtotal ?? 0,
      maxUses: body.maxUses ?? 1,
      // CTV voucher → bind cho chính owner. Public voucher → không bind.
      boundUserId: isPublic
        ? null
        : (body.boundUserId ?? body.ownerUserId!),
      boundEmail: body.boundEmail?.trim().toLowerCase() || null,
      allowedProductIds: productIds,
      allowedCategoryIds: [],
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      status: VOUCHER_STATUS.ACTIVE,
      updatedAt: new Date(),
    };

    const created = [];
    for (let i = 0; i < bulkCount; i++) {
      // Retry up to 3 times if code collides (cực hiếm với 32^10)
      let attempt = 0;
      while (attempt < 3) {
        try {
          const inserted = await db
            .insert(affiliateVoucherTable)
            .values({
              id: nanoid(),
              code: generateVoucherCode(
                body.codePrefix?.trim() || (isPublic ? "SHOP" : "CTV"),
              ),
              ...baseValues,
            })
            .returning();
          if (inserted[0]) created.push(inserted[0]);
          break;
        } catch (e) {
          attempt++;
          const msg = e instanceof Error ? e.message : "";
          if (!msg.includes("duplicate") || attempt >= 3) throw e;
        }
      }
    }

    // Audit log
    if (created.length === 1) {
      await logAuditAction({
        voucherId: created[0]!.id,
        adminId: admin.id,
        action: "created",
        ipAddress: ip,
      });
    } else if (created.length > 1) {
      await logAuditAction({
        voucherId: null,
        adminId: admin.id,
        action: "bulk_created",
        diff: {
          count: { from: 0, to: created.length },
          ownerUserId: { from: null, to: body.ownerUserId ?? null },
        },
        ipAddress: ip,
      });
    }

    return NextResponse.json(
      { vouchers: created, count: created.length },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/admin/vouchers error:", err);
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 },
    );
  }
}
