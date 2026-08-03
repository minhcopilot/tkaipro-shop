import { NextResponse } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { refreshChatCache, getCacheStatus } from "~/lib/chat-cache";

// GET: lấy trạng thái cache hiện tại
export async function GET() {
  try {
    await getCurrentAdminOrRedirect();

    const status = getCacheStatus();

    return NextResponse.json({
      ...status,
      lastUpdated: status.lastUpdated?.toISOString() ?? null,
      expiresAt: status.expiresAt?.toISOString() ?? null,
      ttlHours: status.ttlMs / (60 * 60 * 1000),
    });
  } catch (error) {
    console.error("Error getting cache status:", error);
    return NextResponse.json(
      { error: "Failed to get cache status" },
      { status: 500 }
    );
  }
}

// POST: refresh cache thủ công
export async function POST() {
  try {
    await getCurrentAdminOrRedirect();

    const result = await refreshChatCache();

    return NextResponse.json({
      ...result,
      lastUpdated: result.lastUpdated?.toISOString() ?? null,
      expiresAt: result.expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error refreshing cache:", error);
    return NextResponse.json(
      { error: "Failed to refresh cache" },
      { status: 500 }
    );
  }
}
