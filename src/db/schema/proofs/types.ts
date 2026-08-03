export const PROOF_PLATFORMS = {
  WEBSITE: "website",
  TELEGRAM: "telegram",
  FACEBOOK: "facebook",
} as const;

export const PROOF_PRODUCT_TYPES = {
  CURSOR_PRO: "cursor-pro",
  CURSOR_PRO_OFFICIAL: "cursor-pro-official-1m",
  CURSOR_PRO_OFFICIAL_239K: "cursor-pro-official-239k",
  GITHUB_COPILOT: "github-copilot",
  FIGMA_PRO: "figma-pro",
  JETBRAINS_EDU: "jetbrains-edu",
} as const;

export type ProofPlatform = typeof PROOF_PLATFORMS[keyof typeof PROOF_PLATFORMS];
export type ProofProductType = typeof PROOF_PRODUCT_TYPES[keyof typeof PROOF_PRODUCT_TYPES];

