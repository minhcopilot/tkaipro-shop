"use client";

import {
  Building2,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  CreditCard,
  Edit,
  Info,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { BankAccount } from "~/db/schema";

import { findBankByBin, searchBanks } from "~/lib/payment/vietqr-banks";

type BankAccountStatsRow = {
  bankAccountId: string;
  pendingOrders: number;
  paidOrders: number;
  paidOrdersAmount7d: number;
  paidOrdersAmount30d: number;
  pendingTopups: number;
  paidTopups: number;
  paidTopupsAmount7d: number;
  paidTopupsAmount30d: number;
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/ui/primitives/alert-dialog";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/ui/primitives/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/ui/primitives/popover";
import { Switch } from "~/ui/primitives/switch";

type BankSelectionMode = "default" | "round_robin";

interface FormData {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

const emptyForm: FormData = {
  accountName: "",
  accountNumber: "",
  bankCode: "",
  bankName: "",
  isActive: true,
  isDefault: false,
  sortOrder: 0,
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

interface SettingsClientPageProps {
  initialAccounts: BankAccount[];
  initialBankSelectionMode: BankSelectionMode;
}

export default function SettingsClientPage({
  initialAccounts,
  initialBankSelectionMode,
}: SettingsClientPageProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [bankSelectionMode, setBankSelectionMode] = useState<BankSelectionMode>(
    initialBankSelectionMode,
  );
  const [stats, setStats] = useState<BankAccountStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<null | string>(null);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState("");

  const selectedBank = useMemo(() => findBankByBin(form.bankCode), [form.bankCode]);
  const filteredBanks = useMemo(() => searchBanks(bankSearchTerm), [bankSearchTerm]);
  const activeCount = useMemo(
    () => accounts.filter((a) => a.isActive).length,
    [accounts],
  );
  const statsById = useMemo(() => {
    const map = new Map<string, BankAccountStatsRow>();
    for (const row of stats) map.set(row.bankAccountId, row);
    return map;
  }, [stats]);

  const bankDisplayLabel =
    selectedBank?.label ??
    (form.bankCode && form.bankName ? `(${form.bankCode}) ${form.bankName}` : null);

  const resetBankSearch = () => {
    setBankSearchOpen(false);
    setBankSearchTerm("");
  };

  const handleSelectBank = (bin: string) => {
    const bank = findBankByBin(bin);
    if (!bank) return;

    setForm((prev) => ({
      ...prev,
      bankCode: bank.bin,
      bankName: bank.name,
    }));
    resetBankSearch();
  };

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/admin/bank-accounts/stats");
      if (!res.ok) return;
      const data = (await res.json()) as { stats: BankAccountStatsRow[] };
      setStats(data.stats);
    } catch {
      // non-blocking
    }
  };

  const refreshList = async () => {
    setLoading(true);
    try {
      const [accountsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/bank-accounts"),
        fetch("/api/admin/payment-settings"),
      ]);
      if (!accountsRes.ok) throw new Error("fetch failed");
      const data = (await accountsRes.json()) as { bankAccounts: BankAccount[] };
      setAccounts(data.bankAccounts);

      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as {
          bankSelectionMode?: string;
        };
        if (
          settings.bankSelectionMode === "round_robin" ||
          settings.bankSelectionMode === "default"
        ) {
          setBankSelectionMode(settings.bankSelectionMode);
        }
      }
      await refreshStats();
    } catch {
      toast.error("Không tải được danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStats();
  }, []);

  const handleModeChange = async (mode: BankSelectionMode) => {
    if (mode === bankSelectionMode) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        body: JSON.stringify({ bankSelectionMode: mode }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error || "Không đổi được chế độ");
        return;
      }
      setBankSelectionMode(mode);
      toast.success(
        mode === "round_robin"
          ? "Đã bật luân phiên theo đơn"
          : "Đã chuyển về mặc định 1 TK",
      );
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    resetBankSearch();
    setDialogOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setForm({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankCode: account.bankCode,
      bankName: account.bankName,
      isActive: account.isActive,
      isDefault: account.isDefault,
      sortOrder: account.sortOrder,
    });
    resetBankSearch();
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.bankName.trim() || !form.bankCode.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin tài khoản");
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/admin/bank-accounts/${editingId}` : "/api/admin/bank-accounts";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method,
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(
          data.error === "CANNOT_DEACTIVATE_LAST_ACTIVE"
            ? "Không thể tắt tài khoản active cuối cùng"
            : data.error || "Lưu thất bại",
        );
        return;
      }

      toast.success(editingId ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản mới");
      setDialogOpen(false);
      await refreshList();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${id}`, {
        body: JSON.stringify({ setDefault: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error || "Không đặt được mặc định");
        return;
      }
      toast.success("Đã đặt làm tài khoản mặc định");
      await refreshList();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleSortOrderBlur = async (account: BankAccount, raw: string) => {
    const next = Number(raw);
    if (!Number.isFinite(next) || next === account.sortOrder) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        body: JSON.stringify({ sortOrder: next }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Không cập nhật được thứ tự");
        return;
      }
      await refreshList();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    if (bankSelectionMode === "default" && account.isDefault && account.isActive) {
      toast.error("Không thể tắt tài khoản mặc định — hãy đặt TK khác làm mặc định trước");
      return;
    }

    if (account.isActive && activeCount <= 1) {
      toast.error("Không thể tắt tài khoản active cuối cùng");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        body: JSON.stringify({ isActive: !account.isActive }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(
          data.error === "CANNOT_DEACTIVATE_LAST_ACTIVE"
            ? "Không thể tắt tài khoản active cuối cùng"
            : "Cập nhật trạng thái thất bại",
        );
        return;
      }
      toast.success(account.isActive ? "Đã ẩn tài khoản" : "Đã kích hoạt tài khoản");
      await refreshList();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${deleteId}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(
          data.error === "CANNOT_DELETE_DEFAULT_ACCOUNT"
            ? "Không thể xóa tài khoản mặc định"
            : data.error || "Xóa thất bại",
        );
        return;
      }
      toast.success("Đã xóa tài khoản");
      setDeleteId(null);
      await refreshList();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const isRoundRobin = bankSelectionMode === "round_robin";

  return (
    <div className="space-y-6">
      {/* Header hồng dễ thương */}
      <div className={`
        rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50
        via-rose-50 to-fuchsia-50 p-6
        dark:border-pink-800/50 dark:from-pink-950/40 dark:via-rose-950/30
        dark:to-fuchsia-950/20
      `}>
        <div className={`
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        `}>
          <div className="flex items-start gap-3">
            <div className={`
              rounded-xl bg-pink-100 p-3 text-pink-600
              dark:bg-pink-900/50 dark:text-pink-300
            `}>
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className={`
                text-2xl font-bold text-pink-900
                dark:text-pink-100
              `}>
                Cài đặt hệ thống
              </h1>
              <p className={`
                text-sm text-pink-700/80
                dark:text-pink-300/80
              `}>
                Quản lý tài khoản ngân hàng hiển thị QR cho khách chuyển khoản
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className={`
                border-pink-200 text-pink-700
                hover:bg-pink-50
                dark:border-pink-800 dark:text-pink-300
              `}
              disabled={loading}
              onClick={() => void refreshList()}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`
                mr-2 h-4 w-4
                ${loading ? "animate-spin" : ""}
              `} />
              Làm mới
            </Button>
            <Button
              className={`
                bg-pink-500 text-white shadow-sm
                hover:bg-pink-600
              `}
              onClick={openCreate}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm TK
            </Button>
          </div>
        </div>
      </div>

      {/* Chế độ chọn TK */}
      <div className={`
        rounded-2xl border border-pink-100 bg-white p-5 shadow-sm
        dark:border-pink-900/30 dark:bg-card
      `}>
        <h2 className={`
          mb-3 font-semibold text-pink-900
          dark:text-pink-100
        `}>
          Chế độ chọn tài khoản
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className={`
              flex-1 rounded-xl border px-4 py-3 text-left text-sm transition
              ${!isRoundRobin
                ? "border-pink-400 bg-pink-50 text-pink-900 dark:bg-pink-950/40"
                : "border-pink-100 hover:bg-pink-50/50 dark:border-pink-900/30"}
            `}
            disabled={loading}
            onClick={() => void handleModeChange("default")}
            type="button"
          >
            <div className="font-medium">Mặc định 1 TK</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Mọi đơn/nạp ví mới dùng tài khoản đang gắn sao mặc định
            </div>
          </button>
          <button
            className={`
              flex-1 rounded-xl border px-4 py-3 text-left text-sm transition
              ${isRoundRobin
                ? "border-pink-400 bg-pink-50 text-pink-900 dark:bg-pink-950/40"
                : "border-pink-100 hover:bg-pink-50/50 dark:border-pink-900/30"}
            `}
            disabled={loading}
            onClick={() => void handleModeChange("round_robin")}
            type="button"
          >
            <div className="font-medium">Luân phiên theo đơn</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Mỗi đơn/nạp ví mới gán TK active tiếp theo theo thứ tự (sortOrder)
            </div>
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Đổi chế độ không ảnh hưởng đơn/topup pending đã gắn snapshot TK.
        </p>
      </div>

      {/* Ghi chú SePay */}
      <div className={`
        flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4
        dark:border-amber-800 dark:bg-amber-950/30
      `}>
        <Info className={`
          mt-0.5 h-5 w-5 shrink-0 text-amber-600
          dark:text-amber-400
        `} />
        <div className={`
          text-sm text-amber-800
          dark:text-amber-300
        `}>
          <p className="mb-1 font-medium">Đồng bộ với SePay Dashboard</p>
          {isRoundRobin ? (
            <p>
              Chế độ luân phiên: đăng ký webhook cho{" "}
              <span className="font-semibold">tất cả STK đang Active</span>{" "}
              trên{" "}
              <a
                className="font-semibold underline hover:text-amber-900"
                href="https://my.sepay.vn"
                rel="noopener noreferrer"
                target="_blank"
              >
                SePay Dashboard
              </a>
              . Đơn đã tạo giữ nguyên TK snapshot — đổi mode/default không đổi QR đang chờ thanh toán.
            </p>
          ) : (
            <p>
              Sau khi đổi tài khoản mặc định ở đây, hãy vào{" "}
              <a
                className={`
                  font-semibold underline
                  hover:text-amber-900
                `}
                href="https://my.sepay.vn"
                rel="noopener noreferrer"
                target="_blank"
              >
                SePay Dashboard
              </a>{" "}
              → WebHooks → chọn đúng tài khoản ngân hàng tương ứng. Webhook backend không cần sửa code.
            </p>
          )}
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className={`
        overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm
        dark:border-pink-900/30 dark:bg-card
      `}>
        <div className={`
          border-b border-pink-100 bg-pink-50/50 px-6 py-4
          dark:border-pink-900/30 dark:bg-pink-950/20
        `}>
          <h2 className={`
            flex items-center gap-2 font-semibold text-pink-900
            dark:text-pink-100
          `}>
            <Building2 className="h-5 w-5" />
            Tài khoản ngân hàng
          </h2>
        </div>

        {accounts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto mb-3 h-12 w-12 text-pink-300" />
            <p>Chưa có tài khoản nào. Hãy thêm TP Bank hoặc chạy migration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`
                  border-b border-pink-100 bg-pink-50/30
                  dark:border-pink-900/20
                `}>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Ngân hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Thứ tự
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Mã BIN
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Số TK
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Chủ TK
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Thống kê
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-pink-800 dark:text-pink-200">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-pink-800 dark:text-pink-200">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const rowStats = statsById.get(account.id);
                  return (
                    <tr
                      className={`
                        border-b border-pink-50
                        hover:bg-pink-50/40
                        dark:border-pink-900/10 dark:hover:bg-pink-950/10
                      `}
                      key={account.id}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{account.bankName}</span>
                          {!isRoundRobin && account.isDefault && (
                            <Badge className={`
                              border-pink-200 bg-pink-100 text-pink-700
                              dark:bg-pink-900/40 dark:text-pink-300
                            `}>
                              <Star className="mr-1 h-3 w-3 fill-current" />
                              Mặc định
                            </Badge>
                          )}
                          {isRoundRobin && account.isActive && (
                            <Badge className={`
                              border-sky-200 bg-sky-50 text-sky-700
                              dark:bg-sky-950/40 dark:text-sky-300
                            `} variant="outline">
                              Trong pool
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 w-16 border-pink-200 font-mono text-xs"
                          defaultValue={account.sortOrder}
                          disabled={loading}
                          key={`${account.id}-${account.sortOrder}`}
                          onBlur={(e) =>
                            void handleSortOrderBlur(account, e.target.value)
                          }
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{account.bankCode}</td>
                      <td className="px-4 py-3 font-mono">{account.accountNumber}</td>
                      <td className="px-4 py-3">{account.accountName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {rowStats ? (
                          <div className="space-y-0.5">
                            <div>
                              Đơn: {rowStats.pendingOrders} chờ / {rowStats.paidOrders} paid
                            </div>
                            <div>
                              7d {formatVnd(rowStats.paidOrdersAmount7d)} · 30d{" "}
                              {formatVnd(rowStats.paidOrdersAmount30d)}
                            </div>
                            <div>
                              Topup: {rowStats.pendingTopups} chờ / {rowStats.paidTopups} paid
                            </div>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {account.isActive ? (
                          <Badge className={`
                            border-emerald-300 text-emerald-700
                            dark:text-emerald-400
                          `} variant="outline">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="border-gray-300 text-gray-500" variant="outline">
                            <XCircle className="mr-1 h-3 w-3" />
                            Ẩn
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!isRoundRobin && !account.isDefault && (
                            <Button
                              className={`
                                text-pink-600
                                hover:bg-pink-50 hover:text-pink-700
                              `}
                              disabled={loading}
                              onClick={() => void handleSetDefault(account.id)}
                              size="sm"
                              title="Đặt làm mặc định"
                              variant="ghost"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            disabled={loading}
                            onClick={() => openEdit(account)}
                            size="sm"
                            variant="ghost"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch
                            aria-label="Bật/tắt active"
                            checked={account.isActive}
                            disabled={loading}
                            onCheckedChange={() => void handleToggleActive(account)}
                          />
                          {!account.isDefault && (
                            <Button
                              className={`
                                text-rose-500
                                hover:bg-rose-50 hover:text-rose-600
                              `}
                              disabled={loading}
                              onClick={() => setDeleteId(account.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog thêm/sửa */}
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className={`
          border-pink-200
          sm:max-w-md
          dark:border-pink-800
        `}>
          <DialogHeader>
            <DialogTitle className={`
              text-pink-900
              dark:text-pink-100
            `}>
              {editingId ? "Sửa tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}
            </DialogTitle>
            <DialogDescription>
              Chọn ngân hàng từ danh sách VietQR — mã BIN và tên sẽ tự điền
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="bankSelector">Ngân hàng VietQR</Label>
              <Popover onOpenChange={setBankSearchOpen} open={bankSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    aria-expanded={bankSearchOpen}
                    className={`
                      w-full justify-between border-pink-200 bg-pink-50/50
                      text-left font-normal text-pink-900
                      hover:bg-pink-100/60
                      focus-visible:ring-pink-400
                      dark:border-pink-800 dark:bg-pink-950/30
                      dark:text-pink-100 dark:hover:bg-pink-950/50
                    `}
                    id="bankSelector"
                    role="combobox"
                    type="button"
                    variant="outline"
                  >
                    <span className="truncate">
                      {bankDisplayLabel ?? (
                        <span className="text-muted-foreground">Chọn ngân hàng...</span>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className={`
                    w-[var(--radix-popover-trigger-width)] border-pink-200 p-0
                    dark:border-pink-800
                  `}
                >
                  <Command className={`
                    bg-white
                    dark:bg-card
                  `}>
                    <CommandInput
                      className={`
                        text-pink-900
                        dark:text-pink-100
                      `}
                      onValueChange={setBankSearchTerm}
                      placeholder="Tìm theo tên, mã BIN hoặc mã ngân hàng..."
                      value={bankSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty className={`
                        py-6 text-center text-sm text-muted-foreground
                      `}>
                        Không tìm thấy ngân hàng
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredBanks.map((bank) => (
                          <CommandItem
                            className={`
                              cursor-pointer text-pink-900
                              aria-selected:bg-pink-100
                              dark:text-pink-100
                              dark:aria-selected:bg-pink-950/50
                            `}
                            key={bank.bin}
                            onSelect={() => handleSelectBank(bank.bin)}
                            value={`${bank.code} ${bank.bin} ${bank.name} ${bank.label}`}
                          >
                            <Check
                              className={`
                                mr-2 h-4 w-4 shrink-0 text-pink-500
                                ${form.bankCode === bank.bin ? "opacity-100" : `
                                  opacity-0
                                `}
                              `}
                            />
                            <span className={`
                              font-mono text-xs text-pink-600
                              dark:text-pink-400
                            `}>
                              {bank.bin}
                            </span>
                            <span className="ml-2">{bank.name}</span>
                            <span className={`
                              ml-auto text-xs text-muted-foreground
                            `}>{bank.code}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.bankCode && !selectedBank && (
                <p className={`
                  text-xs text-amber-600
                  dark:text-amber-400
                `}>
                  Ngân hàng hiện tại không có trong danh sách VietQR — hãy chọn lại để cập nhật mã BIN.
                </p>
              )}
              {selectedBank && (
                <p className={`
                  text-xs text-pink-600/80
                  dark:text-pink-400/80
                `}>
                  Đã chọn: <span className="font-medium">{selectedBank.label}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Số tài khoản</Label>
              <Input
                className={`
                  border-pink-200 font-mono
                  focus-visible:ring-pink-400
                `}
                id="accountNumber"
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="00003209087"
                value={form.accountNumber}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Tên chủ tài khoản</Label>
              <Input
                className={`
                  border-pink-200
                  focus-visible:ring-pink-400
                `}
                id="accountName"
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="Phan Le Van Minh"
                value={form.accountName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Thứ tự (sortOrder)</Label>
              <Input
                className="border-pink-200 font-mono focus-visible:ring-pink-400"
                id="sortOrder"
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
                type="number"
                value={form.sortOrder}
              />
              <p className="text-xs text-muted-foreground">
                Dùng cho thứ tự luân phiên (số nhỏ hơn được chọn trước)
              </p>
            </div>
            {!isRoundRobin && (
              <div className={`
                flex items-center justify-between rounded-lg border
                border-pink-100 p-3
                dark:border-pink-900/30
              `}>
                <Label htmlFor="isDefault">Đặt làm mặc định</Label>
                <Switch
                  checked={form.isDefault}
                  id="isDefault"
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setDialogOpen(false)} type="button" variant="outline">
                Hủy
              </Button>
              <Button className={`
                bg-pink-500
                hover:bg-pink-600
              `} disabled={loading} type="submit">
                {loading ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Xác nhận xóa */}
      <AlertDialog onOpenChange={(open) => !open && setDeleteId(null)} open={!!deleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài khoản ngân hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Chỉ xóa được tài khoản không phải mặc định.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={`
                bg-rose-500
                hover:bg-rose-600
              `}
              onClick={() => void handleDelete()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
