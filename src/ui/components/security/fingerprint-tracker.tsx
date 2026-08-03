"use client";

import { useEffect } from "react";

/**
 * Tính device fingerprint (FingerprintJS open-source) 1 lần khi load trang,
 * lưu vào cookie `fp` (để server đọc trong ban-guard / layout) và gửi
 * POST /api/track ghi nhận IP + quốc gia + fingerprint.
 *
 * Mount ở layout public. KHÔNG mount cho /admin.
 *
 * Lưu ý: bản open-source kém ổn định hơn FingerprintJS Pro (visitorId có thể
 * đổi khi user xoá storage / đổi trình duyệt), dùng như tín hiệu hỗ trợ.
 */
export function FingerprintTracker() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const FingerprintJS = (
          await import("@fingerprintjs/fingerprintjs")
        ).default;
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        if (cancelled || !visitorId) return;

        // Lưu cookie fp (1 năm) để server đọc qua getFingerprintFromRequest.
        document.cookie = `fp=${encodeURIComponent(visitorId)}; path=/; max-age=31536000; SameSite=Lax`;

        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-fp": visitorId },
          body: JSON.stringify({ fingerprint: visitorId }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // ignore — tracking là best-effort, không được phép làm vỡ trang
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
