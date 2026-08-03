import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "~/db";
import { userTable, walletTopupTable } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

/**
 * GET /api/admin/wallet/topups — danh sách topup theo status filter.
 *
 * Query: ?status=pending_review&limit=50
 *   - status mặc định = pending_review (admin chỉ care queue cần approve)
 *   - status='all' để xem tất cả (audit purpose)
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending_review";
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get("limit") ?? 50)),
    200,
  );

  const whereStatus =
    status === "all" ? undefined : eq(walletTopupTable.status, status);

  const topups = await db
    .select({
      id: walletTopupTable.id,
      userId: walletTopupTable.userId,
      currency: walletTopupTable.currency,
      amount: walletTopupTable.amount,
      method: walletTopupTable.method,
      cryptoMethodId: walletTopupTable.cryptoMethodId,
      status: walletTopupTable.status,
      transferContent: walletTopupTable.transferContent,
      proofImageUrl: walletTopupTable.proofImageUrl,
      sepayTransactionId: walletTopupTable.sepayTransactionId,
      confirmedByUserId: walletTopupTable.confirmedByUserId,
      rejectedReason: walletTopupTable.rejectedReason,
      createdAt: walletTopupTable.createdAt,
      paidAt: walletTopupTable.paidAt,
      expiresAt: walletTopupTable.expiresAt,
    })
    .from(walletTopupTable)
    .where(whereStatus)
    .orderBy(desc(walletTopupTable.createdAt))
    .limit(limit);

  // Hydrate user info để admin UI khỏi gọi thêm
  const userIds = Array.from(new Set(topups.map((t) => t.userId)));
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
    topups: topups.map((t) => ({
      ...t,
      user: userMap.get(t.userId) ?? null,
    })),
  });
}
