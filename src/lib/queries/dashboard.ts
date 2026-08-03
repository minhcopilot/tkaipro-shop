import "server-only";
import { eq, desc, sql, count, gte, and, lt, lte } from "drizzle-orm";

import { db } from "~/db";
import { orderTable } from "~/db/schema/orders/tables";
import { productTable } from "~/db/schema/products/tables";
import { subscriptionTable } from "~/db/schema/subscriptions/tables";
import { userTable } from "~/db/schema/users/tables";

export interface DashboardStats {
  // revenue
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  
  // profit (doanh thu thực sau khi trừ giá nhập)
  totalProfit: number;
  todayProfit: number;
  weekProfit: number;
  monthProfit: number;
  
  // orders
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  
  // subscriptions
  activeSubscriptions: number;
  expiringSoon: number;
  expiredNeedProcessing: number;
  
  // products & inventory
  totalProducts: number;
  lowStockProducts: number;
  totalCredentialsAvailable: number;
  
  // users
  totalUsers: number;
  newUsersToday: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  profit: number;
  availableStock: number;
}

// Stat cho widget "Sản phẩm bán hôm nay - Chuẩn bị hàng cho hôm sau".
// Mỗi dòng = 1 sản phẩm, phạm vi thời gian do caller chọn (today/yesterday/7d).
export interface ProductSalesForPrep {
  productId: string;
  name: string;
  image: string | null;
  productType: string | null;
  category: string;
  orderCount: number;        // số đơn paid distinct chứa SP này
  quantity: number;          // tổng SL bán trong range
  revenue: number;           // doanh thu (VND)
  stockQuantity: number;     // tồn admin nhập tay
  inStock: boolean;          // cờ admin
  needRestock: boolean;      // true khi stock < quantity bán trong range (gợi ý chuẩn bị thêm)
}

export type ProductSalesRange = "today" | "yesterday" | "7d";

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface ExpiringSubscription {
  id: string;
  productName: string;
  customerEmail: string;
  username: string;
  expiresAt: Date;
  daysLeft: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueChart: RevenueDataPoint[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  expiringSubscriptions: ExpiringSubscription[];
  lowStockAlerts: { productId: string; productName: string; availableCount: number }[];
}

// helper functions
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// helper to get product cost prices
async function getProductCostPriceMap(): Promise<Map<string, number>> {
  try {
    const products = await db
      .select({ id: productTable.id, costPrice: productTable.costPrice })
      .from(productTable);
    
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.id, product.costPrice ?? 0);
    }
    return map;
  } catch (error) {
    console.error("Failed to get product cost price map:", error);
    return new Map();
  }
}

