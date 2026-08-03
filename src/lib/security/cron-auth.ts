// Auth shared-secret cho các endpoint /api/cron/* gọi từ crontab trên VPS.
// Env: CRON_SECRET

export interface CronAuthResult {
  ok: boolean;
  error?: string;
}

export function authenticateCron(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron-auth] CRON_SECRET chưa được set trên server");
    return { ok: false, error: "Server chưa cấu hình cron secret" };
  }

  const auth = request.headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");

  if (scheme !== "Bearer" || !token) {
    return { ok: false, error: "Thiếu Authorization: Bearer <secret>" };
  }

  if (!constantTimeEqual(token.trim(), secret.trim())) {
    return { ok: false, error: "Cron secret không đúng" };
  }

  return { ok: true };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
