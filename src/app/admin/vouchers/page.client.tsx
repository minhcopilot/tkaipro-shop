"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Ticket,
  Search,
  History,
  Ban,
  Copy,
  Check,
  RefreshCw,
  ScrollText,
  Package,
} from "lucide-react";

import type {
  AffiliateVoucher,
  AffiliateVoucherAuditLog,
  AffiliateVoucherRedemption,
} from "~/db/schema/affiliate-voucher/types";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Badge } from "~/ui/primitives/badge";
import { Switch } from "~/ui/primitives/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface AffiliateOption {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
}

// Type for vouchers list returned by listVouchers — bao gồm product info + owner info join sẵn
type VoucherWithProduct = AffiliateVoucher & {
  productName: string | null;
  productImage: string | null;
  productPrice: number | null;
  ownerEmail: string | null;
  ownerName: string | null;
};

interface CreateForm {
  isPublic: boolean;
  ownerUserId: string;
  ownerSearch: string;
  productId: string;
  note: string;
  discountValue: number;
  maxUses: number;
  bulkCount: number;
  validFrom: string;
  validUntil: string;
}

const emptyForm: CreateForm = {
  isPublic: false,
  ownerUserId: "",
  ownerSearch: "",
  productId: "",
  note: "",
  discountValue: 0,
  maxUses: 1,
  bulkCount: 1,
  validFrom: "",
  validUntil: "",
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Đang dùng
        </Badge>
      );
    case "disabled":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Đã tắt
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          Hết hạn
        </Badge>
      );
    case "used_up":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Hết lượt
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface Props {
  initialVouchers: VoucherWithProduct[];
}

