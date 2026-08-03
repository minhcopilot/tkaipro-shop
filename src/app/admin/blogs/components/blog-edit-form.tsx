"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import type { BlogPost } from "~/db/schema/blogs/tables";
import { BLOG_CATEGORIES, BLOG_STATUS } from "~/db/schema/blogs/types";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Textarea } from "~/ui/primitives/textarea";
import { Switch } from "~/ui/primitives/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { ImageUploadField } from "~/app/admin/products/components/image-upload-field";

interface BlogEditFormProps {
  post: BlogPost;
  onSuccess: (updatedPost: BlogPost) => void;
  onCancel: () => void;
}

export function BlogEditForm({ post, onSuccess, onCancel }: BlogEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content,
    category: post.category,
    tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
    featuredImage: post.featuredImage || "",
    status: post.status,
    isFeatured: post.isFeatured,
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    metaKeywords: Array.isArray(post.metaKeywords) ? post.metaKeywords.join(", ") : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.content) {
        toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung");
        return;
      }

      const tagsArray = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const keywordsArray = formData.metaKeywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const payload = {
        postId: post.id,
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        featuredImage: formData.featuredImage || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        metaKeywords: keywordsArray,
        publishedAt: formData.status === "published" && !post.publishedAt 
          ? new Date().toISOString() 
          : undefined,
      };

      const response = await fetch("/api/admin/blogs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update blog post");
      }

      const updatedPost = await response.json() as BlogPost;
      onSuccess(updatedPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      {/* Thông tin cơ bản */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Thông tin cơ bản</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-900 dark:text-gray-100">
            Tiêu đề <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Nhập tiêu đề bài viết"
            required
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-gray-900 dark:text-gray-100">
            Slug (URL)
          </Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="url-slug"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-900 dark:text-gray-100">
              Danh mục
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BLOG_CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-900 dark:text-gray-100">
              Trạng thái
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BLOG_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "draft" ? "Nháp" : status === "published" ? "Đã xuất bản" : "Lưu trữ"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt" className="text-gray-900 dark:text-gray-100">Mô tả ngắn</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
            placeholder="Mô tả ngắn gọn về bài viết"
            rows={2}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-gray-900 dark:text-gray-100">
            Nội dung <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder="Nội dung bài viết..."
            rows={15}
            required
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hỗ trợ: xuống dòng, danh sách (bắt đầu bằng -), code (`code`), URL tự động thành link. Hoặc nhập HTML trực tiếp.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-gray-900 dark:text-gray-100">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Hình ảnh */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Hình ảnh nổi bật</h3>
        
        <ImageUploadField
          value={formData.featuredImage}
          onChange={(value) => handleChange("featuredImage", value)}
          label="Hình ảnh đại diện"
        />
      </div>

      {/* SEO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">SEO</h3>
        
        <div className="space-y-2">
          <Label htmlFor="metaTitle" className="text-gray-900 dark:text-gray-100">Meta Title</Label>
          <Input
            id="metaTitle"
            value={formData.metaTitle}
            onChange={(e) => handleChange("metaTitle", e.target.value)}
            placeholder="Tiêu đề SEO"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaDescription" className="text-gray-900 dark:text-gray-100">Meta Description</Label>
          <Textarea
            id="metaDescription"
            value={formData.metaDescription}
            onChange={(e) => handleChange("metaDescription", e.target.value)}
            placeholder="Mô tả SEO"
            rows={2}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaKeywords" className="text-gray-900 dark:text-gray-100">Meta Keywords</Label>
          <Input
            id="metaKeywords"
            value={formData.metaKeywords}
            onChange={(e) => handleChange("metaKeywords", e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Trạng thái */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tùy chọn</h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => handleChange("isFeatured", checked)}
          />
          <Label htmlFor="isFeatured" className="text-gray-900 dark:text-gray-100">
            Bài viết nổi bật
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {loading ? "Đang cập nhật..." : "Cập nhật bài viết"}
        </Button>
      </div>
    </form>
  );
}

