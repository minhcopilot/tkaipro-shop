"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  ArrowUpRight,
  Crown,
  Layers,
  AlertTriangle,
  ImageOff,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/ui/primitives/card";
import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";
import { Input } from "~/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

// types
interface RevenueByProduct {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  orderCount: number;
  averageOrderValue: number;
  // Mở rộng cho cột ảnh + tồn kho + cảnh báo "Cần thêm hàng"
  image?: string | null;
  productType?: string | null;
  stockQuantity?: number | null;
  inStock?: boolean | null;
}

interface RevenueByCategory {
  category: string;
  productCount: number;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  orderCount: number;
  percentageOfTotal: number;
}

interface RevenueByPeriod {
  period: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
  averageOrderValue: number;
  growth?: number;
}

interface ReportSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProduct: { name: string; revenue: number; profit: number } | null;
  topCategory: { name: string; revenue: number; profit: number } | null;
}

interface CategoryOption {
  slug: string;
  name: string;
}

interface ReportData {
  summary: ReportSummary;
  byProduct: RevenueByProduct[];
  byCategory: RevenueByCategory[];
  byPeriod: RevenueByPeriod[];
  periodType: "day" | "week" | "month";
  availableCategories: CategoryOption[];
}

// format currency
function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M₫`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K₫`;
  }
  return `${amount.toLocaleString("vi-VN")}₫`;
}

function formatFullVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

// color palette for charts
const CHART_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
];

// preset date ranges
const DATE_PRESETS = [
  { label: "Chọn tháng", value: "selected_month" },
  { label: "7 ngày qua", value: "7d" },
  { label: "14 ngày qua", value: "14d" },
  { label: "30 ngày qua", value: "30d" },
  { label: "Tháng này", value: "this_month" },
  { label: "Tháng trước", value: "last_month" },
  { label: "3 tháng qua", value: "3m" },
  { label: "6 tháng qua", value: "6m" },
  { label: "Năm nay", value: "this_year" },
];

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

