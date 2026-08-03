import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { productRestockAlertTable } from "~/db/schema";
import { normalizeLocale } from "~/lib/email-i18n";
import { sendRestockAlertEmail } from "~/lib/email-service";
import { getLocalizedProduct } from "~/lib/product-localization";

import { getProductById } from "./products";

export type RestockAlertError =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_IN_STOCK"
  | "PRODUCT_INACTIVE";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function subscribeRestockAlert(input: {
  productId: string;
  email: string;
  locale?: string;
}): Promise<{ ok: true } | { ok: false; code: RestockAlertError }> {
  const product = await getProductById(input.productId);
  if (!product) {
    return { ok: false, code: "PRODUCT_NOT_FOUND" };
  }
  if (product.status !== "active") {
    return { ok: false, code: "PRODUCT_INACTIVE" };
  }
  if (product.inStock) {
    return { ok: false, code: "PRODUCT_IN_STOCK" };
  }

  const email = normEmail(input.email);
  const locale = normalizeLocale(input.locale);

  await db
    .insert(productRestockAlertTable)
    .values({
      id: nanoid(),
      productId: input.productId,
      email,
      locale,
      status: "pending",
      createdAt: new Date(),
      notifiedAt: null,
    })
    .onConflictDoUpdate({
      target: [
        productRestockAlertTable.productId,
        productRestockAlertTable.email,
      ],
      set: {
        locale,
        status: "pending",
        notifiedAt: null,
        createdAt: new Date(),
      },
    });

  return { ok: true };
}

export async function getPendingRestockAlerts(productId: string) {
  return db
    .select()
    .from(productRestockAlertTable)
    .where(
      and(
        eq(productRestockAlertTable.productId, productId),
        eq(productRestockAlertTable.status, "pending"),
      ),
    );
}

export async function markRestockAlertsNotified(ids: string[]) {
  if (ids.length === 0) return;

  await db
    .update(productRestockAlertTable)
    .set({
      status: "notified",
      notifiedAt: new Date(),
    })
    .where(inArray(productRestockAlertTable.id, ids));
}

export async function notifyRestockSubscribers(productId: string) {
  const product = await getProductById(productId, true);
  if (!product) {
    console.error(
      `[notifyRestockSubscribers] product not found: ${productId}`,
    );
    return;
  }

  const alerts = await getPendingRestockAlerts(productId);
  if (alerts.length === 0) return;

  const notifiedIds: string[] = [];

  for (const alert of alerts) {
    const locale = normalizeLocale(alert.locale);
    const localized = getLocalizedProduct(product, locale);

    try {
      const sent = await sendRestockAlertEmail({
        email: alert.email,
        productName: localized.name,
        productSlug: product.slug,
        price: product.price,
        locale,
      });

      if (sent) {
        notifiedIds.push(alert.id);
      } else {
        console.error(
          `[notifyRestockSubscribers] failed to send email to ${alert.email} for product ${productId}`,
        );
      }
    } catch (err) {
      console.error(
        `[notifyRestockSubscribers] error sending to ${alert.email} for product ${productId}:`,
        err,
      );
    }
  }

  if (notifiedIds.length > 0) {
    await markRestockAlertsNotified(notifiedIds);
  }
}
