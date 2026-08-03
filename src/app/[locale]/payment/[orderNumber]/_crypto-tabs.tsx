"use client";

import { AlertTriangle, Clock, Copy, RefreshCw, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "next-intl";

import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";
import {
  CRYPTO_METHODS,
  type CryptoMethod,
  DEFAULT_CRYPTO_METHOD_ID,
} from "~/lib/payment/crypto-methods";
import { formatPrice } from "~/lib/product-localization";

interface CryptoTabsPanelProps {
  orderNumber: string;
  paymentMemo: string;
  amount: number;
  locale: string;
  paymentStatus: "pending" | "paid" | "failed" | string;
  paymentChecking: boolean;
  onCheckPayment: () => void;
  onCopy: (text: string, label: string) => void;
}

// Panel hiển thị 7 phương thức crypto cho khách non-VI dưới dạng tabs.
// Logic:
// - Tabs cuộn ngang trên mobile (overflow-x-auto, flex-nowrap, touch).
// - Mỗi method có 2 dạng (exchange / onchain) với layout chi tiết khác nhau,
//   nhưng chung phần QR (256x256) + nút copy + amount + manual-verify note.
// - Order number suffix dùng làm "transfer content" / "memo" cho exchange-pay
//   (Binance/Bybit hỗ trợ memo). On-chain không có memo nên transfer content
//   chỉ ghi để khách đính kèm vào ô remark/note nếu sàn rút có.
export function CryptoTabsPanel({
  orderNumber,
  paymentMemo,
  amount,
  locale,
  paymentStatus,
  paymentChecking,
  onCheckPayment,
  onCopy,
}: CryptoTabsPanelProps) {
  const t = useTranslations("PaymentResult");
  const tCrypto = useTranslations("PaymentResult.crypto");
  const tTransfer = useTranslations("PaymentResult.transfer");

  const [activeId, setActiveId] = React.useState<CryptoMethod["id"]>(
    DEFAULT_CRYPTO_METHOD_ID,
  );
  const active =
    CRYPTO_METHODS.find((m) => m.id === activeId) ?? CRYPTO_METHODS[0];

  const transferContent = paymentMemo;
  const formattedAmount = formatPrice(amount, locale);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          {tCrypto("selectMethod")}
        </p>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {CRYPTO_METHODS.map((m) => {
              const isActive = m.id === activeId;
              return (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveId(m.id)}
                  className="shrink-0 whitespace-nowrap"
                >
                  {m.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* QR (click để phóng to lightbox) */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className={`
                group relative rounded-lg overflow-hidden
                border-2 border-primary/20 hover:border-primary/60
                bg-white p-4 transition-colors
                cursor-zoom-in
              `}
              aria-label={tCrypto("zoomQr", { method: active.label })}
            >
              <Image
                key={active.qr}
                src={active.qr}
                alt={active.label}
                width={512}
                height={512}
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                priority
              />
              {/* Overlay icon hint */}
              <div
                className={`
                  absolute top-3 right-3 rounded-full
                  bg-black/60 text-white p-1.5
                  opacity-0 group-hover:opacity-100 transition-opacity
                `}
              >
                <ZoomIn className="h-4 w-4" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {active.kind === "exchange"
                  ? tCrypto("scanWithApp", { app: active.appLabel })
                  : tCrypto("scanQrToPay")}
              </p>
            </button>
          </DialogTrigger>
          <DialogContent
            className={`
              sm:max-w-[min(90vw,640px)] p-0 bg-white border-0
              [&>button]:bg-white/90 [&>button]:rounded-full
              [&>button]:p-1 [&>button]:top-2 [&>button]:right-2
            `}
          >
            <DialogTitle className="sr-only">
              {tCrypto("zoomQr", { method: active.label })}
            </DialogTitle>
            <div className="p-6 sm:p-8">
              <Image
                key={`zoom-${active.qr}`}
                src={active.qr}
                alt={active.label}
                width={1024}
                height={1024}
                className="w-full h-auto object-contain max-h-[80vh]"
                priority
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail rows */}
      {active.kind === "exchange" ? (
        <ExchangeDetail
          method={active}
          formattedAmount={formattedAmount}
          transferContent={transferContent}
          onCopy={onCopy}
        />
      ) : (
        <OnchainDetail
          method={active}
          formattedAmount={formattedAmount}
          transferContent={transferContent}
          onCopy={onCopy}
        />
      )}

      {/* Manual verification banner (thay cho SePay auto-verify, vốn chỉ work với VI bank) */}
      {paymentStatus === "pending" && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {tCrypto("manualVerifyTitle")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {tCrypto("manualVerifyDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action button (refresh status) */}
      {paymentStatus === "pending" && (
        <Button
          onClick={onCheckPayment}
          disabled={paymentChecking}
          className="w-full"
          size="lg"
          variant="outline"
        >
          {paymentChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {tTransfer("checking")}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {tTransfer("checkManual")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// =====================================================================
// Sub-components
// =====================================================================

function ExchangeDetail({
  method,
  formattedAmount,
  transferContent,
  onCopy,
}: {
  method: Extract<CryptoMethod, { kind: "exchange" }>;
  formattedAmount: string;
  transferContent: string;
  onCopy: (text: string, label: string) => void;
}) {
  const tCrypto = useTranslations("PaymentResult.crypto");
  const tTransfer = useTranslations("PaymentResult.transfer");

  return (
    <div className="space-y-3">
      <RowReadOnly
        label={tCrypto("provider")}
        value={method.label}
      />

      <RowCopy
        label={tCrypto("payId")}
        value={method.payId}
        onCopy={() => onCopy(method.payId, tCrypto("payId"))}
      />

      <RowReadOnly
        label={tCrypto("accountName")}
        value={method.accountName}
      />

      <RowAmount
        label={tTransfer("amount")}
        value={formattedAmount}
      />

      <div className="p-3 bg-primary/10 rounded border-l-4 border-primary">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {tTransfer("content")}:
            </p>
            <p className="font-mono font-medium text-primary break-all">
              {transferContent}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tTransfer("contentNote")}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCopy(transferContent, tTransfer("content"))}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function OnchainDetail({
  method,
  formattedAmount,
  transferContent,
  onCopy,
}: {
  method: Extract<CryptoMethod, { kind: "onchain" }>;
  formattedAmount: string;
  transferContent: string;
  onCopy: (text: string, label: string) => void;
}) {
  const tCrypto = useTranslations("PaymentResult.crypto");
  const tTransfer = useTranslations("PaymentResult.transfer");

  return (
    <div className="space-y-3">
      <RowReadOnly label={tCrypto("asset")} value={method.asset} />

      <RowReadOnly label={tCrypto("network")} value={method.network} />

      <div className="p-3 bg-muted/50 rounded">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">
              {tCrypto("address")}:
            </p>
            <p className="font-mono text-sm font-medium break-all">
              {method.address}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCopy(method.address, tCrypto("address"))}
            className="shrink-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <RowAmount label={tTransfer("amount")} value={formattedAmount} />

      {/* Cảnh báo network sai - hiển thị bắt buộc vì on-chain không reversible */}
      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
            {tCrypto("sendOnlyOn", {
              asset: method.asset,
              network: method.network,
            })}
          </p>
        </div>
      </div>

      {/* Order ref - không phải memo trên on-chain, chỉ để admin reconcile khi cần */}
      <div className="p-3 bg-primary/10 rounded border-l-4 border-primary">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {tTransfer("content")}:
            </p>
            <p className="font-mono font-medium text-primary break-all">
              {transferContent}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tCrypto("orderRefNote")}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCopy(transferContent, tTransfer("content"))}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RowReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function RowCopy({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">{value}</span>
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RowAmount({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-bold text-lg text-primary">{value}</span>
    </div>
  );
}
