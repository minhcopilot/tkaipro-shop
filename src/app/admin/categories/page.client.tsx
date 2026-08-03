"use client";

import { useState } from "react";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { DataTable } from "@/ui/primitives/data-table/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/primitives/dialog";
import { Switch } from "@/ui/primitives/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/primitives/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Tag,
  Hash,
  Bot,
  Filter
} from "lucide-react";
import type { ProductCategory } from "~/db/schema/products/types";
import CategoryCreateForm from "./components/category-create-form";
import CategoryEditForm from "./components/category-edit-form";
import CategoryDeleteDialog from "./components/category-delete-dialog";

interface CategoriesPageClientProps {
  initialCategories: ProductCategory[];
}

export default function CategoriesPageClient({
  initialCategories,
}: CategoriesPageClientProps) {
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [refreshingChatbot, setRefreshingChatbot] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // sắp xếp categories để hiển thị parent trước, sau đó là children
  const sortedCategories = [...categories].sort((a, b) => {
    // nếu a là parent của b, a đứng trước
    if (b.parentId === a.id) return -1;
    if (a.parentId === b.id) return 1;
    
    // nếu cả hai đều là parent (không có parentId)
    if (!a.parentId && !b.parentId) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    
    // nếu chỉ a là parent
    if (!a.parentId) return -1;
    if (!b.parentId) return 1;
    
    // nếu cả hai đều là children, so sánh parentId
    if (a.parentId !== b.parentId) {
      return a.parentId!.localeCompare(b.parentId!);
    }
    
    // nếu cùng parent, sort theo sortOrder
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  // filter categories based on search and status
  const filteredCategories = sortedCategories.filter((category) => {
    // filter theo status
    if (statusFilter === "active" && !category.isActive) return false;
    if (statusFilter === "inactive" && category.isActive) return false;
    
    // filter theo search
    if (searchTerm) {
      return (
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const refreshCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "GET",
      });

      if (response.ok) {
        const updatedCategories = await response.json() as ProductCategory[];
        setCategories(updatedCategories);
        toast.success("Đã cập nhật danh sách danh mục");
      } else {
        toast.error("Không thể cập nhật danh sách danh mục");
      }
    } catch (error) {
      console.error("Error refreshing categories:", error);
      toast.error("Có lỗi xảy ra khi cập nhật danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshChatbot = async () => {
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
  };

  const handleCategoryCreated = (newCategory: ProductCategory) => {
    setCategories(prev => [newCategory, ...prev]);
    setShowCreateDialog(false);
    toast.success(`Đã tạo danh mục "${newCategory.name}"`);
  };

  const handleCategoryUpdated = (updatedCategory: ProductCategory) => {
    setCategories(prev => prev.map(category => 
      category.id === updatedCategory.id ? updatedCategory : category
    ));
    setEditingCategory(null);
    toast.success(`Đã cập nhật danh mục "${updatedCategory.name}"`);
  };

  const handleCategoryDeleted = (deletedId: string) => {
    const deletedCategory = categories.find(c => c.id === deletedId);
    setCategories(prev => prev.filter(category => category.id !== deletedId));
    setDeletingCategory(null);
    toast.success(`Đã xóa danh mục "${deletedCategory?.name}"`);
  };

  const handleToggleStatus = async (category: ProductCategory) => {
    setTogglingStatus(category.id);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          isActive: !category.isActive,
        }),
      });

      if (response.ok) {
        const updatedCategory = await response.json() as ProductCategory;
        setCategories(prev => prev.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
        ));
        toast.success(
          updatedCategory.isActive 
            ? `Đã kích hoạt "${category.name}"` 
            : `Đã tắt "${category.name}"`
        );
      } else {
        toast.error("Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setTogglingStatus(null);
    }
  };

  const getCategoryParentName = (category: ProductCategory) => {
    if (!category.parentId) return null;
    const parent = categories.find(c => c.id === category.parentId);
    return parent?.name;
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Tên danh mục",
      cell: ({ row }: { row: any }) => {
        const category: ProductCategory = row.original;
        const parentName = getCategoryParentName(category);
        const isSubCategory = !!category.parentId;
        
        return (
          <div className="flex items-center space-x-2">
            {isSubCategory && <span className="text-gray-400 ml-4">└─</span>}
            <Tag className={`h-4 w-4 ${isSubCategory ? 'text-gray-400' : 'text-blue-500'}`} />
            <div>
              <div className={`font-medium ${isSubCategory ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                {category.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {category.slug}
                {parentName && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                    ↳ {parentName}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }: { row: any }) => {
        const category: ProductCategory = row.original;
        return (
          <div className="max-w-[300px] truncate text-gray-600 dark:text-gray-300">
            {category.description || "Không có mô tả"}
          </div>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Thứ tự",
      cell: ({ row }: { row: any }) => {
        const category: ProductCategory = row.original;
        return (
          <div className="flex items-center space-x-1">
            <Hash className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
              {category.sortOrder ?? 0}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }: { row: any }) => {
        const category: ProductCategory = row.original;
        const isToggling = togglingStatus === category.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={category.isActive}
              onCheckedChange={() => handleToggleStatus(category)}
              disabled={isToggling}
              className="data-[state=checked]:bg-green-500"
            />
            <span className={`text-sm ${category.isActive ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
              {isToggling ? "..." : category.isActive ? "Bật" : "Tắt"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }: { row: any }) => {
        const category: ProductCategory = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingCategory(category)}
              className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingCategory(category)}
              className="h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* action bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
            <SelectTrigger className="w-[160px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang bật</SelectItem>
              <SelectItem value="inactive">Đang tắt</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshCategories}
            disabled={isLoading}
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshChatbot}
            disabled={refreshingChatbot}
            className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
            title="Cập nhật dữ liệu cho AI Chatbot"
          >
            <Bot className={`h-4 w-4 mr-2 ${refreshingChatbot ? 'animate-pulse' : ''}`} />
            Cập nhật Chatbot
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Tạo danh mục mới</DialogTitle>
            </DialogHeader>
            <CategoryCreateForm onSuccess={handleCategoryCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* data table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {filteredCategories.length} / {categories.length} danh mục
          </span>
          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Xem tất cả
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={filteredCategories}
        />
      </div>

      {/* edit dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Chỉnh sửa danh mục</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryEditForm 
              category={editingCategory}
              onSuccess={handleCategoryUpdated}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* delete dialog */}
      {deletingCategory && (
        <CategoryDeleteDialog
          category={deletingCategory}
          onSuccess={handleCategoryDeleted}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
} 