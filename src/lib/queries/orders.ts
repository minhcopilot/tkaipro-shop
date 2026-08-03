import "server-only";
import { eq, desc, or, and, ilike, count, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { 
  Order, 
  OrderInsert,
  OrderUpdate,
  SepayTransaction,
  SepayTransactionInsert,
  CheckoutFormData
} from "~/db/schema/orders/types";
import type { CartItem } from "~/lib/hooks/use-cart";
import {
  assertPositiveSubtotal,
  buildValidatedOrderItems,
  computeOrderSubtotal,
  type DbProductForOrder,
  OrderValidationError,
} from "~/lib/security/order-validation";

import { db } from "~/db";
import { orderTable, sepayTransactionTable, productTable } from "~/db/schema";
import { generateOrderNumber, ORDER_RANDOM_LEN } from "~/lib/order-number";
import {
  extractPaymentTokens,
  generatePaymentMemo,
} from "~/lib/payment/transfer-memos";
import {
  assignBankAccountForPayment,
  NoActiveBankAccountError,
  toBankSnapshot,
} from "~/lib/queries/bank-accounts";

function isUniqueViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("duplicate key") || msg.includes("unique constraint");
}

export { NoActiveBankAccountError };

// ORDER QUERIES

/**
 * tạo đơn hàng mới từ giỏ hàng
 */
export async function createOrder(
  cartItems: CartItem[],
  formData: CheckoutFormData,
  discount: number = 0,
  discountCode?: string,
  userId?: string,
  customCreatedAt?: Date,
  locale?: string,
  clientMeta?: { clientIp?: string; userAgent?: string },
  termsConsent?: { termsAcceptedAt: Date; termsVersion: string },
): Promise<Order | null> {
  try {
    const id = nanoid();

    const productIds = cartItems.map((item) => item.id);
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

    const productMap = new Map<string, DbProductForOrder>(
      dbProducts.map((p) => [p.id, p]),
    );

    const orderItems = buildValidatedOrderItems(cartItems, productMap);
    const orderNumber = generateOrderNumber(orderItems.map((item) => item.price));
    const subtotal = computeOrderSubtotal(orderItems);
    assertPositiveSubtotal(subtotal);

    // SECURITY: clamp discount vào [0, subtotal] - phòng caller truyền giá trị bẩn
    // (discount âm => total > subtotal, discount > subtotal => total < 0).
    // API route hiện force discount = 0; layer này là lớp defense-in-depth.
    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal));
    const total = subtotal - safeDiscount;

    // chuẩn hoá locale: chỉ chấp nhận trong whitelist; rơi mặc định về 'vi'.
    const SUPPORTED_LOCALES = new Set([
      "vi", "en", "ru", "zh", "ar", "es", "fr", "de", "ja", "ko", "pt",
    ]);
    const safeLocale = locale && SUPPORTED_LOCALES.has(locale) ? locale : "vi";

    // Gắn cứng TK lúc tạo đơn bank_transfer (QR không đổi giữa chừng)
    const bank = await assignBankAccountForPayment();
    const bankSnap = toBankSnapshot(bank);

    for (let attempt = 0; attempt < 5; attempt++) {
      const { memo: paymentMemo, token: paymentToken } = generatePaymentMemo();
      const orderData: OrderInsert = {
        id,
        userId,
        orderNumber,
        items: orderItems,
        subtotal,
        discount: safeDiscount,
        discountCode,
        total,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
        locale: safeLocale,
        clientIp: clientMeta?.clientIp,
        userAgent: clientMeta?.userAgent,
        termsAcceptedAt: termsConsent?.termsAcceptedAt,
        termsVersion: termsConsent?.termsVersion,
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

      try {
        const result = await db
          .insert(orderTable)
          .values(orderData)
          .returning();
        return result[0] ?? null;
      } catch (insertErr) {
        if (isUniqueViolation(insertErr) && attempt < 4) continue;
        throw insertErr;
      }
    }

    return null;
  } catch (error) {
    if (error instanceof NoActiveBankAccountError) {
      throw error;
    }
    if (error instanceof OrderValidationError) {
      console.warn("Order validation rejected:", error.code);
      return null;
    }
    console.error("Failed to create order:", error);
    return null;
  }
}

