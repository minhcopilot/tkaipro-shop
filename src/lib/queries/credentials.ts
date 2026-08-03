import "server-only";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { productTable } from "~/db/schema/products/tables";
import { orderTable, type AssignedCredential } from "~/db/schema/orders/tables";
import { subscriptionTable } from "~/db/schema/subscriptions/tables";
import type { SubscriptionInsert } from "~/db/schema/subscriptions/types";
import {
  decryptAccountCredential,
  encryptSecret,
  normalizeAccountPoolEmail,
} from "~/lib/security/crypto";

/**
 * get available credentials for a product (decrypt pool truoc khi tra ve)
 */
export async function getAvailableCredentials(productId: string): Promise<string[]> {
  try {
    const product = await db
      .select({ accountCredentials: productTable.accountCredentials })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product[0]?.accountCredentials) {
      return [];
    }

    return (product[0].accountCredentials as string[]).map(
      decryptAccountCredential,
    );
  } catch (error) {
    console.error("Failed to get available credentials:", error);
    return [];
  }
}

/**
 * get product with duration info
 */
async function getProductWithDuration(productId: string) {
  try {
    const product = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        duration: productTable.duration,
        accountCredentials: productTable.accountCredentials,
        productType: productTable.productType, // QUAN TRỌNG: cần field này để phân biệt license vs account
      })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    return product[0] || null;
  } catch (error) {
    console.error("Failed to get product with duration:", error);
    return null;
  }
}

/**
 * assign credentials to an order automatically.
 * Account products: store username/email only (Cursor password lives in manager vault).
 * License products: still encrypt license key into assigned.password.
 */
