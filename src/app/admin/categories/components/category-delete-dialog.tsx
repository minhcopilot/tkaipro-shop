"use client";

import { useState } from "react";
import { Button } from "@/ui/primitives/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/primitives/dialog";
import { Alert } from "@/ui/primitives/alert";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Trash2, X } from "lucide-react";
import type { ProductCategory } from "~/db/schema/products/types";

interface CategoryDeleteDialogProps {
  category: ProductCategory;
  onSuccess: (deletedId: string) => void;
  onCancel: () => void;
}

export default function CategoryDeleteDialog({
  category,
  onSuccess,
  onCancel,
}: CategoryDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onSuccess(category.id);
        toast.success(`Đã xóa danh mục "${category.name}"`);
      } else {
        const error = await response.text();
        toast.error(`Không thể xóa danh mục: ${error}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Có lỗi xảy ra khi xóa danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Xác nhận xóa danh mục
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
            </div>
          </Alert>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Thông tin danh mục sẽ bị xóa:
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div><strong>Tên:</strong> {category.name}</div>
              <div><strong>Slug:</strong> {category.slug}</div>
              {category.description && (
                <div><strong>Mô tả:</strong> {category.description}</div>
              )}
              <div>
                <strong>Trạng thái:</strong>{" "}
                <span className={category.isActive ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                  {category.isActive ? "Hoạt động" : "Không hoạt động"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Lưu ý:</strong> Nếu có sản phẩm đang sử dụng danh mục này, 
              bạn cần di chuyển chúng sang danh mục khác trước khi xóa.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa danh mục
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 