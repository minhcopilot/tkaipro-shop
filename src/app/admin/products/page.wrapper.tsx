"use client";

import dynamic from "next/dynamic";

import type { ProductWithCategory, ProductCategory } from "~/db/schema/products/types";

const AdminProductsClient = dynamic(() => import("./page.client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

interface AdminProductsWrapperProps {
  initialProducts: ProductWithCategory[];
  initialTotal: number;
  categories: ProductCategory[];
}

export default function AdminProductsWrapper({
  initialProducts,
  initialTotal,
  categories,
}: AdminProductsWrapperProps) {
  return (
    <AdminProductsClient
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      categories={categories}
    />
  );
}
