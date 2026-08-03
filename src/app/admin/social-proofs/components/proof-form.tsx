"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X, Wand2, Copy, Eye, Image as ImageIcon, Sparkles } from "lucide-react";

import type { SocialProof } from "~/db/schema";
import { PROOF_PLATFORMS, PROOF_PRODUCT_TYPES } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Switch } from "~/ui/primitives/switch";
import { Textarea } from "~/ui/primitives/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Badge } from "~/ui/primitives/badge";

interface ProofFormProps {
  proof?: SocialProof;
  onSuccess: (proof: SocialProof) => void;
  onCancel: () => void;
}

const platformLabels = {
  [PROOF_PLATFORMS.WEBSITE]: "Website",
  [PROOF_PLATFORMS.TELEGRAM]: "Telegram",
  [PROOF_PLATFORMS.FACEBOOK]: "Facebook",
};

const productTypeLabels = {
  [PROOF_PRODUCT_TYPES.CURSOR_PRO]: "Cursor Pro",
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL]: "Cursor Pro chính chủ 1 tháng",
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K]: "Cấp tài khoản Cursor chính hãng giá 239k",
  [PROOF_PRODUCT_TYPES.GITHUB_COPILOT]: "GitHub Copilot + Education Pack",
  [PROOF_PRODUCT_TYPES.FIGMA_PRO]: "Figma Pro",
  [PROOF_PRODUCT_TYPES.JETBRAINS_EDU]: "JetBrains EDU Pack",
};

// quick templates cho từng loại sản phẩm
const productTemplates = {
  [PROOF_PRODUCT_TYPES.CURSOR_PRO]: {
    title: "✅ Khách hàng mua thành công Cursor Pro 1 tháng",
    amount: "99,000đ",
    description: "Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng Cursor Pro",
  },
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL]: {
    title: "✅ Nâng cấp chính chủ Cursor Pro 1 tháng",
    amount: "299,000đ",
    description: "Khách hàng nâng cấp trực tiếp trên tài khoản chính chủ, hỗ trợ đầy đủ trong 1 tháng",
  },
  [PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K]: {
    title: "✅ Khách hàng mua thành công Cấp tài khoản Cursor chính hãng giá 239k",
    amount: "239,000đ",
    description: "Giao dịch thành công, khách hàng đã nhận được tài khoản Cursor chính hãng và đang sử dụng",
  },
  [PROOF_PRODUCT_TYPES.GITHUB_COPILOT]: {
    title: "✅ Khách hàng mua thành công GitHub Copilot + GitHub Education Pack (2 năm)",
    amount: "249,000đ",
    description: "Giao dịch thành công, khách hàng đã kích hoạt GitHub Copilot và GitHub Education Pack với thời hạn 2 năm",
  },
  [PROOF_PRODUCT_TYPES.FIGMA_PRO]: {
    title: "✅ Khách hàng mua thành công Figma Pro (1 năm)",
    amount: "49,000đ",
    description: "Giao dịch thành công, khách hàng đã được thêm vào team Figma Pro với thời hạn 1 năm",
  },
  [PROOF_PRODUCT_TYPES.JETBRAINS_EDU]: {
    title: "✅ Khách hàng mua thành công JetBrains EDU Pack (1 năm)",
    amount: "49,000đ",
    description: "Giao dịch thành công, khách hàng đã kích hoạt JetBrains EDU Pack (IntelliJ, PyCharm, WebStorm...) trong 1 năm",
  },
};

