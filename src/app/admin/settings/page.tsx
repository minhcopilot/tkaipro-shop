import { getCurrentAdminOrRedirect } from "~/lib/auth";
import {
  getOrCreatePaymentSettings,
  listBankAccounts,
} from "~/lib/queries/bank-accounts";

import SettingsClientPage from "./page.client";

export const metadata = {
  description: "Cấu hình tài khoản ngân hàng nhận chuyển khoản",
  title: "Cài đặt | Admin",
};

export default async function SettingsPage() {
  await getCurrentAdminOrRedirect();

  const [bankAccounts, paymentSettings] = await Promise.all([
    listBankAccounts(),
    getOrCreatePaymentSettings(),
  ]);

  return (
    <SettingsClientPage
      initialAccounts={bankAccounts}
      initialBankSelectionMode={
        paymentSettings.bankSelectionMode === "round_robin"
          ? "round_robin"
          : "default"
      }
    />
  );
}
