"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  Search,
  RefreshCw,
  ShoppingCart,
  Tag,
  Shield,
  Bot,
  Filter,
  ArchiveX,
  RotateCcw,
  Check,
  ChevronsUpDown,
  Loader2,
  XCircle,
  Wand2,
  Square,
  CheckSquare,
} from "lucide-react";
import Image from "next/image";

import type { ProductWithCategory, ProductCategory } from "~/db/schema/products/types";

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/ui/primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/ui/primitives/popover";
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

import { ProductCreateForm } from "./components/product-create-form";
import { ProductEditForm } from "./components/product-edit-form";
import { ProductDeleteDialog } from "./components/product-delete-dialog";
import { ProductStatusSelect } from "./components/product-status-select";
import { ProductCredentialsManager } from "./components/product-credentials-manager";

interface AdminProductsClientProps {
  initialProducts: ProductWithCategory[];
  initialTotal: number;
  categories: ProductCategory[];
}

const PRODUCTS_PER_PAGE = 50;

export default function AdminProductsClient({ 
  initialProducts, 
  initialTotal,
  categories
}: AdminProductsClientProps) {
  // find default Cursor Pro category
  const defaultCategory = categories.find(c => 
    c.slug === "cursor-pro" || c.name.toLowerCase().includes("cursor pro")
  );
  
  const [products, setProducts] = useState<ProductWithCategory[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / PRODUCTS_PER_PAGE));
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(defaultCategory?.id ?? "all");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // active, inactive, draft, deleted, all
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // load products với search, category filter, status filter và pagination
  const loadProducts = useCallback(async (searchTerm = "", pageNum = 1, category = "all", status = "active") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: String(pageNum),
        limit: String(PRODUCTS_PER_PAGE),
      });
      
      if (category && category !== "all") {
        params.set("category", category);
      }

      // xử lý status filter
      if (status === "deleted") {
        params.set("includeDeleted", "true");
        params.set("status", "deleted");
      } else if (status === "all") {
        params.set("includeDeleted", "true");
      } else if (status && status !== "all") {
        params.set("status", status);
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json() as { products: ProductWithCategory[]; total: number; totalPages: number };
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.ceil(data.total / PRODUCTS_PER_PAGE));
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);

  // xử lý search
  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    loadProducts(searchTerm, 1, categoryFilter, statusFilter);
  }, [loadProducts, categoryFilter, statusFilter]);

  // xử lý category filter
  const handleCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category);
    loadProducts(search, 1, category, statusFilter);
  }, [loadProducts, search, statusFilter]);

  // xử lý status filter
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    loadProducts(search, 1, categoryFilter, status);
  }, [loadProducts, search, categoryFilter]);

  // refresh data
  const handleRefresh = useCallback(() => {
    loadProducts(search, page, categoryFilter, statusFilter);
  }, [loadProducts, search, page, categoryFilter, statusFilter]);

  // refresh chatbot cache
  const [refreshingChatbot, setRefreshingChatbot] = useState(false);
  const handleRefreshChatbot = useCallback(async () => {
    setRefreshingChatbot(true);
    try {
      const response = await fetch("/api/admin/chat-cache", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to refresh chatbot cache");
      }

      const data = await response.json() as { productCount: number; categoryCount: number };
      toast.success(`Đã cập nhật chatbot: ${data.productCount} sản phẩm, ${data.categoryCount} danh mục`);
    } catch (error) {
      console.error("Error refreshing chatbot cache:", error);
      toast.error("Không thể cập nhật chatbot");
    } finally {
      setRefreshingChatbot(false);
    }
  }, []);

  // actions
  const handleCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = useCallback((product: ProductWithCategory) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((product: ProductWithCategory) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleCredentials = useCallback((product: ProductWithCategory) => {
    setSelectedProduct(product);
    setCredentialsDialogOpen(true);
  }, []);

  // ====== Bulk select + AI refresh description ======
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [refreshingDescIds, setRefreshingDescIds] = useState<Set<string>>(new Set());
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const bulkAbortRef = useRef(false);

  // Confirm dialog dùng AlertDialog (thay native browser confirm() — đồng bộ dark theme).
  type ConfirmTarget =
    | { kind: "single"; product: ProductWithCategory }
    | { kind: "bulk"; ids: string[] };
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      products.forEach((p) => {
        if (p.status !== "deleted") next.add(p.id);
      });
      return next;
    });
  }, [products]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // AI refresh cho 1 sản phẩm — auto-apply ngay vào DB.
  // Trả true nếu thành công.
  const refreshDescriptionOne = useCallback(async (productId: string): Promise<boolean> => {
    setRefreshingDescIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
    try {
      const res = await fetch("/api/admin/products/refresh-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, autoApply: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI refresh thất bại");
      }
      const data = await res.json() as {
        shortDescription: string;
        description: string;
        features?: string[];
      };
      // optimistic update locally — không cần refetch full list cho mỗi item.
      // Chỉ ghi đè features nếu API thực sự trả về list (≥1 item) — tránh xoá
      // sạch features cũ trên UI khi AI bỏ trống mảng.
      setProducts((prev) => prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              shortDescription: data.shortDescription,
              description: data.description,
              ...(Array.isArray(data.features) && data.features.length > 0
                ? { features: data.features }
                : {}),
            }
          : p,
      ));
      return true;
    } catch (error) {
      console.error("[refresh-description] error:", error);
      const msg = error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(`Refresh thất bại: ${msg}`);
      return false;
    } finally {
      setRefreshingDescIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, []);

  // Click trigger → mở confirm dialog (không chạy ngay).
  const handleSingleRefresh = useCallback((product: ProductWithCategory) => {
    if (refreshingDescIds.has(product.id)) return;
    setConfirmTarget({ kind: "single", product });
  }, [refreshingDescIds]);

  const handleBulkRefresh = useCallback(() => {
    const ids = Array.from(selectedIds).filter((id) => {
      const p = products.find((pp) => pp.id === id);
      return p && p.status !== "deleted";
    });
    if (ids.length === 0) {
      toast.error("Chưa chọn sản phẩm nào");
      return;
    }
    setConfirmTarget({ kind: "bulk", ids });
  }, [selectedIds, products]);

  // Người dùng bấm "Xác nhận" trong AlertDialog → chạy real action.
  const runConfirmedAction = useCallback(async () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null); // close dialog ngay để UI không treo trong khi chạy

    if (target.kind === "single") {
      const product = target.product;
      const ok = await refreshDescriptionOne(product.id);
      if (ok) toast.success(`Đã cập nhật mô tả: "${product.name}"`);
      return;
    }

    // bulk
    const ids = target.ids;
    bulkAbortRef.current = false;
    setBulkRefreshing(true);
    setBulkProgress({ current: 0, total: ids.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      if (bulkAbortRef.current) break;
      const id = ids[i];
      const ok = await refreshDescriptionOne(id);
      if (ok) success++;
      else failed++;
      setBulkProgress({ current: i + 1, total: ids.length, success, failed });
    }

    setBulkRefreshing(false);
    if (bulkAbortRef.current) {
      toast(`Đã dừng. ✓${success} ✗${failed} (xử lý ${success + failed}/${ids.length})`, { icon: "⏹️" });
    } else {
      toast.success(`Hoàn tất AI refresh: ✓${success} ✗${failed}`);
    }
    setBulkProgress(null);
    setSelectedIds(new Set());
  }, [confirmTarget, refreshDescriptionOne]);

  // toggle nhanh trạng thái Còn hàng / Hết hàng (optimistic update)
  const [togglingStockIds, setTogglingStockIds] = useState<Set<string>>(new Set());
  const handleToggleInStock = useCallback(async (product: ProductWithCategory) => {
    if (togglingStockIds.has(product.id)) return;

    const nextValue = !product.inStock;
    setTogglingStockIds(prev => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: nextValue } : p));

    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, inStock: nextValue }),
      });

      if (!response.ok) throw new Error("Failed to toggle stock");

      toast.success(nextValue ? `"${product.name}" → Còn hàng` : `"${product.name}" → Hết hàng`);
    } catch (error) {
      console.error("Error toggling inStock:", error);
      // rollback
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: product.inStock } : p));
      toast.error("Không thể đổi trạng thái kho");
    } finally {
      setTogglingStockIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  }, [togglingStockIds]);

  // khôi phục sản phẩm đã xóa
  const handleRestore = useCallback(async (product: ProductWithCategory) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          status: "active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore product");
      }

      // remove from current list (since it's no longer deleted)
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setTotal(prev => prev - 1);
      toast.success(`Đã khôi phục sản phẩm "${product.name}"`);
    } catch (error) {
      console.error("Error restoring product:", error);
      toast.error("Không thể khôi phục sản phẩm");
    }
  }, []);

  // format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // columns definition
  const columns = useMemo((): ColumnDef<ProductWithCategory>[] => [
    {
      id: "select",
      header: () => {
        const visibleIds = products.filter((p) => p.status !== "deleted").map((p) => p.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
        return (
          <button
            type="button"
            onClick={() => allSelected ? clearSelection() : selectAllVisible()}
            className="flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả trên trang này"}
          >
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        if (product.status === "deleted") return null;
        const checked = selectedIds.has(product.id);
        return (
          <button
            type="button"
            onClick={() => toggleSelect(product.id)}
            className={`flex items-center justify-center ${checked ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500 hover:text-purple-500"}`}
            title={checked ? "Bỏ chọn" : "Chọn để bulk action"}
          >
            {checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
        );
      },
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sản phẩm" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            {product.image ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {product.id}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "inStock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const isDeleted = product.status === "deleted";
        
        if (isDeleted) {
          return (
            <Badge variant="destructive" className="font-medium">
              <ArchiveX className="mr-1 h-3 w-3" />
              Đã xóa
            </Badge>
          );
        }

        const isToggling = togglingStockIds.has(product.id);
        return (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleToggleInStock(product)}
              disabled={isToggling}
              title={product.inStock ? "Click để đánh dấu Hết hàng" : "Click để đánh dấu Còn hàng"}
              className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 ${
                product.inStock
                  ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/40 hover:bg-emerald-500/25 hover:ring-emerald-500/70 dark:text-emerald-300"
                  : "bg-rose-500/15 text-rose-700 ring-rose-500/40 hover:bg-rose-500/25 hover:ring-rose-500/70 dark:text-rose-300"
              }`}
            >
              {isToggling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : product.inStock ? (
                <ShoppingCart className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {product.inStock ? "Còn hàng" : "Hết hàng"}
            </button>
            <ProductStatusSelect 
              product={product}
              onStatusChange={(updatedProduct) => {
                setProducts(prev => prev.map(p => 
                  p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
                ));
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "accountCredentials",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tài khoản" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const credentialCount = product.accountCredentials?.length || 0;
        return (
          <Badge
            variant={credentialCount > 0 ? "default" : "secondary"}
            className={`font-medium whitespace-nowrap ${credentialCount === 0 ? "text-red-600 dark:text-red-400" : ""}`}
            title={credentialCount === 0 ? "Chưa có tài khoản nào — bấm icon Shield ở cột Thao tác để thêm" : `${credentialCount} tài khoản đã thêm`}
          >
            {credentialCount} tài khoản
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const product = row.original;
        const isDeleted = product.status === "deleted";

        // Compact icon button: 28x28, no extra padding, để 4 nút action không bị tràn cột.
        const iconBtn = "h-7 w-7 p-0 flex-shrink-0";

        // nếu sản phẩm đã xóa, hiển thị nút khôi phục
        if (isDeleted) {
          return (
            <div className="flex items-center gap-0.5 whitespace-nowrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(product)}
                title="Khôi phục sản phẩm"
                className={`${iconBtn} text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(product)}
                title="Xem chi tiết"
                className={`${iconBtn} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        }

        const isRefreshing = refreshingDescIds.has(product.id);
        return (
          <div className="flex items-center gap-0.5 whitespace-nowrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSingleRefresh(product)}
              disabled={isRefreshing}
              title="Tạo lại mô tả bằng AI (auto-apply ngay)"
              className={`${iconBtn} text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCredentials(product)}
              title="Quản lý tài khoản"
              className={`${iconBtn} text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(product)}
              title="Chỉnh sửa"
              className={`${iconBtn} hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(product)}
              title="Xóa"
              className={`${iconBtn} text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete, handleCredentials, handleRestore, handleToggleInStock, handleSingleRefresh, togglingStockIds, refreshingDescIds, selectedIds, products, toggleSelect, selectAllVisible, clearSelection]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tổng cộng {total} sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefreshChatbot} 
            disabled={refreshingChatbot}
            variant="outline"
            className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
            title="Cập nhật dữ liệu cho AI Chatbot"
          >
            <Bot className={`mr-2 h-4 w-4 ${refreshingChatbot ? 'animate-pulse' : ''}`} />
            Cập nhật Chatbot
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        {/* Category Filter - Searchable */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categorySearchOpen}
                className="w-[220px] justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              >
                {categoryFilter === "all" 
                  ? "Tất cả danh mục" 
                  : categories.find(c => c.id === categoryFilter)?.name ?? "Chọn danh mục"
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Command>
                <CommandInput 
                  placeholder="Tìm danh mục..." 
                  value={categorySearchTerm}
                  onValueChange={setCategorySearchTerm}
                  className="text-gray-900 dark:text-gray-100"
                />
                <CommandList>
                  <CommandEmpty>Không tìm thấy danh mục</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        handleCategoryFilter("all");
                        setCategorySearchOpen(false);
                        setCategorySearchTerm("");
                      }}
                      className="text-gray-900 dark:text-gray-100"
                    >
                      <Check 
                        className={`mr-2 h-4 w-4 ${categoryFilter === "all" ? "opacity-100" : "opacity-0"}`}
                      />
                      Tất cả danh mục
                    </CommandItem>
                    {categories
                      .filter(category => 
                        category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                      )
                      .map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            handleCategoryFilter(category.id);
                            setCategorySearchOpen(false);
                            setCategorySearchTerm("");
                          }}
                          className="text-gray-900 dark:text-gray-100"
                        >
                          <Check 
                            className={`mr-2 h-4 w-4 ${categoryFilter === category.id ? "opacity-100" : "opacity-0"}`}
                          />
                          {category.name}
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="active" className="text-gray-900 dark:text-gray-100">
                🟢 Đang bán
              </SelectItem>
              <SelectItem value="inactive" className="text-gray-900 dark:text-gray-100">
                🟡 Tạm ngừng
              </SelectItem>
              <SelectItem value="draft" className="text-gray-900 dark:text-gray-100">
                📝 Nháp
              </SelectItem>
              <SelectItem value="deleted" className="text-gray-900 dark:text-gray-100">
                🗑️ Đã xóa
              </SelectItem>
              <SelectItem value="all" className="text-gray-900 dark:text-gray-100">
                📋 Tất cả
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions toolbar — chỉ hiện khi có chọn hoặc đang chạy */}
        {(selectedIds.size > 0 || bulkRefreshing) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
            <span className="text-sm text-purple-900 dark:text-purple-200 font-medium">
              {bulkRefreshing && bulkProgress
                ? `${bulkProgress.current}/${bulkProgress.total} (✓${bulkProgress.success} ✗${bulkProgress.failed})`
                : `Đã chọn ${selectedIds.size}`}
            </span>
            {bulkRefreshing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { bulkAbortRef.current = true; }}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                Dừng
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleBulkRefresh}
                  className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                  title="Tạo lại mô tả bằng AI cho các sản phẩm đã chọn"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Tạo lại mô tả AI ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  className="text-purple-700 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/40"
                >
                  Bỏ chọn
                </Button>
              </>
            )}
          </div>
        )}

        {/* Active filter indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {categoryFilter !== "all" && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => handleCategoryFilter("all")}
            >
              {categories.find(c => c.id === categoryFilter)?.name}
              <span className="ml-1 text-gray-500">×</span>
            </Badge>
          )}
          {statusFilter === "deleted" && (
            <Badge 
              variant="destructive" 
              className="cursor-pointer"
              onClick={() => handleStatusFilter("active")}
            >
              <ArchiveX className="mr-1 h-3 w-3" />
              Đang xem sản phẩm đã xóa
              <span className="ml-1">×</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DataTable 
          columns={columns} 
          data={products}
          initialPageSize={PRODUCTS_PER_PAGE}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Trang {page} / {totalPages} (Tổng {total} sản phẩm)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts(search, page - 1, categoryFilter, statusFilter)}
              disabled={page === 1 || loading}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts(search, page + 1, categoryFilter, statusFilter)}
              disabled={page === totalPages || loading}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <ProductCreateForm
            categories={categories}
            onSuccess={(newProduct) => {
              setProducts(prev => [newProduct, ...prev]);
              setTotal(prev => prev + 1);
              setCreateDialogOpen(false);
              toast.success("Tạo sản phẩm thành công");
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Chỉnh sửa sản phẩm</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductEditForm
              product={selectedProduct}
              categories={categories}
              onSuccess={(updatedProduct: ProductWithCategory) => {
                setProducts(prev => prev.map(p => 
                  p.id === updatedProduct.id ? updatedProduct : p
                ));
                setEditDialogOpen(false);
                toast.success("Cập nhật sản phẩm thành công");
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Xóa sản phẩm</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductDeleteDialog
              product={selectedProduct}
              onSuccess={() => {
                setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
                setTotal(prev => prev - 1);
                setDeleteDialogOpen(false);
                toast.success("Xóa sản phẩm thành công");
              }}
              onCancel={() => setDeleteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Management Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Quản lý tài khoản - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductCredentialsManager
              product={selectedProduct}
              onUpdate={(updatedProduct: ProductWithCategory) => {
                setProducts(prev => prev.map(p => 
                  p.id === updatedProduct.id ? updatedProduct : p
                ));
                setSelectedProduct(updatedProduct);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Refresh Description — Confirm Dialog (single + bulk) */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Wand2 className="h-5 w-5 text-purple-500" />
              {confirmTarget?.kind === "bulk"
                ? `Tạo lại mô tả AI cho ${confirmTarget.ids.length} sản phẩm`
                : "Tạo lại mô tả AI"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400 space-y-2">
              {confirmTarget?.kind === "single" && (
                <>
                  <span className="block">
                    Sản phẩm: <strong className="text-gray-900 dark:text-gray-100">{confirmTarget.product.name}</strong>
                  </span>
                  <span className="block text-amber-600 dark:text-amber-400">
                    ⚠️ Mô tả CŨ sẽ bị ghi đè ngay trong DB. Mô tả mới được AI sinh dựa trên tính năng 05/2026.
                  </span>
                </>
              )}
              {confirmTarget?.kind === "bulk" && (
                <>
                  <span className="block">
                    AI sẽ chạy <strong className="text-gray-900 dark:text-gray-100">tuần tự</strong> cho từng sản phẩm,
                    ước tính ~{Math.ceil(confirmTarget.ids.length * 5 / 60)} phút (~5s/sản phẩm).
                  </span>
                  <span className="block text-amber-600 dark:text-amber-400">
                    ⚠️ Mô tả CŨ sẽ bị ghi đè ngay trong DB. Có thể bấm Dừng giữa chừng để abort.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmedAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Wand2 className="h-4 w-4 mr-1.5" />
              {confirmTarget?.kind === "bulk"
                ? `Bắt đầu (${confirmTarget.ids.length})`
                : "Tạo lại"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 