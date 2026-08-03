import { getCurrentAdminOrRedirect } from "~/lib/auth";

import { AdminWalletTransactionsClient } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lịch sử ví | Admin",
  description: "Audit log mọi thay đổi số dư ví khách",
};

export default async function AdminWalletTransactionsPage() {
  await getCurrentAdminOrRedirect();
  return <AdminWalletTransactionsClient />;
}
