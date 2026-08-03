"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProductWithCategory } from "~/db/schema/products/types";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Badge } from "~/ui/primitives/badge";
import { Textarea } from "~/ui/primitives/textarea";

interface ProductCredentialsManagerProps {
  product: ProductWithCategory;
  onUpdate: (updatedProduct: ProductWithCategory) => void;
}

/** Display email only — strip legacy `|password` if still present in pool. */
function displayAccountEmail(credential: string): string {
  const idx = credential.indexOf("|");
  return idx === -1 ? credential : credential.slice(0, idx);
}

export function ProductCredentialsManager({ product, onUpdate }: ProductCredentialsManagerProps) {
  const [showCredentials, setShowCredentials] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newLicenseKey, setNewLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);

  const isLicenseProduct = product.productType === "license";
  const credentials = product.accountCredentials || [];

  const handleAddCredential = async () => {
    let newCredentialString = "";
    
    if (isLicenseProduct) {
      if (!newLicenseKey.trim()) {
        toast.error("Vui lòng nhập license key");
        return;
      }
      // clean license key
      newCredentialString = newLicenseKey.trim()
        .replace(/^\uFEFF/, '') // BOM
        .replace(/\0/g, '') // null bytes
        .replace(/\x00/g, '') // hex null
        .replace(/^��<certificate-key>\s*/g, '') // ký tự lạ
        .replace(/^<certificate-key>\s*/g, ''); // nếu còn
    } else {
      const email = newEmail.trim();
      if (!email || !email.includes("@")) {
        toast.error("Vui lòng nhập email tài khoản Cursor hợp lệ");
        return;
      }
      // Email only — password lấy từ manager vault lúc gửi đơn
      newCredentialString = email.includes("|")
        ? email.slice(0, email.indexOf("|")).trim()
        : email;
    }

    setLoading(true);
    try {
      const newCredentials = [...credentials, newCredentialString];
      
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          accountCredentials: newCredentials,
        }),
      });

      if (!response.ok) throw new Error("Failed to update credentials");

      const updatedProduct = await response.json() as ProductWithCategory;
      onUpdate(updatedProduct);
      setNewEmail("");
      setNewLicenseKey("");
      toast.success(isLicenseProduct ? "Đã thêm license key thành công" : "Đã thêm email tài khoản thành công");
    } catch (error) {
      toast.error(isLicenseProduct ? "Không thể thêm license key" : "Không thể thêm tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredential = async (index: number) => {
    setLoading(true);
    try {
      const newCredentials = credentials.filter((_, i) => i !== index);
      
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          accountCredentials: newCredentials,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove credential");

      const updatedProduct = await response.json() as ProductWithCategory;
      onUpdate(updatedProduct);
      toast.success("Đã xóa tài khoản");
    } catch (error) {
      toast.error("Không thể xóa tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy vào clipboard");
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isLicenseProduct ? "Quản lý License Keys" : "Quản lý tài khoản"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tổng cộng {credentials.length} {isLicenseProduct ? "license keys" : "tài khoản"} có sẵn
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCredentials(!showCredentials)}
          className="flex items-center gap-2"
        >
          {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showCredentials ? "Ẩn" : "Hiện"} thông tin
        </Button>
      </div>

      {/* Add new credential form */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          {isLicenseProduct ? "Thêm license key mới" : "Thêm email tài khoản"}
        </h4>
        
        {isLicenseProduct ? (
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">License Key</Label>
            <Textarea
              value={newLicenseKey}
              onChange={(e) => setNewLicenseKey(e.target.value)}
              placeholder="556AB7855F-eyJsaWNlbnNlSWQiOiI1NTZBQjc4NTVGIi..."
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 font-mono text-sm min-h-[100px]"
            />
            <p className="text-xs text-gray-500">Paste license key từ generator (tự động clean ký tự lạ)</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Email tài khoản Cursor</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@cursor.com"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500">
              Chỉ nhập email. Mật khẩu Cursor phải có sẵn trên manager (mailPassword) — shop không lưu password.
            </p>
          </div>
        )}
        
        <Button 
          onClick={handleAddCredential} 
          disabled={loading}
          className="mt-3 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isLicenseProduct ? "Thêm license key" : "Thêm email"}
        </Button>
      </div>

      {/* Credentials list */}
      <div className="space-y-2">
        {credentials.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Chưa có {isLicenseProduct ? "license key" : "tài khoản"} nào</p>
            <p className="text-sm">Thêm {isLicenseProduct ? "license key" : "email"} đầu tiên ở trên</p>
          </div>
        ) : (
          credentials.map((credential, index) => {
            if (isLicenseProduct) {
              const licenseKey = credential;
              const shortKey = licenseKey.substring(0, 50) + (licenseKey.length > 50 ? "..." : "");
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">License Key:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                          {showCredentials ? licenseKey : shortKey}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(licenseKey)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCredential(index)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            }
            
            // account type — email only
            const email = displayAccountEmail(credential);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {showCredentials ? email : "••••••••"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(email)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCredential(index)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        {isLicenseProduct ? (
          <>
            <p>💡 mẹo: click vào icon copy để sao chép license key</p>
            <p>🔒 license keys được lưu trữ an toàn trong database</p>
            <p>✂️ tự động clean ký tự lạ khi thêm mới</p>
          </>
        ) : (
          <>
            <p>💡 Chỉ lưu email trên shop. Mật khẩu Cursor lấy từ manager khi gửi email đơn hàng.</p>
            <p>🔒 Acc bán phải có cùng email trên manager với mailPassword đúng.</p>
          </>
        )}
      </div>
    </div>
  );
}
