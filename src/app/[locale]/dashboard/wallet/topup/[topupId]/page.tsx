"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/ui/primitives/skeleton";

const TopupDetailInner = dynamic(
  () => import("./_topup-detail-inner").then((m) => m.TopupDetailInner),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    ),
  },
);

export default function TopupDetailPage() {
  return <TopupDetailInner />;
}
