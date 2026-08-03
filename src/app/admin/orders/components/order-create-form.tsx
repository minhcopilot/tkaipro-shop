"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  User, 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart,
  UserPlus,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  Zap
} from "lucide-react";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Textarea } from "~/ui/primitives/textarea";
import { Badge } from "~/ui/primitives/badge";
import { Calendar } from "~/ui/primitives/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/ui/primitives/popover";
import { cn } from "~/lib/cn";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

interface OrderCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderCreateForm({ open, onClose, onSuccess }: OrderCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'customer' | 'products'>('customer');
  
  // customer info
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  
  // order info
  const [notes, setNotes] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [orderTime, setOrderTime] = useState<string>(
    format(new Date(), "HH:mm")
  );

  // fetch users for search
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json() as any;
      
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  }, []);

  // fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100&status=active');
        const data = await response.json() as any;
        
        if (response.ok) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (open) {
      fetchProducts();
    }
  }, [open]);

  // debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerType === 'existing') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, customerType, searchUsers]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery("");
    setUsers([]);
  };

  const handleAddProduct = (product: Product) => {
    const existing = selectedItems.find(item => item.product.id === product.id);
    
    if (existing) {
      setSelectedItems(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    setSelectedItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(items => items.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    // validate customer info
    if (customerType === 'existing' && !selectedUser) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }

    if (customerType === 'new' && (!customerName || !customerEmail)) {
      toast.error("Vui lòng nhập đầy đủ thông tin khách hàng");
      return;
    }

    // validate products
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    setLoading(true);
    try {
      // kết hợp ngày và giờ để tạo createdAt chính xác
      const [hours, minutes] = orderTime.split(':').map(Number);
      const createdAt = new Date(orderDate);
      createdAt.setHours(hours, minutes, 0, 0);

      // prepare order data
      const orderData = {
        items: selectedItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
        customerInfo: {
          customerName: customerType === 'existing' ? selectedUser!.name : customerName,
          customerEmail: customerType === 'existing' ? selectedUser!.email : customerEmail,
          customerPhone: customerPhone,
          notes,
        },
        userId: customerType === 'existing' ? selectedUser!.id : undefined,
        subtotal: calculateTotal(),
        discount: 0,
        createdAt: createdAt.toISOString(),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        toast.error(result.error || "Lỗi tạo đơn hàng");
        return;
      }

      // nếu đánh dấu đã thanh toán, cập nhật trạng thái và tự động gán credentials
      if (markAsPaid && result.id) {
        await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: result.id,
            paymentStatus: 'paid',
            status: 'completed', // completed để tự động gán credentials
          }),
        });
      }

      toast.success("Tạo đơn hàng thành công!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('customer');
    setCustomerType('existing');
    setSearchQuery("");
    setUsers([]);
    setSelectedUser(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedItems([]);
    setNotes("");
    setMarkAsPaid(false);
    setOrderDate(new Date());
    setOrderTime(format(new Date(), "HH:mm"));
  };

  const handleQuickFillCursorPro1Month = async () => {
    // tìm sản phẩm Cursor pro 1 tháng
    const cursorProProduct = products.find(p => 
      p.name.toLowerCase().includes('cursor') && 
      p.name.toLowerCase().includes('1') && 
      (p.name.toLowerCase().includes('tháng') || p.name.toLowerCase().includes('month'))
    );

    if (cursorProProduct) {
      handleAddProduct(cursorProProduct);
      toast.success("Đã thêm Cursor Pro 1 tháng");
    } else {
      toast.error("Không tìm thấy sản phẩm Cursor Pro 1 tháng");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    product.inStock
  );

  const canProceedToProducts = 
    (customerType === 'existing' && selectedUser) ||
    (customerType === 'new' && customerName && customerEmail);

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>tạo đơn hàng mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'customer' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">thông tin khách hàng</span>
            </div>
            <div className="flex-1 h-px bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step === 'products' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">chọn sản phẩm</span>
            </div>
          </div>

          {/* Step 1: Customer Info */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={customerType === 'existing' ? 'default' : 'outline'}
                  onClick={() => setCustomerType('existing')}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  khách hàng có sẵn
                </Button>
                <Button
                  type="button"
                  variant={customerType === 'new' ? 'default' : 'outline'}
                  onClick={() => setCustomerType('new')}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  khách hàng mới
                </Button>
              </div>

              {customerType === 'existing' ? (
                <div className="space-y-4">
                  {selectedUser ? (
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{selectedUser.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(null)}
                        >
                          thay đổi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>tìm kiếm khách hàng</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="nhập tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {users.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                          {users.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                            >
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <Label>số điện thoại (tùy chọn)</Label>
                    <Input
                      placeholder="nhập số điện thoại..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>tên khách hàng *</Label>
                    <Input
                      placeholder="nhập tên..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>email *</Label>
                    <Input
                      type="email"
                      placeholder="nhập email..."
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>số điện thoại</Label>
                    <Input
                      placeholder="nhập số điện thoại..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('products')}
                  disabled={!canProceedToProducts}
                >
                  tiếp tục
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {step === 'products' && (
            <div className="space-y-4">
              {/* Quick Fill Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickFillCursorPro1Month}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  quick fill: cursor pro 1 tháng
                </Button>
              </div>

              <div>
                <Label>tìm kiếm sản phẩm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="tìm sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Available Products */}
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {product.price.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-3">
                  <Label>sản phẩm đã chọn ({selectedItems.length})</Label>
                  <div className="border rounded-lg divide-y">
                    {selectedItems.map(item => (
                      <div key={item.product.id} className="p-3 flex items-center space-x-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.product.price.toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveProduct(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-semibold">tổng cộng:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {calculateTotal().toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
              )}

              {/* Order Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ngày tạo đơn</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderDate ? format(orderDate, "dd/MM/yyyy", { locale: vi }) : "chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderDate}
                        onSelect={(date) => date && setOrderDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>giờ tạo đơn</Label>
                  <Input
                    type="time"
                    value={orderTime}
                    onChange={(e) => setOrderTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>ghi chú</Label>
                <Textarea
                  placeholder="nhập ghi chú cho đơn hàng..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Mark as Paid */}
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="markAsPaid"
                  checked={markAsPaid}
                  onChange={(e) => setMarkAsPaid(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="markAsPaid" className="cursor-pointer">
                  đánh dấu đã thanh toán (tự động gán tài khoản và tạo subscription)
                </Label>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('customer')}
                >
                  quay lại
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || selectedItems.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      đang tạo...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      tạo đơn hàng
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 