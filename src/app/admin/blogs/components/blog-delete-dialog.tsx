"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { BlogPost } from "~/db/schema/blogs/tables";

import { Button } from "~/ui/primitives/button";

interface BlogDeleteDialogProps {
  post: BlogPost;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BlogDeleteDialog({ post, onSuccess, onCancel }: BlogDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/blogs?postId=${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete blog post");
      }

      onSuccess();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast.error(error instanceof Error ? error.message : "Không thể xóa bài viết");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700 dark:text-gray-300">
        Bạn có chắc chắn muốn xóa bài viết <strong>&quot;{post.title}&quot;</strong>?
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Hành động này không thể hoàn tác.
      </p>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600"
        >
          Hủy
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {loading ? "Đang xóa..." : "Xóa bài viết"}
        </Button>
      </div>
    </div>
  );
}

