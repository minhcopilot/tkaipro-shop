import { describe, expect, mock, test } from "bun:test";
mock.module("server-only", () => ({}));
const { buildValidatedOrderItems, OrderValidationError } = await import("../src/lib/security/order-validation");
import type { DbProductForOrder } from "../src/lib/security/order-validation";
import type { CartItem } from "../src/lib/hooks/use-cart";

const product: DbProductForOrder = {
  id: "google", name: "Google AI Pro", category: "google-ai", price: 149000,
  image: null, productType: "upgrade", upgradeEmailOnly: true, status: "active", inStock: true,
};
const cart: CartItem = {
  id: "google", name: "Client name", category: "wrong", price: 1, image: "", quantity: 1,
  productType: "account", upgradeEmailOnly: false,
  upgradeCredentials: { email: "customer@example.com", password: "must-not-survive", contactInfo: "contact" },
};

describe("catalog availability and upgrade checkout", () => {
  test("uses DB price/type and strips password for email-only Google upgrade", () => {
    const [item] = buildValidatedOrderItems([cart], new Map([[product.id, product]]));
    expect(item).toMatchObject({ price: 149000, productType: "upgrade", upgradeEmailOnly: true });
    expect(item.upgradeCredentials).toEqual({ email: "customer@example.com", contactInfo: "contact" });
  });
  test("rejects empty-stock imported accounts even when the client claims upgrade", () => {
    const dbp = { ...product, productType: "account", inStock: false };
    expect(() => buildValidatedOrderItems([{ ...cart, productType: "upgrade" }], new Map([[dbp.id, dbp]])))
      .toThrow("PRODUCT_UNAVAILABLE");
  });
  test("rejects inactive and deleted products despite stale cart availability", () => {
    for (const status of ["inactive", "deleted", "draft"]) {
      expect(() => buildValidatedOrderItems([cart], new Map([[product.id, { ...product, status }]])))
        .toThrow("PRODUCT_UNAVAILABLE");
    }
  });
  test("retains credential requirements for normal upgrades", () => {
    const [item] = buildValidatedOrderItems([cart], new Map([[product.id, { ...product, upgradeEmailOnly: false }]]));
    expect(item.upgradeCredentials?.password).toBe("must-not-survive");
  });
  test("unknown products still fail without building an order", () => {
    expect(() => buildValidatedOrderItems([cart], new Map())).toThrow(OrderValidationError);
  });
});
