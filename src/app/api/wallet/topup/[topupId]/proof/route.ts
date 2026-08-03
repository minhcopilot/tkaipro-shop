import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { attachTopupProof } from "~/lib/queries/wallet";

/**
 * POST /api/wallet/topup/[topupId]/proof — user signals "I have transferred".
 * Optional proof URL: if provided, must be http(s); if empty, only flips
 * status pending → pending_review so admin can review.
 *
 * Body: { proofImageUrl?: string } — optional URL from uploadthing/imgur/etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topupId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawUrl = String(body?.proofImageUrl ?? "").trim();
  // Empty -> store null. Non-empty -> must be http(s).
  if (rawUrl && !/^https?:\/\//.test(rawUrl)) {
    return NextResponse.json(
      { error: "INVALID_PROOF_URL" },
      { status: 400 },
    );
  }
  const proofImageUrl = rawUrl || null;

  const { topupId } = await params;
  const updated = await attachTopupProof({
    topupId,
    userId: user.id,
    proofImageUrl,
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Topup not found, not yours, or no longer pending" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    proofImageUrl: updated.proofImageUrl,
  });
}
