import {
  boolean,
  integer,
  json,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type LocaleMap = Record<string, string>;

export const productTable = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),

  // i18n: JSON locale maps for translated content
  nameLocales: json("name_locales").$type<LocaleMap>().default({}),
  descriptionLocales: json("description_locales").$type<LocaleMap>().default({}),
  shortDescriptionLocales: json("short_description_locales").$type<LocaleMap>().default({}),
  featuresLocales: json("features_locales").$type<Record<string, string[]>>().default({}),
  
  // pricing
  price: integer("price").notNull(), // giá bán hiện tại (VND)
  originalPrice: integer("original_price"), // giá gốc hiển thị (VND)
  costPrice: integer("cost_price").default(0), // giá nhập/vốn (VND) - dùng để tính lợi nhuận
  
  // subscription duration for cursor pro accounts (in days)
  duration: integer("duration").default(30), // thời hạn tính bằng ngày, mặc định 30 ngày
  
  // product details
  image: text("image"), // url hình ảnh chính
  images: json("images").$type<string[]>().default([]), // mảng urls hình ảnh
  inStock: boolean("in_stock").notNull().default(true),
  stockQuantity: integer("stock_quantity").default(0),
  
  // marketing
  isPopular: boolean("is_popular").default(false),
  isFeatured: boolean("is_featured").default(false),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  // Tổng số lượng đã bán (sum quantity across paid orders). Cached counter,
  // increment khi đơn chuyển sang paymentStatus='paid'. Backfill bằng script.
  salesCount: integer("sales_count").notNull().default(0),
  
  // additional data
  features: json("features").$type<string[]>().default([]), // danh sách tính năng
  specs: json("specs").$type<Record<string, string>>().default({}), // thông số kỹ thuật
  tags: json("tags").$type<string[]>().default([]), // tags cho SEO
  
  // product type: "account" for email-only pool, "license" for license keys, "upgrade" for nâng cấp chính chủ, "login_link" for shared activation link
  productType: text("product_type").notNull().default("account"), // account, license, upgrade, login_link

  // Chỉ áp dụng khi productType === 'upgrade'.
  // Khi true: checkout chỉ yêu cầu email Cursor + Telegram/FB liên hệ (bỏ ô mật khẩu Cursor).
  // Mặc định false để giữ behavior cũ — admin opt-in trên từng product nâng cấp chính chủ.
  upgradeEmailOnly: boolean("upgrade_email_only").notNull().default(false),

  // "Upgrade option" feature: an account/license product can link to a hidden
  // upgrade product so its detail page shows a "Nâng cấp chính chủ" choice
  // instead of creating a separate listing card. Points to product.id of a
  // productType='upgrade' row.
  linkedUpgradeProductId: text("linked_upgrade_product_id"),

  // Hide this product from the customer catalog/search/sitemap while keeping it
  // purchasable by id (used for linked upgrade products so they don't clutter
  // the listing). Admin views still show it.
  hiddenFromListing: boolean("hidden_from_listing").notNull().default(false),

  // account credentials for cursor pro accounts or license keys for jetbrains
  // format: email-only for account type (Cursor password in manager vault), "license-key" for license type
  accountCredentials: json("account_credentials").$type<string[]>().default([]), // danh sách email hoặc license keys
  
  // metadata
  status: text("status").notNull().default("active"), // active, inactive, draft
  sortOrder: integer("sort_order").default(0),
  
  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productRestockAlertTable = pgTable(
  "product_restock_alert",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    locale: text("locale").notNull().default("vi"),
    status: text("status").notNull().default("pending"), // pending | notified
    createdAt: timestamp("created_at").notNull().defaultNow(),
    notifiedAt: timestamp("notified_at"),
  },
  (t) => ({
    productEmailUniq: uniqueIndex("product_restock_alert_product_email_uniq").on(
      t.productId,
      t.email,
    ),
  }),
);

export const productCategoryTable = pgTable("product_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  nameLocales: json("name_locales").$type<LocaleMap>().default({}),
  image: text("image"),
  parentId: text("parent_id"),
  
  // metadata
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}); 