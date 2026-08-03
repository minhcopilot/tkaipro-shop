import { getAllOrdersPaginated } from "~/lib/queries/orders";
import AdminOrdersClient from "./page.client";

export default async function AdminOrdersPage() {
  try {
    // fetch initial orders data
    const result = await getAllOrdersPaginated({
      page: 1,
      limit: 20,
    });

    return (
      <AdminOrdersClient 
        initialOrders={result.orders}
        initialTotal={result.total}
        initialPage={result.page}
        totalPages={result.totalPages}
      />
    );
  } catch (error) {
    console.error("Error loading admin orders:", error);
    
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Lỗi tải dữ liệu
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }
} 