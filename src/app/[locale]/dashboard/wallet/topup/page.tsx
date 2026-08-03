"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/ui/primitives/skeleton";

const TopupFormInner = dynamic(
  () => import("./_topup-form-inner").then((m) => m.TopupFormInner),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    ),
  },
);

export default function TopupPage() {
  return <TopupFormInner />;
}