// helper to calculate profit from orders
async function calculateProfitFromOrders(
  orders: { items: any[]; total: number; createdAt: Date }[],
  costPriceMap: Map<string, number>,
  startDate?: Date
): Promise<{ revenue: number; profit: number }> {
  let revenue = 0;
  let cost = 0;
  
  for (const order of orders) {
    if (startDate && order.createdAt < startDate) continue;
    
    revenue += order.total;
    for (const item of order.items || []) {
      const costPrice = costPriceMap.get(item.id) ?? 0;
      cost += costPrice * item.quantity;
    }
  }
  
  return { revenue, profit: revenue - cost };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();
    const startOfToday = getStartOfDay(now);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // get cost price map for profit calculation
    const costPriceMap = await getProductCostPriceMap();

    // get all paid orders for profit calculation
    const allPaidOrders = await db
      .select({
        items: orderTable.items,
        total: orderTable.total,
        createdAt: orderTable.createdAt,
      })
      .from(orderTable)
      .where(eq(orderTable.paymentStatus, "paid"));

    // calculate profits for different periods
    const totalData = await calculateProfitFromOrders(allPaidOrders, costPriceMap);
    const todayData = await calculateProfitFromOrders(
      allPaidOrders.filter(o => o.createdAt >= startOfToday),
      costPriceMap
    );
    const weekData = await calculateProfitFromOrders(
      allPaidOrders.filter(o => o.createdAt >= startOfWeek),
      costPriceMap
    );
    const monthData = await calculateProfitFromOrders(
      allPaidOrders.filter(o => o.createdAt >= startOfMonth),
      costPriceMap
    );

    // revenue queries (keeping for backward compatibility)
    const [totalRevenueResult, todayRevenueResult, weekRevenueResult, monthRevenueResult] = await Promise.all([
      db.select({ sum: sql<number>`COALESCE(SUM(${orderTable.total}), 0)` })
        .from(orderTable)
        .where(eq(orderTable.paymentStatus, "paid")),
      
      db.select({ sum: sql<number>`COALESCE(SUM(${orderTable.total}), 0)` })
        .from(orderTable)
        .where(and(
          eq(orderTable.paymentStatus, "paid"),
          gte(orderTable.createdAt, startOfToday)
        )),
      
      db.select({ sum: sql<number>`COALESCE(SUM(${orderTable.total}), 0)` })
        .from(orderTable)
        .where(and(
          eq(orderTable.paymentStatus, "paid"),
          gte(orderTable.createdAt, startOfWeek)
        )),
      
      db.select({ sum: sql<number>`COALESCE(SUM(${orderTable.total}), 0)` })
        .from(orderTable)
        .where(and(
          eq(orderTable.paymentStatus, "paid"),
          gte(orderTable.createdAt, startOfMonth)
        )),
    ]);

    // order queries
    const [totalOrdersResult, todayOrdersResult, pendingOrdersResult, completedOrdersResult] = await Promise.all([
      db.select({ count: count() }).from(orderTable),
      
      db.select({ count: count() })
        .from(orderTable)
        .where(gte(orderTable.createdAt, startOfToday)),
      
      db.select({ count: count() })
        .from(orderTable)
        .where(eq(orderTable.status, "pending")),
      
      db.select({ count: count() })
        .from(orderTable)
        .where(eq(orderTable.status, "completed")),
    ]);

    // subscription queries
    const [activeSubsResult, expiringSoonResult, expiredNeedProcessingResult] = await Promise.all([
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
      
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          lt(subscriptionTable.expiresAt, sevenDaysFromNow),
          gte(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
      
      db.select({ count: count() })
        .from(subscriptionTable)
        .where(and(
          lt(subscriptionTable.expiresAt, now),
          eq(subscriptionTable.isActive, true),
          eq(subscriptionTable.isExpired, false)
        )),
    ]);

    // product queries
    const [totalProductsResult, productsWithCredentials] = await Promise.all([
      db.select({ count: count() })
        .from(productTable)
        .where(eq(productTable.status, "active")),
      
      db.select({
        id: productTable.id,
        accountCredentials: productTable.accountCredentials,
      })
        .from(productTable)
        .where(eq(productTable.status, "active")),
    ]);

    // calculate credentials stats
    let totalCredentialsAvailable = 0;
    let lowStockProducts = 0;
    
    for (const product of productsWithCredentials) {
      const credCount = (product.accountCredentials as string[] || []).length;
      totalCredentialsAvailable += credCount;
      if (credCount <= 3 && credCount > 0) {
        lowStockProducts++;
      }
    }

    // user queries
    const [totalUsersResult, newUsersTodayResult] = await Promise.all([
      db.select({ count: count() }).from(userTable),
      
      db.select({ count: count() })
        .from(userTable)
        .where(gte(userTable.createdAt, startOfToday)),
    ]);

    return {
      totalRevenue: Number(totalRevenueResult[0]?.sum) || 0,
      todayRevenue: Number(todayRevenueResult[0]?.sum) || 0,
      weekRevenue: Number(weekRevenueResult[0]?.sum) || 0,
      monthRevenue: Number(monthRevenueResult[0]?.sum) || 0,
      
      totalProfit: totalData.profit,
      todayProfit: todayData.profit,
      weekProfit: weekData.profit,
      monthProfit: monthData.profit,
      
      totalOrders: totalOrdersResult[0]?.count || 0,
      todayOrders: todayOrdersResult[0]?.count || 0,
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      completedOrders: completedOrdersResult[0]?.count || 0,
      
      activeSubscriptions: activeSubsResult[0]?.count || 0,
      expiringSoon: expiringSoonResult[0]?.count || 0,
      expiredNeedProcessing: expiredNeedProcessingResult[0]?.count || 0,
      
      totalProducts: totalProductsResult[0]?.count || 0,
      lowStockProducts,
      totalCredentialsAvailable,
      
      totalUsers: totalUsersResult[0]?.count || 0,
      newUsersToday: newUsersTodayResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    return {
      totalRevenue: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      totalProfit: 0,
      todayProfit: 0,
      weekProfit: 0,
      monthProfit: 0,
      totalOrders: 0,
      todayOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      activeSubscriptions: 0,
      expiringSoon: 0,
      expiredNeedProcessing: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      totalCredentialsAvailable: 0,
      totalUsers: 0,
      newUsersToday: 0,
    };
  }
}

export async function getRevenueChart(days: number = 30): Promise<RevenueDataPoint[]> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const orders = await db
      .select({
        total: orderTable.total,
        createdAt: orderTable.createdAt,
      })
      .from(orderTable)
      .where(and(
        eq(orderTable.paymentStatus, "paid"),
        gte(orderTable.createdAt, startDate)
      ))
      .orderBy(orderTable.createdAt);

    // group by date
    const dataByDate = new Map<string, { revenue: number; orders: number }>();
    
    // initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0]!;
      dataByDate.set(dateStr, { revenue: 0, orders: 0 });
    }

    // aggregate order data
    for (const order of orders) {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0]!;
      const existing = dataByDate.get(dateStr) || { revenue: 0, orders: 0 };
      dataByDate.set(dateStr, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1,
      });
    }

    return Array.from(dataByDate.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));
  } catch (error) {
    console.error("Failed to get revenue chart:", error);
    return [];
  }
}

