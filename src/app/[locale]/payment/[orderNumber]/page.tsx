"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";

// Lý do dynamic + ssr:false:
// - PaymentInner sử dụng `useCurrentUser()` từ better-auth, mà hook đó
//   gọi `useStore` nội bộ; trong production build (server-rendering phase)
//   `useStore` cố `useRef` qua React context = null → throw
//   "Cannot read properties of null (reading 'useRef')" → trang trả 500.
// - Trang payment không cần SEO (chỉ truy cập sau checkout) nên skip SSR
//   không ảnh hưởng. Khách thấy skeleton ~100ms rồi UI client mount đầy đủ.
// - Skeleton ở `loading` mirror layout 2-cột thực để tránh layout shift.
const PaymentInner = dynamic(
  () => import("./_payment-inner").then((m) => m.PaymentInner),
  {
    ssr: false,
    loading: () => (
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
    ),
  },
);

export default function PaymentPage() {
  return <PaymentInner />;
}
