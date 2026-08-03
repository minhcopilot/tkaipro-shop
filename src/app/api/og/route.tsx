import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { SEO_CONFIG, SITE_HOST } from "~/app";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const title = searchParams.get("title") || SEO_CONFIG.name;
  const description =
    searchParams.get("description") ||
    "Independent reseller of Google AI / Antigravity subscriptions";
  const locale = searchParams.get("locale") || "vi";

  const isVietnamese = locale === "vi";
  
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          position: "relative",
        }}
      >
        {/* background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
          }}
        />
        
        {/* content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            maxWidth: "1000px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* logo area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ⚡ {SEO_CONFIG.name}
            </div>
          </div>
          
          {/* main title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: "24px",
              maxWidth: "900px",
            }}
          >
            {title.length > 50 ? title.substring(0, 50) + "..." : title}
          </div>
          
          {/* description */}
          <div
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              lineHeight: 1.4,
              marginBottom: "40px",
              maxWidth: "800px",
            }}
          >
            {description.length > 100 ? description.substring(0, 100) + "..." : description}
          </div>
          
          {/* badges */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                padding: "12px 24px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <span style={{ fontSize: "22px", color: "#818cf8" }}>
                {isVietnamese ? "✅ Tiết kiệm 90%" : "✅ Save 90%"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                borderRadius: "50px",
                padding: "12px 24px",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              <span style={{ fontSize: "22px", color: "#c084fc" }}>
                {isVietnamese ? "🛡️ Bảo hành 1 đổi 1" : "🛡️ 1-to-1 Warranty"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                borderRadius: "50px",
                padding: "12px 24px",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <span style={{ fontSize: "22px", color: "#4ade80" }}>
                {isVietnamese ? "💬 Hỗ trợ 24/7" : "💬 24/7 Support"}
              </span>
            </div>
          </div>
        </div>
        
        {/* footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px", color: "#6366f1" }}>🌐</span>
            <span style={{ fontSize: "24px", color: "#71717a" }}>{SITE_HOST}</span>
          </div>
          <span
            style={{
              fontSize: "14px",
              color: "#52525b",
              maxWidth: "1000px",
              textAlign: "center",
            }}
          >
            Independent reseller. Not affiliated with Google LLC
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

