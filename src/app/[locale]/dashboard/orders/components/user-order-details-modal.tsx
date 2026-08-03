"use client";

import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  Package, 
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Clock,
  Copy,
  KeyRound,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

import type { Order } from "~/db/schema/orders/types";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { UserOrderCredentials } from "~/ui/components/orders/user-order-credentials";
import { Badge } from "~/ui/primitives/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "~/ui/primitives/dialog";
import { Separator } from "~/ui/primitives/separator";

const FACEBOOK_URL = SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

interface UserOrderDetailsModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export function UserOrderDetailsModal({ 
  order, 
  open, 
  onClose 
}: UserOrderDetailsModalProps) {
  const t = useTranslations("UserOrderDetails");
  const tWarn = useTranslations("ActivationWarning");
  const locale = useLocale();

  const hasAccountOrder =
    order.items?.some((item) => item.productType === "account") &&
    order.paymentStatus === "paid" &&
    order.assignedCredentials &&
    order.assignedCredentials.length > 0;

  const buildVerificationHref = (cursorEmail: string) => {
    const params = new URLSearchParams({
      order: order.orderNumber,
      email: order.customerEmail,
      cursorEmail,
    });
    return `/verification-code?${params.toString()}`;
  };

  // Format currency based on locale
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND'
    });
  };

  // Format date based on locale
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', {
      locale: locale === 'vi' ? vi : enUS
    });
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid' && status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          {t("status.completed")}
        </Badge>
      );
    }
    
    if (paymentStatus === 'paid') {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
          <Package className="w-4 h-4 mr-1" />
          {t("status.processing")}
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400">
        <Clock className="w-4 h-4 mr-1" />
        {t("paymentStatus.pending")}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5" />
              <span>{t("title", { orderNumber: order.orderNumber })}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusBadge(order.status, order.paymentStatus)}
              
              {order.paymentStatus === 'pending' && (
                <Button size="sm" asChild>
                  <Link href={`/payment/${order.orderNumber}`}>
                    {t("payNow")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {t("info.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t("info.orderNumber")}:</span>
                  <div className="font-mono font-medium">{order.orderNumber}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t("info.orderDate")}:</span>
                  <div className="font-medium">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t("info.customer")}:</span>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t("info.email")}:</span>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                {t("items.title", { count: order.items?.length || 0 })}
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    className="flex items-center space-x-3 p-4 border rounded-lg bg-white dark:bg-gray-700"
                  >
                    <div className="relative h-16 w-16 rounded overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-base">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.category}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("items.quantity", { quantity: item.quantity })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                )) || <div className="text-gray-500">{t("items.empty")}</div>}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white dark:bg-gray-700 border p-4 rounded-lg">
              <h3 className="font-semibold mb-3">{t("statusLabels.order")}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("statusLabels.order")}</span>
                  <Badge 
                    className={
                      order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/50' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50'
                    }
                  >
                    {order.status === 'pending' ? t("status.pending") :
                     order.status === 'processing' ? t("status.processing") :
                     order.status === 'completed' ? t("status.completed") :
                     t("status.cancelled")}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("statusLabels.payment")}</span>
                  <Badge 
                    className={
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50' :
                      order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/50' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/50'
                    }
                  >
                    {order.paymentStatus === 'paid' ? t("paymentStatus.paid") :
                     order.paymentStatus === 'failed' ? t("paymentStatus.failed") :
                     t("paymentStatus.pending")}
                  </Badge>
                </div>

                {order.paymentStatus === 'pending' && (
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link href={`/payment/${order.orderNumber}`}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t("payNow")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white dark:bg-gray-700 border p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                {t("payment.title")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("payment.subtotal")}:</span>
                  <span>{formatCurrency(order.subtotal || order.total)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t("payment.discount")}:</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>{t("payment.total")}:</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
                
                {order.paidAt && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center text-green-700 dark:text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>{t("payment.paidAt")}</span>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                      {formatDate(order.paidAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">
                  {t("notes.title")}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Assigned Credentials */}
            {order.assignedCredentials && order.assignedCredentials.length > 0 && (
              <UserOrderCredentials
                credentials={order.assignedCredentials}
                orderNumber={order.orderNumber}
                customerEmail={order.customerEmail}
              />
            )}

            {hasAccountOrder && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t("verificationCodeGuide.title")}
                </h4>
                <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-3">
                  {t("verificationCodeGuide.description")}
                </p>
                <div className="flex flex-col gap-2">
                  {order.assignedCredentials!.map((cred, idx) => (
                    <Button key={`vc-${idx}`} asChild variant="default" size="sm">
                      <Link href={buildVerificationHref(cred.username)}>
                        <KeyRound className="h-4 w-4 mr-2" />
                        {order.assignedCredentials!.length > 1
                          ? t("verificationCodeGuide.ctaFor", {
                              email: cred.username,
                            })
                          : t("verificationCodeGuide.cta")}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Cảnh báo ĐỌC KỸ trước khi active (login_link only) */}
            {order.items?.some(item => item.productType === "login_link") && order.paymentStatus === 'paid' && (
              <div
                role="alert"
                className="p-3 rounded-lg border-2 border-red-500 bg-red-50 shadow-sm dark:border-red-700 dark:bg-red-950/40"
              >
                <p className="text-xs font-bold text-red-800 dark:text-red-200">
                  {tWarn("title")}
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-red-700 dark:text-red-300">
                  <li className="flex gap-1.5">
                    <span aria-hidden className="shrink-0">•</span>
                    <span>{tWarn("line1")}</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span aria-hidden className="shrink-0">•</span>
                    <span>{tWarn("line2")}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Auto Activate CTA + Activation Code */}
            {order.items?.some(item => item.productType === "login_link") && order.paymentStatus === 'paid' && (
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg text-center shadow-md">
                <h4 className="font-bold text-white text-base mb-1 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> {t("autoActivate.title")}
                </h4>
                <p className="text-white/90 text-xs mb-3">
                  {t("autoActivate.desc")}
                </p>

                {order.activationCode ? (
                  <div className="mb-3 p-2.5 bg-white/15 border-2 border-dashed border-white/60 rounded-md">
                    <p className="text-white/80 text-[10px] mb-0.5">{t("autoActivate.codeLabel")}</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-white text-xl font-extrabold font-mono tracking-[3px]">
                        {order.activationCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(order.activationCode!);
                          toast.success(t("autoActivate.copyToast"));
                        }}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <p className="text-white/70 text-[10px] mt-1">
                      {t("autoActivate.codeNote")}
                    </p>
                  </div>
                ) : (
                  <div className="mb-3 p-2 bg-white/10 rounded text-white/80 text-xs">
                    {t("autoActivate.codeIssuingFallback")}
                  </div>
                )}

                <Link
                  href={`/activate?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customerEmail)}${order.activationCode ? `&code=${encodeURIComponent(order.activationCode)}` : ''}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-white text-emerald-700 rounded-md font-bold text-sm hover:bg-emerald-50 transition-colors"
                >
                  {t("autoActivate.cta")}
                </Link>
              </div>
            )}

            {/* Login Link Instructions (manual fallback) */}
            {order.items?.some(item => item.productType === "login_link") && order.paymentStatus === 'paid' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  {t("loginLinkInstructions.title")}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                  {t("loginLinkInstructions.lead")}
                </p>
                <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-2 mb-3">
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
                      <code className="block mt-1 text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded break-all font-mono">
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

                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 mb-3">
                  <p className="font-semibold text-red-700 dark:text-red-400 text-xs mb-1">{t("loginLinkInstructions.noteTitle")}</p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc list-inside">
                    <li>{t("loginLinkInstructions.note1")}</li>
                    <li>{t("loginLinkInstructions.note2")}</li>
                    <li>{t("loginLinkInstructions.note3")}</li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.youtube.com/watch?v=v1UmbhPN8uA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    {t("loginLinkInstructions.videoBtn")}
                  </a>
                  {FACEBOOK_URL && (
                    <a
                      href={FACEBOOK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t("loginLinkInstructions.fbBtn")}
                    </a>
                  )}
                  {TELEGRAM_URL && (
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-medium rounded-md hover:bg-sky-600 transition-colors"
                    >
                      {t("loginLinkInstructions.tgBtn")}
                    </a>
                  )}
                </div>

                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  {t.rich("loginLinkInstructions.footer", {
                    orderNumber: order.orderNumber,
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            )}

            {/* Support Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <h4 className="font-medium mb-2">{t("support.title")}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t("support.description")}
              </p>
              <Button variant="outline" size="sm">
                {t("support.contact")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}