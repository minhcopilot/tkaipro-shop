"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, Users, Mail } from "lucide-react";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Textarea } from "~/ui/primitives/textarea";
import { Label } from "~/ui/primitives/label";
import { Badge } from "~/ui/primitives/badge";

interface BulkEmailDialogProps {
  selectedUsers: Array<{ id: string; email: string; name: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMAIL_TEMPLATES = [
  {
    name: "🔥 Google AI mới về",
    subject: "🔥 Google AI đã có hàng - Giảm giá đặc biệt!",
    content: `Chúng tôi vừa nhập lô tài khoản Google AI mới với chất lượng tốt nhất!

✨ Ưu đãi đặc biệt dành cho khách hàng cũ:
• Giảm 10% cho đơn hàng tiếp theo
• Tài khoản ngon, login được ngay
• Hỗ trợ 24/7

⏰ Số lượng có hạn, nhanh tay đặt hàng ngay!

Ghé thăm cửa hàng để xem các sản phẩm mới nhất.`
  },
  {
    name: "🎁 Khuyến mãi đặc biệt",
    subject: "🎁 Khuyến mãi cuối tuần - Giảm 20% tất cả sản phẩm!",
    content: `Chương trình khuyến mãi đặc biệt cuối tuần đã bắt đầu!

🎉 Ưu đãi:
• Giảm 20% tất cả sản phẩm
• Mua 2 tặng 1 cho tài khoản Google AI
• Miễn phí hỗ trợ cài đặt

⏰ Chương trình kết thúc vào Chủ nhật!

Đừng bỏ lỡ cơ hội này nhé!`
  },
  {
    name: "📢 Thông báo quan trọng",
    subject: `📢 Thông báo quan trọng từ ${SEO_CONFIG.name}`,
    content: `Kính gửi quý khách hàng,

Chúng tôi có một số thông báo quan trọng muốn chia sẻ với bạn:

[Nhập nội dung thông báo tại đây]

Cảm ơn bạn đã luôn tin tưởng và ủng hộ ${SEO_CONFIG.name}!`
  }
];

export function BulkEmailDialog({ 
  selectedUsers, 
  onSuccess, 
  onCancel 
}: BulkEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.subject);
    setContent(template.content);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người nhận");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users/bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          content,
          recipients: selectedUsers.map(u => ({
            email: u.email,
            name: u.name
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      toast.success(data.message);
      
      if (data.failedEmails?.length > 0) {
        toast.warning(`Không gửi được đến: ${data.failedEmails.join(", ")}`);
      }

      onSuccess();
    } catch (error) {
      console.error("Send bulk email error:", error);
      toast.error("Có lỗi xảy ra khi gửi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* recipients preview */}
      <div>
        <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
          <Users className="inline h-4 w-4 mr-1" />
          Người nhận ({selectedUsers.length})
        </Label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          {selectedUsers.map((user) => (
            <Badge 
              key={user.id} 
              variant="secondary"
              className="text-xs"
            >
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </Badge>
          ))}
        </div>
      </div>

      {/* templates */}
      <div>
        <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
          Mẫu email nhanh
        </Label>
        <div className="flex flex-wrap gap-2">
          {EMAIL_TEMPLATES.map((template, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTemplateSelect(template)}
              className="text-xs"
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* subject */}
      <div>
        <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300 mb-2 block">
          Tiêu đề email *
        </Label>
        <Input
          id="subject"
          placeholder="Nhập tiêu đề email..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* content */}
      <div>
        <Label htmlFor="content" className="text-gray-700 dark:text-gray-300 mb-2 block">
          Nội dung email *
        </Label>
        <Textarea
          id="content"
          placeholder="Nhập nội dung email..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Nội dung sẽ được format tự động với template đẹp
        </p>
      </div>

      {/* actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="button"
          onClick={handleSend}
          disabled={loading || !subject.trim() || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Gửi {selectedUsers.length} email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

