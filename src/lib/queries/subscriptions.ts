import "server-only";
import { eq, lt, gt, and, desc, count, ilike, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { subscriptionTable } from "~/db/schema/subscriptions/tables";
import { productTable } from "~/db/schema/products/tables";
import { orderTable } from "~/db/schema/orders/tables";
import { encryptAccountCredential } from "~/lib/security/crypto";

// Chỉ gửi reminder cho gói có thời hạn >= 30 ngày.
// Gói ngắn ngày (vd 6 ngày) đời sống quá ngắn để có ý nghĩa nhắc trước 3 ngày
// (khách vừa mua hôm trước đã được nhắc → quấy rầy).
// Đặt const ở đây để code subscription/activation cùng tham chiếu một nguồn.
export const REMINDER_MIN_PLAN_DAYS = 30;
import type { 
  Subscription, 
  SubscriptionInsert, 
  SubscriptionUpdate,
  SubscriptionWithDetails 
} from "~/db/schema/subscriptions/types";

/**
 * get all expired subscriptions that are still active
 */
export async function getExpiredSubscriptions(): Promise<SubscriptionWithDetails[]> {
  try {
    const now = new Date();
    
    const expired = await db
      .select({
        id: subscriptionTable.id,
        orderId: subscriptionTable.orderId,
        productId: subscriptionTable.productId,
        username: subscriptionTable.username,
        password: subscriptionTable.password,
        assignedAt: subscriptionTable.assignedAt,
        expiresAt: subscriptionTable.expiresAt,
        isActive: subscriptionTable.isActive,
        isExpired: subscriptionTable.isExpired,
        customerEmail: subscriptionTable.customerEmail,
        productName: subscriptionTable.productName,
        createdAt: subscriptionTable.createdAt,
        updatedAt: subscriptionTable.updatedAt,
      })
      .from(subscriptionTable)
      .where(and(
        lt(subscriptionTable.expiresAt, now), // đã hết hạn
        eq(subscriptionTable.isActive, true), // vẫn đang active
        eq(subscriptionTable.isExpired, false) // chưa được đánh dấu expired
      ))
      .orderBy(desc(subscriptionTable.expiresAt));

    return expired;
  } catch (error) {
    console.error("Failed to get expired subscriptions:", error);
    return [];
  }
}

/**
 * get subscriptions expiring soon (within next N days)
 */
export async function getSubscriptionsExpiringSoon(days: number = 7): Promise<SubscriptionWithDetails[]> {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const expiringSoon = await db
      .select({
        id: subscriptionTable.id,
        orderId: subscriptionTable.orderId,
        productId: subscriptionTable.productId,
        username: subscriptionTable.username,
        password: subscriptionTable.password,
        assignedAt: subscriptionTable.assignedAt,
        expiresAt: subscriptionTable.expiresAt,
        isActive: subscriptionTable.isActive,
        isExpired: subscriptionTable.isExpired,
        customerEmail: subscriptionTable.customerEmail,
        productName: subscriptionTable.productName,
        createdAt: subscriptionTable.createdAt,
        updatedAt: subscriptionTable.updatedAt,
      })
      .from(subscriptionTable)
      .where(and(
        lt(subscriptionTable.expiresAt, futureDate), // hết hạn trong vòng N ngày
        gt(subscriptionTable.expiresAt, now), // chưa hết hạn
        eq(subscriptionTable.isActive, true), // vẫn đang active
        eq(subscriptionTable.isExpired, false) // chưa được đánh dấu expired
      ))
      .orderBy(subscriptionTable.expiresAt);

    return expiringSoon;
  } catch (error) {
    console.error("Failed to get subscriptions expiring soon:", error);
    return [];
  }
}

/**
 * mark subscriptions as expired and return credentials to product pool
 */
