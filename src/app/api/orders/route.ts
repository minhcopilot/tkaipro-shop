import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import {
  affiliateVoucherRedemptionTable,
  affiliateVoucherTable,
  orderTable,
  productTable,
  VOUCHER_STATUS,
} from "~/db/schema";
import type { OrderInsert } from "~/db/schema/orders/types";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { getCurrentUser, isAdmin } from "~/lib/auth";
import { CHECKOUT_WALLET_ONLY } from "~/lib/checkout-config";
import { generateOrderNumber } from "~/lib/order-number";
import { generatePaymentMemo } from "~/lib/payment/transfer-memos";
import {
  assignBankAccountForPayment,
  NoActiveBankAccountError,
  toBankSnapshot,
} from "~/lib/queries/bank-accounts";
import { createOrder, getRecentCompletedOrders } from "~/lib/queries/orders";
import { autoAssignCredentials } from "~/lib/queries/credentials";
import {
  computeDiscount,
  validateVoucherPreview,
} from "~/lib/queries/vouchers";
import {
  debitForOrderInTx,
  WALLET_CURRENCY,
  type WalletCurrency,
} from "~/lib/queries/wallet";
import type { CartItem } from "~/lib/hooks/use-cart";
import { EXCHANGE_RATE } from "~/lib/product-localization";
import { notifyFraudAttempt } from "~/lib/notifications/fraud-alert";
import { guardBannedRequest } from "~/lib/security/ban-guard";
import {
  logUserIp,
  getCountryFromHeaders,
  getFingerprintFromRequest,
  getDeviceIdFromRequest,
} from "~/lib/security/ip-log";
import {
  validateCustomerEmail,
  validateCustomerName,
} from "~/lib/security/email-blocklist";
import {
  assertPositiveSubtotal,
  buildValidatedOrderItems,
  computeOrderSubtotal,
  type DbProductForOrder,
  ORDER_VALIDATION_MESSAGES,
  OrderValidationError,
} from "~/lib/security/order-validation";
import { verifyTurnstileToken } from "~/lib/security/turnstile";
import { TERMS_VERSION } from "~/lib/legal/terms-version";

/**
 * Tính số tiền cần deduct từ ví theo locale.
 *  - VI/vi: ví VND, deduct nguyên VND (1:1 với order.total).
 *  - Non-VI: ví USD, quy đổi VND → USD cents bằng EXCHANGE_RATE.
 *    Round-up cents để khách không bị thiếu cent so với hiển thị $X.YY.
 */
function computeWalletDebit(
  totalVnd: number,
  locale: string,
): { currency: WalletCurrency; amount: number } {
  if (locale === "vi") {
    return { currency: WALLET_CURRENCY.VND, amount: totalVnd };
  }
  // ceil để không "ăn gian" (vd: 412.5 cents → 413 cents)
  const cents = Math.ceil((totalVnd / EXCHANGE_RATE) * 100);
  return { currency: WALLET_CURRENCY.USD, amount: cents };
}

// GET recent completed orders for live toast notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    if (status === "completed") {
      const orders = await getRecentCompletedOrders(30, Math.min(limit, 50));

      const TRADEMARK_LEAK_RE =
        /\s*(?:[-–—()\[\]]*\s*)?(?:#?1\s+(?:trusted|tienda|leader|reseller|việt\s*nam|vietnam)|chính\s*hãng|chính\s*chủ|chính\s*thức|genuine|authentic(?:ity)?|official(?:le)?|officiel(?:le)?|offiziell|original|legítimo|autêntico|authentique|正品|正規品|정품|أصلي|оригинальн[а-я]*)\s*(?:[-–—()\[\]]*)?/gi;
      const cleanName = (raw: string): string =>
        !raw
          ? raw
          : raw
              .replace(TRADEMARK_LEAK_RE, " ")
              .replace(/\s{2,}/g, " ")
              .replace(/\s+([–—-])\s+/g, " $1 ")
              .trim();

      const sanitizedOrders = orders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        userAvatar: order.userAvatar || null,
        createdAt: order.createdAt,
        total: order.total,
        items: order.items?.slice(0, 1).map((item: any) => ({
          name: cleanName(item.name),
          price: item.price,
        })),
      }));

      return NextResponse.json({ orders: sanitizedOrders });
    }

    return NextResponse.json({ orders: [] });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ orders: [] });
  }
}

