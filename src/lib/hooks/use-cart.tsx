"use client";

import * as React from "react";

import type { CartItem } from "~/ui/components/cart";
export type { CartItem } from "~/ui/components/cart";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface PriceChange {
  id: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

export interface AppliedVoucher {
  code: string;
  voucherId: string;
  discount: number;
  // snapshot subtotal lúc apply để biết khi cart thay đổi mà invalidate
  subtotalAtApply: number;
}

export interface CartContextType {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  clearCart: () => void;
  clearPriceChanges: () => void;
  itemCount: number;
  items: CartItem[];
  priceChanges: PriceChange[];
  removeItem: (id: string) => void;
  subtotal: number;
  updateQuantity: (id: string, quantity: number) => void;
  // voucher
  voucher: AppliedVoucher | null;
  applyVoucher: (v: AppliedVoucher) => void;
  clearVoucher: () => void;
}

/* -------------------------------------------------------------------------- */
/*                                Context                                     */
/* -------------------------------------------------------------------------- */

const CartContext = React.createContext<CartContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                         Local-storage helpers                              */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "cart";
const VOUCHER_STORAGE_KEY = "cart-voucher";
const DEBOUNCE_MS = 500;

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as CartItem[];
    }
  } catch (err) {
    console.error("Failed to load cart:", err);
  }
  return [];
};

const loadVoucherFromStorage = (): AppliedVoucher | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VOUCHER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppliedVoucher;
    if (parsed && typeof parsed.code === "string") return parsed;
  } catch {
    /* ignore */
  }
  return null;
};

/* -------------------------------------------------------------------------- */
/*                               Provider                                     */
/* -------------------------------------------------------------------------- */

export function CartProvider({ children }: React.PropsWithChildren) {
  const [items, setItems] = React.useState<CartItem[]>(loadCartFromStorage);
  const [priceChanges, setPriceChanges] = React.useState<PriceChange[]>([]);
  const [voucher, setVoucher] = React.useState<AppliedVoucher | null>(
    loadVoucherFromStorage,
  );

  /* -------------------- Persist to localStorage (debounced) ------------- */
  const saveTimeout = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  React.useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.error("Failed to save cart:", err);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [items]);

  /* -------------------- Sync prices with server ------------------------ */
  const isSyncing = React.useRef(false);

  React.useEffect(() => {
    if (items.length === 0 || isSyncing.current) return;

    const syncPrices = async () => {
      isSyncing.current = true;
      try {
        const ids = items.map((i) => i.id).join(",");
        const res = await fetch(`/api/products/prices?ids=${ids}`);
        if (!res.ok) return;

        const data = (await res.json()) as { prices: Record<string, number> };
        const changes: PriceChange[] = [];

        setItems((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            const serverPrice = data.prices[item.id];
            if (serverPrice != null && serverPrice !== item.price) {
              changes.push({
                id: item.id,
                name: item.name,
                oldPrice: item.price,
                newPrice: serverPrice,
              });
              changed = true;
              return { ...item, price: serverPrice };
            }
            return item;
          });
          return changed ? next : prev;
        });

        if (changes.length > 0) {
          setPriceChanges(changes);
        }
      } catch {
        // silently ignore network errors during sync
      } finally {
        isSyncing.current = false;
      }
    };

    syncPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const clearPriceChanges = React.useCallback(() => setPriceChanges([]), []);

  /* ----------------------------- Actions -------------------------------- */
  const addItem = React.useCallback(
    (newItem: Omit<CartItem, "quantity">, qty = 1) => {
      if (qty <= 0) return;
      setItems((prev) => {
        const existing = prev.find((i) => i.id === newItem.id);
        if (existing) {
          return prev.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [...prev, { ...newItem, quantity: qty }];
      });
    },
    [],
  );

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = React.useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return i;
        if (qty <= 0) return []; // treat zero/negative as remove
        if (qty === i.quantity) return i;
        return { ...i, quantity: qty };
      }),
    );
  }, []);

  const clearVoucher = React.useCallback(() => {
    setVoucher(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(VOUCHER_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const applyVoucher = React.useCallback((v: AppliedVoucher) => {
    setVoucher(v);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    clearVoucher();
  }, [clearVoucher]);

  // Invalidate voucher khi cart thay đổi quá nhiều — buộc CTV apply lại
  // (tránh discount tính trên subtotal cũ → server reject ở consume)
  const subtotalNow = React.useMemo(
    () => items.reduce((t, i) => t + i.price * i.quantity, 0),
    [items],
  );
  React.useEffect(() => {
    if (voucher && voucher.subtotalAtApply !== subtotalNow) {
      // Nếu chênh lệch > 1% hoặc cart rỗng → drop voucher
      const ratio =
        voucher.subtotalAtApply > 0
          ? Math.abs(subtotalNow - voucher.subtotalAtApply) /
            voucher.subtotalAtApply
          : 1;
      if (subtotalNow === 0 || ratio > 0.01) {
        clearVoucher();
      }
    }
  }, [subtotalNow, voucher, clearVoucher]);

  /* --------------------------- Derived data ----------------------------- */
  const itemCount = React.useMemo(
    () => items.reduce((t, i) => t + i.quantity, 0),
    [items],
  );

  const subtotal = React.useMemo(
    () => items.reduce((t, i) => t + i.price * i.quantity, 0),
    [items],
  );

  /* ----------------------------- Context value -------------------------- */
  const value = React.useMemo<CartContextType>(
    () => ({
      addItem,
      clearCart,
      clearPriceChanges,
      itemCount,
      items,
      priceChanges,
      removeItem,
      subtotal,
      updateQuantity,
      voucher,
      applyVoucher,
      clearVoucher,
    }),
    [
      items,
      priceChanges,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearPriceChanges,
      itemCount,
      subtotal,
      voucher,
      applyVoucher,
      clearVoucher,
    ],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

/* -------------------------------------------------------------------------- */
/*                                 Hook                                      */
/* -------------------------------------------------------------------------- */

export function useCart(): CartContextType {
  const ctx = React.use(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
