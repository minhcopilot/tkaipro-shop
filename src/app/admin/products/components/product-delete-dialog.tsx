"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Package } from "lucide-react";
import Image from "next/image";

import type { ProductWithCategory } from "~/db/schema/products/types";

import { Button } from "~/ui/primitives/button";

interface ProductDeleteDialogProps {
  product: ProductWithCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductDeleteDialog({ product, onSuccess, onCancel }: ProductDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/products?productId=${product.id}`, {
        method: "DELETE",
      });

      const data = await response.json() as { success?: boolean; error?: string; code?: string };

      if (!response.ok) {
        // hiển thị lỗi chi tiết từ server
        toast.error(data.error || "Không thể xóa sản phẩm", {
          duration: 5000,
          description: data.code === "HAS_SUBSCRIPTIONS" 
            ? "Hãy chuyển trạng thái sản phẩm sang 'Ngừng kinh doanh' thay vì xóa."
            : undefined
        });
        return;
      }

      onSuccess();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Không thể xóa sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Xác nhận xóa sản phẩm</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa sản phẩm này không?
          </p>
        </div>
      </div>

      {/* Product info card */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
        <div className="flex items-start gap-3">
          {product.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <Image 
                src={product.image} 
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600 border border-gray-200 dark:border-gray-500">
              <Package className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">ID: {product.id}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Danh mục: {product.category}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Giá: {formatPrice(product.price)}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="ml-2 text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-amber-600 dark:text-amber-400">
        ⚠️ Sản phẩm sẽ được ẩn khỏi trang web và trang quản trị. Bạn có thể khôi phục lại bằng cách thay đổi trạng thái trong database nếu cần.
      </p>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Hủy
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {loading ? "Đang xóa..." : "Xóa sản phẩm"}
        </Button>
      </div>
    </div>
  );
} 