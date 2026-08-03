/**
 * One-shot migration: ma hoa toan bo credential plaintext dang co trong DB.
 *
 * Chay SAU khi da set CREDENTIAL_ENC_KEY o moi truong:
 *   bun run scripts/encrypt-existing-credentials.ts
 *   (hoac) npx tsx scripts/encrypt-existing-credentials.ts
 *
 * Idempotent: bo qua cac ban da ma hoa (`enc:v1:`), nen chay lai nhieu lan an toan.
 * Ma hoa:
 *   - product.accountCredentials[]      (kho username|password / license key chua ban)
 *   - order.assignedCredentials[].password
 *   - subscription.password
 *
 * GHI CHU: order.items[].upgradeCredentials.password (mat khau Cursor cua chinh
 * khach o don "upgrade") CHUA duoc ma hoa o ban nay vi admin modal render truc
 * tiep — la follow-up rieng (can ma hoa o createOrder + giai ma o admin API).
 */
import { db } from "~/db";
import { productTable } from "~/db/schema/products/tables";
import { orderTable } from "~/db/schema/orders/tables";
import { subscriptionTable } from "~/db/schema/subscriptions/tables";
import { eq } from "drizzle-orm";
import {
  encryptSecret,
  encryptAccountCredential,
  isEncrypted,
} from "~/lib/security/crypto";

async function migrateProducts() {
  const rows = await db.select().from(productTable);
  let changed = 0;
  for (const p of rows) {
    const creds = p.accountCredentials as string[] | null;
    if (!Array.isArray(creds) || creds.length === 0) continue;
    if (creds.every((c) => isEncrypted(c) || (c.includes("|") && isEncrypted(c.slice(c.indexOf("|") + 1))))) {
      continue;
    }
    const next = creds.map((c) =>
      typeof c === "string" ? encryptAccountCredential(c) : c,
    );
    await db
      .update(productTable)
      .set({ accountCredentials: next, updatedAt: new Date() })
      .where(eq(productTable.id, p.id));
    changed++;
  }
  console.log(`[products] encrypted pool for ${changed} product(s)`);
}

async function migrateOrders() {
  const rows = await db.select().from(orderTable);
  let changedCreds = 0;
  for (const o of rows) {
    let dirty = false;

    const creds = o.assignedCredentials as Array<{
      productId: string;
      productName: string;
      username: string;
      password?: string;
      assignedAt: string;
    }> | null;
    if (Array.isArray(creds) && creds.length > 0) {
      for (const c of creds) {
        if (c?.password && !isEncrypted(c.password)) {
          c.password = encryptSecret(c.password);
          dirty = true;
        }
      }
      if (dirty) {
        changedCreds++;
        await db
          .update(orderTable)
          .set({
            assignedCredentials: creds,
            updatedAt: new Date(),
          })
          .where(eq(orderTable.id, o.id));
      }
    }
  }
  console.log(
    `[orders] encrypted assignedCredentials for ${changedCreds} order(s)`,
  );
}

async function migrateSubscriptions() {
  const rows = await db.select().from(subscriptionTable);
  let changed = 0;
  for (const s of rows) {
    if (s.password && !isEncrypted(s.password)) {
      await db
        .update(subscriptionTable)
        .set({ password: encryptSecret(s.password), updatedAt: new Date() })
        .where(eq(subscriptionTable.id, s.id));
      changed++;
    }
  }
  console.log(`[subscriptions] encrypted password for ${changed} subscription(s)`);
}

async function main() {
  if (!process.env.CREDENTIAL_ENC_KEY) {
    console.error(
      "ABORT: CREDENTIAL_ENC_KEY chua duoc set. Set key truoc khi migrate, neu khong se khong ma hoa duoc.",
    );
    process.exit(1);
  }
  console.log("Bat dau ma hoa credential hien co...");
  await migrateProducts();
  await migrateOrders();
  await migrateSubscriptions();
  console.log("Hoan tat migration.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