// tạo mã đơn hàng ngẫu nhiên
const generateOrderNumber = () => {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

export function ProofForm({ proof, onSuccess, onCancel }: ProofFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // lấy datetime hiện tại cho orderDate mặc định (format: yyyy-MM-ddTHH:mm)
  // используем время вьетнама (asia/ho_chi_minh, utc+7)
  const getCurrentDateTime = () => {
    const now = new Date();
    // конвертируем в время вьетнама
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const year = vietnamTime.getFullYear();
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initialFormData = {
    title: proof?.title || "",
    description: proof?.description || "",
    imageUrl: proof?.imageUrl || "",
    platform: proof?.platform || PROOF_PLATFORMS.WEBSITE, // tự động set website
    productType: proof?.productType || "",
    orderNumber: proof?.orderNumber || "",
    customerName: proof?.customerName || "",
    amount: proof?.amount || "",
    orderDate: proof?.orderDate 
      ? (() => {
          // конвертируем utc время в локальное время вьетнама для отображения в форме
          const utcDate = new Date(proof.orderDate);
          const vietnamDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
          const year = vietnamDate.getFullYear();
          const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
          const day = String(vietnamDate.getDate()).padStart(2, '0');
          const hours = String(vietnamDate.getHours()).padStart(2, '0');
          const minutes = String(vietnamDate.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        })()
      : getCurrentDateTime(),
    isActive: proof?.isActive ?? true,
    isFeatured: proof?.isFeatured ?? false,
    displayOrder: proof?.displayOrder || "0",
  };
  
  const [formData, setFormData] = useState(initialFormData);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 4MB)");
      return;
    }

    try {
      setUploading(true);
      
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json() as { url: string; key: string };
      
      handleChange("imageUrl", result.url);
      toast.success("Upload ảnh thành công");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.imageUrl || !formData.productType) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      // конвертируем локальное время в правильный формат для сервера
      let orderDateValue: string | undefined = undefined;
      if (formData.orderDate) {
        // создаем date объект из локального времени, затем конвертируем в iso string
        // это гарантирует, что время будет правильно интерпретировано
        const localDate = new Date(formData.orderDate);
        orderDateValue = localDate.toISOString();
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl,
        platform: formData.platform || PROOF_PLATFORMS.WEBSITE, // luôn set website
        productType: formData.productType,
        orderNumber: formData.orderNumber || undefined,
        customerName: formData.customerName || undefined,
        amount: formData.amount || undefined,
        orderDate: orderDateValue,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder: formData.displayOrder,
      };

      const url = proof 
        ? `/api/admin/social-proofs/${proof.id}`
        : "/api/admin/social-proofs";
      
      const method = proof ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${proof ? "update" : "create"} proof`);
      }

      const data = await response.json() as { proof: SocialProof };
      toast.success(proof ? "Cập nhật thành công" : "Tạo minh chứng thành công");
      onSuccess(data.proof);
    } catch (error) {
      console.error("Error saving proof:", error);
      toast.error(proof ? "Không thể cập nhật" : "Không thể tạo minh chứng");
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

  // apply template khi chọn product type
  const applyProductTemplate = (productType: string) => {
    const template = productTemplates[productType as keyof typeof productTemplates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        productType,
        title: template.title,
        amount: template.amount,
        description: template.description,
      }));
      toast.success("Đã áp dụng template sản phẩm");
    }
  };

  // tự động tạo mã đơn hàng
  const autoGenerateOrderNumber = () => {
    const orderNumber = generateOrderNumber();
    handleChange("orderNumber", orderNumber);
    toast.success(`Đã tạo mã đơn: ${orderNumber}`);
  };

  // xử lý paste ảnh từ clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              if (file.size > 4 * 1024 * 1024) {
                toast.error("File quá lớn (tối đa 4MB)");
                return;
              }

              setUploading(true);
              
              const formDataObj = new FormData();
              formDataObj.append("file", file);
              
              const response = await fetch("/api/admin/upload-image", {
                method: "POST",
                body: formDataObj,
              });

              if (!response.ok) {
                const errorData = await response.json() as { error?: string };
                throw new Error(errorData.error || "Upload failed");
              }

              const result = await response.json() as { url: string; key: string };
              
              setUploadedImages(prev => [...prev, result.url]);
              handleChange("imageUrl", result.url);
              toast.success("Đã paste ảnh thành công!");
            } catch (error) {
              console.error("Error uploading image:", error);
              toast.error("Không thể upload ảnh");
            } finally {
              setUploading(false);
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // xử lý drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      } else {
        toast.error("Vui lòng chỉ kéo thả file ảnh");
      }
    }
  };

  // upload image helper
  const uploadImage = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 4MB)");
      return;
    }

    try {
      setUploading(true);
      
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json() as { url: string; key: string };
      
      // thêm vào danh sách uploaded images
      setUploadedImages(prev => [...prev, result.url]);
      handleChange("imageUrl", result.url);
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
        {/* quick templates */}
        {!proof && (
        <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Templates - Chọn Nhanh
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click để tự động điền thông tin cho từng loại sản phẩm
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(productTypeLabels).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyProductTemplate(value)}
                className="bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-400 transition-all"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* thông tin cơ bản */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
          Thông tin cơ bản
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="productType" className="text-gray-900 dark:text-gray-100 font-medium">
            Loại sản phẩm <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.productType} 
            onValueChange={(value) => handleChange("productType", value)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span className="truncate">
                {formData.productType ? productTypeLabels[formData.productType as keyof typeof productTypeLabels] : "Chọn sản phẩm"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(productTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-900 dark:text-gray-100 font-medium">
            Tiêu đề <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="VD: ✅ Khách hàng mua thành công Cursor Pro"
            required
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-900 dark:text-gray-100 font-medium">
            Mô tả
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Giao dịch thành công, khách hàng đã nhận được tài khoản..."
            rows={2}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* hình ảnh minh chứng */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">2</span>
          Hình ảnh minh chứng <span className="text-red-500">*</span>
        </h3>
        
        <div className="space-y-3">
          {formData.imageUrl ? (
            <div className="space-y-3">
              <div className="relative group">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-full h-64 object-contain rounded-lg border-2 border-green-300 dark:border-green-600 bg-gray-50 dark:bg-gray-800"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Thay ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleChange("imageUrl", "");
                      setUploadedImages([]);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
              
              {/* gallery nếu có nhiều ảnh đã upload */}
              {uploadedImages.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Ảnh đã upload ({uploadedImages.length}) - Click để chọn:
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChange("imageUrl", url)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          formData.imageUrl === url 
                            ? 'border-blue-500 ring-2 ring-blue-300' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }`}
                      >
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        {formData.imageUrl === url && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <Badge className="bg-blue-500 text-white">✓</Badge>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  ) : (
                    <ImageIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {uploading ? "Đang upload..." : isDragging ? "Thả ảnh vào đây" : "Upload ảnh minh chứng"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kéo thả ảnh vào đây, paste (Ctrl+V), hoặc click để chọn
                  </p>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-white dark:bg-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Chọn file
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF • Tối đa 4MB • Độ phân giải đề xuất: 1200x800px
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
          )}
        </div>
      </div>

      {/* thông tin đơn hàng (optional) */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">3</span>
          Thông tin đơn hàng (tùy chọn)
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber" className="text-gray-900 dark:text-gray-100 font-medium">
              Mã đơn hàng
            </Label>
            <div className="flex gap-2">
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => handleChange("orderNumber", e.target.value)}
                placeholder="VD: ORD-12345678"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoGenerateOrderNumber}
                title="Tạo mã tự động"
                className="shrink-0"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-gray-900 dark:text-gray-100 font-medium">
              Tên khách hàng
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              placeholder="VD: Nguyễn Văn A (hoặc ẩn danh)"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-900 dark:text-gray-100 font-medium">
              Số tiền
            </Label>
            <Input
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="VD: 49,000đ"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderDate" className="text-gray-900 dark:text-gray-100 font-medium">
              Ngày đặt hàng
            </Label>
            <Input
              id="orderDate"
              type="datetime-local"
              value={formData.orderDate}
              onChange={(e) => handleChange("orderDate", e.target.value)}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* live preview */}
      {formData.imageUrl && (
        <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Preview - Xem trước
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Ẩn" : "Hiện"}
            </Button>
          </div>
          
          {showPreview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg max-w-sm mx-auto">
              <img 
                src={formData.imageUrl} 
                alt={formData.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                {formData.productType && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700">
                      💎 {productTypeLabels[formData.productType as keyof typeof productTypeLabels] || "Product"}
                    </Badge>
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {formData.title || "Tiêu đề minh chứng"}
                </h4>
                {formData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {formData.description}
                  </p>
                )}
                {formData.amount && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    💰 {formData.amount}
                  </div>
                )}
                {formData.orderNumber && (
                  <div className="text-xs text-gray-500">
                    Mã ĐH: {formData.orderNumber}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* cài đặt hiển thị */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">4</span>
          Cài đặt hiển thị
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <Label htmlFor="isActive" className="text-gray-900 dark:text-gray-100 font-medium">
                🟢 Kích hoạt
              </Label>
              <p className="text-sm text-gray-500">Hiển thị minh chứng này trên trang công khai</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <Label htmlFor="isFeatured" className="text-gray-900 dark:text-gray-100 font-medium">
                ⭐ Nổi bật
              </Label>
              <p className="text-sm text-gray-500">Hiển thị ưu tiên ở đầu danh sách</p>
            </div>
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => handleChange("isFeatured", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder" className="text-gray-900 dark:text-gray-100 font-medium">
              📊 Thứ tự hiển thị
            </Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => handleChange("displayOrder", e.target.value)}
              placeholder="0"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500">Số càng lớn càng hiển thị trước (0-100)</p>
          </div>
        </div>
      </div>
      </div>

      {/* actions - always visible at bottom */}
      <div className="flex justify-between gap-3 pt-6 pb-2 px-1 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          ❌ Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading || uploading || !formData.imageUrl || !formData.title || !formData.productType}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang lưu...
            </>
          ) : proof ? (
            <>✏️ Cập nhật</>
          ) : (
            <>✨ Tạo minh chứng</>
          )}
        </Button>
      </div>
    </form>
  );
}

