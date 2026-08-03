"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

interface TransactionRow {
  id: string;
  userId: string;
  currency: "vnd" | "usd";
  type: string;
  amount: number;
  balanceAfter: number;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
  createdBy: { id: string; email: string; name: string } | null;
}

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

export function AdminWalletTransactionsClient() {
  const [items, setItems] = React.useState<TransactionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterUser, setFilterUser] = React.useState("");
  const [filterType, setFilterType] = React.useState("");
  const [filterCurrency, setFilterCurrency] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUser) params.set("userId", filterUser);
      if (filterType) params.set("type", filterType);
      if (filterCurrency) params.set("currency", filterCurrency);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/wallet/transactions?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = (await res.json()) as { items: TransactionRow[] };
      setItems(data.items ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được audit log");
    } finally {
      setLoading(false);
    }
  }, [filterUser, filterType, filterCurrency]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Audit log ví</h1>
        <Button onClick={load} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div>
            <Label className="text-xs">User ID</Label>
            <Input
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Lọc theo userId"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Loại</Label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="topup">Topup</option>
              <option value="debit">Debit</option>
              <option value="refund">Refund</option>
              <option value="admin_adjust">Admin adjust</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="vnd">VND</option>
              <option value="usd">USD</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Không có transaction.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 px-2">Thời gian</th>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Loại</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-right py-2 px-2">Balance after</th>
                <th className="text-left py-2 px-2">Ref</th>
                <th className="text-left py-2 px-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2 text-xs whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    <div className="font-medium truncate max-w-[180px]">
                      {tx.user?.email ?? tx.userId}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className="text-xs uppercase">
                      {tx.type}
                    </Badge>
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-medium ${
                      tx.amount > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatAmount(tx.amount, tx.currency)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatAmount(tx.balanceAfter, tx.currency)}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {tx.refType ? `${tx.refType}/${tx.refId?.slice(0, 8)}…` : "-"}
                  </td>
                  <td className="py-2 px-2 text-xs max-w-[260px] truncate">
                    {tx.note || "-"}
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
