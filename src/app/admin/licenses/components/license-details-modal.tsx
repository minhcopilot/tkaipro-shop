"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle2, Clock, User, Key } from "lucide-react";
import type { License } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Label } from "~/ui/primitives/label";
import { Textarea } from "~/ui/primitives/textarea";

interface LicenseDetailsModalProps {
  license: License;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function LicenseDetailsModal({
  license,
  open,
  onOpenChange,
  onUpdate,
}: LicenseDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(license.status);
  const [isUsed, setIsUsed] = useState(license.isUsed);
  const [notes, setNotes] = useState(license.notes || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      toast.success("Đã copy license key vào clipboard");
    } catch (error) {
      toast.error("Không thể copy license key");
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/admin/licenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: license.id,
          status,
          isUsed,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update license");
      }

      toast.success("Đã cập nhật license thành công");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("Không thể cập nhật license");
    } finally {
      setUpdating(false);
    }
  };

  // parse license key để hiển thị đẹp
  const parts = license.licenseKey.split('-----BEGIN CERTIFICATE-----');
  const licenseText = parts[0].trim();
  const certificateText = parts.length > 1 
    ? '-----BEGIN CERTIFICATE-----' + parts[1] 
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi Tiết License Key</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Sản phẩm</Label>
              <div className="flex items-center gap-2 mt-1">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{license.productName}</span>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Tên License</Label>
              <p className="mt-1">{license.licenseName}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Người được gán</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{license.assigneeName || "Chưa gán"}</span>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Hết hạn</Label>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(license.expiryDate).toLocaleDateString("vi-VN")}</span>
                <Badge variant="outline">{license.duration} năm</Badge>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Ngày tạo</Label>
              <p className="mt-1">{new Date(license.createdAt).toLocaleString("vi-VN")}</p>
            </div>

            {license.usedAt && (
              <div>
                <Label className="text-muted-foreground">Ngày sử dụng</Label>
                <p className="mt-1">{new Date(license.usedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>License Key</Label>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-2" />
                Copy Toàn Bộ
              </Button>
            </div>
            <div className="bg-black text-green-500 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {licenseText}
              {certificateText && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {certificateText}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Cập nhật trạng thái</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="expired">Hết hạn</SelectItem>
                    <SelectItem value="revoked">Thu hồi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Đã sử dụng</Label>
                <Select value={isUsed ? "true" : "false"} onValueChange={(v) => setIsUsed(v === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Chưa dùng</SelectItem>
                    <SelectItem value="true">Đã dùng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Đóng
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating && <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />}
              Cập Nhật
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 