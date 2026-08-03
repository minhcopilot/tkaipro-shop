import {
  boolean,
  integer,
  json,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const orderTable = pgTable("order", {
  id: text("id").primaryKey(),
  userId: text("user_id"), // có thể null cho guest checkout
  
  // thông tin đơn hàng
  orderNumber: text("order_number").notNull().unique(), // mã đơn hàng duy nhất
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled
  
  // thông tin sản phẩm
  items: json("items").$type<OrderItem[]>().notNull(),
  subtotal: integer("subtotal").notNull(), // tổng tiền chưa giảm giá (VND)
  discount: integer("discount").default(0), // số tiền giảm giá (VND)
  discountCode: text("discount_code"), // mã giảm giá đã sử dụng
  total: integer("total").notNull(), // tổng tiền sau giảm giá (VND)
  
  // thông tin khách hàng
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  
  // thông tin thanh toán
  paymentMethod: text("payment_method").notNull().default("bank_transfer"), // bank_transfer
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  // Nội dung CK tự nhiên hiển thị cho khách (VietQR addInfo) + mã ẩn match webhook
  paymentMemo: text("payment_memo").unique(),
  paymentToken: text("payment_token").unique(),

  // TK ngân hàng gắn cứng lúc tạo đơn (QR ổn định dù admin đổi mode/default)
  bankAccountId: text("bank_account_id"),
  bankName: text("bank_name"),
  bankCode: text("bank_code"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  
  // thông tin SePay
  sepayTransactionId: text("sepay_transaction_id"), // ID giao dịch từ SePay
  sepayReference: text("sepay_reference"), // mã tham chiếu SePay
  sepayQrCode: text("sepay_qr_code"), // URL QR code thanh toán
  
  // tài khoản đã cấp
  assignedCredentials: json("assigned_credentials").$type<AssignedCredential[]>(),

  // mã active dùng khi khách submit /activate (chỉ gen khi thanh toán xong + có item login_link)
  // 8 ký tự [A-Z0-9], unique theo đơn
  activationCode: text("activation_code"),

  // cờ vô hiệu hoá active - admin dùng khi duyệt nhầm đơn để chặn khách active
  // (dù slot còn + code đúng). Khi true: /api/public/activate trả 403 ACTIVATION_DISABLED.
  activationDisabled: boolean("activation_disabled").default(false).notNull(),
  activationDisabledReason: text("activation_disabled_reason"),
  activationDisabledAt: timestamp("activation_disabled_at"),
  activationDisabledBy: text("activation_disabled_by"), // email/id admin thực hiện

  // locale của khách lúc tạo đơn (vi/en/...). Email + activation link sẽ dùng locale này.
  // null => default 'vi' (đơn cũ trước feature i18n).
  locale: text("locale").default("vi"),

  // metadata
  notes: text("notes"), // ghi chú của khách hàng
  adminNotes: text("admin_notes"), // ghi chú của admin

  // forensics — lưu IP/UA lúc tạo đơn để truy vết spam/fraud
  clientIp: text("client_ip"),
  userAgent: text("user_agent"),

  // legal consent audit trail — set at checkout when customer accepts Terms
  termsAcceptedAt: timestamp("terms_accepted_at"),
  termsVersion: text("terms_version"),

  // Affiliate API — đánh dấu đơn do CTV nào đặt hộ qua /api/affiliate/orders.
  // Cả 2 cột nullable: đơn user thường = NULL.
  // Khi set, customerEmail/Name là của END-CUSTOMER (khách cuối CTV bán hàng),
  // không phải email CTV. Pricing dùng affiliate_pricing_row.affiliatePrice
  // (rẻ hơn retail) và trừ vndBalance của CTV.
  affiliateUserId: text("affiliate_user_id"),
  affiliateApiKeyId: text("affiliate_api_key_id"),

  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"), // thời gian thanh toán thành công
});

// bảng lưu các giao dịch từ SePay webhook
export const sepayTransactionTable = pgTable("sepay_transaction", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => orderTable.id),
  
  // dữ liệu từ SePay webhook
  gateway: text("gateway").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  accountNumber: text("account_number"),
  subAccount: text("sub_account"),
  
  transferType: text("transfer_type").notNull(), // "in" hoặc "out"
  transferAmount: integer("transfer_amount").notNull(),
  accumulated: integer("accumulated").notNull(),
  
  code: text("code"),
  content: text("content"), // nội dung chuyển khoản
  referenceCode: text("reference_code"),
  description: text("description"),
  
  // trạng thái xử lý
  processed: boolean("processed").default(false),
  
  // raw webhook data
  rawData: json("raw_data"),
  
  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// types
export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  productType?: "account" | "license" | "upgrade" | "login_link";
  // Snapshot flag — khi true, đơn này khách không phải nhập password Cursor
  // (chỉ có email + contactInfo). Lưu vào item để admin biết được lý do thiếu
  // password trong order detail (không phải KH quên).
  upgradeEmailOnly?: boolean;
  upgradeCredentials?: {
    email: string;
    password?: string;          // optional khi upgradeEmailOnly = true
    contactInfo?: string;       // telegram id hoặc facebook link
  };
}

export interface AssignedCredential {
  productId: string;
  productName: string;
  username: string;
  /** License key ciphertext, or empty for account emails (password from manager vault). */
  password?: string;
  assignedAt: string; // ISO date string
} 