export default function VouchersClient({ initialVouchers }: Props) {
  const [vouchers, setVouchers] =
    useState<VoucherWithProduct[]>(initialVouchers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [redemptionVoucher, setRedemptionVoucher] =
    useState<VoucherWithProduct | null>(null);
  const [redemptions, setRedemptions] = useState<AffiliateVoucherRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  const [confirmDisable, setConfirmDisable] =
    useState<VoucherWithProduct | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AffiliateVoucherAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const reload = async (s = search, st = statusFilter) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (s.trim()) qs.set("search", s.trim());
      if (st !== "all") qs.set("status", st);
      const res = await fetch(`/api/admin/vouchers?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { vouchers: VoucherWithProduct[] };
      setVouchers(data.vouchers);
    } catch {
      toast.error("Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  };

  // Load affiliates + products khi mở dialog tạo voucher
  useEffect(() => {
    if (!showCreate) return;
    fetch("/api/admin/vouchers/affiliates")
      .then((r) => r.json() as Promise<{ affiliates: AffiliateOption[] }>)
      .then((d) => setAffiliates(d.affiliates))
      .catch(() => {
        /* ignore */
      });
    fetch("/api/admin/vouchers/products")
      .then((r) => r.json() as Promise<{ products: ProductOption[] }>)
      .then((d) => setProducts(d.products))
      .catch(() => {
        /* ignore */
      });
  }, [showCreate]);

  const searchAffiliates = async (q: string) => {
    try {
      const qs = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/admin/vouchers/affiliates${qs}`);
      const data = (await res.json()) as { affiliates: AffiliateOption[] };
      setAffiliates(data.affiliates);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.isPublic && !form.ownerUserId) {
      toast.error(
        "Vui lòng chọn CTV (hoặc bật 'Voucher công khai' để cấp cho khách thường)",
      );
      return;
    }
    if (!form.productId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    if (form.discountValue <= 0) {
      toast.error("Số tiền giảm phải > 0 VND");
      return;
    }
    const selectedProduct = products.find((p) => p.id === form.productId);
    if (selectedProduct && form.discountValue >= selectedProduct.price) {
      const ok = window.confirm(
        `Số tiền giảm (${formatVND(
          form.discountValue,
        )}) >= giá sản phẩm (${formatVND(
          selectedProduct.price,
        )}). CTV sẽ mua gần như miễn phí. Bạn có chắc?`,
      );
      if (!ok) return;
    }
    setCreating(true);
    try {
      const payload = {
        ownerUserId: form.isPublic ? null : form.ownerUserId,
        isPublic: form.isPublic,
        note: form.note || null,
        discountType: "fixed" as const,
        discountValue: Math.round(form.discountValue),
        maxUses: Math.max(1, Math.round(form.maxUses)),
        bulkCount: Math.max(1, Math.round(form.bulkCount)),
        allowedProductIds: [form.productId],
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
      };
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || "Tạo voucher thất bại");
      }
      const data = (await res.json()) as {
        vouchers: AffiliateVoucher[];
        count: number;
      };
      // Map about-to-add vouchers với product + owner info từ form (UI hiển thị ngay)
      const selectedAffiliate = form.isPublic
        ? null
        : affiliates.find((a) => a.id === form.ownerUserId);
      const enriched: VoucherWithProduct[] = data.vouchers.map((v) => ({
        ...v,
        productName: selectedProduct?.name ?? null,
        productImage: selectedProduct?.image ?? null,
        productPrice: selectedProduct?.price ?? null,
        ownerEmail: selectedAffiliate?.email ?? null,
        ownerName: selectedAffiliate?.name ?? null,
      }));
      setVouchers((prev) => [...enriched, ...prev]);
      toast.success(`Đã tạo ${data.count} voucher`);
      setShowCreate(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (v: VoucherWithProduct) => {
    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "disabled",
          disabledReason: "Admin disable from UI",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { voucher: AffiliateVoucher };
      setVouchers((prev) =>
        prev.map((x) =>
          x.id === v.id
            ? {
                ...data.voucher,
                productName: x.productName,
                productImage: x.productImage,
                productPrice: x.productPrice,
                ownerEmail: x.ownerEmail,
                ownerName: x.ownerName,
              }
            : x,
        ),
      );
      toast.success("Đã tắt voucher");
    } catch {
      toast.error("Không thể tắt voucher");
    } finally {
      setConfirmDisable(null);
    }
  };

  const handleReactivate = async (v: VoucherWithProduct) => {
    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { voucher: AffiliateVoucher };
      setVouchers((prev) =>
        prev.map((x) =>
          x.id === v.id
            ? {
                ...data.voucher,
                productName: x.productName,
                productImage: x.productImage,
                productPrice: x.productPrice,
                ownerEmail: x.ownerEmail,
                ownerName: x.ownerName,
              }
            : x,
        ),
      );
      toast.success("Đã kích hoạt lại voucher");
    } catch {
      toast.error("Không thể kích hoạt lại");
    }
  };

  const handleViewRedemptions = async (v: VoucherWithProduct) => {
    setRedemptionVoucher(v);
    setLoadingRedemptions(true);
    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}/redemptions`);
      const data = (await res.json()) as {
        redemptions: AffiliateVoucherRedemption[];
      };
      setRedemptions(data.redemptions);
    } catch {
      toast.error("Không thể tải log redemption");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleViewAuditLog = async () => {
    setShowAuditLog(true);
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/vouchers/audit-log");
      const data = (await res.json()) as { logs: AffiliateVoucherAuditLog[] };
      setAuditLogs(data.logs);
    } catch {
      toast.error("Không thể tải audit log");
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Đã copy mã");
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.status === "active").length,
    used: vouchers.reduce((s, v) => s + v.usedCount, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Ticket className="h-8 w-8 text-purple-600" />
            Voucher CTV
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Cấp & quản lý voucher giảm giá cho cộng tác viên. Mọi hành động được
            ghi lại trong audit log.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewAuditLog}>
            <ScrollText className="h-4 w-4 mr-2" />
            Audit log
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setShowCreate(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Cấp voucher
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng voucher</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Đang dùng được</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng lượt redeem</div>
          <div className="text-2xl font-bold text-purple-600">{stats.used}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo code hoặc note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") reload(search, statusFilter);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            reload(search, v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang dùng</SelectItem>
            <SelectItem value="disabled">Đã tắt</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
            <SelectItem value="used_up">Hết lượt</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => reload(search, statusFilter)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* List */}
      {vouchers.length === 0 ? (
        <div className="text-center py-20 px-4">
          <Ticket className="mx-auto h-16 w-16 text-purple-300" />
          <h3 className="mt-4 text-xl font-bold">Chưa có voucher nào</h3>
          <p className="mt-2 text-muted-foreground">Cấp voucher đầu tiên để bắt đầu</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b">
                <th className="text-left px-4 py-3 text-sm font-semibold">Code</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">CTV</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Sản phẩm</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Số tiền giảm</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">Lượt dùng</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Hiệu lực</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">Trạng thái</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vouchers.map((v) => {
                const isCopied = copiedCode === v.code;
                return (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono">
                          {v.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleCopy(v.code)}
                        >
                          {isCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      {v.note && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[260px]">
                          {v.note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {v.ownerUserId ? (
                        <div className="min-w-0">
                          <div className="mb-0.5 inline-flex items-center gap-1">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              CTV
                            </Badge>
                          </div>
                          {v.ownerName && (
                            <div
                              className="font-medium truncate max-w-[200px]"
                              title={v.ownerName}
                            >
                              {v.ownerName}
                            </div>
                          )}
                          {v.ownerEmail ? (
                            <div
                              className="text-xs text-muted-foreground truncate max-w-[200px]"
                              title={v.ownerEmail}
                            >
                              {v.ownerEmail}
                            </div>
                          ) : (
                            <code className="text-xs text-muted-foreground">
                              {v.ownerUserId.slice(0, 12)}…
                            </code>
                          )}
                        </div>
                      ) : (
                        <div>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Công khai
                          </Badge>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Khách thường dùng được
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {v.productName ? (
                        <div className="flex items-center gap-2">
                          {v.productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.productImage}
                              alt={v.productName}
                              className="h-8 w-8 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div
                              className="font-medium truncate max-w-[180px]"
                              title={v.productName}
                            >
                              {v.productName}
                            </div>
                            {v.productPrice !== null && (
                              <div className="text-xs text-muted-foreground">
                                Giá web: {formatVND(v.productPrice)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          (không xác định)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        -{formatVND(v.discountValue)}
                      </strong>
                      {v.productPrice !== null && (
                        <div className="text-xs text-muted-foreground">
                          CTV trả: {formatVND(
                            Math.max(0, v.productPrice - v.discountValue),
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-sm">
                        {v.usedCount}/{v.maxUses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {v.validFrom && <div>Từ: {formatDate(v.validFrom)}</div>}
                      {v.validUntil && <div>Đến: {formatDate(v.validUntil)}</div>}
                      {!v.validFrom && !v.validUntil && <div>Không giới hạn</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(v.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRedemptions(v)}
                          title="Xem log redemption"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {v.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDisable(v)}
                            title="Tắt voucher"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : v.status === "disabled" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(v)}
                            title="Kích hoạt lại"
                            className="text-green-600 hover:text-green-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấp voucher</DialogTitle>
            <DialogDescription>
              Chọn loại voucher: dành riêng cho 1 CTV (bind theo user) hoặc
              công khai cho khách thường (ai có code đều dùng được). Mỗi voucher
              áp dụng cho 1 sản phẩm với mức giảm cố định (VND).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {/* Loại voucher: CTV vs Công khai */}
            <div className="rounded-lg border-2 bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label className="text-sm font-semibold">
                    Voucher công khai (cho khách thường)
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Bật để bất kỳ khách hàng nào nhập đúng code đều dùng được
                    — không bind CTV. Tắt để chỉ định 1 CTV cụ thể.
                  </p>
                </div>
                <Switch
                  checked={form.isPublic}
                  onCheckedChange={(c) =>
                    setForm((p) => ({
                      ...p,
                      isPublic: c,
                      ownerUserId: c ? "" : p.ownerUserId,
                      ownerSearch: c ? "" : p.ownerSearch,
                    }))
                  }
                />
              </div>
              {form.isPublic && (
                <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✅ Mã sẽ có prefix <code>SHOP-</code>, không gắn CTV. Mọi
                  khách hàng đều dùng được trong giới hạn lượt + thời hạn.
                </div>
              )}
            </div>

            {/* Owner CTV — chỉ hiện khi không phải public */}
            {!form.isPublic && (
              <div className="space-y-2">
                <Label>
                  CTV sở hữu <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Tìm CTV theo email hoặc tên..."
                  value={form.ownerSearch}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, ownerSearch: e.target.value }));
                    searchAffiliates(e.target.value);
                  }}
                />
                {affiliates.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                    {affiliates.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            ownerUserId: a.id,
                            ownerSearch: `${a.name} <${a.email}>`,
                          }))
                        }
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm ${
                          form.ownerUserId === a.id
                            ? "bg-purple-50 dark:bg-purple-900/30"
                            : ""
                        }`}
                      >
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.email}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {form.ownerUserId && (
                  <Badge variant="outline" className="gap-1">
                    Đã chọn:
                    <code className="ml-1 text-xs">
                      {form.ownerUserId.slice(0, 12)}…
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          ownerUserId: "",
                          ownerSearch: "",
                        }))
                      }
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  Chỉ user có role <code>AFFILIATE</code> mới chọn được. Voucher
                  tự động bind cho user này — chỉ họ checkout mới redeem được.
                </p>
              </div>
            )}

            {/* Product */}
            <div className="space-y-2 pt-2 border-t">
              <Label>
                Sản phẩm áp dụng <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm((p) => ({ ...p, productId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm voucher áp dụng..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {products.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Chưa có sản phẩm nào
                    </div>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatVND(p.price)})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.productId && (() => {
                const sel = products.find((x) => x.id === form.productId);
                if (!sel) return null;
                const finalPrice = Math.max(0, sel.price - form.discountValue);
                return (
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 text-sm">
                    Giá web: <strong>{formatVND(sel.price)}</strong> → Sau giảm:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {formatVND(finalPrice)}
                    </strong>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>Số tiền giảm (VND) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                step={1000}
                value={form.discountValue || ""}
                placeholder="VD: 20000"
                onChange={(e) =>
                  setForm((p) => ({ ...p, discountValue: Number(e.target.value) }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Voucher giảm trực tiếp số tiền này khỏi giá sản phẩm khi CTV
                checkout.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú nội bộ</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="VD: Cấp ngày 06/05 cho CTV Anh"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-2">
                <Label>Số lượt dùng tối đa / voucher</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxUses: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tạo hàng loạt (số voucher giống nhau)</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={form.bulkCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bulkCount: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Có hiệu lực từ (tuỳ chọn)</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hết hạn (tuỳ chọn)</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                Hủy
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Đang tạo..." : `Tạo ${form.bulkCount > 1 ? `${form.bulkCount} ` : ""}voucher`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Redemption log */}
      <Dialog open={!!redemptionVoucher} onOpenChange={(o) => !o && setRedemptionVoucher(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lịch sử dùng voucher{" "}
              <code className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {redemptionVoucher?.code}
              </code>
            </DialogTitle>
          </DialogHeader>
          {loadingRedemptions ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : redemptions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Chưa có ai dùng voucher này</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-3 py-2">Thời gian</th>
                    <th className="text-left px-3 py-2">Email khách</th>
                    <th className="text-left px-3 py-2">Order ID</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                    <th className="text-right px-3 py-2">Giảm</th>
                    <th className="text-left px-3 py-2">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {redemptions.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-xs">{formatDate(r.redeemedAt)}</td>
                      <td className="px-3 py-2">{r.customerEmail}</td>
                      <td className="px-3 py-2">
                        <code className="text-xs">{r.orderId.slice(0, 12)}…</code>
                      </td>
                      <td className="px-3 py-2 text-right">{formatVND(r.subtotalAtRedemption)}</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                        -{formatVND(r.discountApplied)}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{r.ipAddress || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit log */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit log voucher</DialogTitle>
            <DialogDescription>200 hành động gần nhất do admin thực hiện</DialogDescription>
          </DialogHeader>
          {loadingAudit ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Chưa có log nào</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                    <code className="ml-auto text-xs">admin: {log.adminId.slice(0, 12)}…</code>
                  </div>
                  {log.voucherId && (
                    <div className="text-xs text-muted-foreground mb-1">
                      Voucher: <code>{log.voucherId.slice(0, 12)}…</code>
                    </div>
                  )}
                  {log.diff && (
                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.diff, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm disable */}
      <AlertDialog open={!!confirmDisable} onOpenChange={(o) => !o && setConfirmDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tắt voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                {confirmDisable?.code}
              </code>{" "}
              sẽ không thể dùng được nữa. Bạn có thể kích hoạt lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDisable && handleDisable(confirmDisable)}
              className="bg-red-600 hover:bg-red-700"
            >
              Tắt voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
