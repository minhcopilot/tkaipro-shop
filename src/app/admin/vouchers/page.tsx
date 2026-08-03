import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { listVouchers } from "~/lib/queries/vouchers";

import VouchersClient from "./page.client";

export const metadata = {
  title: "Voucher CTV | Admin",
  description: "Quản lý voucher cấp cho cộng tác viên",
};

export default async function AdminVouchersPage() {
  await getCurrentAdminOrRedirect();
  const vouchers = await listVouchers();
  return <VouchersClient initialVouchers={vouchers} />;
}
