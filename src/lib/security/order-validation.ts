import "server-only";

import type { OrderItem } from "~/db/schema/orders/tables";
import type { CartItem } from "~/lib/hooks/use-cart";

export type OrderBuildError =
  | "INVALID_PRODUCT"
  | "INVALID_PRICE"
  | "INVALID_QTY"
  | "INVALID_SUBTOTAL";

export interface DbProductForOrder {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  productType: string;
  upgradeEmailOnly: boolean;
}

export class OrderValidationError extends Error {
  constructor(public readonly code: OrderBuildError) {
    super(code);
    this.name = "OrderValidationError";
  }
}

const MAX_QTY_PER_ITEM = 99;

/**
 * Build order items chỉ từ giá/metadata DB — KHÔNG tin client price/name/category.
 * Reject mọi item.id không tồn tại trong productMap.
 */
export function buildValidatedOrderItems(
  cartItems: CartItem[],
  productMap: Map<string, DbProductForOrder>,
): OrderItem[] {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new OrderValidationError("INVALID_PRODUCT");
  }

  return cartItems.map((item) => {
    const dbp = productMap.get(item.id);
    if (!dbp) {
      throw new OrderValidationError("INVALID_PRODUCT");
    }

    if (typeof dbp.price !== "number" || !Number.isFinite(dbp.price) || dbp.price <= 0) {
      throw new OrderValidationError("INVALID_PRICE");
    }

    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      throw new OrderValidationError("INVALID_QTY");
    }

    const productType =
      (dbp.productType as CartItem["productType"]) ?? item.productType;
    const upgradeEmailOnly = productType === "upgrade"
      ? Boolean(dbp.upgradeEmailOnly ?? item.upgradeEmailOnly ?? false)
      : false;

    const upgradeCredentials = item.upgradeCredentials
      ? upgradeEmailOnly
        ? {
            email: item.upgradeCredentials.email,
            contactInfo: item.upgradeCredentials.contactInfo,
          }
        : item.upgradeCredentials
      : undefined;

    return {
      id: dbp.id,
      name: dbp.name,
      category: dbp.category,
      price: dbp.price,
      quantity: qty,
      image: dbp.image ?? item.image ?? "",
      productType,
      upgradeEmailOnly,
      upgradeCredentials,
    };
  });
}

export function computeOrderSubtotal(orderItems: OrderItem[]): number {
  return orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function assertPositiveSubtotal(subtotal: number): void {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    throw new OrderValidationError("INVALID_SUBTOTAL");
  }
}

export const ORDER_VALIDATION_MESSAGES: Record<OrderBuildError, string> = {
  INVALID_PRODUCT: "Có sản phẩm không hợp lệ trong giỏ hàng",
  INVALID_PRICE: "Giá sản phẩm không hợp lệ",
  INVALID_QTY: "Số lượng sản phẩm không hợp lệ",
  INVALID_SUBTOTAL: "Tổng đơn hàng không hợp lệ",
};
