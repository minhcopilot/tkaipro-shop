"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ArrowLeft, CreditCard, ShoppingBag, User, Mail, Phone, MessageSquare, KeyRound, Eye, EyeOff, MessageCircle, Tag, Check, X, Loader2, Wallet as WalletIcon, LogIn } from "lucide-react";
import Image from "next/image";
import { Link, useRouter } from "~/i18n/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { useCurrentUser } from "~/lib/auth-client";
import { CHECKOUT_WALLET_ONLY } from "~/lib/checkout-config";
import { useCart } from "~/lib/hooks/use-cart";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { EXCHANGE_RATE, formatPrice, getLocalizedProduct } from "~/lib/product-localization";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Separator } from "~/ui/primitives/separator";
import { Textarea } from "~/ui/primitives/textarea";

interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export function CheckoutPageClient() {
  const router = useRouter();
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const locale = useLocale();
  const { items, subtotal, clearCart, voucher, applyVoucher, clearVoucher } =
    useCart();
  const { user, isPending } = useCurrentUser();
  
  const [formData, setFormData] = React.useState<CheckoutFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderCreated, setOrderCreated] = React.useState(false);
  const [consentOver18, setConsentOver18] = React.useState(true);
  const [consentTermsPrivacy, setConsentTermsPrivacy] = React.useState(true);
  const [consentReseller, setConsentReseller] = React.useState(true);
  const [consentCursorTos, setConsentCursorTos] = React.useState(true);
  const allConsentsChecked =
    consentOver18 && consentTermsPrivacy && consentReseller && consentCursorTos;
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRequired = Boolean(turnstileSiteKey);

  // Voucher input state — cho phép CTV nhập mã ngay tại trang checkout
  // mà không cần quay lại sidebar giỏ hàng.
  const [voucherCode, setVoucherCode] = React.useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = React.useState(false);

  // Payment method state — 2 lựa chọn:
  //  - "bank_transfer": flow QR cũ (VI: MB Bank, non-VI: crypto tabs).
  //  - "wallet": trừ balance VND (VI) hoặc USD (non-VI). Chỉ available khi:
  //      + user đã login
  //      + chưa apply voucher (anh chốt either/or, không trộn)
  //      + balance >= total tương ứng currency
  const [paymentMethod, setPaymentMethod] = React.useState<
    "bank_transfer" | "wallet"
  >(CHECKOUT_WALLET_ONLY ? "wallet" : "bank_transfer");
  const [walletBalance, setWalletBalance] = React.useState<
    { vnd: number; usd: number } | null
  >(null);

  // Fetch balance khi user logged in
  React.useEffect(() => {
    if (!user) {
      setWalletBalance(null);
      return;
    }
    let cancelled = false;
    fetch("/api/wallet/balance")
      .then(async (r) => (r.ok ? ((await r.json()) as { vnd: number; usd: number }) : null))
      .then((data) => {
        if (!cancelled) setWalletBalance(data);
      })
      .catch(() => {
        if (!cancelled) setWalletBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Tính amount cần trừ ví theo locale (VI: VND nguyên, non-VI: USD cents)
  const orderTotal = Math.max(0, subtotal - (voucher?.discount ?? 0));
  const walletCurrency: "vnd" | "usd" = locale === "vi" ? "vnd" : "usd";
  const walletAmountNeeded =
    walletCurrency === "vnd"
      ? orderTotal
      : Math.ceil((orderTotal / EXCHANGE_RATE) * 100);
  const walletBalanceCurrent = walletBalance
    ? walletCurrency === "vnd"
      ? walletBalance.vnd
      : walletBalance.usd
    : 0;
  const walletEnough = walletBalanceCurrent >= walletAmountNeeded;
  const walletShortfall = Math.max(0, walletAmountNeeded - walletBalanceCurrent);
  const minTopupAmount = walletCurrency === "vnd" ? 50_000 : 500;
  const topupAmount = React.useMemo(() => {
    const raw = Math.max(walletShortfall, minTopupAmount);
    return walletCurrency === "vnd"
      ? Math.ceil(raw / 1000) * 1000
      : raw;
  }, [walletShortfall, minTopupAmount, walletCurrency]);
  const topupHref = `/dashboard/wallet/topup?currency=${walletCurrency}&amount=${topupAmount}&return=/checkout`;
  const formatWalletAmount = (amount: number) =>
    walletCurrency === "vnd"
      ? amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : (amount / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        });
  const walletDisabled = !user || !walletEnough;

  // Auto-fallback khi wallet bị disable (chỉ khi bank_transfer còn bật).
  React.useEffect(() => {
    if (
      !CHECKOUT_WALLET_ONLY &&
      paymentMethod === "wallet" &&
      walletDisabled
    ) {
      setPaymentMethod("bank_transfer");
    }
  }, [paymentMethod, walletDisabled]);

  // upgrade credentials for upgrade products. password & contactInfo optional
  // để hỗ trợ chế độ upgradeEmailOnly (chỉ cần email).
  const [upgradeCredentials, setUpgradeCredentials] = React.useState<Record<string, { email: string; password?: string; contactInfo?: string }>>({});
  const [showPasswords, setShowPasswords] = React.useState<Record<string, boolean>>({});

  // detect upgrade items
  const upgradeItems = items.filter(item => item.productType === "upgrade");
  const hasUpgradeItems = upgradeItems.length > 0;

  // redirect if cart empty (but NOT when order created)
  React.useEffect(() => {
    if (items.length === 0 && !isSubmitting && !orderCreated) {
      router.push("/products");
      toast.error(t("toast.cartEmpty"));
    }
  }, [items, router, isSubmitting, orderCreated, t]);

  // auto-fill info from user
  React.useEffect(() => {
    if (user && !isPending) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
      }));
    }
  }, [user, isPending]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpgradeCredentialChange = (
    itemId: string,
    field: "email" | "password" | "contactInfo",
    value: string
  ) => {
    setUpgradeCredentials(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const togglePasswordVisibility = (itemId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) return;

    setIsApplyingVoucher(true);
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
        toast.error(data.message ?? tCart("voucher.invalid"));
        return;
      }
      applyVoucher({
        code: data.code ?? code.toUpperCase(),
        voucherId: data.voucherId ?? "",
        discount: data.discountApplied ?? 0,
        subtotalAtApply: data.subtotal ?? subtotal,
      });
      setVoucherCode("");
      toast.success(tCart("voucher.applied"));
    } catch {
      toast.error(tCart("voucher.networkError"));
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    clearVoucher();
    toast.success(tCart("voucher.removed"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail) {
      toast.error(t("toast.missingInfo"));
      return;
    }

    if (!allConsentsChecked) {
      toast.error(t("toast.missingConsent"));
      return;
    }

    // validate upgrade credentials — emailOnly: cần email + contactInfo (Telegram/FB),
    // không cần password Cursor. Các sản phẩm khác giữ yêu cầu cũ (đủ 3 field).
    if (hasUpgradeItems) {
      for (const item of upgradeItems) {
        const creds = upgradeCredentials[item.id];
        if (!creds?.email || !creds?.contactInfo) {
          toast.error(t("toast.missingUpgradeInfo"));
          return;
        }
        if (!item.upgradeEmailOnly && !creds.password) {
          toast.error(t("toast.missingUpgradeInfo"));
          return;
        }
      }
    }

    // Wallet path skip captcha (đã có session auth user).
    if (
      !CHECKOUT_WALLET_ONLY &&
      paymentMethod !== "wallet"
    ) {
      if (turnstileRequired && !turnstileToken) {
        toast.error("Vui lòng xác minh captcha trước khi đặt hàng");
        return;
      }
    }

    if (CHECKOUT_WALLET_ONLY && !walletEnough) {
      return;
    }

    setIsSubmitting(true);

    try {
      // merge upgrade credentials into items — với emailOnly bỏ password,
      // giữ email + contactInfo. Flag upgradeEmailOnly cho admin biết đơn
      // này đặt ở chế độ chỉ cần email (không phải KH quên pass).
      const itemsWithCredentials = items.map(item => {
        if (item.productType === "upgrade" && upgradeCredentials[item.id]) {
          const creds = upgradeCredentials[item.id];
          const upgradeCreds = item.upgradeEmailOnly
            ? { email: creds.email, contactInfo: creds.contactInfo }
            : creds;
          return {
            ...item,
            upgradeCredentials: upgradeCreds,
          };
        }
        return item;
      });

      // Create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsWithCredentials,
          customerInfo: formData,
          userId: user?.id,
          locale,
          voucherCode: voucher?.code,
          turnstileToken: CHECKOUT_WALLET_ONLY ? undefined : turnstileToken,
          paymentMethod: CHECKOUT_WALLET_ONLY ? "wallet" : paymentMethod === "wallet" ? "wallet" : undefined,
          termsAccepted: true,
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
        if (err.code === "WALLET_INSUFFICIENT_BALANCE") {
          toast.error(t("payment.walletInsufficient"));
          return;
        }
        if (err.error) {
          toast.error(err.error);
          return;
        }
        throw new Error("Unable to create order");
      }

      const orderData = await response.json() as {
        orderNumber: string;
        id: string;
        paidWithWallet?: boolean;
      };
      
      // Mark as created
      setOrderCreated(true);
      
      toast.success(t("toast.success"));
      
      // Clear cart
      clearCart();

      // Lưu email vào sessionStorage để trang /payment có thể gọi
      // /api/orders/[orderNumber]?email=... và lấy được activationCode +
      // assignedCredentials (endpoint hide sensitive fields nếu thiếu email).
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            `order:${orderData.orderNumber}:email`,
            formData.customerEmail.trim().toLowerCase(),
          );
        }
      } catch {
        // sessionStorage có thể bị disable (private mode) — không critical
      }

      // Wallet đã paid sẵn → bỏ qua /payment, đi thẳng vào trang result
      // (trang /payment/[orderNumber] vẫn render được vì paymentStatus=paid
      // → component sẽ hiển thị credentials thay vì QR).
      router.push(`/payment/${orderData.orderNumber}`);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("toast.error"));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };



  if (items.length === 0 && !orderCreated) {
    return null; // Redirecting in useEffect
  }

  if (!user && !isPending && CHECKOUT_WALLET_ONLY) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-lg px-4">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("loginRequired.title")}</h2>
              <p className="text-muted-foreground mb-6">{t("loginRequired.desc")}</p>
              <Link href="/auth/sign-in?callbackUrl=/checkout">
                <Button size="lg">{t("loginHint.link")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {user ? (
              t.rich("greeting.user", {
                name: user.name,
                span: (chunks) => <span className="font-medium text-primary">{chunks}</span>
              })
            ) : (
              t("greeting.guest")
            )}
          </p>
          {CHECKOUT_WALLET_ONLY && user && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              {t("walletBanner")}
            </div>
          )}
          {!CHECKOUT_WALLET_ONLY && !user && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              💡 <Link href="/auth/sign-in" className="underline hover:text-amber-700">
                {t("loginHint.link")}
              </Link> {t("loginHint.text")}
            </p>
          )}
          
          {/* Progress bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <span className="font-medium text-foreground">{t("steps.info")}</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  2
                </div>
                <span>{t("steps.payment")}</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  3
                </div>
                <span>{t("steps.finish")}</span>
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 bg-primary transition-all duration-300" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("form.customerInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">
                      {t("form.name")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      autoComplete="name"
                      placeholder={t("form.name")}
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                    {user && formData.customerName === user.name && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {t("form.autoFill")}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">
                      {t("form.email")} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        autoComplete="email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10 mt-2"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {user && formData.customerEmail === user.email && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {t("form.autoFill")}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">{t("form.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        autoComplete="tel"
                        type="tel"
                        placeholder="0123456789"
                        className="pl-10 mt-2"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">{t("form.note")}</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder={t("form.notePlaceholder")}
                        className="pl-10 min-h-[100px] mt-2"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade Account Credentials */}
              {hasUpgradeItems && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <KeyRound className="h-5 w-5" />
                      {t("upgradeInfo.title")}
                    </CardTitle>
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      {t("upgradeInfo.description")}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {upgradeItems.map((item) => (
                      <div key={item.id} className="space-y-3 p-4 bg-background rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-md">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2">
                            {getLocalizedProduct({ ...item, name: item.name }, locale).name}
                          </h4>
                          {item.upgradeEmailOnly && (
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold whitespace-nowrap">
                              Chỉ cần email
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`upgrade-email-${item.id}`}>
                              {t("upgradeInfo.email")} <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`upgrade-email-${item.id}`}
                                type="email"
                                placeholder={t("upgradeInfo.emailPlaceholder")}
                                className="pl-10 mt-1"
                                value={upgradeCredentials[item.id]?.email || ""}
                                onChange={(e) => handleUpgradeCredentialChange(item.id, "email", e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          {!item.upgradeEmailOnly && (
                            <div>
                              <Label htmlFor={`upgrade-password-${item.id}`}>
                                {t("upgradeInfo.password")} <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id={`upgrade-password-${item.id}`}
                                  type={showPasswords[item.id] ? "text" : "password"}
                                  placeholder={t("upgradeInfo.passwordPlaceholder")}
                                  className="pl-10 pr-10 mt-1"
                                  value={upgradeCredentials[item.id]?.password || ""}
                                  onChange={(e) => handleUpgradeCredentialChange(item.id, "password", e.target.value)}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(item.id)}
                                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                  {showPasswords[item.id] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor={`upgrade-contact-${item.id}`}>
                              {t("upgradeInfo.contactInfo")} <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`upgrade-contact-${item.id}`}
                                type="text"
                                placeholder={t("upgradeInfo.contactPlaceholder")}
                                className="pl-10 mt-1"
                                value={upgradeCredentials[item.id]?.contactInfo || ""}
                                onChange={(e) => handleUpgradeCredentialChange(item.id, "contactInfo", e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("payment.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Option 1: Wallet (chỉ hiển thị khi user logged in) */}
                  {user && (
                    <label
                      htmlFor="pm_wallet"
                      className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        paymentMethod === "wallet" || CHECKOUT_WALLET_ONLY
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      } ${walletDisabled && !CHECKOUT_WALLET_ONLY ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        id="pm_wallet"
                        name="paymentMethod"
                        value="wallet"
                        checked={paymentMethod === "wallet" || CHECKOUT_WALLET_ONLY}
                        onChange={() => setPaymentMethod("wallet")}
                        disabled={walletDisabled && !CHECKOUT_WALLET_ONLY}
                        className="h-4 w-4"
                      />
                      <WalletIcon className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {t("payment.wallet")}
                          {(CHECKOUT_WALLET_ONLY || paymentMethod === "wallet") && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {t("payment.recommended")}
                            </span>
                          )}
                          {walletBalance && (
                            <span className="text-xs font-normal text-muted-foreground">
                              ({t("payment.walletBalance")}:{" "}
                              {walletCurrency === "vnd"
                                ? walletBalance.vnd.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  })
                                : (walletBalance.usd / 100).toLocaleString(
                                    "en-US",
                                    {
                                      style: "currency",
                                      currency: "USD",
                                      minimumFractionDigits: 2,
                                    },
                                  )}
                              )
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {!walletEnough && walletBalance
                            ? (
                              <span>
                                {t("payment.shortfall", {
                                  amount: formatWalletAmount(walletShortfall),
                                })}
                              </span>
                            )
                            : t("payment.walletDesc")}
                        </div>
                      </div>
                    </label>
                  )}

                  {!CHECKOUT_WALLET_ONLY && (
                  <label
                    htmlFor="pm_bank_transfer"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      paymentMethod === "bank_transfer"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      id="pm_bank_transfer"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                      className="h-4 w-4"
                    />
                    <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{t("payment.bankTransfer")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("payment.bankTransferDesc")}
                      </div>
                    </div>
                  </label>
                  )}

                  {!CHECKOUT_WALLET_ONLY && !user && (
                    <p className="text-xs text-muted-foreground pl-1">
                      <Link href="/auth/sign-in" className="underline">
                        {t("loginHint.link")}
                      </Link>{" "}
                      {t("payment.walletLoginHint")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    {t("summary.title", { count: items.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium line-clamp-1">
                            {getLocalizedProduct({ ...item, name: item.name }, locale).name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.category} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity, locale)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Voucher input — same flow như cart sidebar */}
                  <div className="rounded-lg border bg-muted/30 p-3 mb-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <span>Mã giảm giá / Voucher</span>
                    </div>

                    {voucher ? (
                      <div className="flex items-center justify-between gap-2 rounded-md border border-green-300 bg-green-50 p-2.5 dark:border-green-800 dark:bg-green-950/40">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-green-800 dark:text-green-300">
                            <Check className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {tCart("voucher.appliedLabel")}
                            </span>
                            <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs dark:bg-green-900/60">
                              {voucher.code}
                            </code>
                          </div>
                          {voucher.discount > 0 && (
                            <div className="mt-0.5 text-xs text-green-700 dark:text-green-400">
                              -{formatPrice(voucher.discount, locale)}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          className="flex-shrink-0 rounded-md p-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/60"
                          aria-label={tCart("voucher.remove")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={voucherCode}
                          onChange={(e) =>
                            setVoucherCode(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleApplyVoucher();
                            }
                          }}
                          placeholder="VD: CTV-XXXXXXXXXX"
                          className="font-mono text-sm uppercase"
                          disabled={isApplyingVoucher}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleApplyVoucher()}
                          disabled={isApplyingVoucher || !voucherCode.trim()}
                          className="flex-shrink-0"
                        >
                          {isApplyingVoucher ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Áp dụng"
                          )}
                        </Button>
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Nhập mã CTV được cấp để giảm trực tiếp số tiền tương ứng.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("summary.subtotal")}:</span>
                      <span>{formatPrice(subtotal, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("summary.processingFee")}:</span>
                      <span>{t("summary.free")}</span>
                    </div>
                    {voucher && voucher.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          {t("summary.voucher", { code: voucher.code })}
                        </span>
                        <span>-{formatPrice(voucher.discount, locale)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{t("summary.total")}:</span>
                      <span className="text-lg">
                        {formatPrice(
                          Math.max(0, subtotal - (voucher?.discount ?? 0)),
                          locale,
                        )}
                      </span>
                    </div>
                  </div>

                  {turnstileSiteKey && !CHECKOUT_WALLET_ONLY && paymentMethod !== "wallet" ? (
                    <div className="mt-4 flex justify-center">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={turnstileSiteKey}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken(null)}
                        onError={() => setTurnstileToken(null)}
                        options={{ theme: "auto", size: "normal" }}
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">{t("consent.title")}</p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentOver18}
                        onCheckedChange={(v) => setConsentOver18(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t("consent.over18")}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentTermsPrivacy}
                        onCheckedChange={(v) => setConsentTermsPrivacy(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t.rich("consent.termsPrivacy", {
                          terms: (chunks) => (
                            <Link href="/terms" className="underline text-foreground">
                              {chunks}
                            </Link>
                          ),
                          privacy: (chunks) => (
                            <Link href="/privacy" className="underline text-foreground">
                              {chunks}
                            </Link>
                          ),
                        })}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentReseller}
                        onCheckedChange={(v) => setConsentReseller(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t("consent.reseller")}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentCursorTos}
                        onCheckedChange={(v) => setConsentCursorTos(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t.rich("consent.cursorTos", {
                          link: (chunks) => (
                            <a
                              href="https://cursor.com/terms-of-service"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-foreground"
                            >
                              {chunks}
                            </a>
                          ),
                        })}
                      </span>
                    </label>
                  </div>

                  {CHECKOUT_WALLET_ONLY && user && !walletEnough ? (
                    <Link href={topupHref} className="block mt-6">
                      <Button type="button" variant="secondary" className="w-full" size="lg">
                        {t("payment.topupCta", { amount: formatWalletAmount(topupAmount) })}
                      </Button>
                    </Link>
                  ) : null}

                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    size="lg"
                    disabled={
                      isSubmitting ||
                      !allConsentsChecked ||
                      (CHECKOUT_WALLET_ONLY
                        ? !walletEnough
                        : paymentMethod !== "wallet" && turnstileRequired && !turnstileToken)
                    }
                  >
                    {isSubmitting
                      ? t("summary.submitting")
                      : CHECKOUT_WALLET_ONLY || paymentMethod === "wallet"
                        ? t("payment.payWithWalletBtn")
                        : t("summary.submit")}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {t("summary.termsHint")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
