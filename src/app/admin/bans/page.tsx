import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { listBans } from "~/lib/security/ban-list";

import { BansPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ban IP / Email | Admin",
  description: "Quản lý danh sách IP và email bị chặn",
};

export default async function AdminBansPage() {
  await getCurrentAdminOrRedirect();
  // Load 2 list song song để first paint không cần fetch
  const [ipResult, emailResult] = await Promise.all([
    listBans({ kind: "ip", limit: 200 }),
    listBans({ kind: "email", limit: 200 }),
  ]);

  return (
    <BansPageClient
      initialIpBans={ipResult.rows}
      initialEmailBans={emailResult.rows}
      ipTotal={ipResult.total}
      emailTotal={emailResult.total}
    />
  );
}
