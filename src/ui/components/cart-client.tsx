"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Minus, Plus, ShoppingCart, X, Tag, Check } from "lucide-react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { useMediaQuery } from "~/lib/hooks/use-media-query";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { formatPrice, getLocalizedProduct } from "~/lib/product-localization";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "~/ui/primitives/drawer";
import { Input } from "~/ui/primitives/input";
import { Separator } from "~/ui/primitives/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/ui/primitives/sheet";

export interface CartItem {
  category: string;
  id: string;
  image: string;
  name: string;
  price: number;
  quantity: number;
  productType?: "account" | "license" | "upgrade" | "login_link";
  upgradeCredentials?: {
    email: string;
    password: string;
    contactInfo?: string;
  };
}

interface CartProps {
  className?: string;
}

export function CartClient({ className }: CartProps) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [discountCode, setDiscountCode] = React.useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // use the cart hook instead of local state
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    priceChanges,
    clearPriceChanges,
    voucher,
    applyVoucher,
    clearVoucher,
  } = useCart();

  const discount = voucher?.discount ?? 0;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;

    setIsApplyingDiscount(true);
    try {
      const res = await fetch("/api/checkout/apply-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        voucherId?: string;
        code?: string;
        discountApplied?: number;
        subtotal?: number;
      };
      if (!res.ok || !data.ok) {
        clearVoucher();
        toast.error(data.message ?? t("voucher.invalid"));
        return;
      }
      applyVoucher({
        code: data.code ?? code.toUpperCase(),
        voucherId: data.voucherId ?? "",
        discount: data.discountApplied ?? 0,
        subtotalAtApply: data.subtotal ?? subtotal,
      });
      setDiscountCode("");
      toast.success(t("voucher.applied"));
    } catch {
      toast.error(t("voucher.networkError"));
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveVoucher = () => {
    clearVoucher();
    toast.success(t("voucher.removed"));
  };

  const finalTotal = subtotal - discount;



  const CartTrigger = (
    <Button
      aria-label={t("trigger.ariaLabel")}
      className="relative h-9 w-9 rounded-full"
      size="icon"
      variant="outline"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge
          className={`
            absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
          `}
          variant="default"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );

  const CartContent = (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-xl font-semibold">{t("title")}</div>
            <div className="text-sm text-muted-foreground">
              {itemCount === 0
                ? t("empty.message")
                : t("empty.count", { count: itemCount })}
            </div>
          </div>
          {isDesktop && (
            <SheetClose asChild>
              
            </SheetClose>
          )}
        </div>

        {priceChanges.length > 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950"
            initial={{ opacity: 0, y: -10 }}
          >
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span>{t("priceChanged.title")}</span>
            </div>
            <ul className="space-y-1">
              {priceChanges.map((change) => (
                <li key={change.id} className="text-xs text-amber-700 dark:text-amber-300">
                  {change.name}: {formatPrice(change.oldPrice, locale)} → {formatPrice(change.newPrice, locale)}
                </li>
              ))}
            </ul>
            <button
              className="mt-2 text-xs font-medium text-amber-800 underline hover:no-underline dark:text-amber-200"
              onClick={clearPriceChanges}
              type="button"
            >
              {t("priceChanged.dismiss")}
            </button>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence>
            {items.length === 0 ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <div
                  className={`
                    mb-4 flex h-20 w-20 items-center justify-center rounded-full
                    bg-muted
                  `}
                >
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">{t("empty.title")}</h3>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
                {isDesktop ? (
                  <SheetClose asChild>
                    <Link href="/products">
                      <Button>{t("empty.viewProducts")}</Button>
                    </Link>
                  </SheetClose>
                ) : (
                  <DrawerClose asChild>
                    <Link href="/products">
                      <Button>{t("empty.viewProducts")}</Button>
                    </Link>
                  </DrawerClose>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      group relative flex rounded-lg border bg-card p-2
                      shadow-sm transition-colors
                      hover:bg-accent/50
                    `}
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={item.id}
                    layout
                    transition={{ duration: 0.15 }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded">
                      <Image
                        alt={item.name}
                        className="object-cover"
                        fill
                        src={item.image}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            className={`
                              line-clamp-2 text-sm font-medium
                              group-hover:text-primary
                            `}
                            href={`/products/${item.id}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {getLocalizedProduct({ ...item, name: item.name }, locale).name}
                          </Link>
                          <button
                            className={`
                              -mt-1 -mr-1 ml-2 rounded-full p-1
                              text-muted-foreground transition-colors
                              hover:bg-muted hover:text-destructive
                            `}
                            onClick={() => handleRemoveItem(item.id)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">{t("item.remove")}</span>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            className={`
                              flex h-7 w-7 items-center justify-center
                              rounded-l-md border-r text-muted-foreground
                              transition-colors
                              hover:bg-muted hover:text-foreground
                            `}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            type="button"
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">{t("item.decrease")}</span>
                          </button>
                          <span
                            className={`
                              flex h-7 w-7 items-center justify-center text-xs
                              font-medium
                            `}
                          >
                            {item.quantity}
                          </span>
                          <button
                            className={`
                              flex h-7 w-7 items-center justify-center
                              rounded-r-md border-l text-muted-foreground
                              transition-colors
                              hover:bg-muted hover:text-foreground
                            `}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">{t("item.increase")}</span>
                          </button>
                        </div>
                        <div className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity, locale)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <div className="border-t px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("summary.subtotal")}</span>
                <span className="font-medium">{formatPrice(subtotal, locale)}</span>
              </div>
              
              {/* Discount Code Input */}
              <div className="space-y-2">
                {voucher ? (
                  <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/40">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {t("voucher.appliedLabel")}{" "}
                        <code className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs dark:bg-green-900/60">
                          {voucher.code}
                        </code>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {t("voucher.remove")}
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="discount-code" className="text-sm text-muted-foreground">
                      {t("summary.discountCode")}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="discount-code"
                          placeholder={t("summary.placeholder")}
                          className="pl-10"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyDiscount();
                            }
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode.trim()}
                      >
                        {isApplyingDiscount ? t("summary.applying") : t("summary.apply")}
                      </Button>
                    </div>
                  </>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>{t("summary.discount")}</span>
                    <span>-{formatPrice(discount, locale)}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">{t("summary.total")}</span>
                <span className="text-base font-semibold">
                  {formatPrice(finalTotal, locale)}
                </span>
              </div>
              {isDesktop ? (
                <SheetClose asChild>
                  <Link href="/checkout">
                    <Button className="w-full mb-3" size="lg">
                      {t("summary.checkout")}
                    </Button>
                  </Link>
                </SheetClose>
              ) : (
                <DrawerClose asChild>
                  <Link href="/checkout">
                    <Button className="w-full" size="lg">
                      {t("summary.checkout")}
                    </Button>
                  </Link>
                </DrawerClose>
              )}
              <div className="flex items-center justify-between">
                {isDesktop ? (
                  <SheetClose asChild>
                    <Button variant="outline">{t("summary.continue")}</Button>
                  </SheetClose>
                ) : (
                  <DrawerClose asChild>
                    <Button variant="outline">{t("summary.continue")}</Button>
                  </DrawerClose>
                )}
                <Button
                  className="ml-2"
                  onClick={handleClearCart}
                  variant="outline"
                >
                  {t("summary.clear")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!isMounted) {
    return (
      <div className={cn("relative", className)}>
        <Button
          aria-label={t("trigger.ariaLabel")}
          className="relative h-9 w-9 rounded-full"
          size="icon"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge
              className={`
                absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
              `}
              variant="default"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isDesktop ? (
        <Sheet onOpenChange={setIsOpen} open={isOpen}>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent className="flex w-[400px] flex-col p-0">
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent>{CartContent}</DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