export async function autoAssignCredentials(orderId: string): Promise<boolean> {
  try {
    console.log(`🔄 Starting autoAssignCredentials for order: ${orderId}`);
    
    // get order with items
    const order = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, orderId))
      .limit(1);

    if (!order[0]) {
      console.error("❌ Order not found:", orderId);
      return false;
    }

    const orderData = order[0];
    console.log(`📦 Order ${orderData.orderNumber} has ${orderData.items.length} items`);
    
    const assignedCredentials: AssignedCredential[] = [];
    const subscriptionsToCreate: SubscriptionInsert[] = [];

    // process each item in the order
    for (const item of orderData.items) {
      console.log(`🔍 Processing product: ${item.name} (ID: ${item.id}), qty: ${item.quantity}`);
      
      // login_link products don't need credential assignment
      if (item.productType === "login_link") {
        console.log(`🔗 Skipping login_link product: ${item.name} (handled separately)`);
        continue;
      }

      const product = await getProductWithDuration(item.id);
      
      if (!product) {
        console.warn(`⚠️  Product not found: ${item.name}`);
        continue;
      }
      
      const productType = (product as any).productType || "account";
      const credentialsCount = product.accountCredentials?.length || 0;
      console.log(`📋 Product type: ${productType}, available credentials: ${credentialsCount}`);
      
      if (!product.accountCredentials || product.accountCredentials.length === 0) {
        console.warn(`⚠️  No credentials available for product: ${item.name}`);
        continue;
      }

      // assign credentials based on quantity ordered
      for (let i = 0; i < item.quantity && i < product.accountCredentials.length; i++) {
        // `rawCredential` la gia tri luu trong DB (co the da ma hoa) — dung de
        // remove khoi pool. `credential` la ban giai ma (email hoac license key).
        const rawCredential = product.accountCredentials[i];
        const credential = decryptAccountCredential(rawCredential);
        const assignedAt = new Date();
        const durationDays = product.duration || 30; // mặc định 30 ngày
        const expiresAt = new Date(assignedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // kiểm tra loại sản phẩm: "account" hoặc "license"
        const productType = (product as any).productType || "account";

        if (productType === "license") {
          // sản phẩm license: credential là license key thuần
          console.log(`🔑 Assigning license key ${i + 1}/${item.quantity} for ${item.name}`);

          // SECURITY: ma hoa truoc khi luu DB (at-rest).
          const encryptedKey = encryptSecret(credential.trim());

          assignedCredentials.push({
            productId: item.id,
            productName: item.name,
            username: "License Key",
            password: encryptedKey,
            assignedAt: assignedAt.toISOString(),
          });

          subscriptionsToCreate.push({
            id: nanoid(),
            orderId: orderData.id,
            productId: item.id,
            username: "License Key",
            password: encryptedKey,
            assignedAt,
            expiresAt,
            customerEmail: orderData.customerEmail,
            productName: item.name,
            isActive: true,
            isExpired: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await removeCredentialFromProduct(item.id, rawCredential);
          console.log(`✅ License key assigned and removed from product pool`);
        } else {
          // Account: pool is email-only (legacy email|password still accepted).
          // Cursor password is NOT stored on shop — fetched from manager at email time.
          const email = normalizeAccountPoolEmail(credential);

          if (email) {
            console.log(`👤 Assigning account ${i + 1}/${item.quantity}: ${email} for ${item.name}`);

            assignedCredentials.push({
              productId: item.id,
              productName: item.name,
              username: email,
              password: "",
              assignedAt: assignedAt.toISOString(),
            });

            subscriptionsToCreate.push({
              id: nanoid(),
              orderId: orderData.id,
              productId: item.id,
              username: email,
              password: "",
              assignedAt,
              expiresAt,
              customerEmail: orderData.customerEmail,
              productName: item.name,
              isActive: true,
              isExpired: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await removeCredentialFromProduct(item.id, rawCredential);
            console.log(`✅ Account assigned and removed from product pool`);
          }
        }
      }
    }

    if (assignedCredentials.length === 0) {
      console.warn("⚠️  No credentials could be assigned to order:", orderId);
      return false;
    }

    console.log(`💾 Saving ${assignedCredentials.length} credentials and ${subscriptionsToCreate.length} subscriptions...`);

    // transaction để update order và tạo subscriptions
    await db.transaction(async (tx) => {
      // update order with assigned credentials
      await tx
        .update(orderTable)
        .set({
          assignedCredentials,
          status: 'completed', // auto-complete when credentials assigned
          updatedAt: new Date(),
        })
        .where(eq(orderTable.id, orderId));

      // tạo subscription records
      if (subscriptionsToCreate.length > 0) {
        await tx.insert(subscriptionTable).values(subscriptionsToCreate);
      }
    });

    console.log(`✅ Successfully assigned ${assignedCredentials.length} credentials to order ${orderData.orderNumber}`);
    console.log(`✅ Created ${subscriptionsToCreate.length} subscription records`);
    return true;

  } catch (error) {
    console.error("Failed to auto-assign credentials:", error);
    return false;
  }
}

/**
 * remove a credential from product's available pool
 */
async function removeCredentialFromProduct(productId: string, credentialToRemove: string): Promise<void> {
  try {
    const product = await db
      .select({ accountCredentials: productTable.accountCredentials })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product[0]?.accountCredentials) {
      return;
    }

    const currentCredentials = product[0].accountCredentials as string[];
    const updatedCredentials = currentCredentials.filter(cred => cred !== credentialToRemove);

    await db
      .update(productTable)
      .set({
        accountCredentials: updatedCredentials,
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, productId));

  } catch (error) {
    console.error("Failed to remove credential from product:", error);
  }
}

/**
 * get credentials for a specific order
 */
export async function getOrderCredentials(orderId: string): Promise<AssignedCredential[]> {
  try {
    const order = await db
      .select({ assignedCredentials: orderTable.assignedCredentials })
      .from(orderTable)
      .where(eq(orderTable.id, orderId))
      .limit(1);

    return (order[0]?.assignedCredentials as AssignedCredential[]) || [];
  } catch (error) {
    console.error("Failed to get order credentials:", error);
    return [];
  }
}

/**
 * count available credentials for all products
 */
export async function getCredentialsStats() {
  try {
    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        accountCredentials: productTable.accountCredentials,
      })
      .from(productTable);

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      availableCount: (product.accountCredentials as string[] || []).length,
    }));
  } catch (error) {
    console.error("Failed to get credentials stats:", error);
    return [];
  }
}
