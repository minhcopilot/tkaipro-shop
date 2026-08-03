"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Activity,
  Box,
  CreditCard,
  BarChart3,
  Timer,
  Zap,
  ArrowUpRight,
  RefreshCw,
  PackageSearch,
  ImageOff,
} from "lucide-react";

import type {
  DashboardData,
  RecentOrder,
  TopProduct,
  ExpiringSubscription,
  ProductSalesForPrep,
  ProductSalesRange,
} from "~/lib/queries/dashboard";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/ui/primitives/card";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

// month names in Vietnamese
const MONTHS = [
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

// generate years (last 3 years)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i);

interface DashboardClientProps {
  data: DashboardData;
}

// format VND currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

// format compact number
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function StatCard({ title, value, subtitle, icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "from-slate-500/10 to-slate-600/5 border-slate-200 dark:border-slate-700",
    success: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800",
    warning: "from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800",
    danger: "from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-800",
    info: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
    danger: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400",
    info: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${variantStyles[variant]} py-4`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span
                  className={`flex items-center text-xs font-medium ${
                    trend.isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-0.5 h-3 w-3" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${iconStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// mini bar chart for revenue with view mode selector
function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthData, setMonthData] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch data for selected month
  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const monthEnd = endOfMonth(monthStart);
      
      const params = new URLSearchParams({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        periodType: "day",
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const result = await response.json();
        // convert byPeriod to the expected format
        const converted = (result.byPeriod || []).map((p: any) => ({
          date: p.period,
          revenue: p.revenue,
          orders: p.orderCount,
        }));
        setMonthData(converted);
      }
    } catch (error) {
      console.error("Failed to fetch month data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (viewMode === "month") {
      fetchMonthData();
    }
  }, [viewMode, fetchMonthData]);

  // get display data based on view mode
  const displayData = useMemo(() => {
    if (viewMode === "week") {
      return data.slice(-7);
    }
    return monthData;
  }, [viewMode, data, monthData]);

  const maxRevenue = Math.max(...displayData.map((d) => d.revenue), 1);
  const totalRevenue = displayData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = displayData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="space-y-4">
      {/* view mode selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("week")}
          >
            7 ngày
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("month")}
          >
            Theo tháng
          </Button>
        </div>
        
        {viewMode === "month" && (
          <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(val) => setSelectedMonth(parseInt(val))}
            >
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* chart */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : displayData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Không có dữ liệu
        </div>
      ) : (
        <div className="flex items-end justify-between gap-0.5 h-32 overflow-x-auto">
          {displayData.map((day, index) => {
            const height = (day.revenue / maxRevenue) * 100;
            const dayLabel = viewMode === "week" 
              ? format(new Date(day.date), "EEE", { locale: vi })
              : format(new Date(day.date), "dd", { locale: vi });
            const isLast = index === displayData.length - 1;
            const isToday = day.date === format(now, "yyyy-MM-dd");
            
            return (
              <div 
                key={day.date} 
                className="flex flex-1 flex-col items-center gap-1 min-w-[20px] group cursor-pointer"
                title={`${format(new Date(day.date), "dd/MM/yyyy")}: ${formatCurrency(day.revenue)} (${day.orders} đơn)`}
              >
                <div className="relative w-full flex flex-col items-center justify-end h-24">
                  <div
                    className={`w-full max-w-6 rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${
                      isToday || isLast
                        ? "bg-gradient-to-t from-violet-600 to-violet-400"
                        : "bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-500"
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-medium ${isToday || isLast ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"}`}>
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>
          {viewMode === "week" ? "7 ngày gần nhất" : `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
        </span>
        <div className="flex items-center gap-3">
          <span>{totalOrders} đơn</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}

// order status badge
function OrderStatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400", icon: Clock, label: "Chờ xử lý" },
    processing: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400", icon: RefreshCw, label: "Đang xử lý" },
    completed: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400", icon: CheckCircle, label: "Hoàn thành" },
    cancelled: { color: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400", icon: XCircle, label: "Đã hủy" },
  };

  const { color, icon: Icon, label } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge className={`${color} gap-1 border-0`} variant="outline">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// payment status badge  
function PaymentStatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400", label: "Chờ TT" },
    paid: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400", label: "Đã TT" },
    failed: { color: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400", label: "Lỗi" },
  };

  const { color, label } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge className={`${color} border-0`} variant="outline">
      {label}
    </Badge>
  );
}

// recent orders table
function RecentOrdersList({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.slice(0, 5).map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
              {order.customerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{order.customerName}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{order.orderNumber}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      ))}
    </div>
  );
}

// expiring subscriptions list
function ExpiringSubscriptionsList({ subscriptions }: { subscriptions: ExpiringSubscription[] }) {
  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-500/50 mb-2" />
        <p className="text-sm text-muted-foreground">Không có tài khoản sắp hết hạn</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subscriptions.slice(0, 5).map((sub) => (
        <div
          key={sub.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{sub.productName}</p>
            <p className="text-xs text-muted-foreground truncate">{sub.customerEmail}</p>
          </div>
          <div className="text-right shrink-0">
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700">
              <Timer className="mr-1 h-3 w-3" />
              {sub.daysLeft} ngày
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// low stock alerts
function LowStockAlerts({ alerts }: { alerts: { productId: string; productName: string; availableCount: number }[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Box className="h-10 w-10 text-emerald-500/50 mb-2" />
        <p className="text-sm text-muted-foreground">Tất cả sản phẩm còn đủ tồn kho</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((alert) => (
        <div
          key={alert.productId}
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
            alert.availableCount === 0
              ? "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
              : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${
                alert.availableCount === 0 ? "text-rose-500" : "text-amber-500"
              }`}
            />
            <p className="text-sm font-medium truncate">{alert.productName}</p>
          </div>
          <Badge
            variant="outline"
            className={
              alert.availableCount === 0
                ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700"
                : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700"
            }
          >
            {alert.availableCount === 0 ? "Hết hàng" : `Còn ${alert.availableCount}`}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// top products table
function TopProductsList({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu bán hàng</p>
      </div>
    );
  }

  const maxSold = Math.max(...products.map((p) => p.totalSold), 1);

  return (
    <div className="space-y-3">
      {products.map((product, index) => {
        const percentage = (product.totalSold / maxSold) * 100;
        
        return (
          <div key={product.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{product.totalSold} đã bán</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">DT: {formatCurrency(product.revenue)}</span>
                  <span className="text-emerald-600 font-medium">LN: {formatCurrency(product.profit)}</span>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Widget "Sản phẩm bán hôm nay - Chuẩn bị hàng cho hôm sau".
// Tabs: Hôm nay / Hôm qua / 7 ngày. Fetch /api/admin/dashboard/product-sales.
const RANGE_OPTIONS: { value: ProductSalesRange; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7d", label: "7 ngày qua" },
];

function ProductSalesPrepCard() {
  const [range, setRange] = useState<ProductSalesRange>("today");
  const [items, setItems] = useState<ProductSalesForPrep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: ProductSalesRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/dashboard/product-sales?range=${r}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Không tải được dữ liệu");
      const json = (await res.json()) as { data: ProductSalesForPrep[] };
      setItems(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  // Aggregate footer
  const totals = useMemo(() => {
    return items.reduce(
      (acc, it) => ({
        orderCount: acc.orderCount + it.orderCount,
        quantity: acc.quantity + it.quantity,
        revenue: acc.revenue + it.revenue,
        needRestock: acc.needRestock + (it.needRestock ? 1 : 0),
      }),
      { orderCount: 0, quantity: 0, revenue: 0, needRestock: 0 },
    );
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-orange-500" />
              Sản phẩm bán hôm nay – Chuẩn bị hàng
            </CardTitle>
            <CardDescription>
              {range === "today" && "Đếm theo paidAt trong hôm nay. Sắp xếp theo số đơn nhiều nhất."}
              {range === "yesterday" && "Đếm theo paidAt của hôm qua — căn cứ chuẩn hàng cho hôm sau."}
              {range === "7d" && "Tổng hợp 7 ngày gần nhất để dự đoán xu hướng."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* range tabs */}
            <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1 text-xs rounded-sm transition-colors whitespace-nowrap ${
                    range === opt.value
                      ? "bg-background shadow-sm font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => load(range)}
              disabled={loading}
              title="Tải lại"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {!error && !loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Chưa có đơn paid trong khoảng thời gian này.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <>
            {totals.needRestock > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{totals.needRestock}</strong> sản phẩm cần chuẩn bị thêm
                  hàng (tồn kho đang ít hơn số đã bán {range === "today" ? "hôm nay" : range === "yesterday" ? "hôm qua" : "7 ngày qua"}).
                </span>
              </div>
            )}

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="px-2 py-2 font-medium">Sản phẩm</th>
                    <th className="px-2 py-2 font-medium text-right whitespace-nowrap">Số đơn</th>
                    <th className="px-2 py-2 font-medium text-right whitespace-nowrap">SL</th>
                    <th className="px-2 py-2 font-medium text-right whitespace-nowrap">Doanh thu</th>
                    <th className="px-2 py-2 font-medium text-right whitespace-nowrap">Tồn kho</th>
                    <th className="px-2 py-2 font-medium text-center whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.productId}
                      className={`border-b last:border-b-0 ${
                        it.needRestock ? "bg-amber-50/50 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {it.image ? (
                              <Image
                                src={it.image}
                                alt={it.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ImageOff className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products`}
                              className="block text-sm font-medium hover:underline line-clamp-2"
                              title={it.name}
                            >
                              {it.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground capitalize">
                              {it.productType || it.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {it.orderCount}
                      </td>
                      <td className="px-2 py-2 text-right">{it.quantity}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        {formatCurrency(it.revenue)}
                      </td>
                      <td
                        className={`px-2 py-2 text-right whitespace-nowrap font-medium ${
                          it.productType === "upgrade"
                            ? "text-muted-foreground"
                            : it.stockQuantity === 0
                              ? "text-rose-600"
                              : it.needRestock
                                ? "text-amber-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {it.productType === "upgrade" ? "—" : it.stockQuantity}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {it.productType === "upgrade" ? (
                          <Badge variant="outline" className="text-[10px]">
                            Nâng cấp
                          </Badge>
                        ) : it.stockQuantity === 0 ? (
                          <Badge className="bg-rose-100 text-rose-700 border-rose-300 text-[10px] dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700">
                            Hết hàng
                          </Badge>
                        ) : it.needRestock ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                            Cần thêm
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                            Đủ hàng
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td className="px-2 py-2 text-xs uppercase text-muted-foreground">
                      Tổng ({items.length} SP)
                    </td>
                    <td className="px-2 py-2 text-right">{totals.orderCount}</td>
                    <td className="px-2 py-2 text-right">{totals.quantity}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      {formatCurrency(totals.revenue)}
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const { stats, revenueChart, topProducts, recentOrders, expiringSubscriptions, lowStockAlerts } = data;

  // calculate some derived stats
  const weeklyGrowth = useMemo(() => {
    if (stats.weekRevenue === 0) return 0;
    // simplified growth calculation
    const avgDaily = stats.weekRevenue / 7;
    const previousWeekEstimate = avgDaily * 7 * 0.85; // estimate
    return Math.round(((stats.weekRevenue - previousWeekEstimate) / previousWeekEstimate) * 100);
  }, [stats.weekRevenue]);

  const pendingAlerts = stats.pendingOrders + stats.expiredNeedProcessing + lowStockAlerts.filter(a => a.availableCount === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Tổng Quan
          </h1>
          <p className="text-sm text-muted-foreground">
            Cập nhật lần cuối: {format(new Date(), "HH:mm, dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
        
        {pendingAlerts > 0 && (
          <Badge variant="destructive" className="w-fit gap-1">
            <AlertTriangle className="h-3 w-3" />
            {pendingAlerts} cảnh báo cần xử lý
          </Badge>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          subtitle={`Tuần này: ${formatCurrency(stats.weekRevenue)}`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="info"
        />
        
        <StatCard
          title="Lợi nhuận hôm nay"
          value={formatCurrency(stats.todayProfit)}
          subtitle={`Tuần này: ${formatCurrency(stats.weekProfit)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
          trend={weeklyGrowth !== 0 ? { value: Math.abs(weeklyGrowth), isPositive: weeklyGrowth > 0 } : undefined}
        />
        
        <StatCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          subtitle={`Tổng: ${stats.totalOrders} đơn`}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="default"
        />
        
        <StatCard
          title="Tài khoản hoạt động"
          value={stats.activeSubscriptions}
          subtitle={stats.expiringSoon > 0 ? `${stats.expiringSoon} sắp hết hạn` : "Tất cả ổn định"}
          icon={<Zap className="h-5 w-5" />}
          variant={stats.expiringSoon > 0 ? "warning" : "success"}
        />
        
        <StatCard
          title="Tồn kho tài khoản"
          value={stats.totalCredentialsAvailable}
          subtitle={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} sản phẩm tồn thấp` : "Đầy đủ"}
          icon={<Package className="h-5 w-5" />}
          variant={stats.lowStockProducts > 0 ? "warning" : "default"}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Doanh thu tháng</p>
                <p className="text-lg font-bold text-blue-600">{formatCompactNumber(stats.monthRevenue)}₫</p>
              </div>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Lợi nhuận tháng</p>
                <p className="text-lg font-bold text-emerald-600">{formatCompactNumber(stats.monthProfit)}₫</p>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Chờ xử lý</p>
                <p className="text-lg font-bold">{stats.pendingOrders}</p>
              </div>
              <Clock className={`h-4 w-4 ${stats.pendingOrders > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hoàn thành</p>
                <p className="text-lg font-bold">{stats.completedOrders}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tổng người dùng</p>
                <p className="text-lg font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sản phẩm</p>
                <p className="text-lg font-bold">{stats.totalProducts}</p>
              </div>
              <Box className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Revenue Chart & Recent Orders */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-violet-500" />
                    Biểu đồ doanh thu
                  </CardTitle>
                  <CardDescription>Thống kê doanh thu theo thời gian</CardDescription>
                </div>
                <Link href="/admin/reports">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Xem chi tiết
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueChart} />
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Đơn hàng gần đây
                  </CardTitle>
                  <CardDescription>5 đơn hàng mới nhất</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Tất cả đơn hàng
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <RecentOrdersList orders={recentOrders} />
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Sản phẩm bán chạy
                  </CardTitle>
                  <CardDescription>Top 5 sản phẩm có doanh số cao nhất</CardDescription>
                </div>
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Quản lý sản phẩm
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <TopProductsList products={topProducts} />
            </CardContent>
          </Card>

          {/* Sản phẩm bán hôm nay - Chuẩn bị hàng cho hôm sau */}
          <ProductSalesPrepCard />
        </div>

        {/* Right Column - Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Expiring Subscriptions */}
          <Card className={expiringSubscriptions.length > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-amber-500" />
                    Sắp hết hạn
                  </CardTitle>
                  <CardDescription>Tài khoản hết hạn trong 7 ngày</CardDescription>
                </div>
                <Link href="/admin/subscriptions">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Xem
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ExpiringSubscriptionsList subscriptions={expiringSubscriptions} />
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className={lowStockAlerts.some(a => a.availableCount === 0) ? "border-rose-200 dark:border-rose-800" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    Cảnh báo tồn kho
                  </CardTitle>
                  <CardDescription>Sản phẩm cần bổ sung</CardDescription>
                </div>
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Quản lý
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <LowStockAlerts alerts={lowStockAlerts} />
            </CardContent>
          </Card>

          {/* Expired Need Processing */}
          {stats.expiredNeedProcessing > 0 && (
            <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/50">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-rose-700 dark:text-rose-400">
                      {stats.expiredNeedProcessing} tài khoản đã hết hạn
                    </p>
                    <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                      Cần xử lý để trả lại tài khoản vào kho
                    </p>
                    <Link href="/admin/subscriptions?status=expired">
                      <Button size="sm" variant="outline" className="mt-3 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30">
                        Xử lý ngay
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/admin/orders">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Quản lý đơn hàng
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4" />
                  Quản lý sản phẩm
                </Button>
              </Link>
              <Link href="/admin/subscriptions">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Zap className="h-4 w-4" />
                  Quản lý tài khoản
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Quản lý người dùng
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
