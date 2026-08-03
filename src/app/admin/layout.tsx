import "~/css/globals.css";

import type React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { getUnrepliedReviewCount } from "~/lib/queries/reviews";

import AdminLayoutClient from "./layout.client";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // check if user is admin, redirect if not
  await getCurrentAdminOrRedirect();
  const unrepliedCount = await getUnrepliedReviewCount();
  
  const messages = (await import("../../../messages/vi.json")).default;

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen bg-gray-50 dark:bg-gray-900
          text-neutral-900 antialiased
        `}
      >
        <NextIntlClientProvider locale="vi" messages={messages}>
          <AdminLayoutClient unrepliedReviewsCount={unrepliedCount}>
            {children}
          </AdminLayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
