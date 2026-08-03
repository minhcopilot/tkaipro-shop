"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Handshake,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Send,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Sparkles,
  Ban,
  Activity
} from "lucide-react";

import type { UserWithPassword, UserStats, TimeFilter } from "~/lib/queries/users";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import { Checkbox } from "~/ui/primitives/checkbox";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { UserEditForm } from "./components/user-edit-form";
import { UserDeleteDialog } from "./components/user-delete-dialog";
import { RoleChangeDialog } from "./components/role-change-dialog";
import { BulkEmailDialog } from "./components/bulk-email-dialog";

interface AdminUsersClientProps {
  initialUsers: UserWithPassword[];
  initialTotal: number;
  initialStats: UserStats;
}

// check if user was created within last N hours
function isNewUser(createdAt: Date | null, hours = 24): boolean {
  if (!createdAt) return false;
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - hours);
  return new Date(createdAt) >= threshold;
}

export default function AdminUsersClient({ 
  initialUsers, 
  initialTotal,
  initialStats,
}: AdminUsersClientProps) {
  const [users, setUsers] = useState<UserWithPassword[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithPassword | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  // Ban nhanh + forensics
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(
    () => new Set(initialUsers.filter((u) => u.banned).map((u) => u.id)),
  );
  const [busyBanUserId, setBusyBanUserId] = useState<string | null>(null);
  const [forensicsOpen, setForensicsOpen] = useState(false);
  const [forensicsUser, setForensicsUser] = useState<UserWithPassword | null>(null);
  const [forensicsLoading, setForensicsLoading] = useState(false);
  const [forensicsData, setForensicsData] = useState<{
    summary?: { ips: string[]; fingerprints: string[]; dids: string[]; countries: string[] };
    rows?: Array<{ id: string; eventType: string; ip: string; country: string | null; fingerprint: string | null; did: string | null; path: string | null; createdAt: string }>;
  } | null>(null);

  const handleBanUser = useCallback(async (user: UserWithPassword) => {
    if (!window.confirm(`Ban nhanh user "${user.email}"? (ban email + IP + thiết bị + đá session)`)) return;
    setBusyBanUserId(user.id);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setBannedUserIds((prev) => new Set(prev).add(user.id));
        const d = (await res.json()) as any;
        toast.success(`Đã ban: ${d?.banned?.emails ?? 0} email, ${d?.banned?.ips ?? 0} IP, ${d?.banned?.fingerprints ?? 0} thiết bị`);
      } else {
        toast.error("Không thể ban user");
      }
    } finally {
      setBusyBanUserId(null);
    }
  }, []);

  const handleViewForensics = useCallback(async (user: UserWithPassword) => {
    setForensicsUser(user);
    setForensicsOpen(true);
    setForensicsLoading(true);
    setForensicsData(null);
    try {
      const res = await fetch(
        `/api/admin/users/forensics?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`,
        { cache: "no-store" },
      );
      if (res.ok) setForensicsData(await res.json());
    } finally {
      setForensicsLoading(false);
    }
  }, []);

  const totalPages = Math.ceil(total / limit);

  // load users với search, pagination và time filter
  const loadUsers = useCallback(async (searchTerm = "", pageNum = 1, filter: TimeFilter = "all", includeStats = false, pageLimit = limit) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?search=${encodeURIComponent(searchTerm)}&page=${pageNum}&limit=${pageLimit}&timeFilter=${filter}&includeStats=${includeStats}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json() as { users: UserWithPassword[]; total: number; stats?: UserStats };
      setUsers(data.users);
      // Hydrate trạng thái "Đã ban" từ server (giữ đúng sau F5 / phân trang)
      setBannedUserIds((prev) => {
        const next = new Set(prev);
        for (const u of data.users) {
          if (u.banned) next.add(u.id);
          else next.delete(u.id);
        }
        return next;
      });
      setTotal(data.total);
      setPage(pageNum);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // xử lý search
  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    loadUsers(searchTerm, 1, timeFilter);
  }, [loadUsers, timeFilter]);

  // xử lý time filter
  const handleTimeFilter = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
    loadUsers(search, 1, filter, true);
  }, [loadUsers, search]);

  // refresh data
  const handleRefresh = useCallback(() => {
    loadUsers(search, page, timeFilter, true);
  }, [loadUsers, search, page, timeFilter]);

  // xử lý thay đổi page size
  const handlePageSizeChange = useCallback((newLimit: string) => {
    const newLimitNum = Number(newLimit);
    setLimit(newLimitNum);
    loadUsers(search, 1, timeFilter, false, newLimitNum);
  }, [loadUsers, search, timeFilter]);

  // actions
  const handleEdit = useCallback((user: UserWithPassword) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((user: UserWithPassword) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }, []);

  const handleRoleChange = useCallback((user: UserWithPassword) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  }, []);

  // toggle password visibility
  const togglePasswordVisibility = useCallback((userId: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // checkbox selection handlers
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  }, [users, selectedUserIds.size]);

  const selectedUsersForEmail = useMemo(() => {
    return users
      .filter(u => selectedUserIds.has(u.id))
      .map(u => ({ id: u.id, email: u.email, name: u.name }));
  }, [users, selectedUserIds]);

  // format date
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date));
  };

  // columns definition
  const columns = useMemo((): ColumnDef<UserWithPassword>[] => [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={users.length > 0 && selectedUserIds.size === users.length}
          onCheckedChange={toggleAllSelection}
          aria-label="Chọn tất cả"
          className="border-gray-300 dark:border-gray-600"
        />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Checkbox
            checked={selectedUserIds.has(user.id)}
            onCheckedChange={() => toggleUserSelection(user.id)}
            aria-label={`Chọn ${user.name}`}
            className="border-gray-300 dark:border-gray-600"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isNew = isNewUser(user.createdAt, 24);
        const isRecent = !isNew && isNewUser(user.createdAt, 168); // 7 days
        return (
          <div className="flex items-center gap-3">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                {isNew && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    MỚI
                  </Badge>
                )}
                {isRecent && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600 text-[10px] px-1.5 py-0 h-4">
                    7 ngày
                  </Badge>
                )}
              </div>
              {(user.firstName || user.lastName) && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vai trò" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === "ADMIN") {
          return (
            <Badge variant="destructive" className="font-medium">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Admin
            </Badge>
          );
        }
        if (user.role === "AFFILIATE") {
          return (
            <Badge className="font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Handshake className="mr-1 h-3 w-3" />
              CTV
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="font-medium">
            <Shield className="mr-1 h-3 w-3" />
            User
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">{formatDate(user.createdAt)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "password",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mật khẩu" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isVisible = visiblePasswords.has(user.id);
        const hasPassword = !!user.password;
        
        return (
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {hasPassword ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                  {isVisible ? user.password : "••••••••"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePasswordVisibility(user.id)}
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isVisible ? (
                    <EyeOff className="h-3 w-3 text-gray-500" />
                  ) : (
                    <Eye className="h-3 w-3 text-gray-500" />
                  )}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                Không có
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const user = row.original;
        const isBanned = bannedUserIds.has(user.id) || !!user.banned;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRoleChange(user)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewForensics(user)}
              title="Xem IP / định danh / hoạt động"
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBanUser(user)}
              disabled={busyBanUserId === user.id || isBanned}
              title={isBanned ? "User đã bị ban (gỡ ban ở trang Giám sát IP)" : "Ban nhanh (email + IP + thiết bị)"}
              className={
                isBanned
                  ? "text-red-700 bg-red-100 dark:bg-red-900/40"
                  : "text-orange-600 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            >
              <Ban className="h-4 w-4" />
              {isBanned ? <span className="ml-1 text-xs">Đã ban</span> : null}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete, handleRoleChange, handleBanUser, handleViewForensics, busyBanUserId, bannedUserIds, visiblePasswords, togglePasswordVisibility, users, selectedUserIds, toggleAllSelection, toggleUserSelection]);

  const statsCards = [
    {
      title: "Tổng người dùng",
      value: stats.total,
      icon: Users,
      color: "bg-blue-500",
      filter: "all" as TimeFilter,
    },
    {
      title: "Đăng ký hôm nay",
      value: stats.today,
      icon: UserPlus,
      color: "bg-green-500",
      filter: "today" as TimeFilter,
    },
    {
      title: "7 ngày qua",
      value: stats.week,
      icon: Clock,
      color: "bg-purple-500",
      filter: "week" as TimeFilter,
    },
    {
      title: "30 ngày qua",
      value: stats.month,
      icon: CalendarDays,
      color: "bg-orange-500",
      filter: "month" as TimeFilter,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Quản lý người dùng</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {total} người dùng
            {timeFilter !== "all" && (
              <span className="ml-1 text-blue-600 dark:text-blue-400">
                ({timeFilter === "today" ? "hôm nay" : timeFilter === "week" ? "7 ngày" : "30 ngày"})
              </span>
            )}
            {selectedUserIds.size > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                • Đã chọn {selectedUserIds.size} người
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedUserIds.size > 0 && (
            <Button 
              onClick={() => setBulkEmailDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            >
              <Send className="mr-2 h-4 w-4" />
              Gửi email ({selectedUserIds.size})
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          const isActive = timeFilter === card.filter;
          return (
            <button
              key={card.filter}
              onClick={() => handleTimeFilter(card.filter)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }
              `}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`${card.color} p-2.5 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Tìm kiếm theo tên, email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        {/* Quick filter buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Lọc:</span>
          <div className="flex gap-1">
            {[
              { label: "Tất cả", value: "all" as TimeFilter },
              { label: "Hôm nay", value: "today" as TimeFilter },
              { label: "7 ngày", value: "week" as TimeFilter },
              { label: "30 ngày", value: "month" as TimeFilter },
            ].map((btn) => (
              <Button
                key={btn.value}
                variant={timeFilter === btn.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeFilter(btn.value)}
                className={timeFilter === btn.value ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DataTable 
          columns={columns} 
          data={users}
          hidePagination={true}
        />
      </div>

      {/* Server-side Pagination */}
      <div className="flex items-center justify-between px-2 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Hiển thị</span>
            <Select value={String(limit)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[80px] h-8 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-gray-900 dark:text-gray-100">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600 dark:text-gray-400">người dùng/trang</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {total > 0 ? (
              <>
                {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng số {total}
              </>
            ) : (
              "Không có dữ liệu"
            )}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(search, 1, timeFilter)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Trang đầu</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(search, page - 1, timeFilter)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium w-[100px]">
              Trang {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(search, page + 1, timeFilter)}
              disabled={page >= totalPages || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(search, totalPages, timeFilter)}
              disabled={page >= totalPages || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Trang cuối</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              onSuccess={(updatedUser: UserWithPassword) => {
                // cập nhật user trong danh sách
                setUsers(prev => prev.map(u => 
                  u.id === updatedUser.id ? updatedUser : u
                ));
                setEditDialogOpen(false);
                toast.success("Cập nhật thành công");
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Thay đổi vai trò</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <RoleChangeDialog
              user={selectedUser}
              onSuccess={(updatedUser: UserWithPassword) => {
                setUsers(prev => prev.map(u => 
                  u.id === updatedUser.id ? updatedUser : u
                ));
                setRoleDialogOpen(false);
                toast.success("Thay đổi vai trò thành công");
              }}
              onCancel={() => setRoleDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Forensics Dialog: IP / định danh / hoạt động của user */}
      <Dialog open={forensicsOpen} onOpenChange={setForensicsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Thông tin & hoạt động: {forensicsUser?.email}
            </DialogTitle>
          </DialogHeader>
          {forensicsLoading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : forensicsData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium mb-1">IP ({forensicsData.summary?.ips.length ?? 0})</div>
                  <div className="flex flex-wrap gap-1">
                    {(forensicsData.summary?.ips ?? []).map((v) => (
                      <span key={v} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono dark:bg-gray-700">{v}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Quốc gia</div>
                  <div className="text-xs">{(forensicsData.summary?.countries ?? []).join(", ") || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium mb-1">Thiết bị (fingerprint + did): {((forensicsData.summary?.fingerprints.length ?? 0) + (forensicsData.summary?.dids.length ?? 0))}</div>
                  <div className="flex flex-wrap gap-1">
                    {[...(forensicsData.summary?.fingerprints ?? []), ...(forensicsData.summary?.dids ?? [])].map((v) => (
                      <span key={v} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono dark:bg-gray-700" title={v}>{v.slice(0, 14)}…</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                {forensicsUser && (
                  <Button
                    size="sm"
                    onClick={() => handleBanUser(forensicsUser)}
                    disabled={busyBanUserId === forensicsUser.id || bannedUserIds.has(forensicsUser.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    {bannedUserIds.has(forensicsUser.id) ? "Đã ban" : "Ban nhanh user này"}
                  </Button>
                )}
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Hoạt động gần đây</div>
                <div className="overflow-x-auto rounded-lg border dark:border-gray-700 max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Sự kiện</th>
                        <th className="px-2 py-1.5 text-left">IP</th>
                        <th className="px-2 py-1.5 text-left">QG</th>
                        <th className="px-2 py-1.5 text-left">Đường dẫn</th>
                        <th className="px-2 py-1.5 text-left">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(forensicsData.rows ?? []).map((r) => (
                        <tr key={r.id} className="border-t dark:border-gray-700">
                          <td className="px-2 py-1.5">{r.eventType}</td>
                          <td className="px-2 py-1.5 font-mono">{r.ip}</td>
                          <td className="px-2 py-1.5">{r.country ?? "—"}</td>
                          <td className="px-2 py-1.5 max-w-[180px] truncate" title={r.path ?? ""}>{r.path ?? "—"}</td>
                          <td className="px-2 py-1.5">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                      {(forensicsData.rows ?? []).length === 0 && (
                        <tr><td colSpan={5} className="px-2 py-4 text-center text-gray-500">Chưa có hoạt động ghi nhận</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Xóa người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserDeleteDialog
              user={selectedUser}
              onSuccess={() => {
                setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                setDeleteDialogOpen(false);
                toast.success("Xóa người dùng thành công");
              }}
              onCancel={() => setDeleteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailDialogOpen} onOpenChange={setBulkEmailDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Gửi email hàng loạt
            </DialogTitle>
          </DialogHeader>
          <BulkEmailDialog
            selectedUsers={selectedUsersForEmail}
            onSuccess={() => {
              setBulkEmailDialogOpen(false);
              setSelectedUserIds(new Set());
            }}
            onCancel={() => setBulkEmailDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 