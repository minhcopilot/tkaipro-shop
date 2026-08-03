"use client";

import dynamic from "next/dynamic";

// dynamic import with ssr: false to avoid better-auth/react SSR issues.
// NOTE: Khi sửa page.client.tsx mà không thấy thay đổi, làm hard reload
// trình duyệt (Ctrl+Shift+R) — HMR đôi khi không pick up thay đổi của
// dynamic-imported chunk.
const CheckoutPageClient = dynamic(
  () =>
    import("./page.client").then((mod) => ({
      default: mod.CheckoutPageClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    ),
  },
);

export function CheckoutPageWrapper() {
  return <CheckoutPageClient />;
}
