// Rate limit đơn giản in-memory (per-process) dùng cho các public API
// Với VPS single instance là đủ; khi scale horizontal thì thay bằng Redis/Upstash
// Key: IP + action, giới hạn N request/windowMs

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetInMs: windowMs };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetInMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: max - bucket.count,
    resetInMs: bucket.resetAt - now,
  };
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// cleanup định kỳ để Map không phình ra
// không critical - kể cả không cleanup thì mỗi entry ~50 bytes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
