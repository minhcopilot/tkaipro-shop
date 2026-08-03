import { getCurrentAdminOrRedirect } from "~/lib/auth";

import { AdminWalletUsersClient } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Số dư user | Admin",
  description: "Xem & điều chỉnh số dư ví của user",
};

export default async function AdminWalletUsersPage() {
  await getCurrentAdminOrRedirect();
  return <AdminWalletUsersClient />;
}
