import "server-only";
import { eq, desc, sql, gte, lte, and, count } from "drizzle-orm";

import { db } from "~/db";
import { orderTable } from "~/db/schema/orders/tables";
import { productTable, productCategoryTable } from "~/db/schema/products/tables";

// types for analytics
export interface RevenueByProduct {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  revenue: number;
  cost: number; // giá nhập
  profit: number; // lợi nhuận = revenue - cost
  profitMargin: number; // % lợi nhuận
  orderCount: number;
  averageOrderValue: number;
  // Mở rộng cho tính năng "chuẩn bị hàng" — chỉ là metadata sản phẩm, có thể null
  // nếu sản phẩm đã bị xoá (legacy order vẫn aggregate được nhờ snapshot trong items).
  image: string | null;
  productType: string | null;
  stockQuantity: number | null;
  inStock: boolean | null;
}

export interface RevenueByCategory {
  category: string;
  productCount: number;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  orderCount: number;
  percentageOfTotal: number;
}

export interface RevenueByPeriod {
  period: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
  averageOrderValue: number;
  growth?: number; // percentage growth compared to previous period
}

export interface ReportSummary {
  totalRevenue: number;
  totalCost: number; // tổng giá nhập
  totalProfit: number; // lợi nhuận thực
  profitMargin: number; // % lợi nhuận
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProduct: { name: string; revenue: number; profit: number } | null;
  topCategory: { name: string; revenue: number; profit: number } | null;
}

export interface RevenueReportData {
  summary: ReportSummary;
  byProduct: RevenueByProduct[];
  byCategory: RevenueByCategory[];
  byPeriod: RevenueByPeriod[];
  periodType: "day" | "week" | "month";
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  periodType?: "day" | "week" | "month";
  category?: string;
  productId?: string;
  limit?: number;
}

