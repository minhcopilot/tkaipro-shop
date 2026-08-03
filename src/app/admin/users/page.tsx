import { getAllUsers, getUserStats } from "~/lib/queries/users";

import AdminUsersClient from "./page.client";

export default async function AdminUsersPage() {
  // lấy users và stats
  const [{ users, total }, stats] = await Promise.all([
    getAllUsers({ page: 1, limit: 10 }),
    getUserStats(),
  ]);

  return (
    <AdminUsersClient 
      initialUsers={users} 
      initialTotal={total}
      initialStats={stats}
    />
  );
} 