"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // log error details for debugging
    console.error("[Global Error Boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    });
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: "500px", textAlign: "center" }}>
            <h2
              style={{ marginBottom: "16px", fontSize: "24px", color: "#dc2626" }}
            >
              Đã xảy ra lỗi nghiêm trọng!
            </h2>
            <div
              style={{
                marginBottom: "16px",
                padding: "16px",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              <p style={{ fontWeight: "600" }}>Error Details:</p>
              <p style={{ color: "#4b5563" }}>Name: {error.name}</p>
              <p style={{ color: "#4b5563" }}>Message: {error.message}</p>
              {error.digest && (
                <p style={{ color: "#4b5563" }}>Digest: {error.digest}</p>
              )}
              <details style={{ marginTop: "8px" }}>
                <summary style={{ cursor: "pointer", color: "#2563eb" }}>
                  Stack trace
                </summary>
                <pre
                  style={{
                    marginTop: "8px",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            </div>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
