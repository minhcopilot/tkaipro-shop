import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// generate a unique build ID at build time for cache invalidation
const BUILD_ID = Date.now().toString();

const nextConfig: NextConfig = {
  // expose build ID to client for cache invalidation
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: process.env.NODE_ENV === "production" },
  output: "standalone",
  // externalize server-side packages that have issues with standalone mode bundling
  serverExternalPackages: [
    "@getbrevo/brevo",
    "bcryptjs",
    "better-auth",
    "@polar-sh/better-auth",
    "@polar-sh/sdk",
    "pg",
    "postgres",
    "drizzle-orm",
    "@noble/hashes",
    "@noble/curves",
    "@better-auth/utils",
  ],
  experimental: {
    // optimize package imports to reduce bundle size
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "date-fns",
      "sonner",
      "@uploadthing/react",
      "next-intl",
    ],
  },
  // reduce bundle size and build time
  compiler: {
    // temporarily disabled for debugging - enable back after fixing errors
    // removeConsole: process.env.NODE_ENV === "production",
  },
  // modularize imports for better tree shaking
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // minimize image sizes for better LCP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { hostname: "**.githubassets.com", protocol: "https" },
      { hostname: "**.githubusercontent.com", protocol: "https" },
      { hostname: "**.googleusercontent.com", protocol: "https" },
      { hostname: "**.ufs.sh", protocol: "https" },
      { hostname: "**.unsplash.com", protocol: "https" },
      { hostname: "api.github.com", protocol: "https" },
      { hostname: "utfs.io", protocol: "https" },
      { hostname: "upload.wikimedia.org", protocol: "https" },
      { hostname: "cdn.haitrieu.com", protocol: "https" },
      { hostname: "www.vietqr.io", protocol: "https" },
      { hostname: "img.vietqr.io", protocol: "https" },
      { hostname: "ui-avatars.com", protocol: "https" },
      { hostname: "img.youtube.com", protocol: "https" },
    ],
  },
  // enable response compression
  compress: true,
  // power by header off for security and smaller response
  poweredByHeader: false,
  // add headers for cache control - prevent stale JS issues
  async headers() {
    return [
      {
        // prevent caching of RSC payloads to avoid stale server action IDs
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // allow Cloudflare and CDN to cache pages, revalidate with ISR
        source: '/:locale(vi|en|ru|zh|ar|es|fr|de|ja|ko|pt)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  // webpack externals workaround for standalone mode bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // force these packages to be external (not bundled)
      config.externals = [
        ...config.externals,
        "better-auth",
        "@polar-sh/better-auth",
        "@polar-sh/sdk",
        "pg",
        "postgres",
        "drizzle-orm",
        "@getbrevo/brevo",
        "bcryptjs",
      ];
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
