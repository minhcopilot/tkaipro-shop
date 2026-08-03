import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";

import { db } from "~/db";
import {
  affiliateVoucherAuditLogTable,
  affiliateVoucherRedemptionTable,
  affiliateVoucherTable,
  productTable,
  userTable,
  VOUCHER_DISCOUNT_TYPE,
  VOUCHER_STATUS,
} from "~/db/schema";
import type {
  AffiliateVoucher,
  AffiliateVoucherRedemption,
} from "~/db/schema/affiliate-voucher/types";

// Code voucher: 10 ký tự alphanumeric, không có ký tự dễ nhầm (0/O/1/I/l)
// để CTV đọc/đọc-tay không sai. Prefix CTV- giúp phân biệt với mã khác.
const codeNanoid = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZ",
  10,
);

export function generateVoucherCode(prefix = "CTV"): string {
  return `${prefix}-${codeNanoid()}`;
}

/* ------------------------------------------------------------------ */
/*                       Validation result types                      */
/* ------------------------------------------------------------------ */

export type VoucherValidationError =
  | "code_required"
  | "not_found"
  | "disabled"
  | "expired"
  | "not_yet_valid"
  | "used_up"
  | "wrong_user"
  | "wrong_email"
  | "min_subtotal_not_met"
  | "product_not_eligible"
  | "category_not_eligible"
  | "already_applied_on_order"
  | "internal_error";

export interface VoucherValidationOk {
  ok: true;
  voucher: AffiliateVoucher;
  discountApplied: number;
}
export interface VoucherValidationFail {
  ok: false;
  error: VoucherValidationError;
  message: string;
}
export type VoucherValidationResult = VoucherValidationOk | VoucherValidationFail;

const ERROR_MESSAGES_VI: Record<VoucherValidationError, string> = {
  code_required: "Vui lòng nhập mã voucher",
  not_found: "Mã voucher không tồn tại",
  disabled: "Mã voucher đã bị vô hiệu hoá",
  expired: "Mã voucher đã hết hạn",
  not_yet_valid: "Mã voucher chưa đến thời gian sử dụng",
  used_up: "Mã voucher đã hết lượt sử dụng",
  wrong_user: "Mã voucher này không thuộc về tài khoản của bạn",
  wrong_email: "Mã voucher này chỉ áp dụng cho email được chỉ định",
  min_subtotal_not_met: "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này",
  product_not_eligible: "Có sản phẩm trong giỏ không áp dụng được mã này",
  category_not_eligible: "Có sản phẩm thuộc danh mục không áp dụng được mã này",
  already_applied_on_order: "Mã đã được áp dụng cho đơn hàng này",
  internal_error: "Có lỗi xảy ra khi xử lý voucher",
};

function fail(error: VoucherValidationError): VoucherValidationFail {
  return { ok: false, error, message: ERROR_MESSAGES_VI[error] };
}

/* ------------------------------------------------------------------ */
/*                       Discount calculation                         */
/* ------------------------------------------------------------------ */

