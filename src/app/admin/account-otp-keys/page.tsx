import { desc } from "drizzle-orm";

import { db } from "~/db";
import { accountOtpKeysTable } from "~/db/schema";
import { getCurrentAdminOrRedirect } from "~/lib/auth";

import { AccountOtpKeysPageClient, type OtpKeyRow } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mã lấy OTP | Admin",
  description: "Quản lý key cho khách tự lấy mã đăng nhập tài khoản",
};

export default async function AdminAccountOtpKeysPage() {
  await getCurrentAdminOrRedirect();

  const rows = await db
    .select({
      id: accountOtpKeysTable.id,
      email: accountOtpKeysTable.email,
      isActive: accountOtpKeysTable.isActive,
      note: accountOtpKeysTable.note,
      createdAt: accountOtpKeysTable.createdAt,
      lastUsedAt: accountOtpKeysTable.lastUsedAt,
    })
    .from(accountOtpKeysTable)
    .orderBy(desc(accountOtpKeysTable.createdAt))
    .limit(500);

  const initialRows: OtpKeyRow[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
  }));

  return <AccountOtpKeysPageClient initialRows={initialRows} />;
}
