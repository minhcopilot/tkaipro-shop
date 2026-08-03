"use client";

import * as React from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Textarea } from "~/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";

interface AdminTopup {
  id: string;
  userId: string;
  currency: "vnd" | "usd";
  amount: number;
  method: "sepay" | "crypto";
  cryptoMethodId: string | null;
  status: string;
  transferContent: string;
  proofImageUrl: string | null;
  rejectedReason: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string;
  user: { id: string; email: string; name: string } | null;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "outline" as const;
    case "pending_review":
      return "secondary" as const;
    case "paid":
      return "default" as const;
    case "expired":
    case "rejected":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const formatAmount = (amount: number, currency: "vnd" | "usd") => {
  if (currency === "vnd") {
    return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  }
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};

export function AdminWalletTopupsClient() {
  const [statusFilter, setStatusFilter] = React.useState<string>("pending_review");
  const [topups, setTopups] = React.useState<AdminTopup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/wallet/topups?status=${encodeURIComponent(statusFilter)}&limit=200`,
      );
      if (!res.ok) throw new Error("Fetch failed");
      const data = (await res.json()) as { topups: AdminTopup[] };
      setTopups(data.topups ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onApprove = async (id: string) => {
    if (!confirm("Xác nhận duyệt yêu cầu nạp này? (sẽ credit vào ví user ngay)")) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/wallet/topups/${id}/approve`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Duyệt thất bại");
        return;
      }
      toast.success("Đã duyệt và credit ví thành công");
      load();
    } finally {
      setProcessingId(null);
    }
  };

  const onReject = async (id: string) => {
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/wallet/topups/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Từ chối thất bại");
        return;
      }
      toast.success("Đã từ chối yêu cầu");
      setRejectingId(null);
      setRejectReason("");
      load();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Yêu cầu nạp ví</h1>
        <Button onClick={load} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { v: "pending_review", l: "Chờ duyệt" },
          { v: "pending", l: "Chưa nộp proof" },
          { v: "paid", l: "Đã credit" },
          { v: "rejected", l: "Đã từ chối" },
          { v: "expired", l: "Hết hạn" },
          { v: "all", l: "Tất cả" },
        ].map((s) => (
          <Button
            key={s.v}
            variant={statusFilter === s.v ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s.v)}
          >
            {s.l}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Đang tải...
        </p>
      ) : topups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Không có yêu cầu nào.
        </p>
      ) : (
        <div className="grid gap-3">
          {topups.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="font-mono text-sm">{t.transferContent}</span>
                    <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                  </CardTitle>
                  <span className="text-lg font-bold">
                    {formatAmount(t.amount, t.currency)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="truncate font-medium">
                      {t.user?.email ?? t.userId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium">
                      {t.method}
                      {t.cryptoMethodId ? ` (${t.cryptoMethodId})` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {new Date(t.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {t.proofImageUrl && (
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Xem proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogTitle>Biên lai chuyển khoản</DialogTitle>
                        <img
                          src={t.proofImageUrl}
                          alt="proof"
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                    <a
                      href={t.proofImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate"
                    >
                      {t.proofImageUrl}
                    </a>
                  </div>
                )}

                {t.rejectedReason && (
                  <div className="rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-300">
                    Reason: {t.rejectedReason}
                  </div>
                )}

                {/* Actions for pending_review */}
                {t.status === "pending_review" && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => onApprove(t.id)}
                      disabled={processingId === t.id}
                      className="gap-1"
                    >
                      {processingId === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Duyệt
                    </Button>

                    {rejectingId === t.id ? (
                      <div className="flex flex-col gap-2 flex-1 min-w-[300px]">
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Lý do từ chối..."
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(t.id)}
                            disabled={processingId === t.id || !rejectReason.trim()}
                          >
                            Xác nhận từ chối
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectingId(t.id);
                          setRejectReason("");
                        }}
                        className="gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Từ chối
                      </Button>
                    )}
                  </div>
                )}

                {/* Action for pending (chưa nộp proof) — nạp nhanh thẳng */}
                {t.status === "pending" && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => onApprove(t.id)}
                      disabled={processingId === t.id}
                      className="gap-1"
                    >
                      {processingId === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Nạp nhanh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
