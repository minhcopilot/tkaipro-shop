import { desc } from "drizzle-orm";

import { db } from "~/db";
import { announcements } from "~/db/schema";
import { getCurrentAdminOrRedirect } from "~/lib/auth";

import AnnouncementsClientPage from "./page.client";

export const metadata = {
  title: "Quản lý thông báo | Admin",
  description: "Quản lý thông báo popup hiển thị cho người dùng",
};

export default async function AnnouncementsPage() {
  await getCurrentAdminOrRedirect();

  const items = await db.query.announcements.findMany({
    orderBy: [desc(announcements.priority), desc(announcements.createdAt)],
  });

  return <AnnouncementsClientPage announcements={items} />;
}
