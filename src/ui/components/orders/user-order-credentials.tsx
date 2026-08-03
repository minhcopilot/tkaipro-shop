"use client";

import { Copy, Download, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

import { SEO_CONFIG } from "~/app";
import type { AssignedCredential } from "~/db/schema/orders/tables";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Badge } from "~/ui/primitives/badge";
import { Separator } from "~/ui/primitives/separator";

interface UserOrderCredentialsProps {
  credentials: AssignedCredential[];
  orderNumber: string;
  customerEmail?: string;
}

/**
 * SECURITY (sau su co lo tai khoan): web CHI hien thi ten dang nhap/tai khoan.
 * Mat khau KHONG con hien thi tren web va KHONG nam trong response API nua —
 * khach nhan mat khau qua EMAIL don hang. Tranh truong hop DB/API bi doc se lo
 * mat khau hang loat.
 */
export function UserOrderCredentials({
  credentials,
  orderNumber,
}: UserOrderCredentialsProps) {
  if (!credentials || credentials.length === 0) {
    return null;
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}`);
    } catch {
      toast.error("Không thể copy");
    }
  };

  const downloadCredentials = () => {
    const content = credentials
      .map(
        (cred) =>
          `${cred.productName}\nTên đăng nhập: ${cred.username}\nMật khẩu: (xem trong email đơn hàng)\nCấp ngày: ${new Date(cred.assignedAt).toLocaleString("vi-VN")}\n\n`,
      )
      .join("---\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-${orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-green-800 dark:text-green-400">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Tài khoản đã cấp ({credentials.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCredentials}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Tải về
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-400 flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>Mật khẩu đã được gửi qua email đơn hàng của bạn.</strong> Vì lý do
              bảo mật, mật khẩu không còn hiển thị trên website. Vui lòng kiểm tra hộp thư
              (kể cả mục Spam/Quảng cáo) với địa chỉ email bạn đã đặt hàng.
            </span>
          </p>
        </div>

        {credentials.map((credential, index) => {
          const credentialId = `${credential.productId}-${index}`;

          return (
            <Card key={credentialId} className="bg-white dark:bg-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{credential.productName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(credential.assignedAt).toLocaleDateString("vi-VN")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tên đăng nhập:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm font-mono break-all">
                      {credential.username}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credential.username, "tên đăng nhập")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Mật khẩu:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm text-gray-500 dark:text-gray-400 italic">
                      Đã gửi qua email đơn hàng
                    </code>
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}

        <Separator />

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
            💡 <strong>Hướng dẫn:</strong> Dùng tên đăng nhập ở trên + mật khẩu
            trong email để đăng nhập tài khoản của bạn.
          </p>
          {(SEO_CONFIG.supportContacts.facebook ||
            SEO_CONFIG.supportContacts.telegram) && (
            <p className="text-sm text-blue-800 dark:text-blue-400">
              📞 <strong>Liên hệ hỗ trợ:</strong>{" "}
              {SEO_CONFIG.supportContacts.facebook && (
                <a
                  href={SEO_CONFIG.supportContacts.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Fanpage Facebook
                </a>
              )}
              {SEO_CONFIG.supportContacts.facebook &&
                SEO_CONFIG.supportContacts.telegram &&
                " hoặc "}
              {SEO_CONFIG.supportContacts.telegram && (
                <a
                  href={`https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Telegram
                </a>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
