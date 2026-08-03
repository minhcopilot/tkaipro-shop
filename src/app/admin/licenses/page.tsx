import { Metadata } from "next";
import { db } from "~/db";
import { licenseTable } from "~/db/schema";
import { desc } from "drizzle-orm";
import AdminLicensesClient from "./page.client";

export const metadata: Metadata = {
  title: "Quản Lý License Keys",
  description: "Quản lý license keys JetBrains",
};

export default async function AdminLicensesPage() {
  // lấy licenses ban đầu
  const licenses = await db
    .select()
    .from(licenseTable)
    .orderBy(desc(licenseTable.createdAt))
    .limit(50);

  const total = licenses.length;

  return (
    <AdminLicensesClient 
      initialLicenses={licenses} 
      initialTotal={total}
    />
  );
} 