export async function markSubscriptionsAsExpired(subscriptionIds: string[]): Promise<boolean> {
  try {
    if (subscriptionIds.length === 0) return true;

    // get subscriptions với product info
    const subscriptions = await db
      .select()
      .from(subscriptionTable)
      .where(and(
        eq(subscriptionTable.isActive, true),
        eq(subscriptionTable.isExpired, false)
      ));

    const expiredSubscriptions = subscriptions.filter(sub => subscriptionIds.includes(sub.id));

    if (expiredSubscriptions.length === 0) return true;

    await db.transaction(async (tx) => {
      // mark subscriptions as expired
      for (const subId of subscriptionIds) {
        await tx
          .update(subscriptionTable)
          .set({
            isActive: false,
            isExpired: true,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionTable.id, subId));
      }

      // return credentials to product pools (email-only for accounts; license key for licenses)
      for (const subscription of expiredSubscriptions) {
        const credential =
          subscription.username === "License Key"
            ? subscription.password
            : subscription.username;
        if (!credential) continue;
        await returnCredentialToProduct(tx, subscription.productId, credential);
      }
    });

    console.log(`Marked ${expiredSubscriptions.length} subscriptions as expired and returned credentials to pool`);
    return true;
  } catch (error) {
    console.error("Failed to mark subscriptions as expired:", error);
    return false;
  }
}

/**
 * return a credential back to product's available pool
 */
async function returnCredentialToProduct(tx: any, productId: string, credential: string): Promise<void> {
  try {
    const product = await tx
      .select({ accountCredentials: productTable.accountCredentials })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product[0]) return;

    const currentCredentials = (product[0].accountCredentials as string[]) || [];
    const toStore = encryptAccountCredential(credential);

    if (!currentCredentials.includes(toStore) && !currentCredentials.includes(credential)) {
      await tx
        .update(productTable)
        .set({
          accountCredentials: [...currentCredentials, toStore],
          updatedAt: new Date(),
        })
        .where(eq(productTable.id, productId));
    }
  } catch (error) {
    console.error("Failed to return credential to product:", error);
  }
}

/**
 * get subscription statistics
 */
export async function getSubscriptionStats() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalActive,
      totalExpired,
      expiringSoon,
    ] = await Promise.all([
      // total active subscriptions
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
      
      // total expired (but not yet processed)
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          lt(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
      
      // expiring in next 7 days
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          lt(subscriptionTable.expiresAt, sevenDaysFromNow),
          gt(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
    ]);

    return {
      totalActive: totalActive[0]?.count || 0,
      totalExpired: totalExpired[0]?.count || 0,
      expiringSoon: expiringSoon[0]?.count || 0,
    };
  } catch (error) {
    console.error("Failed to get subscription stats:", error);
    return {
      totalActive: 0,
      totalExpired: 0,
      expiringSoon: 0,
    };
  }
}

/**
 * get all subscriptions with pagination and filters
 */
export interface SubscriptionsFilter {
  page: number;
  limit: number;
  status?: 'active' | 'expired' | 'expiring_soon';
  productId?: string;
  customerEmail?: string;
  username?: string;
  search?: string; // tìm kiếm chung (email hoặc username)
}

/**
 * get subscriptions that need reminder emails (3 days or 1 day before expiration)
 */
