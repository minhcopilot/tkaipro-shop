"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/ui/primitives/skeleton";

// dynamic import with ssr: false to avoid better-auth/react SSR issues
// useSession hook from better-auth uses useRef which is null during SSR
const Header = dynamic(
  () => import("./header").then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Skeleton className="h-7 w-32" />
              <div className="hidden md:flex gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-16" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      </header>
    ),
  }
);

interface HeaderWrapperProps {
  showAuth?: boolean;
}

export function HeaderWrapper({ showAuth = true }: HeaderWrapperProps) {
  return <Header showAuth={showAuth} />;
}
