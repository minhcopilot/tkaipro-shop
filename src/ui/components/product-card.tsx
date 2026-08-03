"use client";

import { Eye, Heart, ShoppingCart, Star, Zap, Shield, Clock, Users, Flame } from "lucide-react";
import Image from "next/image";
import { Link, useRouter } from "~/i18n/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { formatPrice } from "~/lib/product-localization";
import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardFooter } from "~/ui/primitives/card";
import { ProductQuickView } from "~/ui/components/product-quick-view";
import { SocialShareButtons } from "~/ui/components/social-share-buttons";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  product: {
    category: string;
    categoryName?: string;
    id: string;
    slug?: string;
    image: string;
    inStock?: boolean;
    name: string;
    originalPrice?: number;
    price: number;
    rating?: number;
    isPopular?: boolean;
    purchaseCount?: number;
    productType?: "account" | "license" | "upgrade" | "login_link";
    upgradeEmailOnly?: boolean;
  };
  variant?: "compact" | "default";
};

export function ProductCard({
  className,
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  ...props
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const t = useTranslations("ProductCard");
  const locale = useLocale();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  const [quickViewOpen, setQuickViewOpen] = React.useState(false);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      setIsAddingToCart(true);
      setTimeout(() => {
        onAddToCart(product.id);
        setIsAddingToCart(false);
      }, 600);
    } else {
      addItem(
        {
          category: product.category,
          id: product.id,
          image: product.image,
          name: product.name,
          price: product.price,
          productType: product.productType,
          upgradeEmailOnly: product.upgradeEmailOnly,
        },
        1
      );
      toast.success(t("toast.added", { name: product.name }));
    }
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        category: product.category,
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.price,
        productType: product.productType,
        upgradeEmailOnly: product.upgradeEmailOnly,
      },
      1
    );
    router.push("/checkout");
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      onAddToWishlist(product.id);
    }
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const savings = product.originalPrice
    ? product.originalPrice - product.price
    : 0;

  const renderStars = () => {
    const rating = product.rating ?? 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            className={cn(
              "h-4 w-4",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "stroke-muted/40 text-muted"
            )}
            key={`star-${product.id}-position-${i + 1}`}
          />
        ))}
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("group", className)} {...props}>
      <ProductQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        productSlug={product.slug || product.id}
        productImage={product.image}
        productName={product.name}
        productPrice={product.price}
        originalPrice={product.originalPrice}
      />
      <Link href={`/products/${product.slug || product.id}`}>
        <Card
          className={cn(
            `
              product-card relative h-full overflow-hidden rounded-md py-0
              transition-all duration-150 ease-out
            `,
            isHovered && "-translate-x-0.5 -translate-y-0.5 shadow-hard-lg",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden border-b-2 border-border">
            {product.image && (
              <Image
                alt={product.name}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={product.image}
              />
            )}

            {/* Category badge */}
            <Badge
              className={`
                absolute top-2 left-2 bg-background
              `}
              variant="outline"
            >
              {product.categoryName || product.category}
            </Badge>

            {/* Popular badge */}
            {product.isPopular && (
              <Badge
                className={`
                  absolute top-2 left-1/2 -translate-x-1/2 bg-primary
                  text-primary-foreground font-semibold
                `}
              >
                {t("popular")}
              </Badge>
            )}

            {/* Discount badge */}
            {discount > 0 && (
              <Badge
                className={`
                absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500
                text-white font-bold shadow-lg animate-pulse
              `}
              >
                -{discount}%
              </Badge>
            )}

            {/* Action buttons container */}
            <div
              className={cn(
                `
                  absolute right-2 bottom-2 z-10 flex flex-col gap-1.5
                  transition-opacity duration-300
                `,
                !isHovered && !isInWishlist && "opacity-0"
              )}
            >
              <Button
                className="rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handleQuickView}
                size="icon"
                type="button"
                variant="outline"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">{t("quickView.button")}</span>
              </Button>

              <SocialShareButtons
                productName={product.name}
                productSlug={product.slug || product.id}
              />

              <Button
                className="rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handleAddToWishlist}
                size="icon"
                type="button"
                variant="outline"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isInWishlist
                      ? "fill-destructive text-destructive"
                      : "text-muted-foreground"
                  )}
                />
                <span className="sr-only">{t("aria.addToWishlist")}</span>
              </Button>
            </div>
          </div>

          <CardContent className="p-4 pt-4">
            {/* Product name with line clamp */}
            <h3
              className={`
                line-clamp-2 text-base font-medium transition-colors
                group-hover:text-primary
              `}
            >
              {product.name}
            </h3>

            {variant === "default" && (
              <>
                <div className="mt-1.5 flex items-center gap-2">
                  {renderStars()}
                  {product.purchaseCount && product.purchaseCount > 0 ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        product.purchaseCount >= 100
                          ? "bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-rose-500/15 text-orange-600 dark:text-orange-300 ring-orange-400/40"
                          : "bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/40"
                      )}
                    >
                      {product.purchaseCount >= 100 ? (
                        <Flame className="h-3 w-3 fill-orange-500/30" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      <span>{t("soldCount", { count: product.purchaseCount })}</span>
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price, locale)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice, locale)}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <Zap className="h-3 w-3" />
                      <span>{t("save", { amount: formatPrice(savings, locale) })}</span>
                    </div>
                  )}
                </div>
                {/* Trust badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs py-0.5 px-2">
                    <Shield className="h-3 w-3 mr-1" />
                    {t("warranty")}
                  </Badge>
                  <Badge variant="outline" className="text-xs py-0.5 px-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("support")}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>

          {variant === "default" && (
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
              <Button
                className={cn(
                  "w-full gap-2 transition-all bg-primary ",
                  isAddingToCart && "opacity-70"
                )}
                disabled={isAddingToCart || !product.inStock}
                onClick={handleQuickBuy}
                size="lg"
              >
                <Zap className="h-4 w-4" />
                {t("buyNow")}
              </Button>
              <Button
                className={cn(
                  "w-full gap-2 transition-all",
                  isAddingToCart && "opacity-70"
                )}
                disabled={isAddingToCart || !product.inStock}
                onClick={handleAddToCart}
                variant="outline"
              >
                {isAddingToCart ? (
                  <div
                    className={`
                      h-4 w-4 animate-spin rounded-full border-2
                      border-primary border-t-transparent
                    `}
                  />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {t("addToCart")}
              </Button>
            </CardFooter>
          )}

          {variant === "compact" && (
            <CardFooter className="p-4 pt-0">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    {formatPrice(product.price, locale)}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.originalPrice, locale)}
                    </span>
                  ) : null}
                </div>
                <Button
                  className="h-8 w-8 rounded-full"
                  disabled={isAddingToCart}
                  onClick={handleAddToCart}
                  size="icon"
                  variant="ghost"
                >
                  {isAddingToCart ? (
                    <div
                      className={`
                        h-4 w-4 animate-spin rounded-full border-2
                        border-primary border-t-transparent
                      `}
                    />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t("addToCart")}</span>
                </Button>
              </div>
            </CardFooter>
          )}

          {!product.inStock && (
            <Badge 
              className="absolute bottom-2 left-2 px-3 py-1 text-sm z-10" 
              variant="destructive"
            >
              {t("outOfStock")}
            </Badge>
          )}
        </Card>
      </Link>
    </div>
  );
}
