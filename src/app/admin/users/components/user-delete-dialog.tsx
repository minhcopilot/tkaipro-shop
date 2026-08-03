"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import type { UserWithPassword } from "~/lib/queries/users";

import { Button } from "~/ui/primitives/button";

interface UserDeleteDialogProps {
  user: UserWithPassword;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserDeleteDialog({ user, onSuccess, onCancel }: UserDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      onSuccess();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Không thể xóa người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Xác nhận xóa</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa người dùng này không?
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
        <div className="space-y-1 text-sm">
          <div className="text-gray-900 dark:text-gray-100"><strong>Tên:</strong> {user.name}</div>
          <div className="text-gray-900 dark:text-gray-100"><strong>Email:</strong> {user.email}</div>
          <div className="text-gray-900 dark:text-gray-100"><strong>Vai trò:</strong> {user.role}</div>
        </div>
      </div>

      <p className="text-sm text-red-600 dark:text-red-400">
        ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
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
          {loading ? "Đang xóa..." : "Xóa người dùng"}
        </Button>
      </div>
    </div>
  );
} 