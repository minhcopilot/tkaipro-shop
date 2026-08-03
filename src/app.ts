// Nhà bán lẻ độc lập, không dùng "Google" trong tên thương hiệu.
// "Google" / "Antigravity" chỉ được nhắc tới như mô tả sự thật về sản phẩm
// (nominative fair use) trên card sản phẩm, checkout và các trang công bố.
//
// Toàn bộ giá trị dưới đây đọc từ env để đổi tên miền/thương hiệu không phải
// sửa code. Lưu ý: biến NEXT_PUBLIC_* được Next.js nhúng vào bundle lúc BUILD,
// nên khi đổi phải build lại (xem build args trong Dockerfile).
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "TKAIPro";
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3003";

export const SEO_CONFIG = {
  description: "", // Managed by i18n (messages/{locale}.json)
  fullName:
    process.env.NEXT_PUBLIC_SITE_FULL_NAME || `${SITE_NAME} - Google AI accounts`,
  name: SITE_NAME,
  slogan: "", // Managed by i18n
  keywords: "", // Managed by i18n
  url: SITE_URL,
  image: "/logo.png",
  ogImage: "/api/og", // dynamic OG image generation
  downloadUrl: "https://gemini.google.com/",
  // Independent disclaimer rendered prominently on landing surfaces.
  affiliationDisclaimer:
    process.env.NEXT_PUBLIC_AFFILIATION_DISCLAIMER ||
    `${SITE_NAME} is an independent reseller. Not affiliated with, endorsed by, or sponsored by Google LLC. Google, Gemini, and related marks are trademarks of Google LLC.`,
  supportContacts: {
    telegram: process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || "",
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
    messenger: process.env.NEXT_PUBLIC_SUPPORT_MESSENGER || "",
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || "",
  },
};

/** Host không kèm scheme — dùng cho IndexNow, sitemap, canonical. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const SYSTEM_CONFIG = {
  redirectAfterSignIn: "/",
  repoName: "",
  repoOwner: "",
  repoStars: false,
};

export const ADMIN_CONFIG = {
  displayEmails: false,
};

export const DB_DEV_LOGGER = false;
