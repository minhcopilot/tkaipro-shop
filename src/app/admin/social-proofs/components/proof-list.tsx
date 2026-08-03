"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Star, Edit, Trash2, Plus } from "lucide-react";

import type { SocialProof } from "~/db/schema";
import { PROOF_PLATFORMS, PROOF_PRODUCT_TYPES } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
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
import { Badge } from "~/ui/primitives/badge";

import { ProofForm } from "./proof-form";

interface ProofListProps {
  initialProofs: SocialProof[];
}

const platformLabels: Record<string, string> = {
  [PROOF_PLATFORMS.WEBSITE]: "Website",
  [PROOF_PLATFORMS.TELEGRAM]: "Telegram",
  [PROOF_PLATFORMS.FACEBOOK]: "Facebook",
};

const productTypeLabels: Record<string, string> = {
  [PROOF_PRODUCT_TYPES.CURSOR_PRO]: "Cursor Pro",
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL]: "Cursor Pro chính chủ 1 tháng",
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K]: "Cấp tài khoản Cursor chính hãng giá 239k",
  [PROOF_PRODUCT_TYPES.GITHUB_COPILOT]: "GitHub Copilot + Education Pack",
  [PROOF_PRODUCT_TYPES.FIGMA_PRO]: "Figma Pro",
  [PROOF_PRODUCT_TYPES.JETBRAINS_EDU]: "JetBrains EDU",
};

export function ProofList({ initialProofs }: ProofListProps) {
  const [proofs, setProofs] = useState<SocialProof[]>(initialProofs);
  const [selectedProof, setSelectedProof] = useState<SocialProof | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [proofToDelete, setProofToDelete] = useState<SocialProof | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setSelectedProof(null);
    setIsCreating(true);
    setShowDialog(true);
  };

  const handleEdit = (proof: SocialProof) => {
    setSelectedProof(proof);
    setIsCreating(false);
    setShowDialog(true);
  };

  const handleDelete = async (proof: SocialProof) => {
    try {
      const response = await fetch(`/api/admin/social-proofs/${proof.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete proof");
      }

      setProofs(prev => prev.filter(p => p.id !== proof.id));
      toast.success("Xóa minh chứng thành công");
    } catch (error) {
      console.error("Error deleting proof:", error);
      toast.error("Không thể xóa minh chứng");
    } finally {
      setShowDeleteAlert(false);
      setProofToDelete(null);
    }
  };

  const handleSuccess = (proof: SocialProof) => {
    if (isCreating) {
      setProofs(prev => [proof, ...prev]);
    } else {
      setProofs(prev => prev.map(p => p.id === proof.id ? proof : p));
    }
    setShowDialog(false);
    setSelectedProof(null);
  };

  const handleToggleFeatured = async (proof: SocialProof) => {
    try {
      const newFeaturedStatus = !proof.isFeatured;
      const response = await fetch(`/api/admin/social-proofs/${proof.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFeatured: newFeaturedStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update featured status");
      }

      const data = await response.json() as { proof: SocialProof };
      
      // cập nhật và sắp xếp lại danh sách: isFeatured DESC, displayOrder DESC, createdAt DESC
      setProofs(prev => {
        const updated = prev.map(p => p.id === proof.id ? data.proof : p);
        return updated.sort((a, b) => {
          // sắp xếp theo isFeatured (true trước false)
          if (a.isFeatured !== b.isFeatured) {
            return a.isFeatured ? -1 : 1;
          }
          // sau đó theo displayOrder (số lớn hơn trước)
          const orderA = parseInt(a.displayOrder || "0", 10);
          const orderB = parseInt(b.displayOrder || "0", 10);
          if (orderA !== orderB) {
            return orderB - orderA;
          }
          // cuối cùng theo createdAt (mới hơn trước)
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      });
      
      toast.success(newFeaturedStatus ? "Đã ghim đơn hàng nổi bật" : "Đã bỏ ghim đơn hàng");
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Không thể cập nhật trạng thái nổi bật");
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            ✅ Quản lý minh chứng đơn hàng
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload và quản lý minh chứng đơn hàng thành công - Xây dựng lòng tin với khách hàng
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm minh chứng
        </Button>
      </div>

      {/* stats summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng minh chứng</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{proofs.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Đang hiển thị</div>
          <div className="text-2xl font-bold text-green-600">{proofs.filter(p => p.isActive).length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Nổi bật</div>
          <div className="text-2xl font-bold text-yellow-600">{proofs.filter(p => p.isFeatured).length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Đã ẩn</div>
          <div className="text-2xl font-bold text-gray-500">{proofs.filter(p => !p.isActive).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group"
          >
            <div className="relative">
              <img
                src={proof.imageUrl}
                alt={proof.title}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 flex gap-2">
                {proof.isFeatured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Nổi bật
                  </Badge>
                )}
                {proof.isActive ? (
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
                    <Eye className="h-3 w-3 mr-1" />
                    Hiển thị
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0 shadow-lg">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Đã ẩn
                  </Badge>
                )}
              </div>
              {!proof.isActive && (
                <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-lg font-bold">Đã ẩn</span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {proof.title}
              </h3>

              {proof.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {proof.description}
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700">
                  💎 {productTypeLabels[proof.productType] || proof.productType}
                </Badge>
              </div>

              {proof.orderNumber && (
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <span className="font-medium">🔖 Mã ĐH:</span> 
                  <span className="font-mono text-xs">{proof.orderNumber}</span>
                </div>
              )}

              {proof.amount && (
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span>💰</span> {proof.amount}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>🕐</span>
                {formatDate(proof.orderDate || proof.createdAt)}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant={proof.isFeatured ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${
                    proof.isFeatured 
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0" 
                      : "hover:bg-yellow-50 hover:border-yellow-400 dark:hover:bg-yellow-900/30"
                  }`}
                  onClick={() => handleToggleFeatured(proof)}
                  title={proof.isFeatured ? "Bỏ ghim nổi bật" : "Ghim nổi bật"}
                >
                  <Star className={`h-4 w-4 mr-1 ${proof.isFeatured ? "fill-white" : ""}`} />
                  {proof.isFeatured ? "Đã ghim" : "Ghim"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-900/30"
                  onClick={() => handleEdit(proof)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setProofToDelete(proof);
                    setShowDeleteAlert(true);
                  }}
                  className="hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {proofs.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
              <Plus className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Chưa có minh chứng nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Bắt đầu xây dựng lòng tin với khách hàng bằng cách thêm minh chứng đơn hàng đầu tiên!
              </p>
            </div>
            <Button 
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Thêm minh chứng đầu tiên
            </Button>
          </div>
        </div>
      )}

      {/* dialog form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden p-0">
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {isCreating ? "✨ Thêm minh chứng mới" : "✏️ Chỉnh sửa minh chứng"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {isCreating 
                  ? "Chỉ cần chọn sản phẩm, upload ảnh và điền thông tin đơn hàng. Hỗ trợ drag & drop và paste ảnh (Ctrl+V)!"
                  : "Cập nhật thông tin minh chứng đơn hàng"
                }
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <ProofForm
              proof={selectedProof || undefined}
              onSuccess={handleSuccess}
              onCancel={() => setShowDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* delete confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa minh chứng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => proofToDelete && handleDelete(proofToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

