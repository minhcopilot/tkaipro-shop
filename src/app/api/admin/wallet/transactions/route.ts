import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "~/db";
import { userTable, walletTransactionTable } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

/**
 * GET /api/admin/wallet/transactions — audit log filterable.
 *
 * Query: ?userId=&type=&currency=&limit=
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const type = url.searchParams.get("type");
  const currency = url.searchParams.get("currency");
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get("limit") ?? 100)),
    500,
  );

  const conditions = [
    userId ? eq(walletTransactionTable.userId, userId) : undefined,
    type ? eq(walletTransactionTable.type, type) : undefined,
    currency ? eq(walletTransactionTable.currency, currency) : undefined,
  ].filter(Boolean) as any[];

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(walletTransactionTable)
    .where(where)
    .orderBy(desc(walletTransactionTable.createdAt))
    .limit(limit);

  // Hydrate user info
  const userIds = Array.from(
    new Set(
      [
        ...items.map((i) => i.userId),
        ...items.map((i) => i.createdByUserId).filter(Boolean),
      ] as string[],
    ),
  );
  const users =
    userIds.length === 0
      ? []
      : await db
          .select({
            id: userTable.id,
            email: userTable.email,
            name: userTable.name,
          })
          .from(userTable)
          .where(inArray(userTable.id, userIds));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    items: items.map((t) => ({
      ...t,
      user: userMap.get(t.userId) ?? null,
      createdBy: t.createdByUserId
        ? userMap.get(t.createdByUserId) ?? null
        : null,
    })),
  });
}
