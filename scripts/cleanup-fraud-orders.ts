#!/usr/bin/env bun
/**
 * Dọn các đơn fake do tấn công giá âm / spam bot.
 *
 * usage:
 *   bun scripts/cleanup-fraud-orders.ts              # dry-run (default)
 *   bun scripts/cleanup-fraud-orders.ts --delete     # xóa thật (backup trước)
 *   bun scripts/cleanup-fraud-orders.ts --days=14    # chỉ xét đơn 14 ngày gần nhất
 */

import "dotenv/config";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { and, eq, gt, ilike, inArray, lt, ne, or } from "drizzle-orm";
import { db } from "../src/db";
import { orderTable } from "../src/db/schema";

const args = new Set(process.argv.slice(2));
const DELETE = args.has("--delete");
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const DAYS = daysArg ? Number.parseInt(daysArg.split("=")[1] ?? "7", 10) : 7;

const SUSPICIOUS_EMAIL_PATTERN = "%@bypass.net%";
const SUSPICIOUS_EMAIL_PATTERN2 = "%@hack.net%";
const SUSPICIOUS_EMAIL_PATTERN3 = "%@hacker.com%";
const SUSPICIOUS_NAME_PATTERN = "%hacker%";

async function main() {
  console.log("=".repeat(70));
  console.log("CLEANUP: fraud / spam orders");
  console.log(`Mode: ${DELETE ? "DELETE (will remove rows)" : "DRY RUN (no writes)"}`);
  console.log(`Window: last ${DAYS} days`);
  console.log("=".repeat(70));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS);

  const suspiciousOrders = await db
    .select({
      id: orderTable.id,
      orderNumber: orderTable.orderNumber,
      customerName: orderTable.customerName,
      customerEmail: orderTable.customerEmail,
      total: orderTable.total,
      paymentStatus: orderTable.paymentStatus,
      createdAt: orderTable.createdAt,
      clientIp: orderTable.clientIp,
    })
    .from(orderTable)
    .where(
      and(
        gt(orderTable.createdAt, cutoff),
        ne(orderTable.paymentStatus, "paid"),
        or(
          lt(orderTable.total, 0),
          and(
            lt(orderTable.total, 50_000),
            or(
              ilike(orderTable.customerEmail, SUSPICIOUS_EMAIL_PATTERN),
              ilike(orderTable.customerEmail, SUSPICIOUS_EMAIL_PATTERN2),
              ilike(orderTable.customerEmail, SUSPICIOUS_EMAIL_PATTERN3),
              ilike(orderTable.customerName, SUSPICIOUS_NAME_PATTERN),
            ),
          ),
        ),
      ),
    )
    .orderBy(orderTable.createdAt);

  console.log(`\nFound ${suspiciousOrders.length} suspicious unpaid orders:\n`);
  for (const o of suspiciousOrders) {
    console.log(
      `  ${o.orderNumber.padEnd(36)} | ${String(o.total).padStart(8)}đ | ${o.customerEmail.padEnd(28)} | ${o.createdAt?.toISOString() ?? "?"}`,
    );
  }

  if (suspiciousOrders.length === 0) {
    console.log("\nNothing to clean.");
    return;
  }

  if (!DELETE) {
    console.log("\n(dry run — pass --delete to remove these orders)");
    return;
  }

  // Backup before delete
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set — aborting delete for safety");
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  mkdirSync("backups", { recursive: true });
  const backupPath = `backups/pre-fraud-cleanup-${ts}.dump`;
  console.log(`\nBacking up to ${backupPath} ...`);
  try {
    execSync(`pg_dump "${dbUrl}" -Fc -f "${backupPath}"`, { stdio: "inherit" });
  } catch (err) {
    console.error("pg_dump failed — aborting delete:", err);
    process.exit(1);
  }

  const ids = suspiciousOrders.map((o) => o.id);
  const deleted = await db
    .delete(orderTable)
    .where(inArray(orderTable.id, ids))
    .returning({ id: orderTable.id });

  console.log(`\nDeleted ${deleted.length} orders. Backup: ${backupPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
