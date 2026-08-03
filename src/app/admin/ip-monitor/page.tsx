import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { getSuspiciousSharedIps } from "~/lib/security/ip-log";

import { IpMonitorClient } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Giám sát IP | Admin",
  description: "Theo dõi IP đăng ký / đăng nhập / tạo đơn và phát hiện multi-account",
};

export default async function AdminIpMonitorPage() {
  await getCurrentAdminOrRedirect();
  // Default view = shared IPs (multi-account bypass signal) so the first paint
  // already shows the most actionable data.
  const sharedIps = await getSuspiciousSharedIps({ minAccounts: 2, limit: 100 });

  return <IpMonitorClient initialSharedIps={sharedIps} />;
}
