import { getCurrentUser } from "~/lib/auth";
import { getUserOrders } from "~/lib/queries/orders";
import UserOrdersClient from "./page.client";

import { getTranslations } from "next-intl/server";

// force dynamic rendering for i18n and auth
export const dynamic = 'force-dynamic';

export default async function UserOrdersPage() {
  const t = await getTranslations("DashboardOrders");
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return (
        <div className="text-center py-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t("loginRequired")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("loginDescription")}
          </p>
        </div>
      );
    }

    // fetch user's orders
    const result = await getUserOrders(user.id, {
      page: 1,
      limit: 10,
    });

    return (
      <UserOrdersClient 
        user={user}
        initialOrders={result.orders}
        initialTotal={result.total}
        initialPage={result.page}
        totalPages={result.totalPages}
      />
    );
  } catch (error) {
    console.error("Error loading user orders:", error);
    
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("errorTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t("errorDescription")}
        </p>
      </div>
    );
  }
} 