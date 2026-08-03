"use client";

import { useState } from "react";
import { Edit, Check, X } from "lucide-react";

import type { Order } from "~/db/schema/orders/types";

import { Button } from "~/ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/ui/primitives/popover";

interface OrderStatusSelectProps {
  order: Order;
  onUpdate: (orderId: string, status?: string, paymentStatus?: string) => Promise<void>;
}

export function OrderStatusSelect({ order, onUpdate }: OrderStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await onUpdate(
        order.id,
        status !== order.status ? status : undefined,
        paymentStatus !== order.paymentStatus ? paymentStatus : undefined
      );
      setIsOpen(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setIsOpen(false);
  };

  const hasChanges = status !== order.status || paymentStatus !== order.paymentStatus;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="font-semibold text-sm">
            Cập nhật trạng thái - {order.orderNumber}
          </div>
          
          {/* Order Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Trạng thái đơn hàng
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Trạng thái thanh toán
            </label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ thanh toán</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="failed">Thanh toán lỗi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!hasChanges || updating}
            >
              <Check className="h-4 w-4 mr-1" />
              {updating ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 