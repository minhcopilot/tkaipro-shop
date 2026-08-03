# 🔔 Hướng Dẫn Cấu Hình SePay - Chi Tiết Từng Bước

## 📌 Thông Tin Của Bạn

- **API Key:** `Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8`
- **Webhook URL:** `https://tkaipro.shop/api/webhooks/sepay`

---

## 🚀 **BƯỚC 1: Cấu Hình Server**

### 1.1. Thêm API Key vào File `.env`

SSH vào server và thêm dòng này vào file `.env`:

```bash
# ssh vào server
ssh deploy@your-server
cd /app/figma-shop

# edit file .env
nano .env
```

Thêm dòng sau vào cuối file:

```env
# sepay webhook authentication
SEPAY_API_KEY=Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8
```

Lưu file: `Ctrl + X` → `Y` → `Enter`

### 1.2. Restart Ứng Dụng

```bash
cd /app/figma-shop
docker-compose restart web
```

---

## 🔧 **BƯỚC 2: Cấu Hình Webhook Trong SePay Dashboard**

### 2.1. Đăng Nhập SePay

Truy cập: **[https://my.sepay.vn](https://my.sepay.vn)**

> 💡 **Môi trường Test:** Nếu muốn test trước, đăng ký tài khoản tại [my.dev.sepay.vn](https://my.dev.sepay.vn) và liên hệ SePay để kích hoạt.

### 2.2. Tạo Webhook Mới

**Bước 1:** Vào menu **"WebHooks"**

**Bước 2:** Click nút **"+ Thêm webhooks"** (góc phải trên)

**Bước 3:** Điền thông tin như sau:

#### 📝 **Thông Tin Cơ Bản**

- **Đặt tên:** `TKAIPro - Thanh toán đơn hàng`

#### 🎯 **Chọn Sự Kiện**

- Chọn: **"Có tiền vào"** (chỉ bắn webhook khi nhận tiền)

#### ⚙️ **Chọn Điều Kiện**

- **Khi tài khoản ngân hàng là:** Chọn tài khoản TP Bank `00003209087` (hoặc từng STK active nếu dùng chế độ luân phiên — xem mục bên dưới)
- **Bỏ qua nếu nội dung giao dịch không có Code thanh toán?:** Chọn **"Không"**
  > ⚠️ Quan trọng: Chọn "Không" để nhận tất cả giao dịch, sau đó code của bạn sẽ tự lọc

#### 🔁 **Nhiều tài khoản / chế độ luân phiên (round-robin)**

Admin → **Cài đặt** có 2 chế độ:

1. **Mặc định 1 TK** — mọi đơn/nạp ví mới dùng TK đang gắn sao mặc định (hành vi cũ).
2. **Luân phiên theo đơn** — mỗi đơn/nạp ví mới gán TK active tiếp theo theo `sortOrder`; TK được **gắn cứng (snapshot)** vào đơn/topup nên QR không đổi giữa chừng.

Khi bật luân phiên:

- Đăng ký webhook SePay cho **tất cả STK đang Active** (không chỉ TK mặc định). Có thể tạo nhiều webhook cùng URL, mỗi cái gắn 1 STK.
- Backend chỉ xử lý webhook khi `accountNumber` khớp một STK `isActive` trong DB; STK lạ → `200` + note ignore (tránh retry spam).
- Đổi mode / đổi default **không** ảnh hưởng đơn/topup pending đã có snapshot.

**Deploy migration:** chạy `drizzle/0026_bank_selection.sql` (tạo `payment_settings` + cột snapshot trên `order` / `wallet_topup`). Seed mode=`default` giữ hành vi hiện tại.

#### 🌐 **Thuộc Tính WebHooks**

- **Gọi đến URL:** 
  ```
  https://tkaipro.shop/api/webhooks/sepay
  ```
- **Là WebHooks xác thực thanh toán?:** Chọn **"Đúng"**
- **Gọi lại WebHooks khi?:** Chọn:
  - ✅ **"HTTP Status Code không nằm trong phạm vi từ 200 đến 299"**

#### 🔐 **Cấu Hình Chứng Thực WebHooks**

- **Kiểu chứng thực:** Chọn **"API Key"**
- **API Key:** Nhập:
  ```
  Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8
  ```
- **Request Content Type:** Chọn **"application/json"**

**Bước 4:** Click **"Thêm"** để hoàn tất

---

## 🧪 **BƯỚC 3: Test Webhook**

### Cách 1: Test Trong SePay Dashboard

1. Vào menu **"WebHooks"**
2. Tìm webhook vừa tạo
3. Click nút **"Test"** hoặc **"Gọi lại"**
4. Kiểm tra kết quả:
  - ✅ **Success:** Status 200, Response: `{"success": true}`
  - ❌ **Failed:** Kiểm tra logs

### Cách 2: Tạo Giao Dịch Thật

1. Tạo đơn hàng trên website: `https://tkaipro.shop/products`
2. Chuyển khoản với **ĐÚNG nội dung:**
  ```
   12345678ABC
  ```
3. Đợi 3-10 giây
4. Kiểm tra trang thanh toán có cập nhật không

### Cách 3: Giả Lập Giao Dịch (Môi Trường Dev)

Nếu dùng tài khoản dev:

1. Vào menu **"Giao dịch"** → **"Giả lập giao dịch"**
2. Điền thông tin:
  - Tài khoản: `00003209087`
  - Số tiền: `49000`
  - Nội dung: `99414751N6AU`
  - Loại: **"Tiền vào"**
3. Click **"Tạo"**
4. Kiểm tra webhook có bắn không

---

## 📊 **BƯỚC 4: Kiểm Tra Logs**

### 4.1. Xem Logs SePay

1. Vào menu **"Nhật ký"** → **"Nhật ký webhooks"**
2. Xem danh sách webhooks đã bắn
3. Kiểm tra status:
  - ✅ **Thành công:** Màu xanh, status 200
  - ❌ **Thất bại:** Màu đỏ, xem lỗi chi tiết

### 4.2. Xem Logs Server

```bash
# ssh vào server
ssh deploy@your-server
cd /app/figma-shop

# xem logs real-time
docker-compose logs -f web | grep -i sepay
```

**Logs thành công sẽ như sau:**

```
SePay webhook received: { gateway: 'TP Bank', ... }
Found matching order: ORD99414751N6AU
Payment confirmed for order ORD99414751N6AU
Credentials automatically assigned to order ORD99414751N6AU
```

---

## 🔍 **Cách Hoạt Động**

Theo [tài liệu SePay](https://docs.sepay.vn/tich-hop-webhooks.html):

### Luồng Dữ Liệu

```
Khách CK → Ngân hàng → SePay (1-5s)
                          ↓
        POST https://tkaipro.shop/api/webhooks/sepay
        Header: Authorization: Apikey Q7UVOV8...
        Body: {
          "id": 92704,
          "gateway": "TP Bank",
          "transactionDate": "2025-09-30 14:02:37",
          "accountNumber": "00003209087",
          "transferType": "in",
          "transferAmount": 49000,
          "content": "12345678ABC",
          ...
        }
                          ↓
        Server xử lý → Response: {"success": true}
                          ↓
        Cập nhật DB → Gửi email → Cấp credentials
```

### Retry Tự Động

SePay sẽ tự động gọi lại webhook nếu:

- Kết nối mạng thất bại
- HTTP Status Code không phải 200-299
- Thời gian retry theo dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13 phút
- Tối đa 7 lần retry trong 5 giờ

---

## ✅ **Checklist Hoàn Thành**

- Thêm `SEPAY_API_KEY` vào file `.env` trên server
- Restart ứng dụng: `docker-compose restart web`
- Tạo webhook trong SePay dashboard với API Key
- Chọn đúng tài khoản ngân hàng: `00003209087` (và mọi STK active nếu dùng round-robin)
- Cấu hình retry khi HTTP status không phải 200-299
- Test webhook bằng nút "Test" trong dashboard
- Tạo giao dịch thật để kiểm tra
- Chạy migration `0026_bank_selection.sql` trước khi deploy app (payment_settings + snapshot cột)
- Xem logs SePay và logs server để đảm bảo hoạt động

---

## 🛠 **Troubleshooting**

### ❌ Webhook không nhận được (Status: Failed to connect)

**Nguyên nhân:**

- Firewall chặn IP của SePay
- SSL certificate không hợp lệ
- Server đang down

**Giải pháp:**

```bash
# kiểm tra server có chạy không
curl -I https://tkaipro.shop/api/webhooks/sepay

# kiểm tra logs
docker-compose logs web | tail -50
```

### ❌ Webhook nhận được nhưng trả về 401 Unauthorized

**Nguyên nhân:**

- API Key không đúng
- Chưa thêm vào file `.env`
- Chưa restart server

**Giải pháp:**

```bash
# kiểm tra .env có SEPAY_API_KEY chưa
grep SEPAY_API_KEY .env

# restart lại
docker-compose restart web
```

### ❌ Webhook thành công nhưng đơn hàng không cập nhật

**Nguyên nhân:**

- Nội dung chuyển khoản không khớp
- Số tiền không đủ
- Code xử lý có lỗi

**Giải pháp:**

```bash
# xem logs chi tiết
docker-compose logs web | grep "Found matching order"

# nếu không thấy log này, có nghĩa là nội dung CK không khớp
```

---

## 📞 **Hỗ Trợ**

- **SePay Support:** [support@sepay.vn](mailto:support@sepay.vn)
- **Tài liệu:** [https://docs.sepay.vn/tich-hop-webhooks.html](https://docs.sepay.vn/tich-hop-webhooks.html)
- **Lập trình Webhook:** [https://docs.sepay.vn/lap-trinh-webhooks.html](https://docs.sepay.vn/lap-trinh-webhooks.html)

---

## 🎉 **Kết Quả Mong Đợi**

Sau khi hoàn thành:

- ✅ Khách hàng chuyển khoản → **Tự động phát hiện trong 3-10 giây**
- ✅ Đơn hàng tự động chuyển sang "Đã thanh toán"
- ✅ Credentials tự động cấp và hiển thị cho khách
- ✅ Admin nhận email thông báo đơn hàng mới
- ✅ Hệ thống an toàn với xác thực API Key

