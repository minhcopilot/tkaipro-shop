import { cn } from "~/lib/cn";

import { CartClient } from "./cart-client";

export interface CartItem {
  category: string;
  id: string;
  image: string;
  name: string;
  price: number;
  quantity: number;
  productType?: "account" | "license" | "upgrade" | "login_link";
  // Chỉ áp dụng khi productType === 'upgrade'.
  // Khi true: checkout chỉ yêu cầu email Cursor + Telegram/FB liên hệ (bỏ ô mật khẩu Cursor).
  upgradeEmailOnly?: boolean;
  upgradeCredentials?: {
    email: string;
    password?: string;          // optional khi upgradeEmailOnly = true
    contactInfo?: string;       // telegram id hoặc facebook link, vẫn bắt buộc cả khi emailOnly
  };
}

interface CartProps {
  className?: string;
}

export function Cart({ className }: CartProps) {
  return (
    <div className={cn("relative", className)}>
      <CartClient className={cn("", className)} />
    </div>
  );
}