/**
 * lấy đơn hàng theo ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const result = await db.query.orderTable.findFirst({
      where: eq(orderTable.id, orderId),
    });

    return result ?? null;
  } catch (error) {
    console.error("Failed to get order:", error);
    return null;
  }
}

/**
 * lấy đơn hàng theo order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const result = await db.query.orderTable.findFirst({
      where: eq(orderTable.orderNumber, orderNumber),
    });

    return result ?? null;
  } catch (error) {
    console.error("Failed to get order by number:", error);
    return null;
  }
}

/**
 * đồng bộ productType trong items của order từ giá trị hiện tại trong db
 * dùng cho đơn đã tạo trước khi admin đổi productType của sản phẩm
 * (ví dụ: đơn cũ snapshot productType="account", sau đó admin đổi thành "login_link")
 * trả về order đã được update, hoặc null nếu không cần update / lỗi
 */
export async function syncOrderItemsProductType(order: Order): Promise<Order | null> {
  try {
    if (!order.items?.length) return null;

    const productIds = order.items.map((item) => item.id);
    const dbProducts = await db
      .select({
        id: productTable.id,
        productType: productTable.productType,
      })
      .from(productTable)
      .where(inArray(productTable.id, productIds));

    const productTypeMap = new Map(dbProducts.map((p) => [p.id, p.productType]));

    let changed = false;
    const refreshedItems = order.items.map((item) => {
      const currentType = productTypeMap.get(item.id);
      if (currentType && currentType !== item.productType) {
        changed = true;
        return { ...item, productType: currentType as typeof item.productType };
      }
      return item;
    });

    if (!changed) return order;

    const result = await db
      .update(orderTable)
      .set({ items: refreshedItems, updatedAt: new Date() })
      .where(eq(orderTable.id, order.id))
      .returning();

    console.log(`Synced productType for order ${order.orderNumber}`);
    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to sync order items productType:", error);
    return null;
  }
}

/**
 * cập nhật đơn hàng
 */
export async function updateOrder(orderId: string, data: OrderUpdate): Promise<Order | null> {
  try {
    // Lấy snapshot trước khi update để biết transition của paymentStatus.
    // Cần để không double-count salesCount khi admin set paid → unpaid → paid lần nữa.
    const prev = await db.query.orderTable.findFirst({
      where: eq(orderTable.id, orderId),
      columns: { paymentStatus: true, items: true },
    });

    const result = await db
      .update(orderTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orderTable.id, orderId))
      .returning();

    const updated = result[0] ?? null;

    if (
      updated &&
      prev &&
      prev.paymentStatus !== "paid" &&
      updated.paymentStatus === "paid"
    ) {
      try {
        const { incrementProductSales } = await import("~/lib/queries/products");
        await incrementProductSales(updated.items);
      } catch (err) {
        console.error("incrementProductSales (updateOrder) failed:", err);
      }
    }

    return updated;
  } catch (error) {
    console.error("Failed to update order:", error);
    return null;
  }
}

/**
 * cập nhật trạng thái thanh toán
 */
export async function updatePaymentStatus(
  orderId: string, 
  paymentStatus: 'pending' | 'paid' | 'failed',
  sepayData?: {
    transactionId?: string;
    reference?: string;
    qrCode?: string;
  }
): Promise<Order | null> {
  try {
    const updateData: OrderUpdate = {
      paymentStatus,
      updatedAt: new Date(),
    };

    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
      updateData.status = 'processing';
    }

    if (sepayData) {
      if (sepayData.transactionId) updateData.sepayTransactionId = sepayData.transactionId;
      if (sepayData.reference) updateData.sepayReference = sepayData.reference;  
      if (sepayData.qrCode) updateData.sepayQrCode = sepayData.qrCode;
    }

    const result = await db
      .update(orderTable)
      .set(updateData)
      .where(eq(orderTable.id, orderId))
      .returning();

    const updated = result[0] ?? null;

    // SePay webhook đã guard `if (order.paymentStatus === 'paid') return` trước
    // khi gọi hàm này, nên đây là transition pending/failed → paid duy nhất.
    if (updated && paymentStatus === "paid") {
      try {
        const { incrementProductSales } = await import("~/lib/queries/products");
        await incrementProductSales(updated.items);
      } catch (err) {
        console.error("incrementProductSales (updatePaymentStatus) failed:", err);
      }
    }

    return updated;
  } catch (error) {
    console.error("Failed to update payment status:", error);
    return null;
  }
}