export async function getSubscriptionsNeedingReminders(daysBeforeExpiry: number): Promise<SubscriptionWithDetails[]> {
  try {
    const now = new Date();
    
    // calculate the target date range (expiring in exactly daysBeforeExpiry days, +/- 12 hours buffer)
    const targetDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);
    const minDate = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000); // 12 hours before
    const maxDate = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000); // 12 hours after

    // determine which reminder field to check
    const reminderField = daysBeforeExpiry === 3 
      ? subscriptionTable.reminder3DaySentAt 
      : subscriptionTable.reminder1DaySentAt;

    const subscriptions = await db
      .select({
        id: subscriptionTable.id,
        orderId: subscriptionTable.orderId,
        productId: subscriptionTable.productId,
        username: subscriptionTable.username,
        password: subscriptionTable.password,
        assignedAt: subscriptionTable.assignedAt,
        expiresAt: subscriptionTable.expiresAt,
        isActive: subscriptionTable.isActive,
        isExpired: subscriptionTable.isExpired,
        customerEmail: subscriptionTable.customerEmail,
        productName: subscriptionTable.productName,
        reminder3DaySentAt: subscriptionTable.reminder3DaySentAt,
        reminder1DaySentAt: subscriptionTable.reminder1DaySentAt,
        createdAt: subscriptionTable.createdAt,
        updatedAt: subscriptionTable.updatedAt,
      })
      .from(subscriptionTable)
      .where(and(
        gt(subscriptionTable.expiresAt, minDate),
        lt(subscriptionTable.expiresAt, maxDate),
        eq(subscriptionTable.isActive, true),
        eq(subscriptionTable.isExpired, false),
        // Chỉ gửi reminder cho gói có thời hạn >= REMINDER_MIN_PLAN_DAYS ngày.
        // Tính trực tiếp từ (expires_at - assigned_at) để không cần JOIN
        // bảng product (tránh N+1 và double-source-of-truth nếu admin đổi
        // duration sản phẩm sau khi đã assign).
        sql`(${subscriptionTable.expiresAt} - ${subscriptionTable.assignedAt}) >= make_interval(days => ${REMINDER_MIN_PLAN_DAYS})`,
      ))
      .orderBy(subscriptionTable.expiresAt);

    // filter out subscriptions that already received this reminder
    const needsReminder = subscriptions.filter(sub => {
      if (daysBeforeExpiry === 3) {
        return !sub.reminder3DaySentAt;
      } else {
        return !sub.reminder1DaySentAt;
      }
    });

    return needsReminder as SubscriptionWithDetails[];
  } catch (error) {
    console.error(`Failed to get subscriptions needing ${daysBeforeExpiry}-day reminders:`, error);
    return [];
  }
}

/**
 * mark reminder as sent for a subscription
 */
export async function markReminderSent(
  subscriptionId: string, 
  reminderType: '3day' | '1day'
): Promise<boolean> {
  try {
    const updateData = reminderType === '3day'
      ? { reminder3DaySentAt: new Date(), updatedAt: new Date() }
      : { reminder1DaySentAt: new Date(), updatedAt: new Date() };

    await db
      .update(subscriptionTable)
      .set(updateData)
      .where(eq(subscriptionTable.id, subscriptionId));

    return true;
  } catch (error) {
    console.error(`Failed to mark ${reminderType} reminder as sent:`, error);
    return false;
  }
}

/**
 * process and send expiration reminder emails
 *
 * Bao gồm 2 nguồn:
 *  1) `subscription` table - đơn account/license tạo sub row khi paid.
 *  2) `activation_job` table - đơn login_link không có sub row, expiry =
 *     completedAt + planDays * 1d. Chỉ scan job status='success' planDays>=30.
 *
 * Filter chung: chỉ gói có thời hạn >= REMINDER_MIN_PLAN_DAYS ngày
 * (default 30). Gói ngắn ngày được skip.
 *
 * Idempotent: dùng cờ reminder_3day_sent_at / reminder_1day_sent_at để không
 * gửi trùng nếu cron bị chạy nhiều lần trong ngày.
 */
