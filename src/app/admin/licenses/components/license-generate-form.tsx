"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

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
import { JETBRAINS_PRODUCTS } from "~/db/schema";

interface LicenseGenerateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Product {
  id: string;
  name: string;
  productType: string;
}

export function LicenseGenerateForm({ onSuccess, onCancel }: LicenseGenerateFormProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    licenseName: "Custom License",
    years: "1",
    quantity: "1",
    assigneeName: "",
    notes: "",
    assignToProduct: false,
    productId: "",
  });

  useEffect(() => {
    // load license-type products
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=100");
        if (response.ok) {
          const result = await response.json();
          const allProducts = result.products || result;
          
          // chỉ lấy sản phẩm loại license
          const licenseProducts = allProducts.filter((p: Product) => p.productType === "license");
          setProducts(licenseProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleProductChange = (productCode: string) => {
    const product = JETBRAINS_PRODUCTS.find(p => p.code === productCode);
    setFormData({
      ...formData,
      productCode,
      productName: product?.name || "",
    });
    
    // tự động tìm và gán sản phẩm phù hợp nếu có assignToProduct
    if (formData.assignToProduct && product && formData.years) {
      autoSelectProduct(product.name, formData.years);
    }
  };

  const handleYearsChange = (years: string) => {
    setFormData({ ...formData, years });
    
    // tự động tìm và gán sản phẩm phù hợp nếu có
    if (formData.assignToProduct && formData.productName && years) {
      autoSelectProduct(formData.productName, years);
    }
  };

  const autoSelectProduct = (productName: string, years: string) => {
    const matchedProduct = products.find(p => {
      const yearNum = parseInt(years);
      return p.name.includes(productName) && 
             (p.name.includes(`${yearNum} Năm`) || p.name.includes(`${yearNum} năm`));
    });
    
    if (matchedProduct) {
      setFormData(prev => ({ ...prev, productId: matchedProduct.id }));
    } else {
      setFormData(prev => ({ ...prev, productId: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const quantity = parseInt(formData.quantity) || 1;
    setProgress({ current: 0, total: quantity });

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < quantity; i++) {
        try {
          setProgress({ current: i + 1, total: quantity });

          const response = await fetch("/api/admin/licenses/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productCode: formData.productCode,
              productName: formData.productName,
              licenseName: formData.licenseName,
              years: formData.years,
              assigneeName: formData.assigneeName,
              notes: formData.notes,
              assignToProduct: formData.assignToProduct,
              productId: formData.productId,
            }),
          });

          if (!response.ok) {
            failCount++;
            console.error(`Failed to generate license ${i + 1}`);
          } else {
            successCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error generating license ${i + 1}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Đã tạo thành công ${successCount} license key!`, {
          description: failCount > 0 ? `Thất bại: ${failCount}` : undefined,
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast.error(`Không thể tạo license key (${failCount} thất bại)`);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error generating licenses:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo license keys"
      );
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="product">Sản phẩm IDE *</Label>
          <Select
            value={formData.productCode}
            onValueChange={handleProductChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn sản phẩm..." />
            </SelectTrigger>
            <SelectContent>
              {JETBRAINS_PRODUCTS.map((product) => (
                <SelectItem key={product.code} value={product.code}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="licenseName">Tên License *</Label>
          <Input
            id="licenseName"
            value={formData.licenseName}
            onChange={(e) => setFormData({ ...formData, licenseName: e.target.value })}
            placeholder="VD: My Company"
            required
          />
        </div>

        <div>
          <Label htmlFor="years">Số năm license *</Label>
          <Input
            id="years"
            type="number"
            min="1"
            max="99"
            value={formData.years}
            onChange={(e) => handleYearsChange(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="quantity">Số lượng license *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="Nhập số lượng (1-100)"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tạo nhiều license cùng lúc (tối đa 100)
          </p>
        </div>

        <div>
          <Label htmlFor="assigneeName">Người được gán (tùy chọn)</Label>
          <Input
            id="assigneeName"
            value={formData.assigneeName}
            onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
            placeholder="Tên người dùng"
          />
        </div>

        <div>
          <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ghi chú về license này..."
            rows={3}
          />
        </div>

        {/* Assign to product */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-0.5">
            <Label className="text-base">Gán vào sản phẩm</Label>
            <p className="text-sm text-muted-foreground">
              Tự động thêm license keys vào pool của sản phẩm để bán
            </p>
          </div>
          <Switch
            checked={formData.assignToProduct}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, assignToProduct: checked });
              // tự động chọn sản phẩm khi bật toggle
              if (checked && formData.productName && formData.years) {
                autoSelectProduct(formData.productName, formData.years);
              }
            }}
          />
        </div>

        {formData.assignToProduct && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {formData.productId ? (
                    <>Sẽ gán vào: <span className="font-semibold">{products.find(p => p.id === formData.productId)?.name}</span></>
                  ) : (
                    <>Chưa tìm thấy sản phẩm phù hợp</>
                  )}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {formData.productId 
                    ? "License keys sẽ tự động thêm vào pool của sản phẩm này"
                    : "Vui lòng chọn IDE và số năm ở trên để tự động tìm sản phẩm"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? `Đang tạo ${progress.current}/${progress.total}...`
            : "Tạo License Key"}
        </Button>
      </div>
    </form>
  );
} 