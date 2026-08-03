"use client";

import { Languages, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { ProductWithCategory, ProductCategory } from "~/db/schema/products/types";
import type { LocaleMap } from "~/db/schema/products/tables";
import { SUPPORTED_LOCALES } from "~/db/schema/announcements/types";

import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Switch } from "~/ui/primitives/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

import { ImageUploadField } from "./image-upload-field";

interface ProductEditFormProps {
  product: ProductWithCategory;
  categories: ProductCategory[];
  onSuccess: (updatedProduct: ProductWithCategory) => void;
  onCancel: () => void;
}

export function ProductEditForm({ product, categories, onSuccess, onCancel }: ProductEditFormProps) {
  const [loading, setLoading] = useState(false);
  
  // lưu credentials gốc để đảm bảo không bị mất
  // Account: hiển thị/lưu email only (strip legacy |password nếu còn)
  const originalCredentials = (product.accountCredentials || [])
    .map((c) => {
      if ((product.productType || "account") === "license") return c;
      const idx = c.indexOf("|");
      return idx === -1 ? c : c.slice(0, idx).trim();
    })
    .filter(Boolean)
    .join("\n");
  
  const [formData, setFormData] = useState({
    name: product.name || "",
    category: product.category || "",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    price: product.price.toString(),
    originalPrice: product.originalPrice?.toString() || "",
    costPrice: product.costPrice?.toString() || "0", // giá nhập
    duration: (product.duration ?? 30).toString(), // thời hạn sử dụng (ngày)
    image: product.image || "",
    inStock: product.inStock,
    stockQuantity: product.stockQuantity?.toString() || "",
    isPopular: product.isPopular || false,
    isFeatured: product.isFeatured || false,
    features: (product.features || []).join("\n"),
    accountCredentials: originalCredentials,
    status: product.status || "active",
    productType: (product.productType || "account") as "account" | "license" | "upgrade" | "login_link", // loại sản phẩm
    upgradeEmailOnly: product.upgradeEmailOnly || false,
    linkedUpgradeProductId: product.linkedUpgradeProductId || "", // option nâng cấp liên kết
    hiddenFromListing: product.hiddenFromListing || false, // ẩn khỏi catalog
  });

  // Danh sách sản phẩm upgrade để gắn làm option nâng cấp (loại trừ chính sản phẩm này).
  const [upgradeProducts, setUpgradeProducts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadUpgradeProducts = async () => {
      try {
        const res = await fetch("/api/admin/products?limit=200");
        if (!res.ok) return;
        const data = await res.json() as { products?: { id: string; name: string; productType?: string }[] };
        const list = (data.products || [])
          .filter((p) => p.productType === "upgrade" && p.id !== product.id)
          .map((p) => ({ id: p.id, name: p.name }));
        setUpgradeProducts(list);
      } catch {
        // non-critical: select sẽ rỗng nếu fetch lỗi
      }
    };
    loadUpgradeProducts();
  }, [product.id]);

  const [nameLocales, setNameLocales] = useState<LocaleMap>((product.nameLocales as LocaleMap) || {});
  const [descriptionLocales, setDescriptionLocales] = useState<LocaleMap>((product.descriptionLocales as LocaleMap) || {});
  const [shortDescriptionLocales, setShortDescriptionLocales] = useState<LocaleMap>((product.shortDescriptionLocales as LocaleMap) || {});
  const [featuresLocales, setFeaturesLocales] = useState<Record<string, string[]>>((product.featuresLocales as Record<string, string[]>) || {});
  const [translating, setTranslating] = useState(false);

  // Tạo lại mô tả bằng AI (Claude/Cursor/GPT 2026 features)
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiContextNotes, setAiContextNotes] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    shortDescription: string;
    description: string;
    features: string[];
  } | null>(null);

  const handleGenerateDescription = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/admin/products/refresh-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          contextNotes: aiContextNotes.trim() || undefined,
          autoApply: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Tạo mô tả thất bại");
      }
      const data = await res.json() as {
        shortDescription: string;
        description: string;
        features?: string[];
      };
      setAiPreview({
        shortDescription: data.shortDescription,
        description: data.description,
        features: Array.isArray(data.features) ? data.features : [],
      });
      toast.success("Đã tạo mô tả mới — kiểm tra preview rồi áp dụng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo mô tả thất bại");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiDescription = () => {
    if (!aiPreview) return;
    setFormData((prev) => ({
      ...prev,
      shortDescription: aiPreview.shortDescription,
      description: aiPreview.description,
      // Chỉ ghi đè features nếu AI có trả list, tránh xoá list cũ vô tình.
      features:
        aiPreview.features.length > 0
          ? aiPreview.features.join("\n")
          : prev.features,
    }));
    setAiDialogOpen(false);
    setAiPreview(null);
    setAiContextNotes("");
    toast.success("Đã áp vào form — đừng quên bấm Lưu để cập nhật DB");
  };

  const handleTranslate = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm trước khi dịch");
      return;
    }
    setTranslating(true);
    try {
      const featuresArray = formData.features.split("\n").map(f => f.trim()).filter(f => f.length > 0);
      const res = await fetch("/api/admin/products/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          shortDescription: formData.shortDescription.trim() || undefined,
          features: featuresArray.length > 0 ? featuresArray : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Dịch thất bại");
      }
      const data = await res.json();
      const t = data.translations as Record<string, { name: string; description?: string; shortDescription?: string; features?: string[] }>;
      const newName: LocaleMap = {};
      const newDesc: LocaleMap = {};
      const newShort: LocaleMap = {};
      const newFeats: Record<string, string[]> = {};
      for (const [locale, val] of Object.entries(t)) {
        if (val.name) newName[locale] = val.name;
        if (val.description) newDesc[locale] = val.description;
        if (val.shortDescription) newShort[locale] = val.shortDescription;
        if (val.features) newFeats[locale] = val.features;
      }
      setNameLocales(newName);
      setDescriptionLocales(newDesc);
      setShortDescriptionLocales(newShort);
      setFeaturesLocales(newFeats);
      toast.success("Đã dịch tự động sang 10 ngôn ngữ!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dịch thất bại");
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.category || !formData.price) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      const featuresArray = formData.features
        .split("\n")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const credentialsArray = formData.accountCredentials
        .split("\n")
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(c => {
          if (formData.productType === "license") return c;
          const idx = c.indexOf("|");
          return idx === -1 ? c : c.slice(0, idx).trim();
        })
        .filter(c => c.length > 0);

      const credentialsChanged = formData.accountCredentials.trim() !== originalCredentials.trim();
      
      const finalCredentials = credentialsChanged
        ? credentialsArray 
        : (product.accountCredentials || []);

      const payload = {
        productId: product.id,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        duration: formData.duration ? Number(formData.duration) : 30,
        image: formData.image || undefined,
        inStock: formData.inStock,
        stockQuantity: formData.stockQuantity ? Number(formData.stockQuantity) : 0,
        isPopular: formData.isPopular,
        isFeatured: formData.isFeatured,
        features: featuresArray,
        accountCredentials: (formData.productType === "upgrade" || formData.productType === "login_link") ? [] : finalCredentials,
        status: formData.status,
        productType: formData.productType,
        upgradeEmailOnly: formData.productType === "upgrade" ? formData.upgradeEmailOnly : false,
        // Chỉ account/license mới gắn option nâng cấp; loại khác để null (clear link).
        linkedUpgradeProductId:
          (formData.productType === "account" || formData.productType === "license") &&
          formData.linkedUpgradeProductId
            ? formData.linkedUpgradeProductId
            : null,
        hiddenFromListing: formData.hiddenFromListing,
        nameLocales: Object.keys(nameLocales).length > 0 ? nameLocales : undefined,
        descriptionLocales: Object.keys(descriptionLocales).length > 0 ? descriptionLocales : undefined,
        shortDescriptionLocales: Object.keys(shortDescriptionLocales).length > 0 ? shortDescriptionLocales : undefined,
        featuresLocales: Object.keys(featuresLocales).length > 0 ? featuresLocales : undefined,
      };

      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const updatedProduct = await response.json() as ProductWithCategory;
      onSuccess(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Không thể cập nhật sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">
              Tên sản phẩm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-900 dark:text-gray-100">
              Danh mục <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loại sản phẩm */}
        <div className="space-y-2">
          <Label htmlFor="productType" className="text-gray-900 dark:text-gray-100">
            Loại sản phẩm <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.productType} onValueChange={(value) => handleChange("productType", value)}>
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Chọn loại sản phẩm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="account">📧 Cấp tài khoản (Account)</SelectItem>
              <SelectItem value="license">🔑 Cấp License Key</SelectItem>
              <SelectItem value="upgrade">⬆️ Nâng cấp chính chủ (Upgrade)</SelectItem>
              <SelectItem value="login_link">🔗 Login bằng Link</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formData.productType === "account" && "Khách hàng sẽ nhận email tài khoản; mật khẩu gửi qua email đơn hàng (lấy từ manager)"}
            {formData.productType === "license" && "Khách hàng sẽ nhận license key từ hệ thống"}
            {formData.productType === "upgrade" && "Khách hàng nhập tài khoản của họ để được nâng cấp"}
            {formData.productType === "login_link" && "Shop sẽ login trực tiếp bằng link từ Cursor IDE của khách hàng"}
          </p>
        </div>

        {formData.productType === "upgrade" && (
          <div className="space-y-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="upgradeEmailOnly" className="text-gray-900 dark:text-gray-100">
                  Chỉ cần email
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Khi bật: khách checkout chỉ điền email Cursor + Telegram/FB liên hệ (bỏ ô mật khẩu Cursor).
                </p>
              </div>
              <Switch
                id="upgradeEmailOnly"
                checked={formData.upgradeEmailOnly}
                onCheckedChange={(checked) => handleChange("upgradeEmailOnly", checked)}
              />
            </div>
          </div>
        )}

        {/* Option "Nâng cấp chính chủ": chỉ gắn cho sản phẩm account/license */}
        {(formData.productType === "account" || formData.productType === "license") && (
          <div className="space-y-2">
            <Label htmlFor="linkedUpgradeProductId" className="text-gray-900 dark:text-gray-100">
              Sản phẩm nâng cấp liên kết (option)
            </Label>
            <Select
              value={formData.linkedUpgradeProductId || "__none__"}
              onValueChange={(value) =>
                handleChange("linkedUpgradeProductId", value === "__none__" ? "" : value)
              }
            >
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có</SelectItem>
                {upgradeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Khi chọn, trang chi tiết sẽ hiện thêm lựa chọn &quot;Nâng cấp chính chủ&quot; (giá riêng).
            </p>
          </div>
        )}

        {/* Ẩn khỏi danh sách: dùng cho sản phẩm chỉ làm option nâng cấp */}
        <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="hiddenFromListing" className="text-gray-900 dark:text-gray-100">
                Ẩn khỏi danh sách
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bật cho sản phẩm chỉ dùng làm option nâng cấp — vẫn mua được nhưng không hiện thành card riêng.
              </p>
            </div>
            <Switch
              id="hiddenFromListing"
              checked={formData.hiddenFromListing}
              onCheckedChange={(checked) => handleChange("hiddenFromListing", checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="shortDescription" className="text-gray-900 dark:text-gray-100">Mô tả ngắn</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAiDialogOpen(true)}
              className="gap-1.5 border-dashed border-purple-400 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950"
              title="Dùng AI viết lại mô tả ngắn + chi tiết theo tính năng mới nhất 2026"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Tạo mô tả mới (AI)
            </Button>
          </div>
          <Input
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => handleChange("shortDescription", e.target.value)}
            placeholder="Mô tả ngắn gọn về sản phẩm"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Mô tả chi tiết</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Mô tả chi tiết về sản phẩm"
            rows={6}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Dialog tạo mô tả mới bằng AI */}
      <Dialog open={aiDialogOpen} onOpenChange={(open) => {
        setAiDialogOpen(open);
        if (!open) {
          setAiPreview(null);
          setAiContextNotes("");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Tạo lại mô tả bằng AI — {product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-3 text-sm text-purple-900 dark:text-purple-200">
              <p className="font-medium">AI sẽ viết lại mô tả ngắn + mô tả chi tiết + danh sách tính năng theo dữ liệu mới nhất 05/2026.</p>
              <p className="mt-1 text-xs opacity-80">Tên sản phẩm và giá GIỮ NGUYÊN. Knowledge base có sẵn cho: Cursor, Claude, ChatGPT, Google Antigravity, Gemini, Genspark, Runway, Krea, Perplexity, Midjourney.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100">
                Ghi chú bổ sung (tuỳ chọn)
              </Label>
              <textarea
                value={aiContextNotes}
                onChange={(e) => setAiContextNotes(e.target.value)}
                placeholder="VD: Paste tính năng mới copy từ trang chính hãng, hoặc lưu ý đặc thù về gói (số seat, có Add Team chính chủ, etc.)"
                rows={4}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiGenerating}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {aiGenerating ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Đang gọi AI...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {aiPreview ? "Tạo lại" : "Tạo mô tả mới"}</>
              )}
            </Button>

            {aiPreview && (
              <div className="space-y-3 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 p-3">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Mô tả ngắn (mới)</Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {aiPreview.shortDescription}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Mô tả chi tiết (mới)</Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-72 overflow-y-auto rounded bg-white/60 dark:bg-gray-900/40 p-2 border border-gray-200 dark:border-gray-700">
                    {aiPreview.description}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Tính năng (mới · {aiPreview.features.length} mục)
                  </Label>
                  {aiPreview.features.length > 0 ? (
                    <ul className="text-sm text-gray-900 dark:text-gray-100 space-y-1 max-h-48 overflow-y-auto rounded bg-white/60 dark:bg-gray-900/40 p-2 border border-gray-200 dark:border-gray-700">
                      {aiPreview.features.map((f, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">•</span>
                          <span className="flex-1">{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">
                      AI không trả về features — list cũ trong form sẽ giữ nguyên khi áp dụng.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAiDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleApplyAiDescription}
              disabled={!aiPreview}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Áp vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dịch tự động */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Dịch đa ngôn ngữ (AI)</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating || !formData.name.trim()}
          className="gap-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300"
        >
          {translating ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Đang dịch tự động...</>
          ) : (
            <><Sparkles className="h-4 w-4" /><Languages className="h-4 w-4" /> Tự động dịch từ tiếng Việt (AI)</>
          )}
        </Button>
        {Object.keys(nameLocales).length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Bản dịch tên sản phẩm:</p>
            {SUPPORTED_LOCALES.filter(l => l.code !== "vi").map(l => (
              <div key={l.code} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-xs font-mono text-gray-400">{l.code}</span>
                <span className="text-gray-700 dark:text-gray-300">{nameLocales[l.code] || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Giá cả & Thời hạn */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Giá cả & Thời hạn</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-gray-900 dark:text-gray-100">
              Giá bán <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="0"
              required
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="costPrice" className="text-gray-900 dark:text-gray-100">
              Giá nhập (vốn)
            </Label>
            <Input
              id="costPrice"
              type="number"
              value={formData.costPrice}
              onChange={(e) => handleChange("costPrice", e.target.value)}
              placeholder="0"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Giá vốn để tính lợi nhuận thực tế
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="originalPrice" className="text-gray-900 dark:text-gray-100">Giá gốc (hiển thị)</Label>
            <Input
              id="originalPrice"
              type="number"
              value={formData.originalPrice}
              onChange={(e) => handleChange("originalPrice", e.target.value)}
              placeholder="0"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Giá gốc hiển thị (gạch ngang) cho khách hàng
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-gray-900 dark:text-gray-100">
              Thời hạn sử dụng (ngày)
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
              placeholder="30"
              min="1"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Số ngày tài khoản/license có hiệu lực sau khi được cấp
            </p>
          </div>
        </div>

        {/* profit preview */}
        {formData.price && formData.costPrice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              💰 Lợi nhuận ước tính: <span className="font-semibold">{(Number(formData.price) - Number(formData.costPrice)).toLocaleString("vi-VN")}₫</span>
              <span className="text-emerald-600 dark:text-emerald-500 ml-2">
                ({Number(formData.costPrice) > 0 ? ((Number(formData.price) - Number(formData.costPrice)) / Number(formData.price) * 100).toFixed(1) : 100}%)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Hình ảnh và trạng thái */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Hình ảnh & Trạng thái</h3>
        
        <ImageUploadField
          value={formData.image}
          onChange={(value) => handleChange("image", value)}
          label="Hình ảnh sản phẩm"
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="inStock"
              checked={formData.inStock}
              onCheckedChange={(checked) => handleChange("inStock", checked)}
            />
            <Label htmlFor="inStock" className="text-gray-900 dark:text-gray-100">Còn hàng</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPopular"
              checked={formData.isPopular}
              onCheckedChange={(checked) => handleChange("isPopular", checked)}
            />
            <Label htmlFor="isPopular" className="text-gray-900 dark:text-gray-100">Phổ biến</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => handleChange("isFeatured", checked)}
            />
            <Label htmlFor="isFeatured" className="text-gray-900 dark:text-gray-100">Nổi bật</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity" className="text-gray-900 dark:text-gray-100">Số lượng tồn kho</Label>
          <Input
            id="stockQuantity"
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => handleChange("stockQuantity", e.target.value)}
            placeholder="0"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Tính năng */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tính năng</h3>
        
        <div className="space-y-2">
          <Label htmlFor="features" className="text-gray-900 dark:text-gray-100">
            Danh sách tính năng (mỗi dòng một tính năng)
          </Label>
          <textarea
            id="features"
            value={formData.features}
            onChange={(e) => handleChange("features", e.target.value)}
            placeholder="Tính năng 1&#10;Tính năng 2&#10;Tính năng 3"
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Thông tin tài khoản - chỉ hiển thị khi không phải upgrade hoặc login_link */}
      {formData.productType !== "upgrade" && formData.productType !== "login_link" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {formData.productType === "license" ? "Thông tin License Key" : "Thông tin tài khoản"}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="accountCredentials" className="text-gray-900 dark:text-gray-100">
              {formData.productType === "license" 
                ? "Danh sách license key (mỗi dòng một key)" 
                : "Danh sách email tài khoản (mỗi dòng một email)"}
            </Label>
            <textarea
              id="accountCredentials"
              value={formData.accountCredentials}
              onChange={(e) => handleChange("accountCredentials", e.target.value)}
              placeholder={formData.productType === "license" 
                ? "LICENSE-KEY-001\nLICENSE-KEY-002\nLICENSE-KEY-003"
                : "user1@cursor.com\nuser2@cursor.com\nuser3@cursor.com"}
              rows={6}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.productType === "license"
                ? "⚠️ Lưu ý: Mỗi dòng là một license key. Thông tin này sẽ được bảo mật."
                : "⚠️ Chỉ nhập email. Mật khẩu Cursor phải có trên manager (mailPassword) — shop không lưu password."}
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              📊 Hiện có {formData.accountCredentials.split('\n').filter(c => c.trim()).length} {formData.productType === "license" ? "license key" : "tài khoản"}
            </div>
          </div>
        </div>
      )}

      {/* Thông báo cho loại upgrade */}
      {formData.productType === "upgrade" && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-medium text-amber-700 dark:text-amber-400 mb-2">
            ⬆️ Sản phẩm Nâng cấp chính chủ
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Với loại sản phẩm này, khách hàng sẽ tự nhập email và mật khẩu tài khoản của họ khi đặt hàng.
            Admin sẽ xử lý nâng cấp thủ công sau khi đơn hàng được thanh toán.
          </p>
        </div>
      )}

      {/* Thông báo cho loại login_link */}
      {formData.productType === "login_link" && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-2">
            🔗 Sản phẩm Login bằng Link
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-500">
            Sau khi thanh toán thành công, đơn hàng sẽ tự động hoàn thành và gửi email hướng dẫn khách hàng 
            lấy link login từ Cursor IDE gửi cho shop để được login tài khoản.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
        </Button>
      </div>
    </form>
  );
} 