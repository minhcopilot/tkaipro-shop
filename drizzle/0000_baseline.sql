CREATE TYPE "public"."type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "polar_customer" (
	"created_at" timestamp NOT NULL,
	"customer_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "polar_customer_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "polar_subscription" (
	"created_at" timestamp NOT NULL,
	"customer_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"status" text NOT NULL,
	"subscription_id" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "polar_subscription_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
CREATE TABLE "bank_account" (
	"account_name" varchar(200) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"bank_code" varchar(20) NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"bank_selection_mode" text DEFAULT 'default' NOT NULL,
	"rr_cursor_bank_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"name_locales" json DEFAULT '{}'::json,
	"image" text,
	"parent_id" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_restock_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"email" text NOT NULL,
	"locale" text DEFAULT 'vi' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"short_description" text,
	"name_locales" json DEFAULT '{}'::json,
	"description_locales" json DEFAULT '{}'::json,
	"short_description_locales" json DEFAULT '{}'::json,
	"features_locales" json DEFAULT '{}'::json,
	"price" integer NOT NULL,
	"original_price" integer,
	"cost_price" integer DEFAULT 0,
	"duration" integer DEFAULT 30,
	"image" text,
	"images" json DEFAULT '[]'::json,
	"in_stock" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer DEFAULT 0,
	"is_popular" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"rating" real DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"features" json DEFAULT '[]'::json,
	"specs" json DEFAULT '{}'::json,
	"tags" json DEFAULT '[]'::json,
	"product_type" text DEFAULT 'account' NOT NULL,
	"upgrade_email_only" boolean DEFAULT false NOT NULL,
	"linked_upgrade_product_id" text,
	"hidden_from_listing" boolean DEFAULT false NOT NULL,
	"account_credentials" json DEFAULT '[]'::json,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"type" "type" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"url" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"backup_codes" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"age" integer,
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"first_name" text,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"last_name" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"two_factor_enabled" boolean,
	"updated_at" timestamp NOT NULL,
	"vnd_balance" integer DEFAULT 0 NOT NULL,
	"usd_balance" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" json NOT NULL,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0,
	"discount_code" text,
	"total" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"payment_method" text DEFAULT 'bank_transfer' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_memo" text,
	"payment_token" text,
	"bank_account_id" text,
	"bank_name" text,
	"bank_code" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"sepay_transaction_id" text,
	"sepay_reference" text,
	"sepay_qr_code" text,
	"assigned_credentials" json,
	"activation_code" text,
	"activation_disabled" boolean DEFAULT false NOT NULL,
	"activation_disabled_reason" text,
	"activation_disabled_at" timestamp,
	"activation_disabled_by" text,
	"locale" text DEFAULT 'vi',
	"notes" text,
	"admin_notes" text,
	"client_ip" text,
	"user_agent" text,
	"terms_accepted_at" timestamp,
	"terms_version" text,
	"affiliate_user_id" text,
	"affiliate_api_key_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "order_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "order_payment_memo_unique" UNIQUE("payment_memo"),
	CONSTRAINT "order_payment_token_unique" UNIQUE("payment_token")
);
--> statement-breakpoint
CREATE TABLE "sepay_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"gateway" text NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"account_number" text,
	"sub_account" text,
	"transfer_type" text NOT NULL,
	"transfer_amount" integer NOT NULL,
	"accumulated" integer NOT NULL,
	"code" text,
	"content" text,
	"reference_code" text,
	"description" text,
	"processed" boolean DEFAULT false,
	"raw_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"assigned_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_expired" boolean DEFAULT false,
	"customer_email" text NOT NULL,
	"product_name" text NOT NULL,
	"reminder_3day_sent_at" timestamp,
	"reminder_1day_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license" (
	"id" text PRIMARY KEY NOT NULL,
	"product_code" text NOT NULL,
	"product_name" text NOT NULL,
	"license_name" text NOT NULL,
	"license_key" text NOT NULL,
	"user_id" text,
	"assignee_name" text,
	"expiry_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_used" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "social_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"platform" varchar(50) NOT NULL,
	"product_type" varchar(100) NOT NULL,
	"order_number" varchar(100),
	"customer_name" varchar(255),
	"amount" varchar(100),
	"order_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" varchar(10) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" varchar(100) DEFAULT 'General' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"featured_image" text,
	"author_id" text NOT NULL,
	"author_name" varchar(255),
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" json DEFAULT '[]'::json,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"locale" varchar(10) DEFAULT 'vi' NOT NULL,
	"published_at" timestamp with time zone,
	"read_time" integer,
	"view_count" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"reply" text,
	"reply_at" timestamp,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" json NOT NULL,
	"content" json NOT NULL,
	"type" varchar(20) DEFAULT 'general' NOT NULL,
	"image_url" text,
	"link_url" text,
	"link_text" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_voucher_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_id" text,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"diff" json,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_voucher_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_id" text NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"customer_email" text NOT NULL,
	"subtotal_at_redemption" integer NOT NULL,
	"discount_applied" integer NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_voucher" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"owner_user_id" text,
	"issued_by_admin_id" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_amount" integer,
	"min_order_subtotal" integer DEFAULT 0,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"bound_user_id" text,
	"bound_email" text,
	"allowed_product_ids" json DEFAULT '[]'::json,
	"allowed_category_ids" json DEFAULT '[]'::json,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"disabled_reason" text,
	"disabled_at" timestamp,
	"disabled_by_admin_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_voucher_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "auto_ban_exempt" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"note" text,
	"created_by" text,
	"created_by_label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ban_list" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"reason" text,
	"banned_by" text,
	"banned_by_label" text,
	"banned_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_otp" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"ip" text,
	"fingerprint" text,
	"did" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"outcome" text,
	"reason_code" text,
	"customer_email" text,
	"client_ip" text,
	"country" text,
	"user_agent" text,
	"message" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ip_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" text,
	"event_type" text NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text,
	"order_id" text,
	"country" text,
	"fingerprint" text,
	"did" text,
	"path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_topup" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"currency" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"crypto_method_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transfer_content" text NOT NULL,
	"bank_account_id" text,
	"bank_name" text,
	"bank_code" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"proof_image_url" text,
	"sepay_transaction_id" text,
	"confirmed_by_user_id" text,
	"rejected_reason" text,
	"client_ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"currency" text NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"note" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "polar_customer" ADD CONSTRAINT "polar_customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polar_subscription" ADD CONSTRAINT "polar_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_restock_alert" ADD CONSTRAINT "product_restock_alert_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepay_transaction" ADD CONSTRAINT "sepay_transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_proofs" ADD CONSTRAINT "social_proofs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher_audit_log" ADD CONSTRAINT "affiliate_voucher_audit_log_voucher_id_affiliate_voucher_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."affiliate_voucher"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher_audit_log" ADD CONSTRAINT "affiliate_voucher_audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher_redemption" ADD CONSTRAINT "affiliate_voucher_redemption_voucher_id_affiliate_voucher_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."affiliate_voucher"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher_redemption" ADD CONSTRAINT "affiliate_voucher_redemption_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher_redemption" ADD CONSTRAINT "affiliate_voucher_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher" ADD CONSTRAINT "affiliate_voucher_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher" ADD CONSTRAINT "affiliate_voucher_issued_by_admin_id_user_id_fk" FOREIGN KEY ("issued_by_admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_voucher" ADD CONSTRAINT "affiliate_voucher_bound_user_id_user_id_fk" FOREIGN KEY ("bound_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_restock_alert_product_email_uniq" ON "product_restock_alert" USING btree ("product_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_voucher_order" ON "affiliate_voucher_redemption" USING btree ("voucher_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_ban_exempt_kind_value_uniq" ON "auto_ban_exempt" USING btree ("kind","value");--> statement-breakpoint
CREATE UNIQUE INDEX "ban_list_kind_value_uniq" ON "ban_list" USING btree ("kind","value");--> statement-breakpoint
CREATE INDEX "ban_list_kind_idx" ON "ban_list" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "ban_list_until_idx" ON "ban_list" USING btree ("banned_until");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_otp_email_uniq" ON "registration_otp" USING btree ("email");--> statement-breakpoint
CREATE INDEX "registration_otp_expires_idx" ON "registration_otp" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "security_event_type_idx" ON "security_event" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "security_event_email_idx" ON "security_event" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "security_event_ip_idx" ON "security_event" USING btree ("client_ip");--> statement-breakpoint
CREATE INDEX "user_ip_log_user_idx" ON "user_ip_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_ip_log_ip_idx" ON "user_ip_log" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "user_ip_log_email_idx" ON "user_ip_log" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_ip_log_event_idx" ON "user_ip_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "user_ip_log_fp_idx" ON "user_ip_log" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "user_ip_log_did_idx" ON "user_ip_log" USING btree ("did");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_topup_transfer_content_uniq" ON "wallet_topup" USING btree ("transfer_content");--> statement-breakpoint
CREATE INDEX "wallet_topup_user_created_idx" ON "wallet_topup" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_topup_status_idx" ON "wallet_topup" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "wallet_transaction_user_created_idx" ON "wallet_transaction" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_transaction_ref_idx" ON "wallet_transaction" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE INDEX "wallet_transaction_type_idx" ON "wallet_transaction" USING btree ("type","created_at");