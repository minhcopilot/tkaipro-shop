"use client";

import {
  Check,
  ChevronRight,
  Clock,
  Minus,
  Package,
  Plus,
  Flame,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { SEO_CONFIG } from "~/app";
import { useCart } from "~/lib/hooks/use-cart";
import { Breadcrumbs } from "~/ui/components/breadcrumbs";
import { CustomRequestBanner } from "~/ui/components/custom-request-banner";
import { RestockAlertForm } from "~/ui/components/restock-alert-form";
import { ProductCard } from "~/ui/components/product-card";
import { SocialShareButtons } from "~/ui/components/social-share-buttons";
import { formatPrice, getLocalizedProduct } from "~/lib/product-localization";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";
import { ProductReviewsWrapper } from "~/ui/components/product-reviews-wrapper";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent } from "~/ui/primitives/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";
import { cn } from "~/lib/cn";

// "Upgrade option" gắn vào sản phẩm account: cho phép khách chọn mua mới
// hoặc nâng cấp chính chủ (giá riêng) ngay trên trang chi tiết.
interface UpgradeOption {
  id: string;
  slug: string;
  name: string;
  nameLocales?: Record<string, string> | null;
  price: number;
  originalPrice?: number;
  upgradeEmailOnly?: boolean;
}

interface Product {
  category: string;
  categorySlug?: string;
  description: string;
  shortDescription?: string;
  features: string[];
  id: string;
  image: string;
  inStock: boolean;
  stockQuantity?: number;
  availableAccounts?: number;
  name: string;
  originalPrice?: number;
  price: number;
  rating: number;
  reviewCount?: number;
  purchaseCount?: number;
  specs: Record<string, string>;
  isPopular?: boolean;
  slug: string;
  productType?: "account" | "license" | "upgrade" | "login_link";
  upgradeEmailOnly?: boolean;
  upgradeOption?: UpgradeOption;
}

