"use client";

import dynamic from "next/dynamic";

// dynamic import with ssr: false to avoid better-auth/react SSR issues
const SignOutPageClient = dynamic(
  () => import("./page.client").then((mod) => ({ default: mod.SignOutPageClient })),
  { ssr: false, loading: () => <div className="animate-pulse p-4">Loading...</div> }
);

export function SignOutPageWrapper() {
  return <SignOutPageClient />;
}