// SEPAY TRANSACTION QUERIES

/**
 * tạo SePay transaction từ webhook
 */
export async function createSepayTransaction(
  webhookData: any,
  orderId?: string
): Promise<SepayTransaction | null> {
  try {
    const id = nanoid();
    
    const transactionData: SepayTransactionInsert = {
      id,
      orderId,
      gateway: webhookData.gateway,
      transactionDate: new Date(webhookData.transactionDate),
      accountNumber: webhookData.accountNumber,
      subAccount: webhookData.subAccount,
      transferType: webhookData.transferType,
      transferAmount: webhookData.transferAmount,
      accumulated: webhookData.accumulated,
      code: webhookData.code,
      content: webhookData.content,
      referenceCode: webhookData.referenceCode,
      description: webhookData.description,
      rawData: webhookData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(sepayTransactionTable)
      .values(transactionData)
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to create SePay transaction:", error);
    return null;
  }
}

/**
 * Tìm đơn pending theo mã ẩn 8 ký tự trong nội dung webhook.
 */
export async function findOrderByPaymentToken(
  content: string,
): Promise<Order | null> {
  try {
    const tokens = extractPaymentTokens(content);
    if (tokens.length === 0) return null;

    for (const token of tokens) {
      const rows = await db
        .select()
        .from(orderTable)
        .where(
          and(
            eq(orderTable.paymentToken, token),
            eq(orderTable.paymentStatus, "pending"),
          ),
        )
        .limit(1);
      if (rows[0]) {
        console.log(
          "Order found (payment token):",
          rows[0].orderNumber,
          "token:",
          token,
        );
        return rows[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to find order by payment token:", error);
    return null;
  }
}

/**
 * tìm đơn hàng từ nội dung chuyển khoản
 */
export async function findOrderByTransactionContent(content: string): Promise<Order | null> {
  try {
    console.log("Searching order by transaction content:", content);

    // extract order number tu noi dung chuyen khoan (ho tro ca ma ngan gon khong co ord)
    const normalizedContent = content.toUpperCase();
    const candidateNumbers = new Set<string>();

    // 1) cho phép dấu _ vì mã đơn mới có hậu tố kiểu _99K_1499K để phân biệt loại sản phẩm
    const prefixedMatches = [...normalizedContent.matchAll(/ORD[A-Z0-9_]{8,}/g)];
    for (const m of prefixedMatches) {
      candidateNumbers.add(m[0]);
      // fallback cho đơn cũ: tách phần trước _ đầu tiên (mã không có hậu tố)
      const baseCode = m[0].split("_")[0];
      if (baseCode && baseCode !== m[0]) {
        candidateNumbers.add(baseCode);
      }
    }

    // 2) short code fallback: matchAll thay vì match đầu tiên
    // vì MoMo/ví điện tử thường nhét ref số (kiểu 125XXXXXXXXX) trước mã đơn thật
    // → match đầu tiên rơi vào ref number, cần thử hết mọi block alnum >=10 ký tự
    const shortCodeMatches = [...normalizedContent.matchAll(/[A-Z0-9_]{10,}/g)];
    for (const m of shortCodeMatches) {
      const shortCode = m[0].replace(/^ORD/, "");
      candidateNumbers.add(`ORD${shortCode}`);
    }

    for (const candidate of candidateNumbers) {
      const order = await getOrderByNumber(candidate);
      if (order) {
        console.log("Order found (exact):", order.orderNumber, "paymentStatus:", order.paymentStatus);
        return order;
      }
    }

    // 3) fallback: sepay/ngân hàng có thể strip dấu "_" khỏi nội dung
    // ví dụ: ORD9XPKN538I5_399K -> content chỉ còn "ORD9XPKN538I5399K"
    // giải pháp: rút phần base (prefix + random) rồi query LIKE để tìm đơn cùng prefix.
    //
    // LƯU Ý: dùng matchAll + iterate tất cả. MoMo nội dung kiểu:
    //   "125916522983-94111011835J99K-CHUYEN TIEN-OQCH000AEYII-MOMO125916522983MOMO"
    // regex match đầu tiên có thể rơi vào ref MoMo chứ không phải mã đơn thật.
    // Phải thử tất cả match, lấy cái nào có order trong db. Prefix LIKE sẽ khớp
    // phần trước hậu tố `_giáK`.
    const basePrefixes: string[] = [];
    const addBasePrefix = (p: string) => basePrefixes.push(p);

    // Mã MỚI: `ORD` + 10 random (không còn timestamp). Trường hợp strip dấu `_`
    // nhưng giữ "ORD" -> base = "ORD"+10 ký tự đầu.
    for (const m of normalizedContent.matchAll(
      new RegExp(`ORD[A-Z0-9]{${ORDER_RANDOM_LEN}}`, "g"),
    )) {
      addBasePrefix(m[0]);
    }
    // Mã MỚI khi strip CẢ "ORD" lẫn "_": ghép "ORD" + 10 ký tự đầu của mỗi block
    // alnum. ORD + random là rất đặc trưng nên prefix LIKE gần như không đụng nhầm.
    for (const m of normalizedContent.matchAll(/[A-Z0-9]{10,}/g)) {
      addBasePrefix(`ORD${m[0].slice(0, ORDER_RANDOM_LEN)}`);
    }
    // Mã CŨ (legacy): 8 số timestamp + 10 random crypto, hoặc + 4 random (cũ hơn).
    // Có thể bị strip cả "ORD". Thử pattern 10 trước (đặc trưng hơn) rồi 4.
    for (const m of normalizedContent.matchAll(/\d{8}[A-Z0-9]{10}/g)) {
      addBasePrefix(`ORD${m[0]}`);
    }
    for (const m of normalizedContent.matchAll(/\d{8}[A-Z0-9]{4}/g)) {
      addBasePrefix(`ORD${m[0]}`);
    }

    const seenBasePrefixes = new Set<string>();
    for (const basePrefix of basePrefixes) {
      if (seenBasePrefixes.has(basePrefix)) continue;
      seenBasePrefixes.add(basePrefix);
      try {
        const order = await db.query.orderTable.findFirst({
          where: ilike(orderTable.orderNumber, `${basePrefix}%`),
          orderBy: desc(orderTable.createdAt),
        });
        if (order) {
          console.log("Order found (prefix LIKE):", order.orderNumber, "paymentStatus:", order.paymentStatus, "basePrefix:", basePrefix);
          return order;
        }
      } catch (err) {
        console.error("Prefix LIKE lookup failed for", basePrefix, err);
      }
    }

    if (!candidateNumbers.size && !basePrefixes.length) {
      console.log("No order number found in content:", content);
      return null;
    }

    console.log(
      "Order not found. Candidates:",
      Array.from(candidateNumbers).join(", "),
      "| basePrefixes tried:",
      Array.from(seenBasePrefixes).join(", "),
    );
    return null;
  } catch (error) {
    console.error("Failed to find order by transaction content:", error);
    return null;
  }
}

/**
 * đánh dấu transaction đã xử lý
 */
export async function markTransactionAsProcessed(transactionId: string): Promise<boolean> {
  try {
    await db
      .update(sepayTransactionTable)
      .set({ processed: true })
      .where(eq(sepayTransactionTable.id, transactionId));

    return true;
  } catch (error) {
    console.error("Failed to mark transaction as processed:", error);
    return false;
  }
} 

// ADMIN ORDER QUERIES

export interface OrdersFilter {
  page: number;
  limit: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  search?: string;
  // Lọc đơn chứa 1 sản phẩm cụ thể (match theo id trong JSON items).
  productId?: string;
  // Lọc theo loại khách: 'registered' = có userId (đăng nhập mua),
  // 'guest' = userId NULL (mua không đăng nhập).
  accountType?: 'registered' | 'guest';
}

export interface OrderStatusUpdate {
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  notes?: string;
  updatedBy?: string;
}

/**
 * get all orders with pagination and filters for admin
 */
export async function getAllOrdersPaginated(filter: OrdersFilter) {
  try {
    const offset = (filter.page - 1) * filter.limit;

    // build where conditions
    const conditions: any[] = [];

    if (filter.status) {
      conditions.push(eq(orderTable.status, filter.status));
    }

    if (filter.paymentStatus) {
      conditions.push(eq(orderTable.paymentStatus, filter.paymentStatus));
    }

    if (filter.search) {
      conditions.push(
        or(
          ilike(orderTable.orderNumber, `%${filter.search}%`),
          ilike(orderTable.customerName, `%${filter.search}%`),
          ilike(orderTable.customerEmail, `%${filter.search}%`)
        )
      );
    }

    // Lọc theo sản phẩm: đơn có item.id == productId trong JSON `items`.
    if (filter.productId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM json_array_elements(${orderTable.items}) AS e WHERE e->>'id' = ${filter.productId})`,
      );
    }

    // Lọc theo loại khách: đăng nhập (có userId) hoặc khách vãng lai (userId NULL).
    if (filter.accountType === 'registered') {
      conditions.push(isNotNull(orderTable.userId));
    } else if (filter.accountType === 'guest') {
      conditions.push(isNull(orderTable.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // get orders with count
    const [orders, totalResult] = await Promise.all([
      db
        .select()
        .from(orderTable)
        .where(whereClause)
        .orderBy(desc(orderTable.createdAt))
        .limit(filter.limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(orderTable)
        .where(whereClause)
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      orders,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  } catch (error) {
    console.error("Failed to get orders:", error);
    return {
      orders: [],
      total: 0,
      page: filter.page,
      limit: filter.limit,
      totalPages: 0,
    };
  }
}

/**
 * update order status/payment status (admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  updates: OrderStatusUpdate
): Promise<Order | null> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.paymentStatus) {
      updateData.paymentStatus = updates.paymentStatus;
      if (updates.paymentStatus === 'paid' && !updateData.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (updates.notes) {
      updateData.notes = updates.notes;
    }

    const result = await db
      .update(orderTable)
      .set(updateData)
      .where(eq(orderTable.id, orderId))
      .returning();

    const updatedOrder = result[0];

    // nếu order đã thanh toán và completed, tự động gán credentials
    if (
      updatedOrder && 
      updatedOrder.paymentStatus === 'paid' && 
      updatedOrder.status === 'completed'
    ) {
      const { autoAssignCredentials } = await import("~/lib/queries/credentials");
      const success = await autoAssignCredentials(updatedOrder.id);
      
      if (success) {
        console.log(`✅ Auto-assigned credentials for order ${updatedOrder.orderNumber}`);
        
        // query lại order để lấy assignedCredentials mới nhất
        const refreshedOrder = await db
          .select()
          .from(orderTable)
          .where(eq(orderTable.id, orderId))
          .limit(1);
        
        const finalOrder = refreshedOrder[0] ?? updatedOrder;
        
        // gửi email xác nhận đơn hàng và thông tin tài khoản cho khách hàng
        try {
          const { sendAdminOrderNotification } = await import("~/lib/email-service");
          const { sendOrderCredentialsEmail } = await import(
            "~/lib/fulfillment/send-order-credentials-email"
          );
          
          if (finalOrder.assignedCredentials && finalOrder.assignedCredentials.length > 0) {
            // Pass từ manager vault → email khách; không persist pass trên shop
            const result = await sendOrderCredentialsEmail({
              orderId: finalOrder.id,
              orderNumber: finalOrder.orderNumber,
              customerName: finalOrder.customerName,
              customerEmail: finalOrder.customerEmail,
              customerPhone: finalOrder.customerPhone || undefined,
              total: finalOrder.total,
              paymentMethod: finalOrder.paymentMethod,
              items: finalOrder.items,
              assignedCredentials: finalOrder.assignedCredentials,
              paidAt: finalOrder.paidAt || new Date(),
              locale: finalOrder.locale ?? undefined,
            });
            if (result.sent) {
              console.log(`✅ Customer confirmation email sent for order ${finalOrder.orderNumber}`);
            } else {
              console.warn(
                `⚠️ Customer confirmation skipped for ${finalOrder.orderNumber}:`,
                result.reason,
                result.missingEmails,
              );
            }
            
            // gửi email cho admin
            await sendAdminOrderNotification({
              orderNumber: finalOrder.orderNumber,
              customerName: finalOrder.customerName,
              customerEmail: finalOrder.customerEmail,
              customerPhone: finalOrder.customerPhone || undefined,
              total: finalOrder.total,
              paymentMethod: finalOrder.paymentMethod,
              items: finalOrder.items,
              paidAt: finalOrder.paidAt || new Date()
            });
            console.log(`✅ Admin notification email sent for order ${finalOrder.orderNumber}`);
          }
        } catch (emailError) {
          console.error(`Failed to send confirmation emails for order ${finalOrder.orderNumber}:`, emailError);
          // không fail update nếu email lỗi
        }
        
        return finalOrder;
      }
    }

    return updatedOrder ?? null;
  } catch (error) {
    console.error("Failed to update order status:", error);
    return null;
  }
}

// USER ORDER QUERIES

export interface UserOrdersFilter {
  page: number;
  limit: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
}

/**
 * get user's own orders with pagination and filters
 */
export async function getUserOrders(userId: string, filter: UserOrdersFilter) {
  try {
    const offset = (filter.page - 1) * filter.limit;

    // build where conditions
    const conditions: any[] = [
      eq(orderTable.userId, userId)
    ];

    if (filter.status) {
      conditions.push(eq(orderTable.status, filter.status));
    }

    if (filter.paymentStatus) {
      conditions.push(eq(orderTable.paymentStatus, filter.paymentStatus));
    }

    const whereClause = and(...conditions);

    // get orders with count
    const [orders, totalResult] = await Promise.all([
      db
        .select()
        .from(orderTable)
        .where(whereClause)
        .orderBy(desc(orderTable.createdAt))
        .limit(filter.limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(orderTable)
        .where(whereClause)
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      orders,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  } catch (error) {
    console.error("Failed to get user orders:", error);
    return {
      orders: [],
      total: 0,
      page: filter.page,
      limit: filter.limit,
      totalPages: 0,
    };
  }
}

// order with user avatar for social proof display
export type OrderWithAvatar = Order & {
  userAvatar?: string | null;
};

/**
 * get recent completed orders for social proof, with user avatars if available
 */
export async function getRecentCompletedOrders(days: number = 3, limit: number = 10): Promise<OrderWithAvatar[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { userTable } = await import("~/db/schema");

    const result = await db
      .select({
        id: orderTable.id,
        userId: orderTable.userId,
        orderNumber: orderTable.orderNumber,
        status: orderTable.status,
        items: orderTable.items,
        subtotal: orderTable.subtotal,
        discount: orderTable.discount,
        discountCode: orderTable.discountCode,
        total: orderTable.total,
        customerName: orderTable.customerName,
        customerEmail: orderTable.customerEmail,
        customerPhone: orderTable.customerPhone,
        paymentMethod: orderTable.paymentMethod,
        paymentStatus: orderTable.paymentStatus,
        sepayTransactionId: orderTable.sepayTransactionId,
        sepayReference: orderTable.sepayReference,
        sepayQrCode: orderTable.sepayQrCode,
        assignedCredentials: orderTable.assignedCredentials,
        notes: orderTable.notes,
        adminNotes: orderTable.adminNotes,
        createdAt: orderTable.createdAt,
        updatedAt: orderTable.updatedAt,
        paidAt: orderTable.paidAt,
        userAvatar: userTable.image,
      })
      .from(orderTable)
      .leftJoin(userTable, eq(orderTable.userId, userTable.id))
      .where(
        and(
          eq(orderTable.status, 'completed'),
          eq(orderTable.paymentStatus, 'paid')
        )
      )
      .orderBy(desc(orderTable.createdAt))
      .limit(limit * 2);

    const recentOrders = result.filter(order => new Date(order.createdAt) >= cutoffDate);
    
    return recentOrders.slice(0, limit);
  } catch (error) {
    console.error("Failed to get recent completed orders:", error);
    return [];
  }
} 