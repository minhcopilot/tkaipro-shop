"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Crown, RefreshCw } from "lucide-react";

import { Button } from "~/ui/primitives/button";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

interface TopSpender {
  customerEmail: string;
  customerName: string;
  userId: string | null;
  totalSpent: number;
  orderCount: number;
  quantity?: number;
}

interface TopSpenderRow extends TopSpender {
  rank: number;
}

function formatFullVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

export default function TopSpendersClient() {
  const [spenders, setSpenders] = useState<TopSpender[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [limit, setLimit] = useState<string>("50");
  const [productOptions, setProductOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/admin/products?limit=200&includeHidden=true",
        );
        const data = (await res.json()) as {
          products?: Array<{ id: string; name: string }>;
        };
        if (!cancelled && Array.isArray(data?.products)) {
          setProductOptions(
            data.products.map((p) => ({ id: p.id, name: p.name })),
          );
        }
      } catch {
        // product filter is optional UX
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSpenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit,
      });
      if (productFilter !== "all") {
        params.set("productId", productFilter);
      }

      const response = await fetch(
        `/api/admin/stats/top-spenders?${params.toString()}`,
      );
      const data = (await response.json()) as {
        spenders?: TopSpender[];
        error?: string;
      };

      if (response.ok) {
        setSpenders(data.spenders ?? []);
      } else {
        toast.error(data.error || "Lỗi tải top chi tiêu");
      }
    } catch (error) {
      console.error("Error fetching top spenders:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [productFilter, limit]);

  useEffect(() => {
    void fetchSpenders();
  }, [fetchSpenders]);

  const rows: TopSpenderRow[] = useMemo(
    () => spenders.map((s, index) => ({ ...s, rank: index + 1 })),
    [spenders],
  );

  const showQuantity = productFilter !== "all";

  const columns: ColumnDef<TopSpenderRow>[] = useMemo(() => {
    const cols: ColumnDef<TopSpenderRow>[] = [
      {
        accessorKey: "rank",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hạng" />
        ),
        cell: ({ row }) => (
          <div className="font-semibold tabular-nums w-10">
            {row.original.rank}
          </div>
        ),
      },
      {
        accessorKey: "customerEmail",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.customerEmail}</div>
        ),
      },
      {
        accessorKey: "customerName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tên" />
        ),
        cell: ({ row }) => (
          <div>{row.original.customerName || "—"}</div>
        ),
      },
      {
        accessorKey: "userId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User ID" />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
            {row.original.userId || "—"}
          </div>
        ),
      },
      {
        accessorKey: "orderCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Số đơn" />
        ),
        cell: ({ row }) => (
          <div className="tabular-nums">{row.original.orderCount}</div>
        ),
      },
      {
        accessorKey: "totalSpent",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng chi (VND)" />
        ),
        cell: ({ row }) => (
          <div className="font-semibold tabular-nums">
            {formatFullVND(row.original.totalSpent)}
          </div>
        ),
      },
    ];

    if (showQuantity) {
      cols.push({
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="SL" />
        ),
        cell: ({ row }) => (
          <div className="tabular-nums">{row.original.quantity ?? 0}</div>
        ),
      });
    }

    return cols;
  }, [showQuantity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Top chi tiêu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Khách hàng chi tiêu nhiều nhất (chỉ đơn đã thanh toán)
          </p>
        </div>

        <Button
          onClick={() => void fetchSpenders()}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả sản phẩm</SelectItem>
            {productOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger>
            <SelectValue placeholder="Giới hạn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">Top 20</SelectItem>
            <SelectItem value="50">Top 50</SelectItem>
            <SelectItem value="100">Top 100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        hidePagination={true}
        initialPageSize={100}
      />

      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chưa có dữ liệu chi tiêu phù hợp bộ lọc.
        </p>
      )}
    </div>
  );
}
