import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, sql } from "drizzle-orm";

import { db } from "~/db";
import { userTable } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

/**
 * GET /api/admin/wallet/users — list user kèm balance, hỗ trợ search.
 *
 * Query: ?q=email-or-name&limit=
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get("limit") ?? 50)),
    200,
  );
  // Sort: recent_topup (mặc định) | highest_balance | most_topup
  const sortParam = url.searchParams.get("sort") ?? "recent_topup";
  const sort = ["recent_topup", "highest_balance", "most_topup"].includes(
    sortParam,
  )
    ? sortParam
    : "recent_topup";

  const where = q
    ? or(
        ilike(userTable.email, `%${q}%`),
        ilike(userTable.name, `%${q}%`),
        ilike(userTable.id, `%${q}%`),
      )
    : undefined;

  // Tỉ giá 250 CHỈ để chuẩn hoá mixed-currency khi xếp hạng, không đổi hiển thị.
  const orderBy =
    sort === "highest_balance"
      ? sql`(${userTable.vndBalance} + ${userTable.usdBalance} * 250) desc`
      : sort === "most_topup"
        ? sql`(SELECT COALESCE(SUM(CASE WHEN currency = 'vnd' THEN amount ELSE amount * 250 END), 0) FROM wallet_topup WHERE user_id = ${userTable.id} AND status = 'paid') desc`
        : sql`(SELECT MAX(created_at) FROM wallet_topup WHERE user_id = ${userTable.id} AND status = 'paid') desc nulls last`;

  const users = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
      vndBalance: userTable.vndBalance,
      usdBalance: userTable.usdBalance,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(where)
    .orderBy(orderBy, desc(userTable.createdAt))
    .limit(limit);

  return NextResponse.json({ users });
}
