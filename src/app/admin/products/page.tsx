import { getAllProducts, getAllCategories } from "~/lib/queries/products";

import AdminProductsWrapper from "./page.wrapper";

const PRODUCTS_PER_PAGE = 50;

export default async function AdminProductsPage() {
  // lấy categories trước để tìm default category (Cursor Pro)
  const categories = await getAllCategories();
  
  // tìm Cursor Pro category làm mặc định
  const defaultCategory = categories.find(c => 
    c.slug === "cursor-pro" || c.name.toLowerCase().includes("cursor pro")
  );

  // lấy products ban đầu - filter theo status="active" và Cursor Pro category
  const productsResult = await getAllProducts({ 
    page: 1, 
    limit: PRODUCTS_PER_PAGE,
    filters: { 
      status: "active",
      ...(defaultCategory ? { category: defaultCategory.id } : {})
    }
  });

  return (
    <AdminProductsWrapper 
      initialProducts={productsResult.products} 
      initialTotal={productsResult.total}
      categories={categories}
    />
  );
} 