export async function processExpirationReminders(): Promise<{
  processed3Day: number;
  processed1Day: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed3Day = 0;
  let processed1Day = 0;

  try {
    // dynamic import để tránh circular dependency
    const { sendSubscriptionExpirationReminder } = await import("~/lib/email-service");

    // ===== Helper inner =====
    const sendOne = async (params: {
      customerEmail: string;
      productName: string;
      username: string;
      expiresAt: Date;
      daysLeft: 1 | 3;
      locale: string | undefined;
    }): Promise<boolean> => {
      const ok = await sendSubscriptionExpirationReminder(params);
      // throttle nhẹ giữa các email để tránh Brevo rate limit khi batch lớn
      await new Promise((resolve) => setTimeout(resolve, 200));
      return ok;
    };

    // ============================================================
    // (1) Subscription rows (account / license)
    // ============================================================
    for (const daysLeft of [3, 1] as const) {
      const subs = await getSubscriptionsNeedingReminders(daysLeft);
      console.log(
        `[reminder] subscription needing ${daysLeft}-day: ${subs.length}`,
      );
      for (const sub of subs) {
        try {
          let locale: string | undefined = undefined;
          if (sub.orderId) {
            const [ord] = await db
              .select({ locale: orderTable.locale })
              .from(orderTable)
              .where(eq(orderTable.id, sub.orderId))
              .limit(1);
            locale = ord?.locale ?? undefined;
          }

          const sent = await sendOne({
            customerEmail: sub.customerEmail,
            productName: sub.productName,
            username: sub.username,
            expiresAt: sub.expiresAt,
            daysLeft,
            locale,
          });

          if (sent) {
            await markReminderSent(sub.id, daysLeft === 3 ? "3day" : "1day");
            if (daysLeft === 3) processed3Day++;
            else processed1Day++;
          } else {
            errors.push(
              `Failed sub-${daysLeft}d reminder to ${sub.customerEmail}`,
            );
          }
        } catch (err) {
          errors.push(
            `Error sub-${daysLeft}d for ${sub.customerEmail}: ${err}`,
          );
        }
      }
    }

    console.log(
      `[reminder] DONE: 3-day=${processed3Day}, 1-day=${processed1Day}, errors=${errors.length}`,
    );

    return { processed3Day, processed1Day, errors };
  } catch (error) {
    console.error("Failed to process expiration reminders:", error);
    errors.push(`General error: ${error}`);
    return { processed3Day, processed1Day, errors };
  }
}

export async function getAllSubscriptionsPaginated(filter: SubscriptionsFilter) {
  try {
    const offset = (filter.page - 1) * filter.limit;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // build where conditions
    const conditions: any[] = [];

    if (filter.status === 'active') {
      conditions.push(
        and(
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false),
          gt(subscriptionTable.expiresAt, now)
        )
      );
    } else if (filter.status === 'expired') {
      conditions.push(
        and(
          lt(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )
      );
    } else if (filter.status === 'expiring_soon') {
      conditions.push(
        and(
          lt(subscriptionTable.expiresAt, sevenDaysFromNow),
          gt(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )
      );
    }

    if (filter.productId) {
      conditions.push(eq(subscriptionTable.productId, filter.productId));
    }

    if (filter.customerEmail) {
      conditions.push(ilike(subscriptionTable.customerEmail, `%${filter.customerEmail}%`));
    }

    if (filter.username) {
      conditions.push(ilike(subscriptionTable.username, `%${filter.username}%`));
    }

    // tìm kiếm chung (email, username, hoặc mã đơn hàng orderNumber)
    if (filter.search) {
      conditions.push(
        or(
          ilike(subscriptionTable.customerEmail, `%${filter.search}%`),
          ilike(subscriptionTable.username, `%${filter.search}%`),
          ilike(orderTable.orderNumber, `%${filter.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // get subscriptions with order info (join để lấy orderNumber)
    const [subscriptions, totalResult] = await Promise.all([
      db
        .select({
          id: subscriptionTable.id,
          orderId: subscriptionTable.orderId,
          orderNumber: orderTable.orderNumber, // mã đơn hàng thực tế
          productId: subscriptionTable.productId,
          username: subscriptionTable.username,
          password: subscriptionTable.password,
          assignedAt: subscriptionTable.assignedAt,
          expiresAt: subscriptionTable.expiresAt,
          isActive: subscriptionTable.isActive,
          isExpired: subscriptionTable.isExpired,
          customerEmail: subscriptionTable.customerEmail,
          productName: subscriptionTable.productName,
          createdAt: subscriptionTable.createdAt,
          updatedAt: subscriptionTable.updatedAt,
        })
        .from(subscriptionTable)
        .leftJoin(orderTable, eq(subscriptionTable.orderId, orderTable.id))
        .where(whereClause)
        .orderBy(desc(subscriptionTable.createdAt))
        .limit(filter.limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(subscriptionTable)
        .leftJoin(orderTable, eq(subscriptionTable.orderId, orderTable.id))
        .where(whereClause)
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      subscriptions,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  } catch (error) {
    console.error("Failed to get subscriptions:", error);
    return {
      subscriptions: [],
      total: 0,
      page: filter.page,
      limit: filter.limit,
      totalPages: 0,
    };
  }
} 