export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  try {
    // get all completed orders
    const orders = await db
      .select({
        items: orderTable.items,
        status: orderTable.status,
      })
      .from(orderTable)
      .where(eq(orderTable.status, "completed"));

    // get cost price map
    const costPriceMap = await getProductCostPriceMap();

    // aggregate sales by product
    const productStats = new Map<string, { 
      id: string;
      name: string; 
      category: string;
      totalSold: number; 
      revenue: number;
      cost: number;
    }>();

    for (const order of orders) {
      for (const item of order.items || []) {
        const costPrice = costPriceMap.get(item.id) ?? 0;
        const existing = productStats.get(item.id) || {
          id: item.id,
          name: item.name,
          category: item.category,
          totalSold: 0,
          revenue: 0,
          cost: 0,
        };
        productStats.set(item.id, {
          ...existing,
          totalSold: existing.totalSold + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
          cost: existing.cost + (costPrice * item.quantity),
        });
      }
    }

    // get current stock info
    const products = await db
      .select({
        id: productTable.id,
        accountCredentials: productTable.accountCredentials,
      })
      .from(productTable);

    const stockMap = new Map<string, number>();
    for (const product of products) {
      stockMap.set(product.id, (product.accountCredentials as string[] || []).length);
    }

    // combine and sort
    const topProducts = Array.from(productStats.values())
      .map(p => ({
        ...p,
        profit: p.revenue - p.cost,
        availableStock: stockMap.get(p.id) || 0,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);

    return topProducts;
  } catch (error) {
    console.error("Failed to get top products:", error);
    return [];
  }
}

/**
 * Sản phẩm bán hôm nay / hôm qua / 7 ngày — phục vụ widget "chuẩn bị hàng".
 *
 * Filter: paymentStatus = 'paid' AND paidAt trong range.
 *   - today:     [start of today, now)
 *   - yesterday: [start of yesterday, start of today)
 *   - 7d:        [now - 7 days, now)
 *
 * Sort mặc định theo orderCount giảm dần (bán nhiều → ưu tiên chuẩn bị).
 * `needRestock` = true khi stockQuantity hiện tại < quantity đã bán trong range
 * (heuristic: nếu mai bán bằng hôm nay thì hết hàng).
 */
export async function getProductSalesForRange(
  range: ProductSalesRange,
): Promise<ProductSalesForPrep[]> {
  try {
    const now = new Date();
    const startToday = getStartOfDay(now);
    let start: Date;
    let end: Date;
    if (range === "today") {
      start = startToday;
      end = now;
    } else if (range === "yesterday") {
      end = startToday;
      start = new Date(startToday);
      start.setDate(start.getDate() - 1);
    } else {
      end = now;
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    }

    const orders = await db
      .select({
        id: orderTable.id,
        items: orderTable.items,
      })
      .from(orderTable)
      .where(
        and(
          eq(orderTable.paymentStatus, "paid"),
          gte(orderTable.paidAt, start),
          lte(orderTable.paidAt, end),
        ),
      );

    // aggregate by product
    const stats = new Map<
      string,
      {
        productId: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        orderIds: Set<string>;
      }
    >();

    for (const order of orders) {
      for (const item of order.items || []) {
        const existing = stats.get(item.id) || {
          productId: item.id,
          name: item.name,
          category: item.category,
          quantity: 0,
          revenue: 0,
          orderIds: new Set<string>(),
        };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.orderIds.add(order.id);
        stats.set(item.id, existing);
      }
    }

    if (stats.size === 0) return [];

    // join product meta (image, stockQuantity, inStock, productType)
    const products = await db
      .select({
        id: productTable.id,
        image: productTable.image,
        productType: productTable.productType,
        stockQuantity: productTable.stockQuantity,
        inStock: productTable.inStock,
      })
      .from(productTable);
    const metaMap = new Map(products.map((p) => [p.id, p]));

    return Array.from(stats.values())
      .map((s) => {
        const meta = metaMap.get(s.productId);
        const stockQuantity = meta?.stockQuantity ?? 0;
        // upgrade products không cần "chuẩn bị hàng" (KH cung cấp acc của họ)
        const needRestock =
          meta?.productType !== "upgrade" &&
          stockQuantity < s.quantity;
        return {
          productId: s.productId,
          name: s.name,
          image: meta?.image ?? null,
          productType: meta?.productType ?? null,
          category: s.category,
          orderCount: s.orderIds.size,
          quantity: s.quantity,
          revenue: s.revenue,
          stockQuantity,
          inStock: meta?.inStock ?? false,
          needRestock,
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount || b.quantity - a.quantity);
  } catch (error) {
    console.error("Failed to get product sales for range:", error);
    return [];
  }
}

export async function getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
  try {
    const orders = await db
      .select({
        id: orderTable.id,
        orderNumber: orderTable.orderNumber,
        customerName: orderTable.customerName,
        customerEmail: orderTable.customerEmail,
        total: orderTable.total,
        status: orderTable.status,
        paymentStatus: orderTable.paymentStatus,
        createdAt: orderTable.createdAt,
      })
      .from(orderTable)
      .orderBy(desc(orderTable.createdAt))
      .limit(limit);

    return orders;
  } catch (error) {
    console.error("Failed to get recent orders:", error);
    return [];
  }
}

export async function getExpiringSubscriptions(days: number = 7, limit: number = 10): Promise<ExpiringSubscription[]> {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const subscriptions = await db
      .select({
        id: subscriptionTable.id,
        productName: subscriptionTable.productName,
        customerEmail: subscriptionTable.customerEmail,
        username: subscriptionTable.username,
        expiresAt: subscriptionTable.expiresAt,
      })
      .from(subscriptionTable)
      .where(and(
        lt(subscriptionTable.expiresAt, futureDate),
        gte(subscriptionTable.expiresAt, now),
        eq(subscriptionTable.isActive, true),
        eq(subscriptionTable.isExpired, false)
      ))
      .orderBy(subscriptionTable.expiresAt)
      .limit(limit);

    return subscriptions.map(sub => ({
      ...sub,
      daysLeft: Math.ceil((new Date(sub.expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    }));
  } catch (error) {
    console.error("Failed to get expiring subscriptions:", error);
    return [];
  }
}

export async function getLowStockAlerts(threshold: number = 3): Promise<{ productId: string; productName: string; availableCount: number }[]> {
  try {
    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        accountCredentials: productTable.accountCredentials,
      })
      .from(productTable)
      .where(eq(productTable.status, "active"));

    return products
      .map(product => ({
        productId: product.id,
        productName: product.name,
        availableCount: (product.accountCredentials as string[] || []).length,
      }))
      .filter(p => p.availableCount <= threshold)
      .sort((a, b) => a.availableCount - b.availableCount);
  } catch (error) {
    console.error("Failed to get low stock alerts:", error);
    return [];
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [stats, revenueChart, topProducts, recentOrders, expiringSubscriptions, lowStockAlerts] = await Promise.all([
    getDashboardStats(),
    getRevenueChart(30),
    getTopProducts(5),
    getRecentOrders(10),
    getExpiringSubscriptions(7, 10),
    getLowStockAlerts(3),
  ]);

  return {
    stats,
    revenueChart,
    topProducts,
    recentOrders,
    expiringSubscriptions,
    lowStockAlerts,
  };
}

