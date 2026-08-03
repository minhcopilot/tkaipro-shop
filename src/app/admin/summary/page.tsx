import { getDashboardData } from "~/lib/queries/dashboard";

import DashboardClient from "./page.client";

export default async function AdminSummaryPage() {
  const dashboardData = await getDashboardData();
  return <DashboardClient data={dashboardData} />;
}
