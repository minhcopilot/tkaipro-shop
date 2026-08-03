"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/ui/primitives/skeleton";

// Dynamic import + ssr:false để tránh crash SSR với better-auth hooks (cùng
// pattern đã fix cho /payment/[orderNumber]).
const WalletInner = dynamic(
  () => import("./_wallet-inner").then((m) => m.WalletInner),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    ),
  },
);

export default function DashboardWalletPage() {
  return <WalletInner />;
}
