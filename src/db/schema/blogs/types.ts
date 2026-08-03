export const BLOG_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const BLOG_CATEGORIES = {
  TUTORIAL: "Tutorial",
  AI_MODELS: "AI Models",
  INSIGHTS: "Insights",
  SUPPORT: "Support",
  COMPARISON: "Comparison",
  TRENDS: "Trends",
  GENERAL: "General",
} as const;

export type BlogStatus = typeof BLOG_STATUS[keyof typeof BLOG_STATUS];
export type BlogCategory = typeof BLOG_CATEGORIES[keyof typeof BLOG_CATEGORIES];

