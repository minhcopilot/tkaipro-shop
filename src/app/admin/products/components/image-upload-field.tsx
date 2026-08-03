"use client";

import { useState, useEffect } from "react";
import { Upload, Link, X, Eye, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function ImageUploadField({ value, onChange, label = "Hình ảnh sản phẩm", required = false }: ImageUploadFieldProps) {
  const [uploadMethod, setUploadMethod] = useState<"url" | "upload">("url");
  const [previewUrl, setPreviewUrl] = useState(value);

  // sync previewUrl with value prop when it changes
  useEffect(() => {
    setPreviewUrl(value);
    
    // auto-detect upload method based on URL pattern
    if (value) {
      // if URL contains uploadthing domain, it's an uploaded file
      if (value.includes('ufs.sh') || value.includes('uploadthing')) {
        setUploadMethod("upload");
      } else {
        setUploadMethod("url");
      }
    }
  }, [value]);

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleUploadComplete = (res: Array<{ 
    ufsUrl?: string; 
    serverData?: { fileUrl: string }; 
    fileUrl?: string;
  }>) => {
    console.log("Upload complete callback:", res);
    if (res && res[0]) {
      // try different URL properties based on UploadThing response structure
      const uploadedUrl = res[0].ufsUrl || res[0].serverData?.fileUrl || res[0].fileUrl;
      console.log("Setting uploaded URL:", uploadedUrl);
      console.log("Available URL properties:", {
        ufsUrl: res[0].ufsUrl,
        serverDataFileUrl: res[0].serverData?.fileUrl,
        fileUrl: res[0].fileUrl
      });
      
      if (uploadedUrl) {
        // update both local state and parent component
        setPreviewUrl(uploadedUrl);
        onChange(uploadedUrl);
        
        // automatically switch to upload method to show the uploaded image
        setUploadMethod("upload");
        
        toast.success("Upload ảnh thành công!");
      } else {
        console.error("No valid URL found in upload response:", res[0]);
        toast.error("Không tìm thấy URL ảnh sau khi upload");
      }
    } else {
      console.error("No upload result received");
      toast.error("Không nhận được kết quả upload");
    }
  };

  const handleUploadError = (error: Error) => {
    toast.error(`Lỗi upload: ${error.message}`);
  };

  const clearImage = () => {
    setPreviewUrl("");
    onChange("");
  };

  return (
    <div className="space-y-4">
      <Label className="text-gray-900 dark:text-gray-100">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Dropdown để chọn phương thức tải ảnh */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-gray-500" />
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Chọn cách thêm ảnh đại diện:
          </Label>
        </div>
        
        <Select value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "url" | "upload")}>
          <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="Chọn phương thức tải ảnh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url" className="flex items-center">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                <span>Nhập đường dẫn URL từ internet</span>
              </div>
            </SelectItem>
            <SelectItem value="upload" className="flex items-center">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Tải ảnh từ máy tính của tôi</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hiển thị form tương ứng với phương thức đã chọn */}
      {uploadMethod === "url" && (
        <div className="space-y-3 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Link className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Nhập đường dẫn URL hình ảnh
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Dán đường dẫn ảnh từ internet (Google Drive, Imgur, v.v.)
          </p>
        </div>
      )}

      {uploadMethod === "upload" && (
        <div className="space-y-3 p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50/50 dark:bg-green-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Tải ảnh từ máy tính
            </span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              appearance={{
                button: "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 ut-button:bg-green-600 ut-button:hover:bg-green-700",
                allowedContent: "text-gray-600 dark:text-gray-400"
              }}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              📁 Hỗ trợ: PNG, JPG, JPEG. Tối đa 4MB.
            </p>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Xóa ảnh
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Image preview */}
      {(value || previewUrl) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Xem trước ảnh đại diện:</span>
          </div>
          <div className="relative w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <Image
              src={value || previewUrl}
              alt="Product image preview"
              fill
              className="object-cover"
              onError={() => {
                console.error("Failed to load image:", value || previewUrl);
                toast.error("Không thể tải ảnh. Vui lòng kiểm tra URL.");
                setPreviewUrl("");
                onChange("");
              }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
            🔗 URL: {value || previewUrl}
          </div>
        </div>
      )}
    </div>
  );
} 