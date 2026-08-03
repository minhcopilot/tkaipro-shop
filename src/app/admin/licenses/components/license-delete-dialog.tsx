"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import type { License } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";

interface LicenseDeleteDialogProps {
  license: License;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LicenseDeleteDialog({
  license,
  open,
  onOpenChange,
  onSuccess,
}: LicenseDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/licenses?id=${license.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete license");
      }

      toast.success("Đã xóa license thành công");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Không thể xóa license");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xóa License Key
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa license key này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div><strong>Sản phẩm:</strong> {license.productName}</div>
          <div><strong>Tên License:</strong> {license.licenseName}</div>
          <div><strong>Người được gán:</strong> {license.assigneeName || "Chưa gán"}</div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa License
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 