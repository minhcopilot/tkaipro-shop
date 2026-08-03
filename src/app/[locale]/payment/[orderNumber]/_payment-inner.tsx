"use client";

import { CheckCircle, Copy, QrCode, RefreshCw, ArrowLeft, Clock, Mail } from "lucide-react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Separator } from "~/ui/primitives/separator";
import { Skeleton } from "~/ui/primitives/skeleton";
import { UserOrderCredentials } from "~/ui/components/orders/user-order-credentials";
import { formatPrice } from "~/lib/product-localization";
import { CelebrationConfetti } from "~/ui/components/effects/celebration-confetti";
import { useCurrentUser } from "~/lib/auth-client";
import { buildVietQrUrl } from "~/lib/payment/vietqr";

import { CryptoTabsPanel } from "./_crypto-tabs";

import type { AssignedCredential } from "~/db/schema/orders/tables";

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const FACEBOOK_URL = SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

interface BankInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  paymentMemo?: string | null;
  status: string;
  paymentStatus: string;
  total: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    image: string;
    productType?: string;
  }>;
  createdAt: string;
  sepayQrCode?: string;
  assignedCredentials?: AssignedCredential[];
  activationCode?: string | null;
  requiresEmail?: boolean;
}

export function PaymentInner() {
  const t = useTranslations("PaymentResult");
  const tWarn = useTranslations("ActivationWarning");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;
  
  const { user, isPending: isAuthPending } = useCurrentUser();
  const isGuest = !isAuthPending && !user;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentChecking, setPaymentChecking] = React.useState(false);
  const [redirectCountdown, setRedirectCountdown] = React.useState<number | null>(null);
  // Email khách tự nhập để mở khoá xem tài khoản (guest quay lại, không có
  // sessionStorage). Không tự lấy từ server nữa (chống bypass email gate).
  const [manualEmail, setManualEmail] = React.useState("");
  const [bankAccount, setBankAccount] = React.useState<BankInfo | null>(null);
  const [bankLoading, setBankLoading] = React.useState(false);

  // Email-gating helper: build URL có `?email=` để lấy được activationCode +
  // assignedCredentials từ /api/orders/[orderNumber] (endpoint chỉ trả các
  // field nhạy cảm khi email khớp đơn). Ưu tiên user.email (đã login) >
  // sessionStorage (set lúc checkout) > order.customerEmail (sau khi đã fetch
  // 1 lần safe). Nếu vẫn không có → fetch safe mode, KH cần nhập email manual
  // qua bước thank-you (TODO sau).
  // SECURITY: KHÔNG fallback theo order.customerEmail (server không còn echo
  // email ở mode chưa cấp quyền). Chủ đơn đã đăng nhập được server cấp quyền
  // qua session (không cần email). Guest dùng email đã nhập lúc checkout
  // (sessionStorage) hoặc tự nhập lại ở ô bên dưới.
  const buildOrderUrl = React.useCallback(() => {
    let email = "";
    try {
      if (typeof window !== "undefined") {
        email =
          window.sessionStorage.getItem(`order:${orderNumber}:email`) ?? "";
      }
    } catch {
      email = "";
    }
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    return `/api/orders/${orderNumber}${qs}`;
  }, [orderNumber]);

  // Format currency based on locale
  const formatCurrency = (amount: number) => {
    return formatPrice(amount, locale);
  };

  const transferContent = React.useMemo(() => {
    if (order?.paymentMemo) return order.paymentMemo;
    return orderNumber.replace(/^ORD/i, "");
  }, [order?.paymentMemo, orderNumber]);

  // Fetch TK đã gắn vào đơn (snapshot) — chỉ locale VI dùng VietQR
  React.useEffect(() => {
    if (locale !== "vi" || !orderNumber) return;

    let cancelled = false;
    setBankLoading(true);

    fetch(`/api/payment/bank-info?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("bank info fetch failed");
        return res.json() as Promise<BankInfo>;
      })
      .then((data) => {
        if (!cancelled) setBankAccount(data);
      })
      .catch((err) => {
        console.error("Error fetching bank info:", err);
        if (!cancelled) setBankAccount(null);
      })
      .finally(() => {
        if (!cancelled) setBankLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, orderNumber]);

  const generateVietQRUrl = React.useMemo(() => {
    if (!order || locale !== "vi" || !bankAccount) return null;

    return buildVietQrUrl({
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      amount: order.total,
      content: transferContent,
    });
  }, [order, locale, bankAccount, transferContent]);

  // fetch order data
  const fetchOrder = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(buildOrderUrl());

      if (!response.ok) {
        if (response.status === 404) {
          setError(t("error.notFound"));
        } else {
          setError(t("error.fetchError"));
        }
        return;
      }

      const orderData = await response.json() as Order;
      setOrder(orderData);
      setError(null);

      // Sau khi có order.customerEmail từ safe payload, lưu vào sessionStorage
      // để các lần fetch sau (đặc biệt là sau khi payment paid) có thể truyền
      // ?email= và lấy activationCode + assignedCredentials.
      try {
        if (typeof window !== "undefined" && orderData.customerEmail) {
          window.sessionStorage.setItem(
            `order:${orderNumber}:email`,
            orderData.customerEmail.trim().toLowerCase(),
          );
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(t("error.connection"));
    } finally {
      setLoading(false);
    }
  }, [orderNumber, t, buildOrderUrl]);

  // Guest tự nhập email đã đặt đơn -> lưu sessionStorage + refetch để mở khoá.
  const submitManualEmail = React.useCallback(() => {
    const e = manualEmail.trim().toLowerCase();
    if (!e) return;
    try {
      window.sessionStorage.setItem(`order:${orderNumber}:email`, e);
    } catch {
      // ignore
    }
    void fetchOrder();
  }, [manualEmail, orderNumber, fetchOrder]);

  // check payment status
  const checkPaymentStatus = React.useCallback(async () => {
    if (!order) return;

    try {
      setPaymentChecking(true);
      const response = await fetch(`/api/orders/${orderNumber}/payment-status`);
      
      if (response.ok) {
        const data = await response.json() as { paymentStatus: string };
        if (data.paymentStatus === 'paid') {
          // Refetch full order để lấy activationCode, assignedCredentials, status mới sau webhook
          try {
            const fullRes = await fetch(buildOrderUrl());
            if (fullRes.ok) {
              const fresh = await fullRes.json() as Order;
              setOrder(fresh);
            } else {
              setOrder(prev => prev ? { ...prev, paymentStatus: 'paid', status: 'processing' } : null);
            }
          } catch {
            setOrder(prev => prev ? { ...prev, paymentStatus: 'paid', status: 'processing' } : null);
          }

          toast.success(t("summary.successTitle"));

          if (!isGuest) {
            setRedirectCountdown(3);
          }
        }
      }
    } catch (err) {
      console.error("Error checking payment:", err);
    } finally {
      setPaymentChecking(false);
    }
  }, [order, orderNumber, isGuest, t, buildOrderUrl]);

  // copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("transfer.copy", { label }));
  };

  // auto-check payment every 10 seconds
  React.useEffect(() => {
    if (order && order.paymentStatus === 'pending') {
      const interval = setInterval(checkPaymentStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [order, checkPaymentStatus]);

  React.useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // auto-redirect if already paid (only for logged-in users)
  React.useEffect(() => {
    if (order && order.paymentStatus === 'paid' && redirectCountdown === null && !isGuest) {
      setRedirectCountdown(3);
    }
  }, [order, redirectCountdown, isGuest]);

  // countdown timer effect
  React.useEffect(() => {
    if (redirectCountdown === null) return;
    
    if (redirectCountdown === 0) {
      router.push('/dashboard/orders');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              {error || t("error.notFound")}
            </h1>
            <Button onClick={() => router.push("/products")}>
              {t("error.back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <CelebrationConfetti key={orderNumber} active={order.paymentStatus === 'paid'} />
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backButton")}
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground">
                {t("orderNumber", { number: orderNumber })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {order.paymentStatus === 'paid' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t("status.paid")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{t("status.pending")}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  ✓
                </div>
                <span>{t("progress.info")}</span>
              </span>
              <span className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓' : '2'}
                </div>
                <span className={order.paymentStatus === 'paid' ? 'font-medium text-foreground' : 'font-medium text-foreground'}>
                  {t("progress.payment")}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓' : '3'}
                </div>
                <span className={order.paymentStatus === 'paid' ? 'font-medium text-foreground' : ''}>
                  {t("progress.finish")}
                </span>
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full bg-primary transition-all duration-300 ${
                  order.paymentStatus === 'paid' ? 'w-full' : 'w-2/3'
                }`} 
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* QR Code & Bank Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                {t("transfer.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {locale === 'vi' ? (
                <>
                  {/* QR Code (VietQR) */}
                  <div className="flex justify-center">
                    <div className="relative">
                      {generateVietQRUrl ? (
                        <div className="rounded-lg overflow-hidden border-2 border-primary/20 bg-white p-4">
                          <Image
                            src={generateVietQRUrl}
                            alt={t("qrAlt")}
                            width={256}
                            height={256}
                            className="w-64 h-64"
                            priority
                          />
                          <p className="text-center text-xs text-muted-foreground mt-2">
                            {t("transfer.scan")}
                          </p>
                        </div>
                      ) : bankLoading ? (
                        <div className="h-64 w-64 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                          <div className="text-center">
                            <RefreshCw className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-spin" />
                            <p className="text-sm text-muted-foreground">
                              {t("transfer.generating")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 w-64 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                          <div className="text-center">
                            <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {t("transfer.generating")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Info */}
                  {bankAccount && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">{t("transfer.bank")}:</span>
                      <span className="font-medium">{bankAccount.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">{t("transfer.accountNumber")}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{bankAccount.accountNumber}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(bankAccount.accountNumber, t("transfer.accountNumber"))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">{t("transfer.accountName")}:</span>
                      <span className="font-medium">{bankAccount.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">{t("transfer.amount")}:</span>
                      <span className="font-bold text-lg text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    <div className="p-3 bg-primary/10 rounded border-l-4 border-primary">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">{t("transfer.content")}:</p>
                          <p className="font-mono font-medium text-primary break-all">
                            {transferContent}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("transfer.contentNote")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(transferContent, t("transfer.content"))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Auto-verification notice (chỉ VI - SePay webhook) */}
                  {order.paymentStatus === 'pending' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            {t("transfer.autoVerifyTitle")}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {t("transfer.autoVerifyDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button (manual recheck) */}
                  {order.paymentStatus === 'pending' && (
                    <Button
                      onClick={checkPaymentStatus}
                      disabled={paymentChecking}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {paymentChecking ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {t("transfer.checking")}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t("transfer.checkManual")}
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <CryptoTabsPanel
                  orderNumber={orderNumber}
                  paymentMemo={order.paymentMemo ?? transferContent}
                  amount={order.total}
                  locale={locale}
                  paymentStatus={order.paymentStatus}
                  paymentChecking={paymentChecking}
                  onCheckPayment={checkPaymentStatus}
                  onCopy={copyToClipboard}
                />
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t("summary.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium mb-2">{t("summary.customer")}</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">{t("summary.name")}</span> {order.customerName}</p>
                    <p><span className="text-muted-foreground">{t("summary.email")}</span> {order.customerEmail}</p>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <h3 className="font-medium mb-3">{t("summary.products", { count: order.items.length })}</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-base font-semibold">
                    <span>{t("summary.total")}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.paymentStatus === 'paid' && (
                  <>
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{t("summary.successTitle")}</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        {t("summary.successDesc")}
                      </p>
                      {redirectCountdown !== null && (
                        <p className="text-sm text-green-600 dark:text-green-500 mt-2 font-medium">
                          {t("summary.redirect", { seconds: redirectCountdown })}
                        </p>
                      )}
                    </div>

                    {/* Guest user: show order info + email notice + contact */}
                    {isGuest && (
                      <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-lg mb-3 flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          {t("summary.guestSuccessTitle")}
                        </h3>

                        <div className="space-y-3 mb-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <span className="font-medium">{t("summary.guestOrderNumber")}</span>{" "}
                              <span className="font-mono font-bold">#{order.orderNumber}</span>
                            </p>
                          </div>

                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            {t("summary.guestEmailNotice", { email: order.customerEmail })}
                          </p>

                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            {t("summary.guestSaveOrder")}
                          </p>
                        </div>

                        <Separator className="my-4 bg-blue-200 dark:bg-blue-700" />

                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
                          {t("summary.guestContactTitle")}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {FACEBOOK_URL && (
                            <a
                              href={FACEBOOK_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              📘 Facebook
                            </a>
                          )}
                          {TELEGRAM_URL && (
                            <a
                              href={TELEGRAM_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
                            >
                              ✈️ Telegram
                            </a>
                          )}
                          {SUPPORT_EMAIL && (
                            <a
                              href={`mailto:${SUPPORT_EMAIL}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              ✉️ Email
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-4">
                          {t("summary.guestRegisterHint")}
                        </p>
                      </div>
                    )}

                    {/* Guest chưa mở khoá: nhập email đã đặt đơn để xem tài khoản */}
                    {order.requiresEmail && order.paymentStatus === "paid" && (
                      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                        <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                          {locale === "vi"
                            ? "Nhập email bạn đã dùng khi đặt đơn để xem tài khoản:"
                            : "Enter the email you used at checkout to view your account:"}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            placeholder="email@gmail.com"
                            className="flex-1 rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            autoComplete="email"
                          />
                          <Button onClick={submitManualEmail} type="button">
                            {locale === "vi" ? "Xem tài khoản" : "View account"}
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                          {locale === "vi"
                            ? "Thông tin tài khoản cũng đã được gửi qua email đơn hàng của bạn."
                            : "Your account details were also sent to your order email."}
                        </p>
                      </div>
                    )}

                    {/* Display Assigned Credentials */}
                    {order.assignedCredentials && order.assignedCredentials.length > 0 && (
                      <div className="mt-6">
                        <UserOrderCredentials
                          credentials={order.assignedCredentials}
                          orderNumber={order.orderNumber}
                        />
                  </div>
                    )}

                    {/* Cảnh báo quan trọng: ĐỌC KỸ trước khi active (login_link only) */}
                    {order.items.some(item => item.productType === "login_link") && order.paymentStatus === "paid" && (
                      <div
                        role="alert"
                        className="mt-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 shadow-md dark:border-red-700 dark:bg-red-950/40"
                      >
                        <p className="text-sm font-bold text-red-800 dark:text-red-200">
                          {tWarn("title")}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                          <li className="flex gap-2">
                            <span aria-hidden className="shrink-0">•</span>
                            <span>{tWarn("line1")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span aria-hidden className="shrink-0">•</span>
                            <span>{tWarn("line2")}</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Auto Activate CTA - ưu tiên lên trên */}
                    {order.items.some(item => item.productType === "login_link") && order.paymentStatus === "paid" && (
                      <div className="mt-6 p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-center shadow-md">
                        <h3 className="font-bold text-white text-xl mb-2">
                          {t("autoActivate.title")}
                        </h3>
                        <p className="text-white/90 text-sm mb-4">
                          {t("autoActivate.desc")}
                        </p>

                        {order.activationCode && (
                          <div className="mb-4 p-3 bg-white/15 border-2 border-dashed border-white/50 rounded-lg">
                            <p className="text-white/80 text-xs mb-1">{t("autoActivate.codeLabel")}</p>
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-white text-2xl font-extrabold font-mono tracking-[4px]">
                                {order.activationCode}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(order.activationCode!, t("autoActivate.copyLabel"))
                                }
                                className="text-white hover:bg-white/20"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-white/70 text-[11px] mt-1">
                              {t("autoActivate.codeNote")}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/activate?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customerEmail)}${order.activationCode ? `&code=${encodeURIComponent(order.activationCode)}` : ''}`}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-700 rounded-lg font-bold text-base hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                          {t("autoActivate.cta")}
                        </Link>
                        <p className="text-white/70 text-xs mt-3">
                          {order.activationCode
                            ? t("autoActivate.prefillWithCode")
                            : t("autoActivate.prefillWithoutCode")}
                        </p>
                      </div>
                    )}

                    {/* Login Link Instructions */}
                    {order.items.some(item => item.productType === "login_link") && (
                      <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-lg mb-3">
                          {t("loginLinkInstructions.title")}
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                          {t("loginLinkInstructions.lead")}
                        </p>
                        <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-2.5 mb-4">
                          <li className="flex gap-2">
                            <span className="font-bold shrink-0">1️⃣</span>
                            <span>
                              {t.rich("loginLinkInstructions.step1", {
                                b: (chunks) => <strong>{chunks}</strong>,
                              })}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold shrink-0">2️⃣</span>
                            <span>
                              {t.rich("loginLinkInstructions.step2", {
                                b: (chunks) => <strong>{chunks}</strong>,
                              })}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold shrink-0">3️⃣</span>
                            <span>
                              {t("loginLinkInstructions.step3")}
                              <code className="block mt-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded break-all font-mono">
                                {t("loginLinkInstructions.linkExample")}
                              </code>
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold shrink-0">4️⃣</span>
                            <span>
                              {t.rich("loginLinkInstructions.step4", {
                                b: (chunks) => <strong>{chunks}</strong>,
                              })}
                            </span>
                          </li>
                        </ol>

                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                          <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1.5">{t("loginLinkInstructions.noteTitle")}</p>
                          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                            <li>{t("loginLinkInstructions.note1")}</li>
                            <li>{t("loginLinkInstructions.note2")}</li>
                            <li>{t("loginLinkInstructions.note3")}</li>
                          </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <a
                            href="https://www.youtube.com/watch?v=v1UmbhPN8uA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            {t("loginLinkInstructions.videoBtn")}
                          </a>
                          {FACEBOOK_URL && (
                            <a
                              href={FACEBOOK_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {t("loginLinkInstructions.fbBtn")}
                            </a>
                          )}
                          {TELEGRAM_URL && (
                            <a
                              href={TELEGRAM_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
                            >
                              {t("loginLinkInstructions.tgBtn")}
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-3">
                          {t.rich("loginLinkInstructions.footer", {
                            orderNumber: order.orderNumber,
                            b: (chunks) => <strong>{chunks}</strong>,
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                {t("summary.note")}
              </p>
              <p>
                {t("summary.support")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}