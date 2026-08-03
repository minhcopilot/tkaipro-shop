"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/ui/primitives/select";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "~/ui/components/page-header";

interface Subscription {
  id: string;
  orderId: string;
  orderNumber: string | null; // mã đơn hàng thực tế (ORD...)
  productName: string;
  username: string;
  password: string;
  customerEmail: string;
  assignedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isExpired: boolean;
}

interface SubscriptionStats {
  totalActive: number;
  totalExpired: number;
  expiringSoon: number;
}

interface ReminderPreview {
  pending3Day: Array<{
    id: string;
    customerEmail: string;
    productName: string;
    expiresAt: string;
  }>;
  pending1Day: Array<{
    id: string;
    customerEmail: string;
    productName: string;
    expiresAt: string;
  }>;
  total3Day: number;
  total1Day: number;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
}

export function SubscriptionsPageClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalActive: 0,
    totalExpired: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // reminder state
  const [reminderPreview, setReminderPreview] = useState<ReminderPreview | null>(null);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  // filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/subscriptions/stats");
      if (response.ok) {
        const data = await response.json() as SubscriptionStats;
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription stats:", error);
    }
  };

  const fetchReminderPreview = async () => {
    try {
      setLoadingReminders(true);
      const response = await fetch("/api/admin/subscriptions/reminders");
      if (response.ok) {
        const data = await response.json() as ReminderPreview;
        setReminderPreview(data);
      }
    } catch (error) {
      console.error("Failed to fetch reminder preview:", error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      const response = await fetch("/api/admin/subscriptions/reminders", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        const total = result.totalProcessed || 0;
        
        if (total > 0) {
          toast.success(`Đã gửi ${total} email nhắc nhở thành công!`);
        } else {
          toast.info("Không có subscription nào cần gửi email nhắc nhở");
        }
        
        if (result.errors && result.errors.length > 0) {
          console.error("Reminder errors:", result.errors);
          toast.warning(`Có ${result.errors.length} lỗi khi gửi email`);
        }
        
        // refresh data
        await fetchReminderPreview();
      } else {
        toast.error("Không thể gửi email nhắc nhở");
      }
    } catch (error) {
      console.error("Failed to send reminders:", error);
      toast.error("Đã xảy ra lỗi khi gửi email");
    } finally {
      setSendingReminders(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      });
      
      if (statusFilter) params.append("status", statusFilter);
      if (searchFilter) params.append("search", searchFilter);

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (response.ok) {
        const data = await response.json() as SubscriptionsResponse;
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("Không thể tải danh sách subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleExpireSelected = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một subscription để hết hạn");
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch("/api/admin/subscriptions/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionIds: selectedIds }),
      });

      if (response.ok) {
        toast.success(`Đã đánh dấu ${selectedIds.length} subscription hết hạn`);
        await fetchSubscriptions();
        await fetchStats();
      } else {
        toast.error("Không thể đánh dấu hết hạn");
      }
    } catch (error) {
      console.error("Failed to expire subscriptions:", error);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    const now = new Date();
    const isExpired = subscription.expiresAt < now;
    const isExpiringSoon = subscription.expiresAt < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (subscription.isExpired || !subscription.isActive) {
      return <Badge variant="destructive">Đã hết hạn</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Hết hạn</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="secondary">Sắp hết hạn</Badge>;
    }
    return <Badge variant="default">Đang hoạt động</Badge>;
  };

  const columns: ColumnDef<Subscription>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
        />
      ),
    },
    {
      accessorKey: "orderNumber",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-xs font-mono">
          {row.original.orderNumber || row.original.orderId}
        </code>
      ),
    },
    {
      accessorKey: "productName",
      header: "Sản phẩm",
    },
    {
      accessorKey: "customerEmail",
      header: "Email khách hàng",
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <code className="bg-muted px-1 py-0.5 rounded text-sm">
          {row.original.username}
        </code>
      ),
    },
    {
      accessorKey: "assignedAt",
      header: "Ngày cấp",
      cell: ({ row }) => format(new Date(row.original.assignedAt), "dd/MM/yyyy HH:mm", { locale: vi }),
    },
    {
      accessorKey: "expiresAt",
      header: "Ngày hết hạn",
      cell: ({ row }) => format(new Date(row.original.expiresAt), "dd/MM/yyyy HH:mm", { locale: vi }),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original),
    },
  ];

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
    fetchReminderPreview();
  }, [statusFilter, searchFilter]);

  return (
    <div className="container mx-auto py-6">
      <PageHeader>
        <PageHeaderHeading>Quản lý Subscriptions</PageHeaderHeading>
        <PageHeaderDescription>
          Quản lý thời hạn và trạng thái các tài khoản đã cấp cho khách hàng
        </PageHeaderDescription>
      </PageHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalActive}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Trong 7 ngày tới</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã hết hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalExpired}</div>
            <p className="text-xs text-muted-foreground">Cần xử lý</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Reminder Section */}
      <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-amber-600">📧</span>
                Gửi email nhắc nhở tự động
              </CardTitle>
              <CardDescription>
                Gửi email nhắc nhở cho khách hàng có subscription sắp hết hạn (3 ngày và 1 ngày trước)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReminderPreview}
                disabled={loadingReminders}
              >
                {loadingReminders ? "Đang tải..." : "Kiểm tra"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSendReminders}
                disabled={sendingReminders || loadingReminders || 
                  (!reminderPreview?.total3Day && !reminderPreview?.total1Day)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {sendingReminders ? "Đang gửi..." : "Gửi email nhắc nhở"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {reminderPreview && (reminderPreview.total3Day > 0 || reminderPreview.total1Day > 0) && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 3-day reminders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500 text-xl">⚠️</span>
                  <h4 className="font-semibold">Hết hạn trong 3 ngày</h4>
                  <Badge variant="secondary">{reminderPreview.total3Day}</Badge>
                </div>
                {reminderPreview.pending3Day.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reminderPreview.pending3Day.slice(0, 5).map((sub) => (
                      <div key={sub.id} className="text-sm flex justify-between items-center">
                        <span className="truncate max-w-[60%]">{sub.customerEmail}</span>
                        <Badge variant="outline" className="text-xs">{sub.productName}</Badge>
                      </div>
                    ))}
                    {reminderPreview.pending3Day.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{reminderPreview.pending3Day.length - 5} subscription khác...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có subscription nào</p>
                )}
              </div>

              {/* 1-day reminders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-500 text-xl">🚨</span>
                  <h4 className="font-semibold">Hết hạn trong 1 ngày</h4>
                  <Badge variant="destructive">{reminderPreview.total1Day}</Badge>
                </div>
                {reminderPreview.pending1Day.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reminderPreview.pending1Day.slice(0, 5).map((sub) => (
                      <div key={sub.id} className="text-sm flex justify-between items-center">
                        <span className="truncate max-w-[60%]">{sub.customerEmail}</span>
                        <Badge variant="outline" className="text-xs">{sub.productName}</Badge>
                      </div>
                    ))}
                    {reminderPreview.pending1Day.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{reminderPreview.pending1Day.length - 5} subscription khác...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có subscription nào</p>
                )}
              </div>
            </div>
          </CardContent>
        )}
        
        {reminderPreview && reminderPreview.total3Day === 0 && reminderPreview.total1Day === 0 && (
          <CardContent className="pt-0">
            <div className="text-center py-4 text-muted-foreground">
              <span className="text-2xl block mb-2">✅</span>
              <p>Không có subscription nào cần gửi email nhắc nhở</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="expiring_soon">Sắp hết hạn</SelectItem>
                  <SelectItem value="expired">Đã hết hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Tìm kiếm</label>
              <Input
                placeholder="Email, Username hoặc Mã đơn hàng..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("");
                  setSearchFilter("");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="destructive"
          onClick={() => {
            const table = document.querySelector('[data-table]') as any;
            if (table?.__table) {
              const selectedRows = table.__table.getSelectedRowModel().rows;
              const selectedIds = selectedRows.map((row: any) => row.original.id);
              handleExpireSelected(selectedIds);
            }
          }}
          disabled={processing}
        >
          {processing ? "Đang xử lý..." : "Đánh dấu hết hạn"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            fetchSubscriptions();
            fetchStats();
          }}
          disabled={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div data-table>
            {loading ? (
              <div className="p-8 text-center">Đang tải...</div>
            ) : (
              <DataTable
                columns={columns}
                data={subscriptions}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 