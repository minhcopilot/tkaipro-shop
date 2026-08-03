"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Card, CardContent, CardHeader } from "~/ui/primitives/card";

// dynamic import with ssr: false to avoid better-auth/react SSR issues
// useSession hook from better-auth uses useRef which is null during SSR
const ProductReviews = dynamic(
  () =>
    import("./product-reviews").then((mod) => ({
      default: mod.ProductReviews,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-28" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

interface ProductReviewsWrapperProps {
  productId: string;
}

export function ProductReviewsWrapper({ productId }: ProductReviewsWrapperProps) {
  return <ProductReviews productId={productId} />;
}