// generate years (last 5 years)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function ReportsClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [datePreset, setDatePreset] = useState("selected_month");
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("day");
  const [category, setCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // month/year picker for daily view
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // product table sort
  const [productSort, setProductSort] = useState<{ key: keyof RevenueByProduct; dir: "asc" | "desc" }>({
    key: "revenue",
    dir: "desc",
  });

  // calculate date range from preset or selected month
  const getDateRange = useCallback((preset: string) => {
    const today = new Date();
    
    // use selected month/year for monthly view
    if (preset === "selected_month") {
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      // if selected month is current month, use today as end
      const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1;
      return { start: monthStart, end: isCurrentMonth ? today : monthEnd };
    }
    
    switch (preset) {
      case "7d":
        return { start: subDays(today, 7), end: today };
      case "14d":
        return { start: subDays(today, 14), end: today };
      case "30d":
        return { start: subDays(today, 30), end: today };
      case "this_month":
        return { start: startOfMonth(today), end: today };
      case "last_month": {
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case "3m":
        return { start: subMonths(today, 3), end: today };
      case "6m":
        return { start: subMonths(today, 6), end: today };
      case "this_year":
        return { start: new Date(today.getFullYear(), 0, 1), end: today };
      default:
        return { start: subDays(today, 30), end: today };
    }
  }, [selectedMonth, selectedYear]);

  // fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        const range = getDateRange(datePreset);
        start = range.start;
        end = range.end;
      }

      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        periodType,
      });

      if (category) {
        params.set("category", category);
      }

      const response = await fetch(`/api/admin/reports?${params}`);
      
      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu báo cáo");
      }

      const reportData = await response.json() as ReportData;
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [datePreset, periodType, category, startDate, endDate, getDateRange, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // sorted products
  const sortedProducts = useMemo(() => {
    if (!data?.byProduct) return [];
    return [...data.byProduct].sort((a, b) => {
      const aVal = a[productSort.key];
      const bVal = b[productSort.key];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return productSort.dir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return productSort.dir === "asc" 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data?.byProduct, productSort]);

  // chart calculations
  const maxRevenue = useMemo(() => {
    if (!data?.byPeriod) return 0;
    return Math.max(...data.byPeriod.map(p => p.revenue), 1);
  }, [data?.byPeriod]);

  const maxCategoryRevenue = useMemo(() => {
    if (!data?.byCategory) return 0;
    return Math.max(...data.byCategory.map(c => c.revenue), 1);
  }, [data?.byCategory]);

  // export to CSV
  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Sản phẩm", "Số lượng", "Doanh thu", "Số đơn", "TB/Đơn"];
    const rows = data.byProduct.map(p => [
      p.productName,
      p.quantity.toString(),
      p.revenue.toString(),
      p.orderCount.toString(),
      p.averageOrderValue.toString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
  };

  // sort handler for product table
  const handleProductSort = (key: keyof RevenueByProduct) => {
    setProductSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải báo cáo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-10">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Báo cáo Doanh thu
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân tích chi tiết doanh thu theo sản phẩm, danh mục và thời gian
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Bộ lọc</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {/* date preset */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Khoảng thời gian</label>
              <Select 
                value={datePreset} 
                onValueChange={(val) => {
                  setDatePreset(val);
                  setStartDate("");
                  setEndDate("");
                  // auto set period type based on preset
                  if (val === "selected_month" || val === "this_month" || val === "last_month") {
                    setPeriodType("day");
                  }
                }}
              >
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* month/year picker - only show when "selected_month" is chosen */}
            {datePreset === "selected_month" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tháng / Năm</label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(val) => setSelectedMonth(parseInt(val))}
                  >
                    <SelectTrigger className="flex-1">
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
                    <SelectTrigger className="w-24">
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
              </div>
            )}

            {/* period type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nhóm theo</label>
              <Select value={periodType} onValueChange={(val) => setPeriodType(val as "day" | "week" | "month")}>
                <SelectTrigger>
                  <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* category filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Danh mục</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả danh mục</SelectItem>
                  {data.availableCategories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* custom date range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tùy chỉnh</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* total revenue */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tổng doanh thu
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatFullVND(data.summary.totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {data.summary.totalOrders} đơn hàng
            </p>
          </CardContent>
        </Card>

        {/* total cost */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tổng giá nhập
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatFullVND(data.summary.totalCost)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Chi phí vốn hàng bán
            </p>
          </CardContent>
        </Card>

        {/* total profit */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Lợi nhuận thực
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatFullVND(data.summary.totalProfit)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className={data.summary.profitMargin >= 50 ? "text-emerald-600 font-semibold" : data.summary.profitMargin >= 30 ? "text-amber-600" : "text-orange-600"}>
                {data.summary.profitMargin}%
              </span>
              tỷ suất lợi nhuận
            </p>
          </CardContent>
        </Card>

        {/* products sold */}
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sản phẩm bán được
                </p>
                <p className="text-2xl font-bold text-violet-600 mt-1">
                  {data.summary.totalProducts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Package className="h-6 w-6 text-violet-600" />
              </div>
            </div>
            {data.summary.topProduct && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1 truncate">
                <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">{data.summary.topProduct.name}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* avg order value */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  TB/Đơn hàng
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {formatVND(data.summary.averageOrderValue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            {data.summary.topCategory && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-500" />
                {data.summary.topCategory.name}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* revenue over time chart - line chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Doanh thu theo thời gian
                  {datePreset === "selected_month" && (
                    <Badge variant="secondary" className="ml-2">
                      {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Biểu đồ doanh thu nhóm theo {periodType === "day" ? "ngày" : periodType === "week" ? "tuần" : "tháng"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.byPeriod.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            ) : (
              <div className="space-y-3">
                {/* line chart */}
                <div className="relative">
                  {/* y-axis labels */}
                  <div className="absolute left-0 top-0 h-[220px] flex flex-col justify-between text-[10px] text-muted-foreground pr-2">
                    <span>{formatVND(maxRevenue)}</span>
                    <span>{formatVND(maxRevenue * 0.75)}</span>
                    <span>{formatVND(maxRevenue * 0.5)}</span>
                    <span>{formatVND(maxRevenue * 0.25)}</span>
                    <span>0</span>
                  </div>
                  
                  {/* chart area */}
                  <div className="ml-14">
                    <svg
                      viewBox={`0 0 ${Math.max(data.byPeriod.length * 50, 400)} 220`}
                      className="w-full h-[220px]"
                      preserveAspectRatio="none"
                    >
                      {/* grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                        <line
                          key={ratio}
                          x1="0"
                          y1={200 - ratio * 200}
                          x2={data.byPeriod.length * 50}
                          y2={200 - ratio * 200}
                          stroke="currentColor"
                          strokeOpacity="0.1"
                          strokeDasharray="4,4"
                        />
                      ))}
                      
                      {/* area fill under line */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`
                          M 0 200
                          ${data.byPeriod.map((p, i) => {
                            const x = i * 50 + 25;
                            const y = 200 - (p.revenue / maxRevenue) * 180;
                            return `L ${x} ${y}`;
                          }).join(" ")}
                          L ${(data.byPeriod.length - 1) * 50 + 25} 200
                          Z
                        `}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* line */}
                      <path
                        d={data.byPeriod.map((p, i) => {
                          const x = i * 50 + 25;
                          const y = 200 - (p.revenue / maxRevenue) * 180;
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* data points */}
                      {data.byPeriod.map((period, i) => {
                        const x = i * 50 + 25;
                        const y = 200 - (period.revenue / maxRevenue) * 180;
                        return (
                          <g key={period.period} className="group cursor-pointer">
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all hover:r-7"
                            />
                            {/* tooltip */}
                            <title>{`${period.label}: ${formatFullVND(period.revenue)} (${period.orderCount} đơn)`}</title>
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* x-axis labels */}
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground overflow-x-auto">
                      {data.byPeriod.map((period, i) => (
                        <div
                          key={period.period}
                          className="text-center"
                          style={{ width: `${100 / data.byPeriod.length}%` }}
                        >
                          {period.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* legend / total */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-muted-foreground">Doanh thu</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600 font-medium">
                      DT: {formatFullVND(data.byPeriod.reduce((sum, p) => sum + p.revenue, 0))}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      LN: {formatFullVND(data.byPeriod.reduce((sum, p) => sum + p.profit, 0))}
                    </span>
                    <span className="text-muted-foreground">
                      {data.byPeriod.reduce((sum, p) => sum + p.orderCount, 0)} đơn
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* revenue by category chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-violet-500" />
              Doanh thu theo danh mục
            </CardTitle>
            <CardDescription>
              Phân bố doanh thu giữa các danh mục sản phẩm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.byCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <div className="space-y-4">
                {/* horizontal bar chart */}
                {data.byCategory.map((cat, idx) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="font-medium truncate max-w-[150px]">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                          {cat.percentageOfTotal}%
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatVND(cat.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(cat.revenue / maxCategoryRevenue) * 100}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{cat.quantity} đã bán</span>
                      <span className="text-emerald-600 font-medium">LN: {formatVND(cat.profit)}</span>
                      <span className={cat.profitMargin >= 50 ? "text-emerald-600" : cat.profitMargin >= 30 ? "text-amber-600" : "text-orange-600"}>
                        ({cat.profitMargin}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* products table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Doanh thu theo sản phẩm
              </CardTitle>
              <CardDescription>
                Chi tiết doanh thu của từng sản phẩm
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {data.byProduct.length} sản phẩm
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sortedProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Không có dữ liệu sản phẩm
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                      #
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("productName")}
                    >
                      <div className="flex items-center gap-1">
                        Sản phẩm
                        <SortIcon active={productSort.key === "productName"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("quantity")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        SL
                        <SortIcon active={productSort.key === "quantity"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("revenue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Doanh thu
                        <SortIcon active={productSort.key === "revenue"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("cost")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Giá nhập
                        <SortIcon active={productSort.key === "cost"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("profit")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Lợi nhuận
                        <SortIcon active={productSort.key === "profit"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                      onClick={() => handleProductSort("profitMargin")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        %
                        <SortIcon active={productSort.key === "profitMargin"} dir={productSort.dir} />
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Tồn kho
                    </th>
                    <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Chuẩn bị
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product, idx) => {
                    const stockQty = product.stockQuantity ?? 0;
                    const isUpgrade = product.productType === "upgrade";
                    // cần thêm hàng = đã bán nhiều hơn tồn kho hiện tại (loại trừ upgrade)
                    const needRestock = !isUpgrade && stockQty < product.quantity;
                    const isOutOfStock = !isUpgrade && stockQty === 0;
                    return (
                    <tr
                      key={product.productId}
                      className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                        needRestock && !isOutOfStock ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
                      } ${isOutOfStock ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}`}
                    >
                      <td className="py-3 px-2">
                        {idx < 3 ? (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-amber-700"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.productName}
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
                            <div className="font-medium line-clamp-2" title={product.productName}>
                              {product.productName}
                            </div>
                            <div className="text-[11px] text-muted-foreground capitalize">
                              {product.productType || product.category}
                              {product.orderCount > 0 && (
                                <> · {product.orderCount} đơn</>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        {product.quantity}
                      </td>
                      <td className="py-3 px-2 text-right text-blue-600 tabular-nums">
                        {formatVND(product.revenue)}
                      </td>
                      <td className="py-3 px-2 text-right text-orange-600 tabular-nums">
                        {formatVND(product.cost)}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-emerald-600 tabular-nums">
                        {formatVND(product.profit)}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={product.profitMargin >= 50 ? "text-emerald-600 font-medium" : product.profitMargin >= 30 ? "text-amber-600" : "text-orange-600"}>
                          {product.profitMargin}%
                        </span>
                      </td>
                      <td
                        className={`py-3 px-2 text-right tabular-nums font-medium ${
                          isUpgrade
                            ? "text-muted-foreground"
                            : isOutOfStock
                              ? "text-rose-600"
                              : needRestock
                                ? "text-amber-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {isUpgrade ? "—" : stockQty}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isUpgrade ? (
                          <Badge variant="outline" className="text-[10px]">
                            Nâng cấp
                          </Badge>
                        ) : isOutOfStock ? (
                          <Badge className="bg-rose-100 text-rose-700 border-rose-300 text-[10px] gap-1 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700">
                            <AlertTriangle className="h-3 w-3" />
                            Hết
                          </Badge>
                        ) : needRestock ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] gap-1 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            Cần thêm
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                            Đủ
                          </Badge>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// sort icon component
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) {
    return <Minus className="h-3 w-3 opacity-30" />;
  }
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-primary" />
  );
}