export function computeDiscount(
  voucher: AffiliateVoucher,
  subtotal: number,
): number {
  let raw = 0;
  if (voucher.discountType === VOUCHER_DISCOUNT_TYPE.PERCENT) {
    raw = Math.floor((subtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
      raw = Math.min(raw, voucher.maxDiscountAmount);
    }
  } else {
    raw = voucher.discountValue;
  }
  // Clamp [0, subtotal] — chống discount âm và discount > subtotal
  return Math.max(0, Math.min(raw, subtotal));
}

/* ------------------------------------------------------------------ */
/*                         Preview validator                          */
/* ------------------------------------------------------------------ */

export interface ValidateVoucherInput {
  code: string;
  subtotal: number;
  productIds: string[];
  customerEmail?: string;
  userId?: string;
}

/**
 * Preview-only validation. KHÔNG mutate DB, KHÔNG consume.
 * Dùng cho `/api/checkout/apply-voucher`. Để áp thật vào order, dùng
 * `validateAndConsumeVoucher` trong cùng transaction tạo order.
 */
export async function validateVoucherPreview(
  input: ValidateVoucherInput,
): Promise<VoucherValidationResult> {
  const code = (input.code || "").trim();
  if (!code) return fail("code_required");

  try {
    const voucher = await db.query.affiliateVoucherTable.findFirst({
      where: eq(affiliateVoucherTable.code, code),
    });
    if (!voucher) return fail("not_found");

    const check = await checkVoucherRules(voucher, input);
    if (!check.ok) return check;

    const discountApplied = computeDiscount(voucher, input.subtotal);
    return { ok: true, voucher, discountApplied };
  } catch (err) {
    console.error("validateVoucherPreview error:", err);
    return fail("internal_error");
  }
}

async function checkVoucherRules(
  voucher: AffiliateVoucher,
  input: ValidateVoucherInput,
): Promise<VoucherValidationResult> {
  if (voucher.status === VOUCHER_STATUS.DISABLED) return fail("disabled");
  if (voucher.status === VOUCHER_STATUS.USED_UP) return fail("used_up");
  if (voucher.status === VOUCHER_STATUS.EXPIRED) return fail("expired");

  const now = new Date();
  if (voucher.validFrom && voucher.validFrom > now) return fail("not_yet_valid");
  if (voucher.validUntil && voucher.validUntil < now) return fail("expired");
  if (voucher.usedCount >= voucher.maxUses) return fail("used_up");

  if (voucher.boundUserId) {
    if (!input.userId || input.userId !== voucher.boundUserId) {
      return fail("wrong_user");
    }
  }
  if (voucher.boundEmail) {
    if (
      !input.customerEmail ||
      input.customerEmail.trim().toLowerCase() !==
        voucher.boundEmail.trim().toLowerCase()
    ) {
      return fail("wrong_email");
    }
  }

  if (
    (voucher.minOrderSubtotal ?? 0) > 0 &&
    input.subtotal < (voucher.minOrderSubtotal ?? 0)
  ) {
    return fail("min_subtotal_not_met");
  }

  const allowedProducts = voucher.allowedProductIds ?? [];
  const allowedCategories = voucher.allowedCategoryIds ?? [];

  if (allowedProducts.length > 0 || allowedCategories.length > 0) {
    if (input.productIds.length === 0) return fail("product_not_eligible");

    const inAllowedProducts = (id: string) => allowedProducts.includes(id);

    let productCategoryMap: Map<string, string> | null = null;
    if (allowedCategories.length > 0) {
      const products = await db
        .select({
          id: productTable.id,
          category: productTable.category,
        })
        .from(productTable)
        .where(inArray(productTable.id, input.productIds));
      productCategoryMap = new Map(products.map((p) => [p.id, p.category]));
    }

    for (const pid of input.productIds) {
      const okByProduct =
        allowedProducts.length > 0 ? inAllowedProducts(pid) : false;
      const okByCategory =
        allowedCategories.length > 0
          ? allowedCategories.includes(productCategoryMap?.get(pid) ?? "")
          : false;
      if (!okByProduct && !okByCategory) {
        if (allowedProducts.length > 0 && allowedCategories.length === 0) {
          return fail("product_not_eligible");
        }
        if (allowedCategories.length > 0 && allowedProducts.length === 0) {
          return fail("category_not_eligible");
        }
        return fail("product_not_eligible");
      }
    }
  }

  // discountApplied filled by caller
  return { ok: true, voucher, discountApplied: 0 };
}

/* ------------------------------------------------------------------ */
/*                  Validate + consume in transaction                 */
/* ------------------------------------------------------------------ */

export interface ConsumeVoucherInput extends ValidateVoucherInput {
  orderId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsumeVoucherResult {
  ok: boolean;
  error?: VoucherValidationError;
  message?: string;
  voucherId?: string;
  discountApplied?: number;
  redemption?: AffiliateVoucherRedemption;
}

/**
 * Validate + consume + log, ALL trong 1 transaction.
 * - Lock voucher row bằng SELECT ... FOR UPDATE để chống race condition
 *   (2 đơn cùng dùng voucher có maxUses=1 chạy song song).
 * - Insert vào affiliate_voucher_redemption — uniqueIndex (voucher_id, order_id)
 *   chặn double-spend nếu API tạo order bị retry.
 * - Auto-mark status = "used_up" khi usedCount >= maxUses sau khi increment.
 */
export async function validateAndConsumeVoucher(
  input: ConsumeVoucherInput,
): Promise<ConsumeVoucherResult> {
  const code = (input.code || "").trim();
  if (!code) {
    return { ok: false, error: "code_required", message: ERROR_MESSAGES_VI.code_required };
  }
  if (!input.orderId) {
    return { ok: false, error: "internal_error", message: "orderId is required" };
  }

  try {
    return await db.transaction(async (tx) => {
      // SELECT ... FOR UPDATE — drizzle-orm postgres-js dùng .for("update")
      const lockedRows = await tx
        .select()
        .from(affiliateVoucherTable)
        .where(eq(affiliateVoucherTable.code, code))
        .for("update");

      const voucher = lockedRows[0];
      if (!voucher) {
        return {
          ok: false,
          error: "not_found" as const,
          message: ERROR_MESSAGES_VI.not_found,
        };
      }

      const check = await checkVoucherRules(voucher, input);
      if (!check.ok) {
        // Auto-update status nếu phát hiện hết hạn/dùng hết
        if (check.error === "expired" && voucher.status === VOUCHER_STATUS.ACTIVE) {
          await tx
            .update(affiliateVoucherTable)
            .set({ status: VOUCHER_STATUS.EXPIRED, updatedAt: new Date() })
            .where(eq(affiliateVoucherTable.id, voucher.id));
        }
        if (check.error === "used_up" && voucher.status === VOUCHER_STATUS.ACTIVE) {
          await tx
            .update(affiliateVoucherTable)
            .set({ status: VOUCHER_STATUS.USED_UP, updatedAt: new Date() })
            .where(eq(affiliateVoucherTable.id, voucher.id));
        }
        return {
          ok: false,
          error: check.error,
          message: check.message,
        };
      }

      const discountApplied = computeDiscount(voucher, input.subtotal);

      // Insert redemption — sẽ throw nếu vi phạm uniq_voucher_order
      let redemption: AffiliateVoucherRedemption;
      try {
        const inserted = await tx
          .insert(affiliateVoucherRedemptionTable)
          .values({
            id: nanoid(),
            voucherId: voucher.id,
            orderId: input.orderId,
            userId: input.userId ?? null,
            customerEmail: input.customerEmail ?? "",
            subtotalAtRedemption: input.subtotal,
            discountApplied,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
          })
          .returning();
        redemption = inserted[0]!;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // unique_voucher_order violation
        if (msg.includes("uniq_voucher_order") || msg.includes("duplicate key")) {
          return {
            ok: false,
            error: "already_applied_on_order" as const,
            message: ERROR_MESSAGES_VI.already_applied_on_order,
          };
        }
        throw e;
      }

      // Increment usedCount + auto-mark used_up nếu đạt max
      const newUsed = voucher.usedCount + 1;
      const newStatus =
        newUsed >= voucher.maxUses ? VOUCHER_STATUS.USED_UP : voucher.status;
      await tx
        .update(affiliateVoucherTable)
        .set({
          usedCount: newUsed,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(affiliateVoucherTable.id, voucher.id));

      return {
        ok: true,
        voucherId: voucher.id,
        discountApplied,
        redemption,
      };
    });
  } catch (err) {
    console.error("validateAndConsumeVoucher error:", err);
    return {
      ok: false,
      error: "internal_error" as const,
      message: ERROR_MESSAGES_VI.internal_error,
    };
  }
}

/* ------------------------------------------------------------------ */
/*                           Admin queries                             */
/* ------------------------------------------------------------------ */

export interface VoucherListFilters {
  search?: string;
  status?: string;
  ownerUserId?: string;
}

export type VoucherWithProduct = AffiliateVoucher & {
  productName: string | null;
  productImage: string | null;
  productPrice: number | null;
  ownerEmail: string | null;
  ownerName: string | null;
};

export async function listVouchers(
  filters: VoucherListFilters = {},
): Promise<VoucherWithProduct[]> {
  const conds = [];
  if (filters.search) {
    conds.push(
      or(
        ilike(affiliateVoucherTable.code, `%${filters.search}%`),
        ilike(affiliateVoucherTable.note, `%${filters.search}%`),
      ),
    );
  }
  if (filters.status) {
    conds.push(eq(affiliateVoucherTable.status, filters.status));
  }
  if (filters.ownerUserId) {
    conds.push(eq(affiliateVoucherTable.ownerUserId, filters.ownerUserId));
  }

  const vouchers = await db
    .select()
    .from(affiliateVoucherTable)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(affiliateVoucherTable.createdAt))
    .limit(500);

  // Mô hình mới: 1 voucher = 1 sản phẩm (allowedProductIds có 0..1 phần tử).
  // Batch fetch product info bằng 1 query để tránh N+1.
  const productIds = Array.from(
    new Set(
      vouchers
        .map((v) => v.allowedProductIds?.[0])
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  let productMap = new Map<
    string,
    { name: string; image: string | null; price: number }
  >();
  if (productIds.length > 0) {
    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        image: productTable.image,
        price: productTable.price,
      })
      .from(productTable)
      .where(inArray(productTable.id, productIds));
    productMap = new Map(
      products.map((p) => [
        p.id,
        { name: p.name, image: p.image ?? null, price: p.price },
      ]),
    );
  }

  // Batch fetch owner (CTV) info để hiển thị email + name thay vì id thô.
  const ownerIds = Array.from(
    new Set(
      vouchers
        .map((v) => v.ownerUserId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  let ownerMap = new Map<string, { email: string; name: string }>();
  if (ownerIds.length > 0) {
    const owners = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
      })
      .from(userTable)
      .where(inArray(userTable.id, ownerIds));
    ownerMap = new Map(
      owners.map((o) => [o.id, { email: o.email, name: o.name }]),
    );
  }

  return vouchers.map((v) => {
    const pid = v.allowedProductIds?.[0];
    const product = pid ? productMap.get(pid) : undefined;
    const owner = v.ownerUserId ? ownerMap.get(v.ownerUserId) : undefined;
    return {
      ...v,
      productName: product?.name ?? null,
      productImage: product?.image ?? null,
      productPrice: product?.price ?? null,
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.name ?? null,
    };
  });
}

export async function listVoucherRedemptions(voucherId: string) {
  return await db
    .select()
    .from(affiliateVoucherRedemptionTable)
    .where(eq(affiliateVoucherRedemptionTable.voucherId, voucherId))
    .orderBy(desc(affiliateVoucherRedemptionTable.redeemedAt))
    .limit(200);
}

export async function listAuditLogs(limit = 200) {
  return await db
    .select()
    .from(affiliateVoucherAuditLogTable)
    .orderBy(desc(affiliateVoucherAuditLogTable.createdAt))
    .limit(limit);
}

export async function logAuditAction(params: {
  voucherId: string | null;
  adminId: string;
  action: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
  ipAddress?: string;
}) {
  await db.insert(affiliateVoucherAuditLogTable).values({
    id: nanoid(),
    voucherId: params.voucherId,
    adminId: params.adminId,
    action: params.action,
    diff: params.diff ?? null,
    ipAddress: params.ipAddress ?? null,
  });
}

// Sort helper used by API list response
export const _sortAsc = asc;
export const _sql = sql;
