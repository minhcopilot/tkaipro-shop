import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/db";
import type { AssignedCredential } from "~/db/schema/orders/tables";
import { orderTable } from "~/db/schema/orders/tables";
import {
  sendAdminMissingPasswordAlert,
  sendCustomerOrderConfirmation,
} from "~/lib/email-service";
import { decryptSecret } from "~/lib/security/crypto";

export type EmailCredentialPayload = {
  productName: string;
  username: string;
  password: string;
  assignedAt: string;
};

export type ResolveCredentialsResult =
  | { ok: true; credentials: EmailCredentialPayload[] }
  | { ok: false; missingEmails: string[]; credentials: EmailCredentialPayload[] };

/**
 * Resolve plaintext passwords for customer email.
 *
 * Kho tài khoản nằm ngay trên shop: mật khẩu được lưu đã mã hoá trong
 * `product.accountCredentials` và copy sang `order.assignedCredentials` lúc
 * giao hàng, nên chỉ cần giải mã bằng CREDENTIAL_ENC_KEY.
 *
 * Giải mã thất bại nghĩa là bản ghi hỏng hoặc sai khoá — trả về danh sách
 * `missingEmails` để caller cảnh báo admin thay vì gửi email rỗng cho khách.
 */
export async function resolveCredentialsForCustomerEmail(
  assigned: AssignedCredential[],
): Promise<ResolveCredentialsResult> {
  const credentials: EmailCredentialPayload[] = [];
  const missingEmails: string[] = [];

  for (const cred of assigned) {
    const username = (cred.username || "").trim();
    const isLicense = username === "License Key";

    if (isLicense) {
      const key = decryptSecret(cred.password || "");
      if (!key) {
        missingEmails.push("License Key");
        continue;
      }
      credentials.push({
        productName: cred.productName,
        username,
        password: key,
        assignedAt: cred.assignedAt,
      });
      continue;
    }

    const password = cred.password ? decryptSecret(cred.password) : "";
    if (password) {
      credentials.push({
        productName: cred.productName,
        username,
        password,
        assignedAt: cred.assignedAt,
      });
      continue;
    }

    console.error(`[fulfillment] Missing password for ${username}`);
    missingEmails.push(username);
  }

  if (missingEmails.length > 0) {
    return { ok: false, missingEmails, credentials };
  }
  return { ok: true, credentials };
}

async function markOrderNeedsManualPassword(
  orderId: string | undefined,
  orderNumber: string,
  missingEmails: string[],
): Promise<void> {
  const note = `[MISSING_PASSWORD ${new Date().toISOString()}] ${missingEmails.join(", ")}`;
  if (!orderId) {
    console.warn(`[fulfillment] ${orderNumber}: ${note}`);
    return;
  }
  try {
    const rows = await db
      .select({ notes: orderTable.notes })
      .from(orderTable)
      .where(eq(orderTable.id, orderId))
      .limit(1);
    const prev = rows[0]?.notes?.trim() || "";
    await db
      .update(orderTable)
      .set({
        notes: prev ? `${prev}\n${note}` : note,
        updatedAt: new Date(),
      })
      .where(eq(orderTable.id, orderId));
  } catch (err) {
    console.error(`[fulfillment] Failed to mark order ${orderNumber}:`, err);
  }
}

export type SendOrderCredentialsInput = {
  orderId?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  paymentMethod: string;
  items: Array<{
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  assignedCredentials: AssignedCredential[];
  paidAt: Date;
  locale?: string | null;
};

/**
 * Fetch vault passwords → send customer confirmation.
 * On missing passwords: do NOT email customer incomplete creds; notify admin + note order.
 */
export async function sendOrderCredentialsEmail(
  input: SendOrderCredentialsInput,
): Promise<{ sent: boolean; reason?: string; missingEmails?: string[] }> {
  if (!input.assignedCredentials?.length) {
    return { sent: false, reason: "no_credentials" };
  }

  const resolved = await resolveCredentialsForCustomerEmail(
    input.assignedCredentials,
  );

  if (!resolved.ok) {
    await markOrderNeedsManualPassword(
      input.orderId,
      input.orderNumber,
      resolved.missingEmails,
    );

    try {
      await sendAdminMissingPasswordAlert({
        orderNumber: input.orderNumber,
        customerEmail: input.customerEmail,
        missingEmails: resolved.missingEmails,
      });
      console.error(
        `[fulfillment] Order ${input.orderNumber} needs manual password for: ${resolved.missingEmails.join(", ")}. Admin notified; customer email skipped.`,
      );
    } catch (err) {
      console.error(
        `[fulfillment] Admin notify failed for ${input.orderNumber}:`,
        err,
      );
    }

    return {
      sent: false,
      reason: "missing_passwords",
      missingEmails: resolved.missingEmails,
    };
  }

  const ok = await sendCustomerOrderConfirmation({
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    total: input.total,
    paymentMethod: input.paymentMethod,
    items: input.items,
    assignedCredentials: resolved.credentials,
    paidAt: input.paidAt,
    locale: input.locale ?? undefined,
  });

  return { sent: ok, reason: ok ? undefined : "email_send_failed" };
}
