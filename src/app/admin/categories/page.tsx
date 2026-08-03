import { Suspense } from "react";
import { getAllCategories } from "~/lib/queries/products";
import CategoriesPageClient from "./page.client";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/ui/components/page-header";
import { Skeleton } from "@/ui/primitives/skeleton";

export const metadata = {
  title: "Quản lý danh mục | Admin",
  description: "Quản lý danh mục sản phẩm",
};

async function CategoriesContent() {
  // admin cần xem tất cả danh mục, kể cả inactive
  const categories = await getAllCategories(true);

  return (
    <CategoriesPageClient 
      initialCategories={categories}
    />
  );
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>Danh mục sản phẩm</PageHeaderHeading>
        <PageHeaderDescription>
          Quản lý các danh mục sản phẩm trong hệ thống
        </PageHeaderDescription>
      </PageHeader>
      
      <Suspense fallback={<CategoriesPageSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}

function CategoriesPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
} 