// helper to format date for grouping
function formatDateForPeriod(date: Date, periodType: "day" | "week" | "month"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (periodType) {
    case "day":
      return `${year}-${month}-${day}`;
    case "week": {
      // get ISO week number
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${year}-W${String(weekNum).padStart(2, "0")}`;
    }
    case "month":
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// helper to get period label
function getPeriodLabel(period: string, periodType: "day" | "week" | "month"): string {
  switch (periodType) {
    case "day": {
      const date = new Date(period);
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    }
    case "week": {
      const [year, week] = period.split("-W");
      return `Tuần ${week}/${year}`;
    }
    case "month": {
      const [year, month] = period.split("-");
      const monthNames = ["", "Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
      return `${monthNames[parseInt(month!)]}/${year}`;
    }
    default:
      return period;
  }
}

// helper to get category slug -> name mapping
async function getCategoryNameMap(): Promise<Map<string, string>> {
  try {
    const categories = await db
      .select({ slug: productCategoryTable.slug, name: productCategoryTable.name })
      .from(productCategoryTable);
    
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.slug, cat.name);
    }
    return map;
  } catch (error) {
    console.error("Failed to get category name map:", error);
    return new Map();
  }
}

// helper to get product id -> costPrice mapping
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

// helper to get product id -> meta (image, stockQuantity, inStock, productType)
// Dùng cho widget "Chuẩn bị hàng" và bảng product trong reports.
interface ProductMeta {
  image: string | null;
  productType: string | null;
  stockQuantity: number | null;
  inStock: boolean | null;
}
async function getProductMetaMap(): Promise<Map<string, ProductMeta>> {
  try {
    const products = await db
      .select({
        id: productTable.id,
        image: productTable.image,
        productType: productTable.productType,
        stockQuantity: productTable.stockQuantity,
        inStock: productTable.inStock,
      })
      .from(productTable);
    const map = new Map<string, ProductMeta>();
    for (const p of products) {
      map.set(p.id, {
        image: p.image,
        productType: p.productType,
        stockQuantity: p.stockQuantity,
        inStock: p.inStock,
      });
    }
    return map;
  } catch (error) {
    console.error("Failed to get product meta map:", error);
    return new Map();
  }
}

/**
 * get revenue by product
 */
export async function getRevenueByProduct(filters: ReportFilters = {}): Promise<RevenueByProduct[]> {
  try {
    const { startDate, endDate, category, limit = 50 } = filters;

    // build conditions
    const conditions: any[] = [eq(orderTable.paymentStatus, "paid")];
    
    if (startDate) {
      conditions.push(gte(orderTable.paidAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orderTable.paidAt, endDate));
    }

    const whereClause = and(...conditions);

    // get category name mapping, cost price mapping, product meta
    const [categoryNameMap, costPriceMap, productMetaMap] = await Promise.all([
      getCategoryNameMap(),
      getProductCostPriceMap(),
      getProductMetaMap(),
    ]);

    // get all paid orders
    // FIX: select id để đếm distinct order chính xác (trước đây dùng total nên
    // 2 đơn cùng giá bị merge thành 1).
    const orders = await db
      .select({
        id: orderTable.id,
        items: orderTable.items,
      })
      .from(orderTable)
      .where(whereClause);

    // aggregate by product
    const productStats = new Map<string, {
      productId: string;
      productName: string;
      category: string;
      quantity: number;
      revenue: number;
      cost: number;
      orderIds: Set<string>;
    }>();

    for (const order of orders) {
      for (const item of order.items || []) {
        // filter by category if specified
        if (category && item.category !== category) continue;

        const key = item.id;
        const categoryName = categoryNameMap.get(item.category) || item.category;
        const costPrice = costPriceMap.get(item.id) ?? 0;
        const existing = productStats.get(key) || {
          productId: item.id,
          productName: item.name,
          category: categoryName,
          quantity: 0,
          revenue: 0,
          cost: 0,
          orderIds: new Set<string>(),
        };

        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.cost += costPrice * item.quantity;
        existing.orderIds.add(order.id);

        productStats.set(key, existing);
      }
    }

    // convert to array and calculate averages + profit
    const result = Array.from(productStats.values())
      .map(p => {
        const profit = p.revenue - p.cost;
        const profitMargin = p.revenue > 0 ? Math.round((profit / p.revenue) * 10000) / 100 : 0;
        const meta = productMetaMap.get(p.productId);
        return {
          productId: p.productId,
          productName: p.productName,
          category: p.category,
          quantity: p.quantity,
          revenue: p.revenue,
          cost: p.cost,
          profit,
          profitMargin,
          orderCount: p.orderIds.size,
          averageOrderValue: p.orderIds.size > 0 ? Math.round(p.revenue / p.orderIds.size) : 0,
          image: meta?.image ?? null,
          productType: meta?.productType ?? null,
          stockQuantity: meta?.stockQuantity ?? null,
          inStock: meta?.inStock ?? null,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return result;
  } catch (error) {
    console.error("Failed to get revenue by product:", error);
    return [];
  }
}

/**
 * get revenue by category
 */
export async function getRevenueByCategory(filters: ReportFilters = {}): Promise<RevenueByCategory[]> {
  try {
    const { startDate, endDate } = filters;

    // build conditions
    const conditions: any[] = [eq(orderTable.paymentStatus, "paid")];
    
    if (startDate) {
      conditions.push(gte(orderTable.paidAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orderTable.paidAt, endDate));
    }

    const whereClause = and(...conditions);

    // get category name mapping and cost price mapping
    const [categoryNameMap, costPriceMap] = await Promise.all([
      getCategoryNameMap(),
      getProductCostPriceMap(),
    ]);

    // get all paid orders
    const orders = await db
      .select({
        items: orderTable.items,
      })
      .from(orderTable)
      .where(whereClause);

    // aggregate by category (using slug as key, but storing name for display)
    const categoryStats = new Map<string, {
      categorySlug: string;
      categoryName: string;
      productIds: Set<string>;
      quantity: number;
      revenue: number;
      cost: number;
      orderCount: number;
    }>();

    for (const order of orders) {
      const categoriesInOrder = new Set<string>();
      
      for (const item of order.items || []) {
        const key = item.category;
        const categoryName = categoryNameMap.get(item.category) || item.category;
        const costPrice = costPriceMap.get(item.id) ?? 0;
        const existing = categoryStats.get(key) || {
          categorySlug: item.category,
          categoryName: categoryName,
          productIds: new Set<string>(),
          quantity: 0,
          revenue: 0,
          cost: 0,
          orderCount: 0,
        };

        existing.productIds.add(item.id);
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.cost += costPrice * item.quantity;
        categoriesInOrder.add(key);

        categoryStats.set(key, existing);
      }

      // increment order count for each category in this order
      for (const cat of categoriesInOrder) {
        const stats = categoryStats.get(cat);
        if (stats) {
          stats.orderCount++;
        }
      }
    }

    // calculate total revenue for percentage
    const totalRevenue = Array.from(categoryStats.values()).reduce((sum, c) => sum + c.revenue, 0);

    // convert to array with category name for display
    const result = Array.from(categoryStats.values())
      .map(c => {
        const profit = c.revenue - c.cost;
        const profitMargin = c.revenue > 0 ? Math.round((profit / c.revenue) * 10000) / 100 : 0;
        return {
          category: c.categoryName,
          productCount: c.productIds.size,
          quantity: c.quantity,
          revenue: c.revenue,
          cost: c.cost,
          profit,
          profitMargin,
          orderCount: c.orderCount,
          percentageOfTotal: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 10000) / 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return result;
  } catch (error) {
    console.error("Failed to get revenue by category:", error);
    return [];
  }
}

/**
 * get revenue by time period
 */
export async function getRevenueByPeriod(filters: ReportFilters = {}): Promise<RevenueByPeriod[]> {
  try {
    const { startDate, endDate, periodType = "day", category, productId } = filters;

    // default to last 30 days if no date range
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // build conditions
    const conditions: any[] = [
      eq(orderTable.paymentStatus, "paid"),
      gte(orderTable.paidAt, start),
      lte(orderTable.paidAt, end),
    ];

    const whereClause = and(...conditions);

    // get cost price mapping
    const costPriceMap = await getProductCostPriceMap();

    // get all paid orders in range
    const orders = await db
      .select({
        items: orderTable.items,
        total: orderTable.total,
        paidAt: orderTable.paidAt,
      })
      .from(orderTable)
      .where(whereClause)
      .orderBy(orderTable.paidAt);

    // aggregate by period
    const periodStats = new Map<string, {
      period: string;
      revenue: number;
      cost: number;
      orderCount: number;
    }>();

    for (const order of orders) {
      if (!order.paidAt) continue;

      // calculate revenue and cost
      let orderRevenue = 0;
      let orderCost = 0;
      
      for (const item of order.items || []) {
        if (category && item.category !== category) continue;
        if (productId && item.id !== productId) continue;
        
        const costPrice = costPriceMap.get(item.id) ?? 0;
        orderRevenue += item.price * item.quantity;
        orderCost += costPrice * item.quantity;
      }
      
      // if no filter, use order total for revenue (but still calculate cost from items)
      if (!category && !productId) {
        orderRevenue = order.total;
      }
      
      if (orderRevenue === 0) continue;

      const period = formatDateForPeriod(order.paidAt, periodType);
      const existing = periodStats.get(period) || {
        period,
        revenue: 0,
        cost: 0,
        orderCount: 0,
      };

      existing.revenue += orderRevenue;
      existing.cost += orderCost;
      existing.orderCount++;
      periodStats.set(period, existing);
    }

    // fill in missing periods
    const allPeriods: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      allPeriods.push(formatDateForPeriod(current, periodType));
      
      switch (periodType) {
        case "day":
          current.setDate(current.getDate() + 1);
          break;
        case "week":
          current.setDate(current.getDate() + 7);
          break;
        case "month":
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    // dedupe and sort periods
    const uniquePeriods = [...new Set(allPeriods)].sort();

    // convert to array with growth calculation
    const result: RevenueByPeriod[] = [];
    let previousRevenue = 0;

    for (const period of uniquePeriods) {
      const stats = periodStats.get(period) || { period, revenue: 0, cost: 0, orderCount: 0 };
      
      const growth = previousRevenue > 0 
        ? Math.round(((stats.revenue - previousRevenue) / previousRevenue) * 10000) / 100
        : undefined;

      const profit = stats.revenue - stats.cost;

      result.push({
        period: stats.period,
        label: getPeriodLabel(stats.period, periodType),
        revenue: stats.revenue,
        cost: stats.cost,
        profit,
        orderCount: stats.orderCount,
        averageOrderValue: stats.orderCount > 0 ? Math.round(stats.revenue / stats.orderCount) : 0,
        growth,
      });

      previousRevenue = stats.revenue;
    }

    return result;
  } catch (error) {
    console.error("Failed to get revenue by period:", error);
    return [];
  }
}

/**
 * get report summary
 */
export async function getReportSummary(filters: ReportFilters = {}): Promise<ReportSummary> {
  try {
    const { startDate, endDate, category } = filters;

    // build conditions
    const conditions: any[] = [eq(orderTable.paymentStatus, "paid")];
    
    if (startDate) {
      conditions.push(gte(orderTable.paidAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orderTable.paidAt, endDate));
    }

    const whereClause = and(...conditions);

    // get category name mapping and cost price mapping
    const [categoryNameMap, costPriceMap] = await Promise.all([
      getCategoryNameMap(),
      getProductCostPriceMap(),
    ]);

    // get all paid orders
    const orders = await db
      .select({
        items: orderTable.items,
        total: orderTable.total,
      })
      .from(orderTable)
      .where(whereClause);

    // calculate summary
    let totalRevenue = 0;
    let totalCost = 0;
    const productSet = new Set<string>();
    const productRevenue = new Map<string, { name: string; revenue: number; cost: number }>();
    const categoryRevenue = new Map<string, { slug: string; revenue: number; cost: number }>();

    for (const order of orders) {
      let orderTotal = 0;
      let orderCost = 0;
      
      for (const item of order.items || []) {
        if (category && item.category !== category) continue;

        const itemRevenue = item.price * item.quantity;
        const costPrice = costPriceMap.get(item.id) ?? 0;
        const itemCost = costPrice * item.quantity;
        
        orderTotal += itemRevenue;
        orderCost += itemCost;
        productSet.add(item.id);

        // track product revenue and cost
        const existing = productRevenue.get(item.id) || { name: item.name, revenue: 0, cost: 0 };
        existing.revenue += itemRevenue;
        existing.cost += itemCost;
        productRevenue.set(item.id, existing);

        // track category revenue and cost (using slug as key)
        const catRev = categoryRevenue.get(item.category) || { slug: item.category, revenue: 0, cost: 0 };
        catRev.revenue += itemRevenue;
        catRev.cost += itemCost;
        categoryRevenue.set(item.category, catRev);
      }

      totalRevenue += category ? orderTotal : order.total;
      totalCost += orderCost;
    }

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0;

    // find top product by profit
    let topProduct: { name: string; revenue: number; profit: number } | null = null;
    for (const [_, product] of productRevenue) {
      const profit = product.revenue - product.cost;
      if (!topProduct || profit > topProduct.profit) {
        topProduct = { name: product.name, revenue: product.revenue, profit };
      }
    }

    // find top category by profit (convert slug to name for display)
    let topCategory: { name: string; revenue: number; profit: number } | null = null;
    for (const [slug, catData] of categoryRevenue) {
      const categoryName = categoryNameMap.get(slug) || slug;
      const profit = catData.revenue - catData.cost;
      if (!topCategory || profit > topCategory.profit) {
        topCategory = { name: categoryName, revenue: catData.revenue, profit };
      }
    }

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalOrders: orders.length,
      totalProducts: productSet.size,
      averageOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      topProduct,
      topCategory,
    };
  } catch (error) {
    console.error("Failed to get report summary:", error);
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      totalOrders: 0,
      totalProducts: 0,
      averageOrderValue: 0,
      topProduct: null,
      topCategory: null,
    };
  }
}

/**
 * get full revenue report
 */
export async function getRevenueReport(filters: ReportFilters = {}): Promise<RevenueReportData> {
  const periodType = filters.periodType || "day";

  const [summary, byProduct, byCategory, byPeriod] = await Promise.all([
    getReportSummary(filters),
    getRevenueByProduct(filters),
    getRevenueByCategory(filters),
    getRevenueByPeriod({ ...filters, periodType }),
  ]);

  return {
    summary,
    byProduct,
    byCategory,
    byPeriod,
    periodType,
  };
}

export interface TopSpender {
  customerEmail: string;
  customerName: string;
  userId: string | null;
  totalSpent: number;
  orderCount: number;
  quantity?: number;
}

export interface TopSpendersFilters {
  productId?: string;
  limit?: number;
}

/**
 * Top spenders among paid orders.
 * Customer key: coalesce(userId, lower(customerEmail)).
 * Without productId: sum(order.total). With productId: sum(line price*qty) for matching items.
 */
export async function getTopSpenders(
  filters: TopSpendersFilters = {},
): Promise<TopSpender[]> {
  try {
    const limit = Math.min(Math.max(1, filters.limit ?? 50), 200);
    const productId = filters.productId;

    const conditions: any[] = [eq(orderTable.paymentStatus, "paid")];
    if (productId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM json_array_elements(${orderTable.items}) AS e WHERE e->>'id' = ${productId})`,
      );
    }

    const orders = await db
      .select({
        id: orderTable.id,
        userId: orderTable.userId,
        customerEmail: orderTable.customerEmail,
        customerName: orderTable.customerName,
        total: orderTable.total,
        items: orderTable.items,
      })
      .from(orderTable)
      .where(and(...conditions));

    type Agg = {
      customerEmail: string;
      customerName: string;
      userId: string | null;
      totalSpent: number;
      orderCount: number;
      quantity: number;
    };

    const map = new Map<string, Agg>();

    for (const order of orders) {
      const key = order.userId ?? order.customerEmail.toLowerCase();

      if (productId) {
        let lineSpent = 0;
        let lineQty = 0;
        for (const item of order.items || []) {
          if (item.id === productId) {
            lineSpent += item.price * item.quantity;
            lineQty += item.quantity;
          }
        }
        if (lineSpent === 0 && lineQty === 0) continue;

        const existing = map.get(key);
        if (existing) {
          existing.totalSpent += lineSpent;
          existing.orderCount += 1;
          existing.quantity += lineQty;
        } else {
          map.set(key, {
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            userId: order.userId,
            totalSpent: lineSpent,
            orderCount: 1,
            quantity: lineQty,
          });
        }
      } else {
        const existing = map.get(key);
        if (existing) {
          existing.totalSpent += order.total;
          existing.orderCount += 1;
        } else {
          map.set(key, {
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            userId: order.userId,
            totalSpent: order.total,
            orderCount: 1,
            quantity: 0,
          });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map((row) => {
        const base: TopSpender = {
          customerEmail: row.customerEmail,
          customerName: row.customerName,
          userId: row.userId,
          totalSpent: row.totalSpent,
          orderCount: row.orderCount,
        };
        if (productId) {
          base.quantity = row.quantity;
        }
        return base;
      });
  } catch (error) {
    console.error("Failed to get top spenders:", error);
    return [];
  }
}

/**
 * get available categories for filter
 * returns array of { slug, name } for filter options
 */
export async function getAvailableCategories(): Promise<{ slug: string; name: string }[]> {
  try {
    // get category name mapping
    const categoryNameMap = await getCategoryNameMap();

    const orders = await db
      .select({ items: orderTable.items })
      .from(orderTable)
      .where(eq(orderTable.paymentStatus, "paid"));

    const categorySlugs = new Set<string>();
    for (const order of orders) {
      for (const item of order.items || []) {
        categorySlugs.add(item.category);
      }
    }

    // convert to array with both slug and name
    return Array.from(categorySlugs)
      .map(slug => ({
        slug,
        name: categoryNameMap.get(slug) || slug,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}

