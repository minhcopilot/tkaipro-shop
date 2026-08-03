"use client";

import { Check, ChevronRight, ShoppingCart, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "~/i18n/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { formatPrice, getLocalizedProduct } from "~/lib/product-localization";
import { cn } from "~/lib/cn";
import { useCart, type CartItem } from "~/lib/hooks/use-cart";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Skeleton } from "~/ui/primitives/skeleton";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  productType?: string;
  upgradeEmailOnly?: boolean;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  isPopular?: boolean;
  rating: number;
  reviewCount?: number;
  features?: string[];
  nameLocales?: Record<string, string>;
  descriptionLocales?: Record<string, string>;
  shortDescriptionLocales?: Record<string, string>;
  featuresLocales?: Record<string, string[]>;
}

interface ProductQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSlug: string;
  productImage: string;
  productName: string;
  productPrice: number;
  originalPrice?: number;
}

export function ProductQuickView({
  open,
  onOpenChange,
  productSlug,
  productImage,
  productName,
  productPrice,
  originalPrice,
}: ProductQuickViewProps) {
  const t = useTranslations("ProductCard");
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const [detail, setDetail] = React.useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !productSlug) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/products/${productSlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          const localized = getLocalizedProduct(data as ProductDetail, locale);
          setDetail(localized);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, productSlug, locale]);

  const discount =
    (originalPrice ?? detail?.originalPrice)
      ? Math.round(
          (((originalPrice ?? detail?.originalPrice ?? 0) - (detail?.price ?? productPrice)) /
            (originalPrice ?? detail?.originalPrice ?? 1)) *
            100,
        )
      : 0;

  const handleBuyNow = () => {
    const d = detail;
    addItem(
      {
        category: d?.category ?? "",
        id: d?.id ?? productSlug,
        image: d?.image ?? productImage,
        name: d?.name ?? productName,
        price: d?.price ?? productPrice,
        productType: d?.productType as CartItem["productType"],
        upgradeEmailOnly: d?.upgradeEmailOnly,
      },
      1,
    );
    onOpenChange(false);
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    const d = detail;
    addItem(
      {
        category: d?.category ?? "",
        id: d?.id ?? productSlug,
        image: d?.image ?? productImage,
        name: d?.name ?? productName,
        price: d?.price ?? productPrice,
        productType: d?.productType as CartItem["productType"],
        upgradeEmailOnly: d?.upgradeEmailOnly,
      },
      1,
    );
    toast.success(t("toast.added", { name: d?.name ?? productName }));
  };

  const handleViewDetail = () => {
    onOpenChange(false);
    router.push(`/products/${productSlug}`);
  };

  const price = detail?.price ?? productPrice;
  const origPrice = detail?.originalPrice ?? originalPrice;
  const name = detail?.name ?? productName;
  const image = detail?.image ?? productImage;
  const rating = detail?.rating ?? 0;
  const features = detail?.features ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] p-0 gap-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-muted/30 sm:rounded-l-lg overflow-hidden">
            <Image
              alt={name}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              src={image}
            />
            {discount > 0 && (
              <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold shadow-lg">
                -{discount}%
              </Badge>
            )}
            {detail?.isPopular && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-semibold">
                {t("popular")}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col p-5 sm:p-6">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-lg leading-snug line-clamp-2">
                {name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("quickView.button")}
              </DialogDescription>
            </DialogHeader>

            {/* Rating */}
            {isLoading ? (
              <Skeleton className="h-4 w-24 mb-3" />
            ) : (
              rating > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({detail?.reviewCount ?? 0})
                  </span>
                </div>
              )
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(price, locale)}
              </span>
              {origPrice && origPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(origPrice, locale)}
                </span>
              )}
            </div>

            {/* Short description */}
            {isLoading ? (
              <div className="space-y-2 mb-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : (
              detail?.shortDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {detail.shortDescription}
                </p>
              )
            )}

            {/* Features */}
            {isLoading ? (
              <div className="space-y-2 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-5/6" />
                ))}
              </div>
            ) : (
              features.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t("quickView.features")}
                  </p>
                  <ul className="space-y-1.5">
                    {features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}

            {/* CTA */}
            <div className="mt-auto flex flex-col gap-2">
              <Button
                className="w-full gap-2 bg-primary "
                disabled={detail ? !detail.inStock : false}
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                {t("buyNow")}
              </Button>
              <Button
                className="w-full gap-2"
                disabled={detail ? !detail.inStock : false}
                onClick={handleAddToCart}
                variant="outline"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("addToCart")}
              </Button>
              <Button
                className="w-full gap-1 text-xs"
                onClick={handleViewDetail}
                variant="ghost"
                size="sm"
              >
                {t("quickView.viewDetail")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
