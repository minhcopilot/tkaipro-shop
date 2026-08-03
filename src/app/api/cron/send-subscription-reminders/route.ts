import { NextRequest, NextResponse } from "next/server";

import { authenticateCron } from "~/lib/security/cron-auth";
import { processExpirationReminders } from "~/lib/queries/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint: gửi email nhắc-nhớ-hết-hạn TỰ ĐỘNG.
 *
 * Lịch chạy: 1 lần/ngày (khuyến nghị 09:00 giờ VN ≈ 02:00 UTC).
 * Idempotent: function processExpirationReminders() set cờ
 *   reminder_3day_sent_at / reminder_1day_sent_at sau khi gửi xong, nên
 *   nếu cron chạy 2 lần trong ngày cũng không gửi trùng.
 *
 * Phạm vi:
 *   - subscription table (account/license, plan_days >= 30)
 *
 * Auth (ưu tiên Bearer — tránh secret vào access log; ?secret= vẫn hỗ trợ):
 *   - Authorization: Bearer <CRON_SECRET>      (khuyến nghị)
 *   - ?secret=<CRON_SECRET>                    (deprecated, vẫn OK)
 *
 * Response: JSON { ok, processed3Day, processed1Day, errors[], at }
 */
async function handle(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const cronSecretParam = searchParams.get("secret");
  const authHeader = request.headers.get("authorization") ?? "";

  const byBearerCron = Boolean(
    process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`,
  );
  const byQuerySecret = Boolean(
    cronSecretParam && cronSecretParam === process.env.CRON_SECRET,
  );

  if (!byBearerCron && !byQuerySecret) {
    const cronAuth = authenticateCron(request);
    if (!cronAuth.ok) {
      return NextResponse.json(
        { error: cronAuth.error ?? "Unauthorized" },
        { status: 401 },
      );
    }
  }

  // Chống chạy song song: nếu request thứ 2 đi vào lúc job đầu chưa xong
  // (vd Vercel Cron retry, admin click manual) thì batch gửi trùng vẫn an
  // toàn nhờ cờ reminder_*_sent_at, nhưng ta log để dễ debug.
  const startedAt = Date.now();
  console.log(
    `[cron send-subscription-reminders] started by ${
      byBearerCron ? "bearer-cron" : byQuerySecret ? "query-secret" : "cron"
    } at ${new Date().toISOString()}`,
  );

  try {
    const result = await processExpirationReminders();
    const elapsedMs = Date.now() - startedAt;

    console.log(
      `[cron send-subscription-reminders] done in ${elapsedMs}ms ` +
        `processed3Day=${result.processed3Day} processed1Day=${result.processed1Day} ` +
        `errors=${result.errors.length}`,
    );

    return NextResponse.json({
      ok: true,
      processed3Day: result.processed3Day,
      processed1Day: result.processed1Day,
      errors: result.errors,
      elapsedMs,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron send-subscription-reminders] error:", err);
    return NextResponse.json(
      { error: "Lỗi khi gửi reminder" },
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
