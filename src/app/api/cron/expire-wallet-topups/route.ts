import { NextRequest, NextResponse } from "next/server";

import { expireOldPendingTopups } from "~/lib/queries/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cron endpoint mark wallet_topup status='pending' quá expiresAt thành 'expired'.
// Auth (ưu tiên Bearer — tránh secret vào access log; ?secret= vẫn hỗ trợ):
//   - Authorization: Bearer <CRON_SECRET> (Vercel Cron / khuyến nghị)
//   - ?secret=<CRON_SECRET> (cron-job.org / curl manual — deprecated, vẫn OK)
//
// Khuyến nghị chạy mỗi 5-10 phút (TTL pending = 30 phút) — cron không cần
// chính xác phút.
async function handle(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const authHeader = request.headers.get("authorization") ?? "";

  const byVercelCron = Boolean(
    process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`,
  );
  const byQuerySecret = Boolean(
    querySecret && querySecret === process.env.CRON_SECRET,
  );

  if (!byVercelCron && !byQuerySecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await expireOldPendingTopups();
    return NextResponse.json({
      ok: true,
      expiredCount: count,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron expire-wallet-topups] error:", err);
    return NextResponse.json(
      { error: "Lỗi khi expire topups" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
