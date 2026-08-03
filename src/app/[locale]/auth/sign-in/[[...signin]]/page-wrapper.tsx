"use client";

import dynamic from "next/dynamic";

// dynamic import with ssr: false to avoid better-auth/react SSR issues
const SignInPageClient = dynamic(
  () => import("./page.client").then((mod) => ({ default: mod.SignInPageClient })),
  { ssr: false, loading: () => <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse">Loading...</div></div> }
);

export function SignInPageWrapper() {
  return <SignInPageClient />;
}
