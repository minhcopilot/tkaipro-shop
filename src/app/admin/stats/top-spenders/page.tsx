import { getCurrentAdminOrRedirect } from "~/lib/auth";

import TopSpendersClient from "./page.client";

export default async function AdminTopSpendersPage() {
  await getCurrentAdminOrRedirect();
  return <TopSpendersClient />;
}
