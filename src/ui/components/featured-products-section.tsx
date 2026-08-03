"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "~/i18n/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { ProductCard } from "./product-card";
import { Button } from "~/ui/primitives/button";

interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  inStock: boolean;
  stockQuantity?: number;
  isPopular?: boolean;
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  specs?: Record<string, string>;
  tags?: string[];
  productType?: "account" | "license" | "upgrade" | "login_link";
  upgradeEmailOnly?: boolean;
}

interface FeaturedProductsSectionProps {
  products: Product[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { addItem } = useCart();
  const t = useTranslations("FeaturedProducts");

  const handleAddToCart = React.useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
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
          1,
        );
        toast.success(t("toast", { name: product.name }));
      }
    },
    [addItem, products, t],
  );

  const handleAddToWishlist = React.useCallback((productId: string) => {
    console.log(`Added ${productId} to wishlist`);
  }, []);

  return (
    <section className="border-y border-border bg-muted/60 py-12 md:py-16" id="pricing">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-gradient-brand" />
          <p className="mt-4 max-w-2xl text-center font-medium text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Bento-ish product grid for Google / Antigravity SKUs */}
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                "min-h-0",
                index === 0 && "sm:col-span-2 lg:col-span-2 lg:row-span-2",
                index === 1 && "lg:col-span-2",
              )}
            >
              <ProductCard
                className="h-full"
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/products">
            <Button className="group h-12 px-8" size="lg" variant="outline">
              {t("cta")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
