"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Eye,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  ArrowRight,
  Calendar,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "~/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { formatPrice, getLocalizedProduct } from "~/lib/product-localization";

import type { Order } from "~/db/schema/orders/types";
interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { UserOrderDetailsModal } from "./components/user-order-details-modal";

interface UserOrdersClientProps {
  user: User;
  initialOrders: Order[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
}

export default function UserOrdersClient({ 
  user,
  initialOrders, 
  initialTotal,
  initialPage,
  totalPages: initialTotalPages
}: UserOrdersClientProps) {
  const t = useTranslations("DashboardOrders");
  const locale = useLocale();
  
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  // filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-primary text-primary-foreground", icon: Clock, label: t("status.pending") },
      processing: { color: "bg-secondary text-secondary-foreground", icon: Package, label: t("status.processing") },
      completed: { color: "bg-success text-success-foreground", icon: CheckCircle, label: t("status.completed") },
      cancelled: { color: "bg-destructive text-destructive-foreground", icon: XCircle, label: t("status.cancelled") },
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
      pending: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400", icon: Clock, label: t("paymentStatus.pending") },
      paid: { color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400", icon: CheckCircle, label: t("paymentStatus.paid") },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400", icon: XCircle, label: t("paymentStatus.failed") },
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
    status = statusFilter,
    payment = paymentFilter
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (status !== 'all') params.set('status', status);
      if (payment !== 'all') params.set('paymentStatus', payment);

      const response = await fetch(`/api/orders/user?${params}`);
      const data = await response.json() as {
        orders: Order[];
        total: number;
        page: number;
        totalPages: number;
      };

      if (response.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotalPages(data.totalPages);
      } else {
        toast.error(t("toast.loadError"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t("toast.connectionError"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  // table columns
  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.orderNumber")} />
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue("orderNumber")}
        </div>
      ),
    },
    {
      accessorKey: "items",
      header: t("table.products"),
      cell: ({ row }) => {
        const items = row.original.items || [];
        const localizedFirstItem = items[0] ? getLocalizedProduct(items[0], locale) : null;
        return (
          <div className="max-w-[200px]">
            <div className="text-sm font-medium truncate">
              {localizedFirstItem?.name || "N/A"}
            </div>
            {items.length > 1 && (
              <div className="text-xs text-gray-500">
                {t("table.otherProducts", { count: items.length - 1 })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.total")} />
      ),
      cell: ({ row }) => (
        <div className="font-semibold">
          {formatPrice(row.original.total, locale)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "paymentStatus", 
      header: t("table.payment"),
      cell: ({ row }) => getPaymentBadge(row.original.paymentStatus),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.date")} />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
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
            {t("table.viewDetails")}
          </Button>
          
          {row.original.paymentStatus === 'pending' && (
            <Button
              size="sm"
              asChild
            >
              <Link href={`/payment/${row.original.orderNumber}`}>
                {t("table.payNow")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  // event handlers
  const handleFilterChange = useCallback((type: 'status' | 'payment', value: string) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else {
      setPaymentFilter(value);
    }
    // auto-fetch when filter changes
    setTimeout(() => {
      fetchOrders(1, type === 'status' ? value : statusFilter, type === 'payment' ? value : paymentFilter);
    }, 100);
  }, [fetchOrders, statusFilter, paymentFilter]);

  // stats
  const stats = useMemo(() => {
    const totalOrders = total;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
    const pendingPayment = orders.filter(o => o.paymentStatus === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalSpent = orders.reduce((sum, order) => 
      order.paymentStatus === 'paid' ? sum + order.total : sum, 0
    );

    return { totalOrders, paidOrders, completedOrders, pendingPayment, totalSpent };
  }, [orders, total]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        
        <Button 
          onClick={() => fetchOrders(currentPage)}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t("refresh")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("stats.totalOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("stats.paidOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("stats.pendingPayment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayment}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("stats.totalSpent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(stats.totalSpent, locale)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t("filters.statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
            <SelectItem value="pending">{t("status.pending")}</SelectItem>
            <SelectItem value="processing">{t("status.processing")}</SelectItem>
            <SelectItem value="completed">{t("status.completed")}</SelectItem>
            <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Filter */}
        <Select value={paymentFilter} onValueChange={(value) => handleFilterChange('payment', value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t("filters.paymentPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allPayment")}</SelectItem>
            <SelectItem value="pending">{t("paymentStatus.pending")}</SelectItem>
            <SelectItem value="paid">{t("paymentStatus.paid")}</SelectItem>
            <SelectItem value="failed">{t("paymentStatus.failed")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Page Info */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <ShoppingBag className="h-4 w-4 mr-2" />
          <span>{t("pagination", { current: currentPage, total: totalPages })}</span>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("empty.title")}</h3>
            <p className="text-gray-600 mb-4">
              {t("empty.description")}
            </p>
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t("empty.cta")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <UserOrderDetailsModal
          order={selectedOrder}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
} 