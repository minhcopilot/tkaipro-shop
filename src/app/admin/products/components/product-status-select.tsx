"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ProductWithCategory } from "~/db/schema/products/types";

import { Badge } from "~/ui/primitives/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

interface ProductStatusSelectProps {
  product: ProductWithCategory;
  onStatusChange: (updatedProduct: ProductWithCategory) => void;
}

export function ProductStatusSelect({ product, onStatusChange }: ProductStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === product.status) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/products/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product status");
      }

      const updatedProduct = await response.json() as ProductWithCategory;
      onStatusChange(updatedProduct);
      toast.success("Cập nhật trạng thái thành công");
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-xs">Hoạt động</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="text-xs">Tạm dừng</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-xs">Bản nháp</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge(product.status)}
      <Select 
        value={product.status} 
        onValueChange={handleStatusChange}
        disabled={loading}
      >
        <SelectTrigger className="w-auto h-7 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Hoạt động</SelectItem>
          <SelectItem value="inactive">Tạm dừng</SelectItem>
          <SelectItem value="draft">Bản nháp</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 