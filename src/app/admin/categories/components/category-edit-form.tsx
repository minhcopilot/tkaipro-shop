"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Switch } from "@/ui/primitives/switch";
import { DialogFooter } from "@/ui/primitives/dialog";
import { toast } from "sonner";
import { Loader2, Tag, X } from "lucide-react";
import type { ProductCategory } from "~/db/schema/products/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/select";

interface CategoryEditFormProps {
  category: ProductCategory;
  onSuccess: (category: ProductCategory) => void;
  onCancel: () => void;
}

export default function CategoryEditForm({ 
  category, 
  onSuccess, 
  onCancel 
}: CategoryEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    parentId: category.parentId || "",
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive ?? true,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.filter((cat: ProductCategory) => cat.id !== category.id));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [category.id]);

  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9 -]/g, "") // remove special chars
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-") // replace multiple hyphens with single
      .trim();

    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug === category.slug ? slug : prev.slug // only auto-update if slug hasn't been manually changed
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Slug không được để trống");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: category.id,
          ...formData,
        }),
      });

      if (response.ok) {
        const updatedCategory = await response.json() as any;
        onSuccess(updatedCategory);
        toast.success("Đã cập nhật danh mục thành công");
      } else {
        const error = await response.text();
        toast.error(`Không thể cập nhật danh mục: ${error}`);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Có lỗi xảy ra khi cập nhật danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* name field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tên danh mục *
        </Label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ví dụ: Cursor Pro, IDE Tools..."
            required
            className="pl-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* slug field */}
      <div className="space-y-2">
        <Label htmlFor="slug" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Slug *
        </Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="cursor-pro, ide-tools..."
          required
          className="font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          URL-friendly tên danh mục
        </p>
      </div>

      {/* parent category field */}
      <div className="space-y-2">
        <Label htmlFor="parentId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Danh mục cha (tùy chọn)
        </Label>
        <Select
          value={formData.parentId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}
        >
          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            <SelectValue placeholder="Không có (danh mục gốc)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Không có (danh mục gốc)</SelectItem>
            {categories
              .filter(cat => !cat.parentId)
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chọn danh mục cha nếu đây là danh mục con
        </p>
      </div>

      {/* description field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mô tả
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả chi tiết về danh mục này..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* sort order field */}
      <div className="space-y-2">
        <Label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Thứ tự sắp xếp
        </Label>
        <Input
          id="sortOrder"
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
          min={0}
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Số thứ tự hiển thị (0 = đầu tiên)
        </p>
      </div>

      {/* status toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Trạng thái hoạt động
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Danh mục có thể được sử dụng hay không
          </p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, isActive: checked }))
          }
        />
      </div>

      <DialogFooter className="gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            "Cập nhật"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
} 