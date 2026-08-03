/**
 * Seed TKAIPro Google AI / Antigravity products.
 *
 * Usage (from tkaipro-shop root, with DATABASE_URL set):
 *   bun run scripts/seed-google-ai-products.ts
 *
 * Idempotent by slug. Does NOT invent credentials — account pool stays empty.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { productCategoryTable, productTable } from "~/db/schema";

const CATEGORY_SLUG = "google-ai";

const PRODUCTS = [
  {
    slug: "google-pro",
    name: "Google AI Pro",
    nameLocales: { vi: "Google AI Pro", en: "Google AI Pro" },
    shortDescription:
      "Tài khoản Google AI Pro — Gemini nâng cao, giao từ kho khi còn hàng.",
    shortDescriptionLocales: {
      vi: "Tài khoản Google AI Pro — Gemini nâng cao, giao từ kho khi còn hàng.",
      en: "Google AI Pro account — advanced Gemini access, delivered from stock when available.",
    },
    description:
      "Nhận tài khoản Google AI Pro từ kho shop sau khi thanh toán.\n\nPhù hợp nếu bạn cần gói Pro sẵn dùng. Admin sẽ import credential vào kho trước khi mở bán đủ hàng.",
    descriptionLocales: {
      vi: "Nhận tài khoản Google AI Pro từ kho shop sau khi thanh toán. Phù hợp nếu bạn cần gói Pro sẵn dùng.",
      en: "Receive a Google AI Pro account from shop inventory after payment. Best if you need a ready-to-use Pro plan.",
    },
    features: [
      "Giao tài khoản từ kho",
      "Google AI Pro / Gemini nâng cao",
      "Bảo hành theo thời hạn gói",
      "Hỗ trợ qua Telegram/Facebook",
    ],
    featuresLocales: {
      vi: [
        "Giao tài khoản từ kho",
        "Google AI Pro / Gemini nâng cao",
        "Bảo hành theo thời hạn gói",
        "Hỗ trợ qua Telegram/Facebook",
      ],
      en: [
        "Stocked account delivery",
        "Google AI Pro / advanced Gemini",
        "Warranty for the plan duration",
        "Support via Telegram/Facebook",
      ],
    },
    price: 199_000,
    originalPrice: 399_000,
    tags: ["google", "google-ai", "gemini", "pro", "tai-khoan"],
    sortOrder: 10,
    isPopular: true,
    isFeatured: true,
  },
  {
    slug: "google-ultra",
    name: "Google AI Ultra",
    nameLocales: { vi: "Google AI Ultra", en: "Google AI Ultra" },
    shortDescription:
      "Tài khoản Google AI Ultra — quyền lợi cao cấp nhất trong dòng Google AI.",
    shortDescriptionLocales: {
      vi: "Tài khoản Google AI Ultra — quyền lợi cao cấp nhất trong dòng Google AI.",
      en: "Google AI Ultra account — top-tier Google AI plan benefits.",
    },
    description:
      "Nhận tài khoản Google AI Ultra từ kho shop sau khi thanh toán.\n\nGói Ultra dành cho nhu cầu dùng AI nặng / nhiều hạn mức hơn Pro.",
    descriptionLocales: {
      vi: "Nhận tài khoản Google AI Ultra từ kho shop sau khi thanh toán. Gói Ultra dành cho nhu cầu dùng AI nặng hơn Pro.",
      en: "Receive a Google AI Ultra account from shop inventory after payment. Ultra is for heavier AI usage than Pro.",
    },
    features: [
      "Giao tài khoản từ kho",
      "Google AI Ultra",
      "Bảo hành theo thời hạn gói",
      "Hỗ trợ ưu tiên",
    ],
    featuresLocales: {
      vi: [
        "Giao tài khoản từ kho",
        "Google AI Ultra",
        "Bảo hành theo thời hạn gói",
        "Hỗ trợ ưu tiên",
      ],
      en: [
        "Stocked account delivery",
        "Google AI Ultra",
        "Warranty for the plan duration",
        "Priority support",
      ],
    },
    price: 499_000,
    originalPrice: 999_000,
    tags: ["google", "google-ai", "gemini", "ultra", "tai-khoan"],
    sortOrder: 20,
    isPopular: true,
    isFeatured: true,
  },
  {
    slug: "google-antigravity-pro",
    name: "Google Antigravity Pro",
    nameLocales: {
      vi: "Google Antigravity Pro",
      en: "Google Antigravity Pro",
    },
    shortDescription:
      "Tài khoản Google Antigravity Pro — giao từ kho khi còn hàng.",
    shortDescriptionLocales: {
      vi: "Tài khoản Google Antigravity Pro — giao từ kho khi còn hàng.",
      en: "Google Antigravity Pro account — delivered from stock when available.",
    },
    description:
      "Nhận tài khoản Google Antigravity Pro từ kho shop sau khi thanh toán.\n\nPhù hợp nếu bạn cần gói Antigravity Pro sẵn dùng.",
    descriptionLocales: {
      vi: "Nhận tài khoản Google Antigravity Pro từ kho shop sau khi thanh toán.",
      en: "Receive a Google Antigravity Pro account from shop inventory after payment.",
    },
    features: [
      "Giao tài khoản từ kho",
      "Antigravity Pro",
      "Bảo hành theo thời hạn gói",
      "Hỗ trợ qua Telegram/Facebook",
    ],
    featuresLocales: {
      vi: [
        "Giao tài khoản từ kho",
        "Antigravity Pro",
        "Bảo hành theo thời hạn gói",
        "Hỗ trợ qua Telegram/Facebook",
      ],
      en: [
        "Stocked account delivery",
        "Antigravity Pro",
        "Warranty for the plan duration",
        "Support via Telegram/Facebook",
      ],
    },
    price: 249_000,
    originalPrice: 499_000,
    tags: ["google", "antigravity", "pro", "tai-khoan"],
    sortOrder: 30,
    isPopular: true,
    isFeatured: true,
  },
  {
    slug: "google-antigravity-ultra",
    name: "Google Antigravity Ultra",
    nameLocales: {
      vi: "Google Antigravity Ultra",
      en: "Google Antigravity Ultra",
    },
    shortDescription:
      "Tài khoản Google Antigravity Ultra — gói cao cấp Antigravity.",
    shortDescriptionLocales: {
      vi: "Tài khoản Google Antigravity Ultra — gói cao cấp Antigravity.",
      en: "Google Antigravity Ultra account — top Antigravity plan.",
    },
    description:
      "Nhận tài khoản Google Antigravity Ultra từ kho shop sau khi thanh toán.\n\nGói Ultra dành cho nhu cầu Antigravity cao cấp hơn Pro.",
    descriptionLocales: {
      vi: "Nhận tài khoản Google Antigravity Ultra từ kho shop sau khi thanh toán.",
      en: "Receive a Google Antigravity Ultra account from shop inventory after payment.",
    },
    features: [
      "Giao tài khoản từ kho",
      "Antigravity Ultra",
      "Bảo hành theo thời hạn gói",
      "Hỗ trợ ưu tiên",
    ],
    featuresLocales: {
      vi: [
        "Giao tài khoản từ kho",
        "Antigravity Ultra",
        "Bảo hành theo thời hạn gói",
        "Hỗ trợ ưu tiên",
      ],
      en: [
        "Stocked account delivery",
        "Antigravity Ultra",
        "Warranty for the plan duration",
        "Priority support",
      ],
    },
    price: 599_000,
    originalPrice: 1_199_000,
    tags: ["google", "antigravity", "ultra", "tai-khoan"],
    sortOrder: 40,
    isPopular: true,
    isFeatured: true,
  },
] as const;

async function main() {
  let category = await db.query.productCategoryTable.findFirst({
    where: eq(productCategoryTable.slug, CATEGORY_SLUG),
  });

  if (!category) {
    const [created] = await db
      .insert(productCategoryTable)
      .values({
        id: nanoid(),
        name: "Google AI",
        slug: CATEGORY_SLUG,
        description: "Tài khoản Google AI và Antigravity",
        nameLocales: { en: "Google AI", vi: "Google AI" },
        isActive: true,
        sortOrder: 0,
      })
      .returning();
    category = created;
    console.log("Created category:", category.id, category.slug);
  } else {
    console.log("Category exists:", category.id, category.slug);
  }

  const results = [];

  for (const p of PRODUCTS) {
    let existing = await db.query.productTable.findFirst({
      where: eq(productTable.slug, p.slug),
    });

    if (!existing) {
      const [created] = await db
        .insert(productTable)
        .values({
          id: nanoid(),
          name: p.name,
          slug: p.slug,
          category: category.id,
          description: p.description,
          shortDescription: p.shortDescription,
          nameLocales: p.nameLocales,
          descriptionLocales: p.descriptionLocales,
          shortDescriptionLocales: p.shortDescriptionLocales,
          featuresLocales: p.featuresLocales,
          price: p.price,
          originalPrice: p.originalPrice,
          costPrice: 0,
          duration: 30,
          image: "/logo.png",
          inStock: false,
          stockQuantity: 0,
          isPopular: p.isPopular,
          isFeatured: p.isFeatured,
          features: [...p.features],
          tags: [...p.tags],
          productType: "account",
          upgradeEmailOnly: false,
          hiddenFromListing: false,
          accountCredentials: [],
          status: "active",
          sortOrder: p.sortOrder,
        })
        .returning();
      existing = created;
      console.log("Created product:", existing.id, existing.slug, existing.price);
    } else {
      console.log("Product exists:", existing.id, existing.slug);
    }

    results.push({
      id: existing.id,
      slug: existing.slug,
      price: existing.price,
      stockQuantity: existing.stockQuantity,
    });
  }

  console.log("\nDone.");
  console.log({ category: { id: category.id, slug: category.slug }, products: results });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
