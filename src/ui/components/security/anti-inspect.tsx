"use client";

import { useEffect, useState } from "react";

/**
 * Lớp RĂN ĐE chống F12 / inspect cho trang public.
 *
 * GIỚI HẠN: chặn phía client KHÔNG thể tuyệt đối — dev có kinh nghiệm vẫn vượt
 * được (tắt JS, dùng proxy, devtools mở sẵn...). Đây chỉ là rào cản với người
 * dùng phổ thông + cảnh báo, KHÔNG phải biện pháp bảo mật thật. Dữ liệu nhạy
 * cảm vẫn phải được bảo vệ ở server (đã mã hoá credential, ẩn password...).
 *
 * Chỉ mount ở layout public ([locale]/layout.tsx), KHÔNG mount cho /admin.
 */
export function AntiInspect() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Bỏ qua khi dev local để không cản trở chính mình.
    if (process.env.NODE_ENV !== "production") return;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        setBlocked(true);
        return;
      }
      // Ctrl+Shift+I/J/C (devtools / console / inspector)
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) {
        e.preventDefault();
        setBlocked(true);
        return;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && key === "U") {
        e.preventDefault();
        setBlocked(true);
        return;
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);

    // Phát hiện devtools mở qua chênh lệch kích thước cửa sổ — CHỈ chạy trên
    // desktop. Trên mobile/cảm ứng, phần chênh là thanh địa chỉ/công cụ trình
    // duyệt (thường >170px, đổi khi cuộn) nên sẽ báo nhầm -> bỏ qua hẳn.
    const isTouchOrMobile =
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    const THRESHOLD = 170;
    let hits = 0;
    const detect = () => {
      const gap =
        window.outerWidth - window.innerWidth > THRESHOLD ||
        window.outerHeight - window.innerHeight > THRESHOLD;
      // Yêu cầu phát hiện lặp lại 2 lần liên tiếp mới chặn -> bớt báo nhầm
      // (zoom, đổi kích thước cửa sổ tạm thời...).
      hits = gap ? hits + 1 : 0;
      if (hits >= 2) {
        setBlocked(true);
      }
    };

    let interval: number | undefined;
    if (!isTouchOrMobile) {
      interval = window.setInterval(detect, 1000);
    }

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#0a0a0a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Thao tác không được phép
        </h1>
        <p style={{ color: "#a3a3a3", lineHeight: 1.6, marginBottom: 20 }}>
          Hệ thống phát hiện công cụ developer/inspect đang mở. Vì lý do bảo mật,
          vui lòng đóng công cụ này và tải lại trang để tiếp tục.
        </p>
        <button
          type="button"
          onClick={() => {
            // Chỉ cho qua khi devtools đã đóng (kích thước trở lại bình thường).
            const stillOpen =
              window.outerWidth - window.innerWidth > 170 ||
              window.outerHeight - window.innerHeight > 170;
            if (!stillOpen) {
              setBlocked(false);
            } else {
              window.location.reload();
            }
          }}
          style={{
            background: "#fff",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
}
