"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Key, 
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import type { License } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Badge } from "~/ui/primitives/badge";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { LicenseGenerateForm } from "./components/license-generate-form";
import { LicenseDetailsModal } from "./components/license-details-modal";
import { LicenseDeleteDialog } from "./components/license-delete-dialog";

interface AdminLicensesClientProps {
  initialLicenses: License[];
  initialTotal: number;
}

export default function AdminLicensesClient({ 
  initialLicenses, 
  initialTotal
}: AdminLicensesClientProps) {
  const [licenses, setLicenses] = useState<License[]>(initialLicenses);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadLicenses = useCallback(async (searchTerm = "", status = "", pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: status,
        page: pageNum.toString(),
        limit: "50",
      });

      const response = await fetch(`/api/admin/licenses?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to load licenses");
      }

      const data = await response.json();
      setLicenses(data.licenses);
      setTotal(data.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading licenses:", error);
      toast.error("Không thể tải danh sách licenses");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    loadLicenses(searchTerm, statusFilter, 1);
  }, [loadLicenses, statusFilter]);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    loadLicenses(search, status, 1);
  }, [loadLicenses, search]);

  const handleRefresh = useCallback(() => {
    loadLicenses(search, statusFilter, page);
  }, [loadLicenses, search, statusFilter, page]);

  const handleViewDetails = useCallback((license: License) => {
    setSelectedLicense(license);
    setDetailsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((license: License) => {
    setSelectedLicense(license);
    setDeleteDialogOpen(true);
  }, []);

  const handleCopyLicense = useCallback(async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      toast.success("Đã copy license key vào clipboard");
    } catch (error) {
      toast.error("Không thể copy license key");
    }
  }, []);

  const columns = useMemo<ColumnDef<License>[]>(
    () => [
      {
        accessorKey: "productName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sản phẩm" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{row.original.productName}</div>
              <div className="text-xs text-muted-foreground">{row.original.licenseName}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "assigneeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Người được gán" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.assigneeName || <span className="text-muted-foreground">Chưa gán</span>}
          </div>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hết hạn" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {new Date(row.original.expiryDate).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-xs text-muted-foreground">
              ({row.original.duration} năm)
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Trạng thái" />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const isUsed = row.original.isUsed;
          
          return (
            <div className="flex gap-2">
              <Badge variant={
                status === "active" ? "default" :
                status === "expired" ? "destructive" :
                "secondary"
              }>
                {status === "active" ? "Hoạt động" :
                 status === "expired" ? "Hết hạn" :
                 status === "revoked" ? "Thu hồi" : status}
              </Badge>
              {isUsed && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Đã dùng
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ngày tạo" />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLicense(row.original.licenseKey)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewDetails, handleDelete, handleCopyLicense]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý License Keys</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý license keys cho JetBrains IDE
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo License Mới
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo sản phẩm, tên license..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
            <SelectItem value="revoked">Thu hồi</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={licenses}
        loading={loading}
      />

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo License Key Mới</DialogTitle>
          </DialogHeader>
          <LicenseGenerateForm
            onSuccess={() => {
              setGenerateDialogOpen(false);
              handleRefresh();
            }}
            onCancel={() => setGenerateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedLicense && (
        <>
          <LicenseDetailsModal
            license={selectedLicense}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            onUpdate={handleRefresh}
          />
          <LicenseDeleteDialog
            license={selectedLicense}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
} 