type PurchaseMode = "account" | "upgrade";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const range = (length: number) => Array.from({ length }, (_, i) => i);

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations("ProductDetail");
  // Reseller/trademark notice strings live under the "ProductPage" namespace.
  const tProductPage = useTranslations("ProductPage");
  const locale = useLocale();
  const { addItem } = useCart();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [quantity, setQuantity] = React.useState(1);
  const [isAdding, setIsAdding] = React.useState(false);
  // "account" = mua tài khoản mới, "upgrade" = nâng cấp chính chủ (option liên kết)
  const [purchaseMode, setPurchaseMode] = React.useState<PurchaseMode>("account");

  React.useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${slug}`);
        if (response.ok) {
          const productData = (await response.json()) as Product;
          setProduct(productData);
          // Mặc định luôn về "mua tài khoản mới" khi đổi sản phẩm.
          setPurchaseMode("account");
        } else if (response.status === 404) {
          setProduct(null);
        } else {
          console.error("Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const localizedProduct = React.useMemo(() => {
    return product ? getLocalizedProduct(product, locale) : null;
  }, [product, locale]);

  const upgradeOption = product?.upgradeOption;
  const isUpgradeMode = purchaseMode === "upgrade" && !!upgradeOption;

  // Tên hiển thị của option nâng cấp đã localize (dùng nameLocales nếu có).
  const localizedUpgradeName = React.useMemo(() => {
    if (!upgradeOption) return "";
    return getLocalizedProduct(
      {
        id: upgradeOption.id,
        slug: upgradeOption.slug,
        name: upgradeOption.name,
        nameLocales: upgradeOption.nameLocales,
      },
      locale
    ).name;
  }, [upgradeOption, locale]);

  // Giá đang áp dụng theo mode mua: account (gốc) hoặc upgrade (option).
  const activePrice = isUpgradeMode
    ? upgradeOption!.price
    : localizedProduct?.price ?? 0;
  const activeOriginalPrice = isUpgradeMode
    ? upgradeOption!.originalPrice
    : localizedProduct?.originalPrice;

  const discountPercentage = React.useMemo(() => {
    if (!activeOriginalPrice) return 0;
    return Math.round(
      ((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100
    );
  }, [activeOriginalPrice, activePrice]);

  const savings = React.useMemo(() => {
    if (!activeOriginalPrice) return 0;
    return activeOriginalPrice - activePrice;
  }, [activeOriginalPrice, activePrice]);

  const handleQuantityChange = React.useCallback((newQty: number) => {
    setQuantity((prev) => (newQty >= 1 ? newQty : prev));
  }, []);

  // Tạo cart item theo mode đang chọn. Khi nâng cấp chính chủ: dùng id/giá/loại
  // của sản phẩm upgrade liên kết nhưng giữ ảnh của sản phẩm gốc cho đồng nhất.
  const buildCartItem = React.useCallback(() => {
    if (!product) return null;
    if (isUpgradeMode && upgradeOption) {
      return {
        category: product.category,
        id: upgradeOption.id,
        image: product.image,
        name: upgradeOption.name,
        price: upgradeOption.price,
        productType: "upgrade" as const,
        upgradeEmailOnly: upgradeOption.upgradeEmailOnly,
      };
    }
    return {
      category: product.category,
      id: product.id,
      image: product.image,
      name: product.name,
      price: product.price,
      productType: product.productType,
      upgradeEmailOnly: product.upgradeEmailOnly,
    };
  }, [product, isUpgradeMode, upgradeOption]);

  const handleAddToCart = React.useCallback(async () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;

    setIsAdding(true);
    addItem(cartItem, quantity);
    setQuantity(1);
    toast.success(t("actions.added", { name: cartItem.name }));
    await new Promise((r) => setTimeout(r, 400));
    setIsAdding(false);
  }, [addItem, buildCartItem, quantity, t]);

  const handleBuyNow = React.useCallback(async () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;

    addItem(cartItem, quantity);
    router.push("/checkout");
  }, [addItem, buildCartItem, quantity, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="py-6 lg:py-10">
          <div className="container px-4 md:px-6">
            <Skeleton className="mb-6 h-6 w-72" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!localizedProduct || !product) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex-1 py-20">
          <div className="container px-4 md:px-6 text-center">
            <div className="mx-auto max-w-md">
              <Package className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h1 className="text-3xl font-bold mb-4">{t("notFound.title")}</h1>
              <p className="text-muted-foreground mb-8">
                {t("notFound.description")}
              </p>
              <Button size="lg" onClick={() => router.push("/products")}>
                {t("notFound.button")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: localizedProduct.name,
    description: product.description || product.shortDescription,
    image: product.image,
    brand: {
      "@type": "Organization",
      name: SEO_CONFIG.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: "Google LLC",
      url: "https://www.figma.com/",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SEO_CONFIG.url}/products/${product.slug}`,
      priceCurrency: "VND",
      price: product.price.toString(),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      seller: {
        "@type": "Organization",
        name: SEO_CONFIG.name,
        url: SEO_CONFIG.url,
      },
      ...(product.originalPrice && {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: product.originalPrice.toString(),
          priceCurrency: "VND",
        },
      }),
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating.toString(),
          reviewCount: (product.reviewCount || 0).toString(),
          bestRating: "5",
          worstRating: "1",
        }
      : undefined,
    additionalProperty: Object.entries(product.specs || {}).map(
      ([key, value]) => ({
        "@type": "PropertyValue",
        name: key,
        value: value,
      })
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <main className="py-6 lg:py-10">
        <div className="container px-4 md:px-6">
          {/* breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: t("breadcrumbs.home"), href: "/" },
                { name: t("breadcrumbs.products"), href: "/products" },
                {
                  name: localizedProduct.category,
                  href: `/products?category=${localizedProduct.category}`,
                },
                {
                  name: localizedProduct.name,
                  href: `/products/${localizedProduct.slug}`,
                },
              ]}
            />
          </div>

          {/* Banner: tài khoản KHÁC ngoài danh sách trên website */}
          <div className="mb-6">
            <CustomRequestBanner />
          </div>

          {/* main product section */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* product image */}
            <div className="space-y-4 lg:max-w-md lg:mx-auto">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted max-w-sm mx-auto lg:max-w-full">
                <Image
                  alt={`${product.name} - ${product.category} - ${SEO_CONFIG.name}`}
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  fill
                  priority
                  src={product.image}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* badges overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discountPercentage > 0 && (
                    <Badge className="bg-foreground text-white font-bold px-3 py-1 text-sm shadow-lg">
                      {t("badges.discount", { percent: discountPercentage })}
                    </Badge>
                  )}
                  {product.isPopular && (
                    <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-sm shadow-lg">
                      🔥 {t("badges.popular")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* trust badges - desktop */}
              <div className="hidden lg:grid grid-cols-3 gap-3">
                <TrustBadge
                  icon={<Shield className="h-5 w-5" />}
                  title={t("trust.warranty")}
                  subtitle={t("trust.warrantyDesc")}
                />
                <TrustBadge
                  icon={<Truck className="h-5 w-5" />}
                  title={t("trust.delivery")}
                  subtitle={t("trust.deliveryDesc")}
                />
                <TrustBadge
                  icon={<Clock className="h-5 w-5" />}
                  title={t("trust.support")}
                  subtitle={t("trust.supportDesc")}
                />
              </div>
            </div>

            {/* product info */}
            <div className="flex flex-col">
              {/* category */}
              <div className="mb-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {product.category}
                </Badge>
              </div>

              {/* title */}
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl mb-3">
                {localizedProduct.name}
              </h1>

              {/* rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {range(5).map((i) => (
                    <Star
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : i < product.rating
                            ? "fill-yellow-400/50 text-yellow-400"
                            : "text-muted-foreground/30"
                      )}
                      key={`star-${i}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount || 0} {t("reviews")})
                </span>
                {product.purchaseCount && product.purchaseCount > 0 ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset shadow-sm transition-all",
                        product.purchaseCount >= 100
                          ? "bg-muted text-foreground ring-border"
                          : "bg-muted text-foreground ring-border"
                      )}
                    >
                      {product.purchaseCount >= 100 ? (
                        <Flame className="h-3.5 w-3.5 fill-orange-500/30 animate-pulse" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      <span className="tracking-tight">
                        {t("soldCount", { count: product.purchaseCount })}
                      </span>
                    </span>
                  </>
                ) : null}
                <div className="ml-auto">
                  <SocialShareButtons
                    productName={product.name}
                    productSlug={product.slug}
                    variant="icon"
                  />
                </div>
              </div>

              {/* short description */}
              {localizedProduct.shortDescription && (
                <p className="text-muted-foreground text-base leading-relaxed mb-6">
                  {localizedProduct.shortDescription}
                </p>
              )}

              {/* purchase mode selector: chỉ hiện khi sản phẩm có option nâng cấp */}
              {upgradeOption && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <PurchaseModeOption
                    active={purchaseMode === "account"}
                    title={t("purchaseMode.account")}
                    price={formatPrice(localizedProduct.price, locale)}
                    onSelect={() => setPurchaseMode("account")}
                  />
                  <PurchaseModeOption
                    active={purchaseMode === "upgrade"}
                    title={t("purchaseMode.upgrade")}
                    price={formatPrice(upgradeOption.price, locale)}
                    onSelect={() => setPurchaseMode("upgrade")}
                  />
                </div>
              )}

              {/* price section */}
              <Card className="mb-6 border-primary/20 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary sm:text-4xl">
                      {formatPrice(activePrice, locale)}
                    </span>
                    {activeOriginalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(activeOriginalPrice, locale)}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600 dark:text-green-400"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {t("save", { amount: formatPrice(savings, locale) })}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* stock status */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  {product.inStock ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {t("status.inStock")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {t("status.outOfStock")}
                      </span>
                    </div>
                  )}

                  {product.availableAccounts !== undefined &&
                    product.availableAccounts > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-foreground" />
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {t("status.available", {
                            count: product.availableAccounts,
                          })}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {!product.inStock && (
                <div className="mb-6">
                  <RestockAlertForm productSlug={product.slug} />
                </div>
              )}

              {/* quantity and actions */}
              <div className="space-y-4">
                {/* quantity selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{t("quantity")}:</span>
                  <div className="flex items-center rounded-lg border bg-background">
                    <Button
                      aria-label={t("item.decrease")}
                      disabled={quantity <= 1}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-r-none"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium select-none">
                      {quantity}
                    </span>
                    <Button
                      aria-label={t("item.increase")}
                      onClick={() => handleQuantityChange(quantity + 1)}
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-l-none"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* action buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1 h-12 text-base font-semibold gap-2 bg-primary  "
                    disabled={!product.inStock || isAdding}
                    onClick={handleBuyNow}
                    size="lg"
                  >
                    <Zap className="h-5 w-5" />
                    {t("actions.buyNow")}
                  </Button>
                  <Button
                    className="flex-1 h-12 text-base font-semibold gap-2"
                    disabled={!product.inStock || isAdding}
                    onClick={handleAddToCart}
                    variant="outline"
                    size="lg"
                  >
                    {isAdding ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <ShoppingCart className="h-5 w-5" />
                    )}
                    {isAdding ? t("actions.adding") : t("actions.addToCart")}
                  </Button>
                </div>

                {/* Reseller / trademark disclosure required for nominative
                    fair use safety. Rendered prominently next to the buy
                    actions so customers see it before purchase. */}
                <div className="mt-4 rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-semibold mb-0.5">{tProductPage("actions.resellerNoticeTitle")}</p>
                  <p>{tProductPage("actions.resellerNoticeBody")}</p>
                </div>
              </div>

              {/* trust badges - mobile */}
              <div className="grid grid-cols-3 gap-2 mt-6 lg:hidden">
                <TrustBadgeMini
                  icon={<Shield className="h-4 w-4" />}
                  title={t("trust.warranty")}
                />
                <TrustBadgeMini
                  icon={<Truck className="h-4 w-4" />}
                  title={t("trust.delivery")}
                />
                <TrustBadgeMini
                  icon={<Clock className="h-4 w-4" />}
                  title={t("trust.support")}
                />
              </div>
            </div>
          </div>

          {/* tabs section */}
          <div className="mt-12">
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl flex-wrap">
                <TabsTrigger
                  value="features"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {t("sections.features")}
                </TabsTrigger>
                <TabsTrigger
                  value="description"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {t("sections.description")}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {t("sections.reviews")}
                  {product.reviewCount ? ` (${product.reviewCount})` : ""}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {product.features.map((feature) => (
                        <div
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          key={`feature-${product.id}-${slugify(feature)}`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <span className="text-sm leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="prose prose-gray max-w-none dark:prose-invert">
                      <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                        {localizedProduct.description ||
                          t("noDescription")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <ProductReviewsWrapper productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>

          <RelatedProducts
            currentProductId={product.id}
            categorySlug={product.categorySlug || ""}
          />
        </div>
      </main>

      {/* sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-4 shadow-soft lg:hidden">
        <div className="container flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {isUpgradeMode ? localizedUpgradeName : localizedProduct.name}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatPrice(activePrice, locale)}
            </p>
          </div>
          <Button
            className="h-11 px-6 font-semibold gap-2 bg-primary"
            disabled={!product.inStock}
            onClick={handleBuyNow}
          >
            <Zap className="h-4 w-4" />
            {t("actions.buyNow")}
          </Button>
        </div>
      </div>

      {/* spacer for sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

// Một lựa chọn mua (mua mới / nâng cấp chính chủ) dạng nút radio có giá.
function PurchaseModeOption({
  active,
  title,
  price,
  onSelect,
}: {
  active: boolean;
  title: string;
  price: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      <span
        className={cn(
          "text-base font-bold",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {price}
      </span>
    </button>
  );
}

function TrustBadge({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="border-muted">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrustBadgeMini({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 text-center">
      <div className="text-primary">{icon}</div>
      <span className="text-xs font-medium">{title}</span>
    </div>
  );
}

interface RelatedProduct {
  category: string;
  categoryName?: string;
  id: string;
  slug?: string;
  image: string;
  inStock: boolean;
  name: string;
  originalPrice?: number;
  price: number;
  rating: number;
  isPopular?: boolean;
  productType?: "account" | "license" | "upgrade" | "login_link";
  upgradeEmailOnly?: boolean;
}

function RelatedProducts({
  currentProductId,
  categorySlug,
}: {
  currentProductId: string;
  categorySlug: string;
}) {
  const t = useTranslations("ProductDetail");
  const locale = useLocale();
  const { addItem } = useCart();
  const router = useRouter();
  const [products, setProducts] = React.useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!categorySlug) {
      setIsLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/products?category=${categorySlug}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const filtered = (data.products as RelatedProduct[])
            .filter((p) => p.id !== currentProductId)
            .slice(0, 4);
          setProducts(filtered);
        }
      } catch {
        // silently fail — related products are non-critical
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [categorySlug, currentProductId]);

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
        toast.success(t("relatedProducts.added", { name: product.name }));
      }
    },
    [addItem, products, t],
  );

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-12 pt-12 border-t border-border/40">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-foreground" />
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t("relatedProducts.title")}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-full text-xs"
          onClick={() => router.push("/products")}
        >
          {t("relatedProducts.viewAll")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          : products.map((product) => (
              <ProductCard
                key={product.id}
                onAddToCart={handleAddToCart}
                product={getLocalizedProduct(product, locale)}
                variant="compact"
              />
            ))}
      </div>
    </section>
  );
}