const SUPPORTED_LOCALES = new Set([
  "vi", "en", "ru", "zh", "ar", "es", "fr", "de", "ja", "ko", "pt",
]);

// generateOrderNumber: dùng helper crypto-strong dùng chung (~/lib/order-number).

function validationErrorResponse(
  code: keyof typeof ORDER_VALIDATION_MESSAGES,
  ip: string,
  email?: string,
  userAgent?: string,
) {
  notifyFraudAttempt({
    reason: code,
    ip,
    email,
    userAgent,
  });
  return NextResponse.json(
    { error: ORDER_VALIDATION_MESSAGES[code] },
    { status: 400 },
  );
}

async function fetchProductMap(productIds: string[]) {
  const dbProducts = await db
    .select({
      id: productTable.id,
      name: productTable.name,
      category: productTable.category,
      price: productTable.price,
      image: productTable.image,
      productType: productTable.productType,
      upgradeEmailOnly: productTable.upgradeEmailOnly,
    })
    .from(productTable)
    .where(inArray(productTable.id, productIds));

  return new Map<string, DbProductForOrder>(
    dbProducts.map((p) => [p.id, p]),
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const reqCountry = getCountryFromHeaders(request.headers);
  const reqFingerprint = getFingerprintFromRequest(request);
  const reqDid = getDeviceIdFromRequest(request);
  const sessionUser = await getCurrentUser();
  const adminBypass = isAdmin(sessionUser);

  try {
    if (!adminBypass) {
      // Ban check IP trước rate-limit để IP đã ban không tốn bucket / không
      // được hint qua message rate-limit.
      const ipBanResp = await guardBannedRequest(request);
      if (ipBanResp) return ipBanResp;

      const ipLimit = rateLimit(`create-order:${ip}`, 5, 60_000);
      if (!ipLimit.ok) {
        return NextResponse.json(
          {
            error: `Bạn đặt đơn quá nhanh, vui lòng thử lại sau ${Math.ceil(ipLimit.resetInMs / 1000)}s`,
          },
          { status: 429 },
        );
      }
    }

    const body = (await request.json()) as any;
    const {
      items,
      customerInfo,
      userId: bodyUserId,
      createdAt: bodyCreatedAt,
      locale,
      voucherCode,
      turnstileToken,
      paymentMethod: bodyPaymentMethod,
      termsAccepted,
    } = body;
    const wantsWalletPay = bodyPaymentMethod === "wallet";

    if (!adminBypass && CHECKOUT_WALLET_ONLY && !sessionUser) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thanh toán" },
        { status: 401 },
      );
    }

    if (
      !adminBypass &&
      CHECKOUT_WALLET_ONLY &&
      bodyPaymentMethod &&
      bodyPaymentMethod !== "wallet"
    ) {
      return NextResponse.json(
        {
          error:
            "Thanh toán chuyển khoản theo đơn đã tắt. Vui lòng dùng số dư ví.",
        },
        { status: 400 },
      );
    }

    // Chống spoof: chỉ admin được tự set userId / createdAt của đơn.
    // User thường: userId luôn ép = session id (hoặc undefined nếu guest);
    // createdAt luôn = now (server time).
    const userId = adminBypass ? bodyUserId : sessionUser?.id;
    const createdAt = adminBypass ? bodyCreatedAt : undefined;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Giỏ hàng không được trống" },
        { status: 400 },
      );
    }

    if (!customerInfo || !customerInfo.customerName || !customerInfo.customerEmail) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin khách hàng" },
        { status: 400 },
      );
    }

    if (!adminBypass && termsAccepted !== true) {
      return NextResponse.json(
        { error: "Vui lòng xác nhận đủ 18 tuổi và đồng ý Điều khoản dịch vụ trước khi đặt hàng" },
        { status: 400 },
      );
    }

    const termsConsent = {
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    };

    if (!adminBypass) {
      // Email ban check ngay sau khi đọc body
      const emailBanResp = await guardBannedRequest(request, {
        email: customerInfo.customerEmail,
      });
      if (emailBanResp) return emailBanResp;

      const nameCheck = validateCustomerName(customerInfo.customerName);
      if (!nameCheck.ok) {
        return NextResponse.json({ error: nameCheck.message }, { status: 400 });
      }

      const emailCheck = validateCustomerEmail(customerInfo.customerEmail);
      if (!emailCheck.ok) {
        notifyFraudAttempt({
          reason: emailCheck.error ?? "email_blocked",
          ip,
          email: customerInfo.customerEmail,
          userAgent,
        });
        return NextResponse.json({ error: emailCheck.message }, { status: 400 });
      }

      const emailLimit = rateLimit(
        `create-order-email:${customerInfo.customerEmail.trim().toLowerCase()}`,
        10,
        3_600_000,
      );
      if (!emailLimit.ok) {
        notifyFraudAttempt({
          reason: "rate_limit_email",
          ip,
          email: customerInfo.customerEmail,
          userAgent,
        });
        return NextResponse.json(
          {
            error: `Email này đã đặt quá nhiều đơn, vui lòng thử lại sau ${Math.ceil(emailLimit.resetInMs / 1000)}s`,
          },
          { status: 429 },
        );
      }

      const turnstileCheck =
        !CHECKOUT_WALLET_ONLY
          ? await verifyTurnstileToken(turnstileToken, ip)
          : { ok: true as const };
      if (!turnstileCheck.ok) {
        return NextResponse.json(
          { error: turnstileCheck.message ?? "Xác minh captcha thất bại" },
          { status: 403 },
        );
      }
    }

    const customCreatedAt = createdAt ? new Date(createdAt) : undefined;
    const cartItems = items as CartItem[];
    const clientMeta = { clientIp: ip, userAgent };

    // Path 3: WALLET — pay với balance (voucher được phép khi wallet-only).
    if (wantsWalletPay) {
      if (!sessionUser) {
        return NextResponse.json(
          { error: "Vui lòng đăng nhập để dùng số dư trong ví" },
          { status: 401 },
        );
      }

      const productIds = cartItems.map((i) => i.id);
      const productMap = await fetchProductMap(productIds);

      let orderItems;
      try {
        orderItems = buildValidatedOrderItems(cartItems, productMap);
      } catch (err) {
        if (err instanceof OrderValidationError) {
          return validationErrorResponse(
            err.code,
            ip,
            customerInfo.customerEmail,
            userAgent,
          );
        }
        throw err;
      }

      const subtotal = computeOrderSubtotal(orderItems);
      try {
        assertPositiveSubtotal(subtotal);
      } catch (err) {
        if (err instanceof OrderValidationError) {
          return validationErrorResponse(
            err.code,
            ip,
            customerInfo.customerEmail,
            userAgent,
          );
        }
        throw err;
      }

      const hasVoucher =
        typeof voucherCode === "string" && voucherCode.trim().length > 0;
      const code = hasVoucher ? voucherCode.trim() : "";

      if (hasVoucher) {
        const preview = await validateVoucherPreview({
          code,
          subtotal,
          productIds,
          customerEmail: customerInfo.customerEmail,
          userId: sessionUser.id,
        });
        if (!preview.ok) {
          return NextResponse.json(
            {
              error: preview.message,
              voucherError: preview.error,
            },
            { status: 400 },
          );
        }
      }

      const safeLocale =
        typeof locale === "string" && SUPPORTED_LOCALES.has(locale) ? locale : "vi";

      const orderNumber = generateOrderNumber(orderItems.map((i) => i.price));
      const { memo: paymentMemo, token: paymentToken } = generatePaymentMemo();
      const orderId = nanoid();
      const now = new Date();

      let createdOrder;
      let debit: { currency: WalletCurrency; amount: number };

      try {
        const txResult = await db.transaction(async (tx) => {
          let discount = 0;
          let discountCode: string | null = null;
          let consumedVoucherId: string | null = null;

          if (hasVoucher) {
            const lockedRows = await tx
              .select()
              .from(affiliateVoucherTable)
              .where(eq(affiliateVoucherTable.code, code))
              .for("update");
            const voucher = lockedRows[0];
            if (!voucher) {
              throw new Error("VOUCHER_NOT_FOUND");
            }

            const voucherNow = new Date();
            if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
              throw new Error(`VOUCHER_${voucher.status.toUpperCase()}`);
            }
            if (voucher.validFrom && voucher.validFrom > voucherNow) {
              throw new Error("VOUCHER_NOT_YET_VALID");
            }
            if (voucher.validUntil && voucher.validUntil < voucherNow) {
              throw new Error("VOUCHER_EXPIRED");
            }
            if (voucher.usedCount >= voucher.maxUses) {
              throw new Error("VOUCHER_USED_UP");
            }

            discount = computeDiscount(voucher, subtotal);
            discountCode = voucher.code;
            consumedVoucherId = voucher.id;

            const newUsed = voucher.usedCount + 1;
            const newStatus =
              newUsed >= voucher.maxUses
                ? VOUCHER_STATUS.USED_UP
                : voucher.status;
            await tx
              .update(affiliateVoucherTable)
              .set({
                usedCount: newUsed,
                status: newStatus,
                updatedAt: new Date(),
              })
              .where(eq(affiliateVoucherTable.id, voucher.id));
          }

          const total = subtotal - discount;
          if (total <= 0) {
            throw new Error("INVALID_SUBTOTAL");
          }

          const walletDebit = computeWalletDebit(total, safeLocale);

          await debitForOrderInTx(tx, {
            userId: sessionUser.id,
            currency: walletDebit.currency,
            amount: walletDebit.amount,
            orderId,
            note: `Pay-with-wallet order ${orderNumber}`,
          });

          const orderData: OrderInsert = {
            id: orderId,
            userId: sessionUser.id,
            orderNumber,
            items: orderItems,
            subtotal,
            discount,
            discountCode,
            total,
            customerName: customerInfo.customerName,
            customerEmail: customerInfo.customerEmail,
            customerPhone: customerInfo.customerPhone,
            notes: customerInfo.notes,
            locale: safeLocale,
            clientIp: ip,
            userAgent,
            termsAcceptedAt: termsConsent.termsAcceptedAt,
            termsVersion: termsConsent.termsVersion,
            paymentMemo,
            paymentToken,
            paymentMethod: "wallet",
            paymentStatus: "paid",
            paidAt: now,
            createdAt: customCreatedAt || now,
            updatedAt: now,
          };
          const inserted = await tx
            .insert(orderTable)
            .values(orderData)
            .returning();
          if (!inserted[0]) throw new Error("ORDER_INSERT_FAILED");

          if (hasVoucher && consumedVoucherId) {
            try {
              await tx.insert(affiliateVoucherRedemptionTable).values({
                id: nanoid(),
                voucherId: consumedVoucherId,
                orderId: inserted[0].id,
                userId: sessionUser.id,
                customerEmail: customerInfo.customerEmail,
                subtotalAtRedemption: subtotal,
                discountApplied: discount,
                ipAddress: ip,
                userAgent,
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : "";
              if (
                msg.includes("uniq_voucher_order") ||
                msg.includes("duplicate key")
              ) {
                throw new Error("VOUCHER_ALREADY_APPLIED_ON_ORDER");
              }
              throw e;
            }
          }

          return { order: inserted[0], debit: walletDebit };
        });
        createdOrder = txResult.order;
        debit = txResult.debit;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "WALLET_INSUFFICIENT_BALANCE") {
          return NextResponse.json(
            {
              error: "Số dư không đủ để thanh toán đơn này",
              code: "WALLET_INSUFFICIENT_BALANCE",
            },
            { status: 400 },
          );
        }
        if (msg === "WALLET_USER_NOT_FOUND") {
          return NextResponse.json(
            { error: "Không tìm thấy user", code: msg },
            { status: 404 },
          );
        }
        if (msg.startsWith("VOUCHER_") || msg === "INVALID_SUBTOTAL") {
          throw e;
        }
        console.error("Wallet checkout failed:", e);
        return NextResponse.json(
          { error: "Lỗi hệ thống, vui lòng thử lại" },
          { status: 500 },
        );
      }

      // Sau tx — gọi auto-fulfill giống flow SePay webhook (sync version).
      // Best-effort: fail không rollback tx (đơn đã paid, fulfillment có
      // thể retry thủ công từ admin panel nếu cần).
      try {
        const credentialsAssigned = await autoAssignCredentials(createdOrder.id);

        // Mirror bank_transfer (SePay): paid orders awaiting manual fulfillment
        // stay "processing", not default "pending".
        if (!credentialsAssigned) {
          const { updateOrderStatus } = await import("~/lib/queries/orders");
          const updated = await updateOrderStatus(createdOrder.id, {
            status: "processing",
          });
          if (updated) createdOrder = updated;
        }

        // SECURITY: web khong con hien password -> BAT BUOC gui password qua
        // email (kenh duy nhat khach nhan).
        try {
          const { getOrderByNumber } = await import("~/lib/queries/orders");
          const { sendOrderCredentialsEmail } = await import(
            "~/lib/fulfillment/send-order-credentials-email"
          );
          const fulfilled = await getOrderByNumber(createdOrder.orderNumber);
          if (fulfilled?.assignedCredentials?.length) {
            const result = await sendOrderCredentialsEmail({
              orderId: fulfilled.id,
              orderNumber: fulfilled.orderNumber,
              customerName: fulfilled.customerName,
              customerEmail: fulfilled.customerEmail,
              customerPhone: fulfilled.customerPhone || undefined,
              total: fulfilled.total,
              paymentMethod: fulfilled.paymentMethod,
              items: fulfilled.items,
              assignedCredentials: fulfilled.assignedCredentials,
              paidAt: new Date(),
              locale: fulfilled.locale ?? undefined,
            });
            if (!result.sent) {
              console.warn(
                "Wallet checkout: credentials email skipped:",
                result.reason,
                result.missingEmails,
              );
            }
          }
        } catch (e) {
          console.error("Wallet checkout: send credentials email failed:", e);
        }
      } catch (e) {
        console.error("Wallet checkout post-tx fulfillment failed:", e);
      }

      // Forensics: record IP behind this order (fault-tolerant).
      await logUserIp({
        userId: sessionUser.id,
        email: customerInfo.customerEmail,
        eventType: "checkout",
        ip,
        userAgent,
        orderId: createdOrder.id,
        country: reqCountry,
        fingerprint: reqFingerprint,
        did: reqDid,
        path: `checkout:${createdOrder.orderNumber}`,
      });

      return NextResponse.json(
        {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          total: createdOrder.total,
          status: createdOrder.status,
          paymentStatus: createdOrder.paymentStatus,
          paymentMethod: createdOrder.paymentMethod,
          paidWithWallet: true,
          walletCurrency: debit.currency,
          walletAmountDebited: debit.amount,
        },
        { status: 201 },
      );
    }

    // Gate bank_transfer paths khi wallet-only (admin vẫn bypass).
    if (!adminBypass && CHECKOUT_WALLET_ONLY) {
      return NextResponse.json(
        {
          error:
            "Thanh toán chuyển khoản theo đơn đã tắt. Vui lòng dùng số dư ví.",
        },
        { status: 400 },
      );
    }

    // Path 1: KHÔNG có voucher
    if (!voucherCode || typeof voucherCode !== "string" || !voucherCode.trim()) {
      let order;
      try {
        order = await createOrder(
          cartItems,
          customerInfo,
          0,
          undefined,
          userId,
          customCreatedAt,
          typeof locale === "string" ? locale : undefined,
          clientMeta,
          termsConsent,
        );
      } catch (err) {
        if (err instanceof NoActiveBankAccountError) {
          return NextResponse.json(
            {
              error: "Chưa cấu hình tài khoản ngân hàng nhận thanh toán",
              code: "NO_ACTIVE_BANK_ACCOUNT",
            },
            { status: 503 },
          );
        }
        throw err;
      }

      if (!order) {
        notifyFraudAttempt({
          reason: "create_order_failed",
          ip,
          email: customerInfo.customerEmail,
          userAgent,
        });
        return NextResponse.json(
          { error: "Không thể tạo đơn hàng. Vui lòng kiểm tra lại giỏ hàng." },
          { status: 400 },
        );
      }

      // Forensics: record IP behind this order (fault-tolerant).
      await logUserIp({
        userId,
        email: customerInfo.customerEmail,
        eventType: "checkout",
        ip,
        userAgent,
        orderId: order.id,
        country: reqCountry,
        fingerprint: reqFingerprint,
        did: reqDid,
        path: `checkout:${order.orderNumber}`,
      });

      return NextResponse.json(
        {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
        { status: 201 },
      );
    }

    // Path 2: CÓ voucher — validate + consume + tạo order trong cùng transaction
    const code = voucherCode.trim();
    const productIds = cartItems.map((i) => i.id);
    const productMap = await fetchProductMap(productIds);

    let orderItems;
    try {
      orderItems = buildValidatedOrderItems(cartItems, productMap);
    } catch (err) {
      if (err instanceof OrderValidationError) {
        return validationErrorResponse(
          err.code,
          ip,
          customerInfo.customerEmail,
          userAgent,
        );
      }
      throw err;
    }

    const subtotal = computeOrderSubtotal(orderItems);
    try {
      assertPositiveSubtotal(subtotal);
    } catch (err) {
      if (err instanceof OrderValidationError) {
        return validationErrorResponse(
          err.code,
          ip,
          customerInfo.customerEmail,
          userAgent,
        );
      }
      throw err;
    }

    const preview = await validateVoucherPreview({
      code,
      subtotal,
      productIds,
      customerEmail: customerInfo.customerEmail,
      userId,
    });
    if (!preview.ok) {
      return NextResponse.json(
        {
          error: preview.message,
          voucherError: preview.error,
        },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber(orderItems.map((i) => i.price));
    const { memo: paymentMemo, token: paymentToken } = generatePaymentMemo();
    const orderId = nanoid();
    const safeLocale =
      typeof locale === "string" && SUPPORTED_LOCALES.has(locale) ? locale : "vi";

    let bankSnap;
    try {
      bankSnap = toBankSnapshot(await assignBankAccountForPayment());
    } catch (err) {
      if (err instanceof NoActiveBankAccountError) {
        return NextResponse.json(
          {
            error: "Chưa cấu hình tài khoản ngân hàng nhận thanh toán",
            code: "NO_ACTIVE_BANK_ACCOUNT",
          },
          { status: 503 },
        );
      }
      throw err;
    }

    const result = await db.transaction(async (tx) => {
      const lockedRows = await tx
        .select()
        .from(affiliateVoucherTable)
        .where(eq(affiliateVoucherTable.code, code))
        .for("update");
      const voucher = lockedRows[0];
      if (!voucher) {
        throw new Error("VOUCHER_NOT_FOUND");
      }

      const now = new Date();
      if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
        throw new Error(`VOUCHER_${voucher.status.toUpperCase()}`);
      }
      if (voucher.validFrom && voucher.validFrom > now) {
        throw new Error("VOUCHER_NOT_YET_VALID");
      }
      if (voucher.validUntil && voucher.validUntil < now) {
        throw new Error("VOUCHER_EXPIRED");
      }
      if (voucher.usedCount >= voucher.maxUses) {
        throw new Error("VOUCHER_USED_UP");
      }

      const discount = computeDiscount(voucher, subtotal);
      const total = subtotal - discount;
      if (total <= 0) {
        throw new Error("INVALID_SUBTOTAL");
      }

      const orderData: OrderInsert = {
        id: orderId,
        userId,
        orderNumber,
        items: orderItems,
        subtotal,
        discount,
        discountCode: voucher.code,
        total,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        notes: customerInfo.notes,
        locale: safeLocale,
        clientIp: ip,
        userAgent,
        termsAcceptedAt: termsConsent.termsAcceptedAt,
        termsVersion: termsConsent.termsVersion,
        paymentMemo,
        paymentToken,
        bankAccountId: bankSnap.bankAccountId,
        bankName: bankSnap.bankName,
        bankCode: bankSnap.bankCode,
        bankAccountNumber: bankSnap.bankAccountNumber,
        bankAccountName: bankSnap.bankAccountName,
        createdAt: customCreatedAt || new Date(),
        updatedAt: new Date(),
      };
      const insertedOrders = await tx
        .insert(orderTable)
        .values(orderData)
        .returning();
      const order = insertedOrders[0];
      if (!order) throw new Error("ORDER_INSERT_FAILED");

      try {
        await tx.insert(affiliateVoucherRedemptionTable).values({
          id: nanoid(),
          voucherId: voucher.id,
          orderId: order.id,
          userId: userId ?? null,
          customerEmail: customerInfo.customerEmail,
          subtotalAtRedemption: subtotal,
          discountApplied: discount,
          ipAddress: ip,
          userAgent,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("uniq_voucher_order") || msg.includes("duplicate key")) {
          throw new Error("VOUCHER_ALREADY_APPLIED_ON_ORDER");
        }
        throw e;
      }

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

      return { order, discount };
    });

    // Forensics: record IP behind this order (fault-tolerant).
    await logUserIp({
      userId,
      email: customerInfo.customerEmail,
      eventType: "checkout",
      ip,
      userAgent,
      orderId: result.order.id,
      country: reqCountry,
      fingerprint: reqFingerprint,
      did: reqDid,
      path: `checkout:${result.order.orderNumber}`,
    });

    return NextResponse.json(
      {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        total: result.order.total,
        subtotal: result.order.subtotal,
        discount: result.discount,
        discountCode: result.order.discountCode,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("VOUCHER_")) {
      const map: Record<string, string> = {
        VOUCHER_NOT_FOUND: "Mã voucher không tồn tại",
        VOUCHER_DISABLED: "Mã voucher đã bị vô hiệu hoá",
        VOUCHER_EXPIRED: "Mã voucher đã hết hạn",
        VOUCHER_USED_UP: "Mã voucher đã hết lượt sử dụng",
        VOUCHER_NOT_YET_VALID: "Mã voucher chưa đến thời gian sử dụng",
        VOUCHER_ALREADY_APPLIED_ON_ORDER: "Mã đã được áp cho đơn này",
      };
      return NextResponse.json(
        { error: map[msg] ?? "Voucher không hợp lệ", voucherError: msg },
        { status: 400 },
      );
    }
    if (msg === "INVALID_SUBTOTAL") {
      return validationErrorResponse("INVALID_SUBTOTAL", ip, undefined, userAgent);
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống, vui lòng thử lại" },
      { status: 500 },
    );
  }
}
