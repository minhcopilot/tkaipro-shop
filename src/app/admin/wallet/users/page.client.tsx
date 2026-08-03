"use client";

import * as React from "react";
import { Loader2, RefreshCw, Search, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Textarea } from "~/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Badge } from "~/ui/primitives/badge";

type SortKey = "recent_topup" | "highest_balance" | "most_topup";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  vndBalance: number;
  usdBalance: number;
  createdAt: string;
}

const formatVnd = (v: number) =>
  v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatUsd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export function AdminWalletUsersClient() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent_topup");

  const load = React.useCallback(
    async (q?: string, sortKey?: SortKey) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/wallet/users?q=${encodeURIComponent(q ?? "")}&sort=${sortKey ?? sort}&limit=100`,
        );
        const data = (await res.json()) as { users: UserRow[] };
        setUsers(data.users ?? []);
      } finally {
        setLoading(false);
      }
    },
    [sort],
  );

  React.useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Số dư ví user
        </h1>
        <Button onClick={() => load(search)} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(search);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Tìm theo email, name, userId..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Tìm
            </Button>
            <Select
              value={sort}
              onValueChange={(v) => {
                const next = v as SortKey;
                setSort(next);
                load(search, next);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent_topup">Nạp gần đây nhất</SelectItem>
                <SelectItem value="highest_balance">Số dư cao nhất</SelectItem>
                <SelectItem value="most_topup">Tổng nạp nhiều nhất</SelectItem>
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Không có user nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 px-2">User</th>
                <th className="text-right py-2 px-2">VND balance</th>
                <th className="text-right py-2 px-2">USD balance</th>
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-right py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2">
                    <div className="font-medium truncate max-w-[300px]">{u.email}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.name} · {u.id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {formatVnd(u.vndBalance)}
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {formatUsd(u.usdBalance)}
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant="outline">{u.role}</Badge>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <AdjustDialog user={u} onSuccess={() => load(search)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdjustDialog({
  user,
  onSuccess,
}: {
  user: UserRow;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [currency, setCurrency] = React.useState<"vnd" | "usd">("vnd");
  const [delta, setDelta] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let deltaToSend: number;
    if (currency === "usd") {
      // USD cho phép số lẻ (vd 12.5 → 1250 cents). Tối đa 2 chữ số thập phân.
      const v = parseFloat(delta);
      if (!Number.isFinite(v) || v === 0) {
        toast.error("Số tiền USD phải là số khác 0");
        return;
      }
      if (Math.round(v * 100) !== v * 100) {
        toast.error("USD tối đa 2 chữ số thập phân");
        return;
      }
      deltaToSend = Math.round(v * 100);
    } else {
      // VND giữ nguyên yêu cầu số nguyên (1:1).
      const deltaNum = Number(delta);
      if (!Number.isInteger(deltaNum) || deltaNum === 0) {
        toast.error("Delta phải là số nguyên khác 0");
        return;
      }
      deltaToSend = deltaNum;
    }
    if (!note.trim()) {
      toast.error("Phải nhập note");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/wallet/users/${user.id}/adjust`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency, delta: deltaToSend, note: note.trim() }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Adjust failed");
        return;
      }
      toast.success("Đã điều chỉnh số dư");
      setOpen(false);
      setDelta("");
      setNote("");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Điều chỉnh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Điều chỉnh số dư: {user.email}</DialogTitle>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label>Currency</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant={currency === "vnd" ? "default" : "outline"}
                onClick={() => setCurrency("vnd")}
              >
                VND
              </Button>
              <Button
                type="button"
                size="sm"
                variant={currency === "usd" ? "default" : "outline"}
                onClick={() => setCurrency("usd")}
              >
                USD
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Số dư hiện tại:{" "}
              {currency === "vnd"
                ? formatVnd(user.vndBalance)
                : formatUsd(user.usdBalance)}
            </p>
          </div>
          <div>
            <Label>
              {currency === "usd"
                ? "Số tiền USD (cho phép số lẻ, vd 12.5; dương = cộng, âm = trừ)"
                : "Số tiền VND (số nguyên, dương = cộng, âm = trừ)"}
            </Label>
            <Input
              type="number"
              step={currency === "usd" ? "0.01" : "1"}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder={currency === "vnd" ? "vd: 100000 hoặc -50000" : "vd: 12.5 (=$12.5) hoặc -50"}
              required
            />
          </div>
          <div>
            <Label>Ghi chú (bắt buộc, lưu vào audit log)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="vd: Refund đơn ORD123 cancel"
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Xác nhận
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
