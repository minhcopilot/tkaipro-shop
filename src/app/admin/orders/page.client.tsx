"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Eye,
  Search,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  Package,
  Edit,
  Plus,
  Send,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

import type { Order } from "~/db/schema/orders/types";
import type { OrderItem } from "~/db/schema/orders/tables";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { OrderDetailsModal } from "./components/order-details-modal";
import { OrderStatusSelect } from "./components/order-status-select";
import { OrderCreateForm } from "./components/order-create-form";

interface AdminOrdersClientProps {
  initialOrders: Order[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
}

export default function AdminOrdersClient({ 
  initialOrders, 
  initialTotal,
  initialPage,
  totalPages: initialTotalPages
}: AdminOrdersClientProps) {
  
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  // filters and search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [productOptions, setProductOptions] = useState<Array<{ id: string; name: string }>>([]);

  // load danh sách sản phẩm cho dropdown lọc đơn theo sản phẩm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/products?limit=200&includeHidden=true");
        const data = (await res.json()) as any;
        if (!cancelled && Array.isArray(data?.products)) {
          setProductOptions(
            data.products.map((p: any) => ({ id: p.id, name: p.name })),
          );
        }
      } catch {
        // ignore — filter sản phẩm chỉ là tiện ích
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // quick email
  const [sendingEmailForOrder, setSendingEmailForOrder] = useState<string | null>(null);

  // helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Chờ xử lý" },
      processing: { color: "bg-blue-100 text-blue-800", icon: Package, label: "Đang xử lý" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Hoàn thành" },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Đã hủy" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const paymentConfig = {
      pending: { color: "bg-orange-100 text-orange-800", icon: Clock, label: "Chờ thanh toán" },
      paid: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Đã thanh toán" },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Thanh toán lỗi" },
    };
    
    const config = paymentConfig[paymentStatus as keyof typeof paymentConfig] || paymentConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // data fetching
  const fetchOrders = useCallback(async (
    page = 1,
    searchTerm = search,
    status = statusFilter,
    payment = paymentFilter,
    product = productFilter,
    accountType = accountTypeFilter
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (searchTerm) params.set('search', searchTerm);
      if (status !== 'all') params.set('status', status);
      if (payment !== 'all') params.set('paymentStatus', payment);
      if (product !== 'all') params.set('productId', product);
      if (accountType !== 'all') params.set('accountType', accountType);

      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json() as any;

      if (response.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        toast.error("Lỗi tải dữ liệu đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
    }, [search, statusFilter, paymentFilter, productFilter, accountTypeFilter]);

  // update order status
  const handleStatusUpdate = useCallback(async (
    orderId: string, 
    status?: string, 
    paymentStatus?: string
  ) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          paymentStatus,
        }),
      });

