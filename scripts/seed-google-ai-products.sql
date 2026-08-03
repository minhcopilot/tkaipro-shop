-- Seed TKAIPro: Google AI category + 4 account products.
-- Idempotent by slug. Prices are VND placeholders — admin may adjust later.
-- stock_quantity = 0 (no credentials invented).

BEGIN;

INSERT INTO product_category (
  id, name, slug, description, name_locales, image, parent_id,
  is_active, sort_order, created_at, updated_at
)
SELECT
  'catTkGoogleAI00000001',
  'Google AI',
  'google-ai',
  'Tài khoản Google AI và Antigravity',
  '{"en":"Google AI","vi":"Google AI"}'::json,
  NULL,
  NULL,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM product_category WHERE slug = 'google-ai'
);

DO $$
DECLARE
  cat_id text;
BEGIN
  SELECT id INTO cat_id FROM product_category WHERE slug = 'google-ai' LIMIT 1;
  IF cat_id IS NULL THEN
    RAISE EXCEPTION 'Category google-ai missing after insert';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE slug = 'google-pro') THEN
    INSERT INTO product (
      id, name, slug, category,
      description, short_description,
      name_locales, description_locales, short_description_locales, features_locales,
      price, original_price, cost_price, duration,
      image, images,
      in_stock, stock_quantity,
      is_popular, is_featured, rating, review_count, sales_count,
      features, specs, tags,
      product_type, upgrade_email_only, linked_upgrade_product_id, hidden_from_listing,
      account_credentials,
      status, sort_order,
      created_at, updated_at
    ) VALUES (
      'prodTkGooglePro000001',
      'Google AI Pro',
      'google-pro',
      cat_id,
      'Nhận tài khoản Google AI Pro từ kho shop sau khi thanh toán.',
      'Tài khoản Google AI Pro — Gemini nâng cao, giao từ kho khi còn hàng.',
      '{"vi":"Google AI Pro","en":"Google AI Pro"}'::json,
      '{"vi":"Nhận tài khoản Google AI Pro từ kho shop sau khi thanh toán.","en":"Receive a Google AI Pro account from shop inventory after payment."}'::json,
      '{"vi":"Tài khoản Google AI Pro — Gemini nâng cao, giao từ kho khi còn hàng.","en":"Google AI Pro account — advanced Gemini access, delivered from stock when available."}'::json,
      '{"vi":["Giao tài khoản từ kho","Google AI Pro / Gemini nâng cao","Bảo hành theo thời hạn gói","Hỗ trợ qua Telegram/Facebook"],"en":["Stocked account delivery","Google AI Pro / advanced Gemini","Warranty for the plan duration","Support via Telegram/Facebook"]}'::json,
      199000, 399000, 0, 30,
      '/logo.png', '[]'::json,
      false, 0,
      true, true, 0, 0, 0,
      '["Giao tài khoản từ kho","Google AI Pro / Gemini nâng cao","Bảo hành theo thời hạn gói","Hỗ trợ qua Telegram/Facebook"]'::json,
      '{}'::json,
      '["google","google-ai","gemini","pro","tai-khoan"]'::json,
      'account', false, NULL, false,
      '[]'::json,
      'active', 10,
      NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE slug = 'google-ultra') THEN
    INSERT INTO product (
      id, name, slug, category,
      description, short_description,
      name_locales, description_locales, short_description_locales, features_locales,
      price, original_price, cost_price, duration,
      image, images,
      in_stock, stock_quantity,
      is_popular, is_featured, rating, review_count, sales_count,
      features, specs, tags,
      product_type, upgrade_email_only, linked_upgrade_product_id, hidden_from_listing,
      account_credentials,
      status, sort_order,
      created_at, updated_at
    ) VALUES (
      'prodTkGoogleUltra00001',
      'Google AI Ultra',
      'google-ultra',
      cat_id,
      'Nhận tài khoản Google AI Ultra từ kho shop sau khi thanh toán.',
      'Tài khoản Google AI Ultra — quyền lợi cao cấp nhất trong dòng Google AI.',
      '{"vi":"Google AI Ultra","en":"Google AI Ultra"}'::json,
      '{"vi":"Nhận tài khoản Google AI Ultra từ kho shop sau khi thanh toán.","en":"Receive a Google AI Ultra account from shop inventory after payment."}'::json,
      '{"vi":"Tài khoản Google AI Ultra — quyền lợi cao cấp nhất trong dòng Google AI.","en":"Google AI Ultra account — top-tier Google AI plan benefits."}'::json,
      '{"vi":["Giao tài khoản từ kho","Google AI Ultra","Bảo hành theo thời hạn gói","Hỗ trợ ưu tiên"],"en":["Stocked account delivery","Google AI Ultra","Warranty for the plan duration","Priority support"]}'::json,
      499000, 999000, 0, 30,
      '/logo.png', '[]'::json,
      false, 0,
      true, true, 0, 0, 0,
      '["Giao tài khoản từ kho","Google AI Ultra","Bảo hành theo thời hạn gói","Hỗ trợ ưu tiên"]'::json,
      '{}'::json,
      '["google","google-ai","gemini","ultra","tai-khoan"]'::json,
      'account', false, NULL, false,
      '[]'::json,
      'active', 20,
      NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE slug = 'google-antigravity-pro') THEN
    INSERT INTO product (
      id, name, slug, category,
      description, short_description,
      name_locales, description_locales, short_description_locales, features_locales,
      price, original_price, cost_price, duration,
      image, images,
      in_stock, stock_quantity,
      is_popular, is_featured, rating, review_count, sales_count,
      features, specs, tags,
      product_type, upgrade_email_only, linked_upgrade_product_id, hidden_from_listing,
      account_credentials,
      status, sort_order,
      created_at, updated_at
    ) VALUES (
      'prodTkAntiPro00000001',
      'Google Antigravity Pro',
      'google-antigravity-pro',
      cat_id,
      'Nhận tài khoản Google Antigravity Pro từ kho shop sau khi thanh toán.',
      'Tài khoản Google Antigravity Pro — giao từ kho khi còn hàng.',
      '{"vi":"Google Antigravity Pro","en":"Google Antigravity Pro"}'::json,
      '{"vi":"Nhận tài khoản Google Antigravity Pro từ kho shop sau khi thanh toán.","en":"Receive a Google Antigravity Pro account from shop inventory after payment."}'::json,
      '{"vi":"Tài khoản Google Antigravity Pro — giao từ kho khi còn hàng.","en":"Google Antigravity Pro account — delivered from stock when available."}'::json,
      '{"vi":["Giao tài khoản từ kho","Antigravity Pro","Bảo hành theo thời hạn gói","Hỗ trợ qua Telegram/Facebook"],"en":["Stocked account delivery","Antigravity Pro","Warranty for the plan duration","Support via Telegram/Facebook"]}'::json,
      249000, 499000, 0, 30,
      '/logo.png', '[]'::json,
      false, 0,
      true, true, 0, 0, 0,
      '["Giao tài khoản từ kho","Antigravity Pro","Bảo hành theo thời hạn gói","Hỗ trợ qua Telegram/Facebook"]'::json,
      '{}'::json,
      '["google","antigravity","pro","tai-khoan"]'::json,
      'account', false, NULL, false,
      '[]'::json,
      'active', 30,
      NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE slug = 'google-antigravity-ultra') THEN
    INSERT INTO product (
      id, name, slug, category,
      description, short_description,
      name_locales, description_locales, short_description_locales, features_locales,
      price, original_price, cost_price, duration,
      image, images,
      in_stock, stock_quantity,
      is_popular, is_featured, rating, review_count, sales_count,
      features, specs, tags,
      product_type, upgrade_email_only, linked_upgrade_product_id, hidden_from_listing,
      account_credentials,
      status, sort_order,
      created_at, updated_at
    ) VALUES (
      'prodTkAntiUltra0000001',
      'Google Antigravity Ultra',
      'google-antigravity-ultra',
      cat_id,
      'Nhận tài khoản Google Antigravity Ultra từ kho shop sau khi thanh toán.',
      'Tài khoản Google Antigravity Ultra — gói cao cấp Antigravity.',
      '{"vi":"Google Antigravity Ultra","en":"Google Antigravity Ultra"}'::json,
      '{"vi":"Nhận tài khoản Google Antigravity Ultra từ kho shop sau khi thanh toán.","en":"Receive a Google Antigravity Ultra account from shop inventory after payment."}'::json,
      '{"vi":"Tài khoản Google Antigravity Ultra — gói cao cấp Antigravity.","en":"Google Antigravity Ultra account — top Antigravity plan."}'::json,
      '{"vi":["Giao tài khoản từ kho","Antigravity Ultra","Bảo hành theo thời hạn gói","Hỗ trợ ưu tiên"],"en":["Stocked account delivery","Antigravity Ultra","Warranty for the plan duration","Priority support"]}'::json,
      599000, 1199000, 0, 30,
      '/logo.png', '[]'::json,
      false, 0,
      true, true, 0, 0, 0,
      '["Giao tài khoản từ kho","Antigravity Ultra","Bảo hành theo thời hạn gói","Hỗ trợ ưu tiên"]'::json,
      '{}'::json,
      '["google","antigravity","ultra","tai-khoan"]'::json,
      'account', false, NULL, false,
      '[]'::json,
      'active', 40,
      NOW(), NOW()
    );
  END IF;
END $$;

COMMIT;
