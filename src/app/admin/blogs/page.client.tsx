"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  FileText, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Tag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "~/db/schema/blogs/tables";

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

import { BlogCreateForm } from "./components/blog-create-form";
import { BlogEditForm } from "./components/blog-edit-form";
import { BlogDeleteDialog } from "./components/blog-delete-dialog";

interface AdminBlogsClientProps {
  initialPosts: BlogPost[];
  initialTotal: number;
}

export default function AdminBlogsClient({ 
  initialPosts, 
  initialTotal
}: AdminBlogsClientProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 50));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // load posts với search và pagination
  const loadPosts = useCallback(async (searchTerm = "", pageNum = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/blogs?search=${encodeURIComponent(searchTerm)}&page=${pageNum}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error("Failed to load blog posts");
      }

      const data = await response.json() as { posts: BlogPost[]; total: number; totalPages: number };
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.ceil(data.total / 50));
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading blog posts:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, []);

  // xử lý search
  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    loadPosts(searchTerm, 1);
  }, [loadPosts]);

  // refresh data
  const handleRefresh = useCallback(() => {
    loadPosts(search, page);
  }, [loadPosts, search, page]);

  // actions
  const handleCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  }, []);

  // format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Chưa xuất bản";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // columns definition
  const columns = useMemo((): ColumnDef<BlogPost>[] => [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tiêu đề" />
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-3">
            {post.featuredImage ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Image 
                  src={post.featuredImage} 
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{post.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {post.slug}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Danh mục" />
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <Badge variant="outline" className="font-medium">
            <Tag className="mr-1 h-3 w-3" />
            {post.category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => {
        const post = row.original;
        const statusColors = {
          draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
        return (
          <Badge className={`font-medium ${statusColors[post.status as keyof typeof statusColors] || statusColors.draft}`}>
            {post.status === "draft" ? "Nháp" : post.status === "published" ? "Đã xuất bản" : "Lưu trữ"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "publishedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày xuất bản" />
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </div>
        );
      },
    },
    {
      accessorKey: "authorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tác giả" />
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4" />
            {post.authorName || "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-1">
            {post.status === "published" && (
              <Link href={`/blog/${post.slug}`} target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Xem bài viết"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(post)}
              title="Chỉnh sửa"
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(post)}
              title="Xóa"
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Quản lý blog</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tổng cộng {total} bài viết
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Tạo bài viết
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DataTable 
          columns={columns} 
          data={posts}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Trang {page} / {totalPages} (Tổng {total} bài viết)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPosts(search, page - 1)}
              disabled={page === 1 || loading}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPosts(search, page + 1)}
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
            <DialogTitle className="text-gray-900 dark:text-gray-100">Tạo bài viết mới</DialogTitle>
          </DialogHeader>
          <BlogCreateForm
            onSuccess={(newPost) => {
              setPosts(prev => [newPost, ...prev]);
              setTotal(prev => prev + 1);
              setCreateDialogOpen(false);
              toast.success("Tạo bài viết thành công");
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Chỉnh sửa bài viết</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <BlogEditForm
              post={selectedPost}
              onSuccess={(updatedPost: BlogPost) => {
                setPosts(prev => prev.map(p => 
                  p.id === updatedPost.id ? updatedPost : p
                ));
                setEditDialogOpen(false);
                toast.success("Cập nhật bài viết thành công");
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
            <DialogTitle className="text-gray-900 dark:text-gray-100">Xóa bài viết</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <BlogDeleteDialog
              post={selectedPost}
              onSuccess={() => {
                setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
                setTotal(prev => prev - 1);
                setDeleteDialogOpen(false);
                toast.success("Xóa bài viết thành công");
              }}
              onCancel={() => setDeleteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

