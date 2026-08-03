import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { userTable, sessionTable } from "~/db/schema/users/tables";
import { userIpLogTable } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";
import { addBan, removeBan } from "~/lib/security/ban-list";
import { addExempt, removeExempt } from "~/lib/security/exempt-list";
import { recordSecurityEvent } from "~/lib/security/security-audit";

export const runtime = "nodejs";

/** Lấy email + tất cả IP/fingerprint/did đã biết của 1 user từ user_ip_log. */
async function collectUserIdentifiers(userId: string): Promise<{
  email: string | null;
  ips: string[];
  fingerprints: string[];
  dids: string[];
}> {
  const [u] = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const rows = await db
    .select({
      ip: userIpLogTable.ip,
      fingerprint: userIpLogTable.fingerprint,
      did: userIpLogTable.did,
    })
    .from(userIpLogTable)
    .where(eq(userIpLogTable.userId, userId));

  const ips = new Set<string>();
  const fingerprints = new Set<string>();
  const dids = new Set<string>();
  for (const r of rows) {
    if (r.ip && r.ip !== "unknown") ips.add(r.ip);
    if (r.fingerprint) fingerprints.add(r.fingerprint);
    if (r.did) dids.add(r.did);
  }
  return {
    email: u?.email ?? null,
    ips: [...ips],
    fingerprints: [...fingerprints],
    dids: [...dids],
  };
}

/**
 * POST /api/admin/users/ban  { userId }
 * Ban nhanh 1 user: ban email + tất cả IP + fingerprint/did đã biết + revoke
 * session. Đây là ban thủ công (admin quyết định) -> vĩnh viễn.
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const userId = String(body.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
  }

  const ids = await collectUserIdentifiers(userId);
  const label = admin.email ?? admin.name ?? "admin";
  const reason = `Admin ban nhanh user ${userId}`;

  let banned = { emails: 0, ips: 0, fingerprints: 0 };
  const tasks: Promise<unknown>[] = [];

  // Admin ban tay lại -> xoá miễn trừ (nếu có) để trạng thái nhất quán.
  if (ids.email) {
    tasks.push(removeExempt("email", ids.email));
    tasks.push(
      addBan({ kind: "email", value: ids.email, reason, bannedBy: admin.id, bannedByLabel: label }).then(
        (r) => { if (r.ok) banned.emails++; },
      ),
    );
  }
  for (const ip of ids.ips) {
    tasks.push(removeExempt("ip", ip));
    tasks.push(
      addBan({ kind: "ip", value: ip, reason, bannedBy: admin.id, bannedByLabel: label }).then(
        (r) => { if (r.ok) banned.ips++; },
      ),
    );
  }
  for (const fp of [...ids.fingerprints, ...ids.dids]) {
    tasks.push(removeExempt("fingerprint", fp));
    tasks.push(
      addBan({ kind: "fingerprint", value: fp, reason, bannedBy: admin.id, bannedByLabel: label }).then(
        (r) => { if (r.ok) banned.fingerprints++; },
      ),
    );
  }
  await Promise.allSettled(tasks);

  // Revoke tất cả session của user (đá ra ngay).
  try {
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  } catch (err) {
    console.warn("[users/ban] revoke sessions failed:", err);
  }

  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "ok",
    reasonCode: "BAN_USER",
    customerEmail: ids.email ?? undefined,
    metadata: { userId, adminId: admin.id, banned },
  });

  return NextResponse.json({ ok: true, email: ids.email, banned });
}

/**
 * DELETE /api/admin/users/ban?userId=...
 * Gỡ ban nhanh: gỡ email + IP + fingerprint/did của user.
 */
export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (new URL(request.url).searchParams.get("userId") ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
  }

  const ids = await collectUserIdentifiers(userId);
  const label = admin.email ?? admin.name ?? null;
  const tasks: Promise<unknown>[] = [];
  // Gỡ ban + thêm miễn auto-ban cho từng định danh (không tự ban lại nữa).
  if (ids.email) {
    tasks.push(removeBan("email", ids.email));
    tasks.push(addExempt({ kind: "email", value: ids.email, note: "admin gỡ ban user", createdBy: admin.id, createdByLabel: label }));
  }
  for (const ip of ids.ips) {
    tasks.push(removeBan("ip", ip));
    tasks.push(addExempt({ kind: "ip", value: ip, note: "admin gỡ ban user", createdBy: admin.id, createdByLabel: label }));
  }
  for (const fp of [...ids.fingerprints, ...ids.dids]) {
    tasks.push(removeBan("fingerprint", fp));
    tasks.push(addExempt({ kind: "fingerprint", value: fp, note: "admin gỡ ban user", createdBy: admin.id, createdByLabel: label }));
  }
  await Promise.allSettled(tasks);

  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "ok",
    reasonCode: "UNBAN_USER",
    customerEmail: ids.email ?? undefined,
    metadata: { userId, adminId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
