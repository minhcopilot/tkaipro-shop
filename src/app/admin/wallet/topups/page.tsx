import { getCurrentAdminOrRedirect } from "~/lib/auth";

import { AdminWalletTopupsClient } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nạp ví | Admin",
  description: "Duyệt yêu cầu nạp ví crypto của khách",
};

export default async function AdminWalletTopupsPage() {
  await getCurrentAdminOrRedirect();
  return <AdminWalletTopupsClient />;
}
