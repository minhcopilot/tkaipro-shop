"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Star, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserOrRedirect } from "~/lib/auth-client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";
import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/primitives/dialog";
import { Textarea } from "~/ui/primitives/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Badge } from "~/ui/primitives/badge";
import { Checkbox } from "~/ui/primitives/checkbox";

interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
  };
  product: {
    name: string;
    image: string | null;
  };
}

const REPLY_TEMPLATES = [
  "Dạ vâng em cảm ơn bạn đã ủng hộ ạ, Hi vọng sẽ có nhiều khách hàng trong tương lai hơn. Có vấn đề gì cứ nhắn mình hỗ trợ nhé ^^!",
  "Cảm ơn bạn đã tin tưởng sử dụng dịch vụ. Chúc bạn code thật hiệu quả ạ!",
  "Dạ shop cảm ơn đánh giá của bạn nhiều ạ. Mong bạn tiếp tục ủng hộ shop nhé <3",
  "Cảm ơn bạn nhiều nha. Nếu cần hỗ trợ gì nhắn tin qua Fanpage để shop hỗ trợ ngay nhé!"
];

export default function AdminReviewsContent() {
  const { user, isPending } = useCurrentUserOrRedirect();
  
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [replyText, setReplyText] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/reviews"); 
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(reviews.map((r) => r.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedReviews((prev) => [...prev, id]);
    } else {
      setSelectedReviews((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedReviews.length} đánh giá đã chọn?`)) return;

    try {
      const res = await fetch("/api/admin/reviews/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids: selectedReviews }),
      });
      
      if (res.ok) {
        toast.success(`Đã xóa ${selectedReviews.length} đánh giá`);
        setSelectedReviews([]);
        fetchReviews();
      } else {
        toast.error("Lỗi khi xóa hàng loạt");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống");
    }
  };

  const handleBatchReply = async () => {
      setIsReplyOpen(true);
      setSelectedReviewId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Đã xóa đánh giá");
        setReviews(reviews.filter((r) => r.id !== id));
      } else {
        toast.error("Không thể xóa đánh giá");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  const handleReplySubmit = async () => {
    setIsSubmitting(true);
    try {
      if (selectedReviewId) {
          const res = await fetch(`/api/admin/reviews/${selectedReviewId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: replyText }),
          });
          if (res.ok) {
            toast.success("Đã trả lời đánh giá");
            fetchReviews();
            setIsReplyOpen(false);
            setReplyText("");
            setSelectedReviewId(null);
          } else {
            toast.error("Lỗi khi trả lời");
          }
      } else if (selectedReviews.length > 0) {
          const res = await fetch("/api/admin/reviews/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reply", ids: selectedReviews, reply: replyText }),
          });

          if (res.ok) {
            toast.success(`Đã trả lời ${selectedReviews.length} đánh giá`);
            fetchReviews();
            setIsReplyOpen(false);
            setReplyText("");
            setSelectedReviews([]);
          } else {
              toast.error("Lỗi khi trả lời hàng loạt");
          }
      }
    } catch (error) {
      toast.error("Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReply = (review: AdminReview) => {
    setSelectedReviewId(review.id);
    setReplyText(review.reply || "");
    setIsReplyOpen(true);
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (user?.role !== "ADMIN") return <div className="p-6">Access Denied</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản Lý Đánh Giá</h1>
        {selectedReviews.length > 0 && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleBatchReply}>
                    Trả lời ({selectedReviews.length})
                </Button>
                <Button variant="destructive" onClick={handleBatchDelete}>
                    Xóa ({selectedReviews.length})
                </Button>
            </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                    checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Chưa có đánh giá nào.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <Checkbox 
                        checked={selectedReviews.includes(review.id)}
                        onCheckedChange={(checked) => handleSelectOne(!!checked, review.id)}
                    />
                  </TableCell>
                    <TableCell className="font-medium">
                    {review.product?.name || "Unknown Product"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={review.user.image || undefined} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span>{review.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                        {review.rating} <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    <div>{review.comment}</div>
                    {review.reply && (
                        <div className="text-xs text-muted-foreground mt-1 text-blue-600">
                             Rep: {review.reply}
                        </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openReply(review)}>
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(review.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{selectedReviewId ? "Trả lời đánh giá" : `Trả lời ${selectedReviews.length} đánh giá đã chọn`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex flex-wrap gap-2 mb-2">
                    {REPLY_TEMPLATES.map((template, i) => (
                        <Badge 
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20 text-xs font-normal max-w-full text-left h-auto py-1 whitespace-normal leading-relaxed"
                            onClick={() => setReplyText(template)}
                        >
                            {template.length > 50 ? `${template.substring(0, 50)}...` : template}
                        </Badge>
                    ))}
                </div>
                <Textarea 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập câu trả lời..."
                    className="min-h-[100px]"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReplyOpen(false)}>Hủy</Button>
                <Button onClick={handleReplySubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Đang gửi..." : "Gửi trả lời"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