      if (response.ok) {
        toast.success("Cập nhật trạng thái thành công");
        await fetchOrders(currentPage);
      } else {
        toast.error("Lỗi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Lỗi kết nối");
    }
  }, [currentPage, fetchOrders]);

  const defaultAccountContactMessage = `Cảm ơn bạn đã đặt hàng tại ${SEO_CONFIG.name}!

Để nhận tài khoản, vui lòng thực hiện các bước sau:

1️⃣ Mở Cursor IDE trên máy logout tài khoản hiện tại
2️⃣ Bấm "Sign in" trong app 
3️⃣ Cursor sẽ mở trình duyệt với hiện link đăng nhập dạng: 
https://cursor.com/loginDeepControl?challenge=xxxxx&uuid=xxxxx&mode=login
📌 Link mẫu: 
https://cursor.com/loginDeepControl?challenge=MSRaQkEV0jtMmGIF3sHeaZzyq0UYFI8upPZfL-XjQKI&uuid=74ca14ed-e841-4a8f-b619-d11656e633e4&mode=login
4️⃣ Copy NGAY link này gửi cho shop
⚠️ Không bấm đăng nhập trên trình duyệt web 
⚠️ Không lấy link đã tự chuyển trang sang https://authenticator.cursor.sh/?client_id nếu chuyển trang làm lại thao tác "Sign in" từ đầu
👉 Chỉ cần copy link và gửi cho mình là xong ✅

Xem video hướng dẫn youtube: https://www.youtube.com/watch?v=v1UmbhPN8uA

Vui lòng liên hệ với chúng tôi qua Facebook hoặc Telegram để gửi link và nhận tài khoản.`;

  const handleQuickSendContactEmail = useCallback(async (order: Order) => {
    const items = order.items as OrderItem[];
    const accountItem = items.find(i => i.productType === "account" || i.productType === "license");
    if (!accountItem) return;

    setSendingEmailForOrder(order.id);
    try {
      const response = await fetch("/api/admin/orders/send-account-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productName: accountItem.name,
          customMessage: defaultAccountContactMessage,
        }),
      });

      if (response.ok) {
        toast.success(`Đã gửi email liên hệ cho ${order.customerEmail}`);
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi khi gửi email.");
    } finally {
      setSendingEmailForOrder(null);
    }
  }, []);

  const handleQuickCompleteLoginLink = useCallback(async (order: Order) => {
    setSendingEmailForOrder(order.id);
    try {
      // hoàn thành đơn hàng + đánh dấu đã thanh toán
      await handleStatusUpdate(order.id, "completed", "paid");

      // gửi email hướng dẫn login
      const response = await fetch("/api/admin/orders/send-login-link-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          total: order.total,
          items: order.items,
        }),
      });

      if (response.ok) {
        toast.success(`Đã hoàn thành đơn và gửi email cho ${order.customerEmail}`);
      } else {
        toast.error("Đã hoàn thành đơn nhưng không gửi được email.");
      }
    } catch {
      toast.error("Lỗi khi xử lý đơn hàng.");
    } finally {
      setSendingEmailForOrder(null);
    }
  }, [handleStatusUpdate]);

  // table columns
  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mã đơn hàng" />
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue("orderNumber")}
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Khách hàng" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName}</div>
          <div className="text-sm text-gray-500">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tổng tiền" />
      ),
      cell: ({ row }) => (
        <div className="font-semibold">
          {row.original.total.toLocaleString('vi-VN')}₫
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "paymentStatus", 
      header: "Thanh toán",
      cell: ({ row }) => getPaymentBadge(row.original.paymentStatus),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm')}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const items = row.original.items as OrderItem[];
        const hasAccountItem = items.some(i => i.productType === "account" || i.productType === "license");
        const hasLoginLinkItem = items.some(i => i.productType === "login_link");
        const isNotCompleted = row.original.status !== "completed";
        const isSendingThis = sendingEmailForOrder === row.original.id;

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedOrder(row.original);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {hasAccountItem && row.original.paymentStatus === "paid" && (
              <Button
                variant="ghost"
                size="sm"
                title="Gửi email liên hệ nhận tài khoản"
                disabled={isSendingThis}
                onClick={() => handleQuickSendContactEmail(row.original)}
              >
                {isSendingThis 
                  ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  : <Send className="h-4 w-4 text-blue-500" />
                }
              </Button>
            )}

            {hasLoginLinkItem && isNotCompleted && (
              <Button
                variant="ghost"
                size="sm"
                title="Hoàn thành + Gửi email login"
                disabled={isSendingThis}
                onClick={() => handleQuickCompleteLoginLink(row.original)}
              >
                {isSendingThis 
                  ? <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                  : <CheckCircle className="h-4 w-4 text-green-500" />
                }
              </Button>
            )}

            {hasLoginLinkItem && !isNotCompleted && (
              <Button
                variant="ghost"
                size="sm"
                title="Gửi lại email hướng dẫn login"
                disabled={isSendingThis}
                onClick={() => handleQuickCompleteLoginLink(row.original)}
              >
                {isSendingThis 
                  ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  : <Send className="h-4 w-4 text-blue-500" />
                }
              </Button>
            )}
            
            <OrderStatusSelect 
              order={row.original}
              onUpdate={handleStatusUpdate}
            />
          </div>
        );
      },
    },
  ], [handleStatusUpdate, handleQuickSendContactEmail, handleQuickCompleteLoginLink, sendingEmailForOrder]);

  // event handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  }, [fetchOrders]);

  const handleFilterChange = useCallback((
    type: 'status' | 'payment' | 'product' | 'accountType',
    value: string,
  ) => {
    const next = {
      status: statusFilter,
      payment: paymentFilter,
      product: productFilter,
      accountType: accountTypeFilter,
    };
    if (type === 'status') { setStatusFilter(value); next.status = value; }
    else if (type === 'payment') { setPaymentFilter(value); next.payment = value; }
    else if (type === 'product') { setProductFilter(value); next.product = value; }
    else if (type === 'accountType') { setAccountTypeFilter(value); next.accountType = value; }
    // auto-fetch when filter changes
    setTimeout(() => {
      fetchOrders(1, search, next.status, next.payment, next.product, next.accountType);
    }, 100);
  }, [fetchOrders, search, statusFilter, paymentFilter, productFilter, accountTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý đơn hàng
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tổng cộng {total} đơn hàng
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo đơn hàng
          </Button>
          
          <Button 
            onClick={() => fetchOrders(currentPage)}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Tìm theo mã đơn, tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="processing">Đang xử lý</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Filter */}
        <Select value={paymentFilter} onValueChange={(value) => handleFilterChange('payment', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Thanh toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thanh toán</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="failed">Thanh toán lỗi</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter theo loại khách: đăng nhập vs khách vãng lai */}
        <Select value={accountTypeFilter} onValueChange={(value) => handleFilterChange('accountType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Loại khách" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khách</SelectItem>
            <SelectItem value="registered">Có đăng nhập (tài khoản)</SelectItem>
            <SelectItem value="guest">Khách vãng lai (không đăng nhập)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter theo sản phẩm */}
        <Select value={productFilter} onValueChange={(value) => handleFilterChange('product', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả sản phẩm</SelectItem>
            {productOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Stats */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <ShoppingBag className="h-4 w-4" />
          <span>Trang {currentPage}/{totalPages}</span>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        hidePagination={true}
        initialPageSize={20}
      />

      {/* Server-side Pagination */}
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hiển thị {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, total)} trong tổng số {total} đơn hàng
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(1)}
              disabled={currentPage === 1 || loading}
            >
              Đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Trước
            </Button>
            <div className="text-sm font-medium px-2">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Sau
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(totalPages)}
              disabled={currentPage === totalPages || loading}
            >
              Cuối
            </Button>
          </div>
        )}
        {totalPages <= 1 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Trang {currentPage} / {totalPages}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Order Create Modal */}
      <OrderCreateForm
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchOrders(1)}
      />
    </div>
  );
} 