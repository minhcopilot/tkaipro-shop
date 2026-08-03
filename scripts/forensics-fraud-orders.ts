#!/usr/bin/env bun
/**
 * Forensics: kiểm tra đơn fake đã paid + có credentials được cấp chưa.
 * Chạy trên VPS hoặc local với DATABASE_URL trỏ production.
 *
 * usage:
 *   bun scripts/forensics-fraud-orders.ts
 */

import "dotenv/config";
import { and, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "../src/db";
import { orderTable } from "../src/db/schema";

async function main() {
  console.log("=".repeat(70));
  console.log("FORENSICS: paid fraud orders + credential leak check");
  console.log("=".repeat(70));

  const paidLowTotal = await db
    .select({
      orderNumber: orderTable.orderNumber,
      customerEmail: orderTable.customerEmail,
      total: orderTable.total,
      paymentStatus: orderTable.paymentStatus,
      assignedCredentials: orderTable.assignedCredentials,
      createdAt: orderTable.createdAt,
    })
    .from(orderTable)
    .where(
      and(
        eq(orderTable.paymentStatus, "paid"),
        lt(orderTable.total, 50_000),
      ),
    )
    .orderBy(orderTable.createdAt);

  console.log(`\n[1] Paid orders with total < 50,000đ: ${paidLowTotal.length}`);
  for (const o of paidLowTotal) {
    const credCount = o.assignedCredentials?.length ?? 0;
    console.log(
      `  ${o.orderNumber} | ${o.total}đ | ${o.customerEmail} | credentials: ${credCount}`,
    );
  }

  const suspiciousPaid = await db
    .select({
      orderNumber: orderTable.orderNumber,
      customerEmail: orderTable.customerEmail,
      total: orderTable.total,
      assignedCredentials: orderTable.assignedCredentials,
    })
    .from(orderTable)
    .where(
      and(
        eq(orderTable.paymentStatus, "paid"),
        or(
          ilike(orderTable.customerEmail, "%@bypass.net%"),
          ilike(orderTable.customerEmail, "%@hack.net%"),
          ilike(orderTable.customerEmail, "%@hacker.com%"),
          ilike(orderTable.customerName, "%hacker%"),
        ),
      ),
    );

  console.log(`\n[2] Paid orders from suspicious email/name: ${suspiciousPaid.length}`);
  for (const o of suspiciousPaid) {
    const credCount = o.assignedCredentials?.length ?? 0;
    console.log(
      `  ${o.orderNumber} | ${o.total}đ | ${o.customerEmail} | credentials: ${credCount}`,
    );
  }

  const negativeTotal = await db
    .select({
      orderNumber: orderTable.orderNumber,
      total: orderTable.total,
      paymentStatus: orderTable.paymentStatus,
    })
    .from(orderTable)
    .where(lt(orderTable.total, 0));

  console.log(`\n[3] Orders with negative total (any status): ${negativeTotal.length}`);
  for (const o of negativeTotal) {
    console.log(`  ${o.orderNumber} | ${o.total}đ | ${o.paymentStatus}`);
  }

  const recentSpam = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orderTable)
    .where(
      and(
        lt(orderTable.total, 50_000),
        sql`${orderTable.createdAt} > NOW() - INTERVAL '1 hour'`,
      ),
    );

  const spamCount = recentSpam[0]?.count ?? 0;
  console.log(`\n[4] Low-total orders in last hour: ${spamCount}`);
  if (spamCount > 5) {
    console.log("  ⚠ ALERT: possible ongoing attack — check nginx logs + deploy patch");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
