import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { affiliateVoucherTable, VOUCHER_STATUS } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";
import { logAuditAction } from "~/lib/queries/vouchers";

function getIp(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") || undefined;
}

interface PatchPayload {
  note?: string | null;
  status?: string;
  disabledReason?: string | null;
  validUntil?: string | null;
  maxUses?: number;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as PatchPayload;

    const existing = await db.query.affiliateVoucherTable.findFirst({
      where: eq(affiliateVoucherTable.id, id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const diff: Record<string, { from: unknown; to: unknown }> = {};

    if ("note" in body) {
      const newNote = body.note?.trim() || null;
      if (newNote !== existing.note) {
        updateData.note = newNote;
        diff.note = { from: existing.note, to: newNote };
      }
    }

    if ("status" in body && body.status) {
      const validStatuses: string[] = Object.values(VOUCHER_STATUS);
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 },
        );
      }
      if (body.status !== existing.status) {
        updateData.status = body.status;
        diff.status = { from: existing.status, to: body.status };
        if (body.status === VOUCHER_STATUS.DISABLED) {
          updateData.disabledAt = new Date();
          updateData.disabledByAdminId = admin.id;
          updateData.disabledReason = body.disabledReason?.trim() || "Admin disable";
        }
      }
    }

    if ("validUntil" in body) {
      const newDate = body.validUntil ? new Date(body.validUntil) : null;
      const oldStr = existing.validUntil?.toISOString() ?? null;
      const newStr = newDate?.toISOString() ?? null;
      if (oldStr !== newStr) {
        updateData.validUntil = newDate;
        diff.validUntil = { from: oldStr, to: newStr };
      }
    }

    if ("maxUses" in body && typeof body.maxUses === "number") {
      if (body.maxUses < existing.usedCount) {
        return NextResponse.json(
          {
            error: `maxUses (${body.maxUses}) không được nhỏ hơn usedCount hiện tại (${existing.usedCount})`,
          },
          { status: 400 },
        );
      }
      if (body.maxUses !== existing.maxUses) {
        updateData.maxUses = body.maxUses;
        diff.maxUses = { from: existing.maxUses, to: body.maxUses };
      }
    }

    if (Object.keys(diff).length === 0) {
      return NextResponse.json({ voucher: existing });
    }

    const updated = await db
      .update(affiliateVoucherTable)
      .set(updateData)
      .where(eq(affiliateVoucherTable.id, id))
      .returning();

    await logAuditAction({
      voucherId: id,
      adminId: admin.id,
      action:
        diff.status?.to === VOUCHER_STATUS.DISABLED ? "disabled" : "updated",
      diff,
      ipAddress: getIp(request),
    });

    return NextResponse.json({ voucher: updated[0] });
  } catch (err) {
    console.error("PATCH /api/admin/vouchers/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Soft delete: set status = disabled với reason "deleted by admin".
    // Không hard delete vì còn redemption history + audit log tham chiếu.
    const existing = await db.query.affiliateVoucherTable.findFirst({
      where: eq(affiliateVoucherTable.id, id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(affiliateVoucherTable)
      .set({
        status: VOUCHER_STATUS.DISABLED,
        disabledReason: "Deleted by admin",
        disabledAt: new Date(),
        disabledByAdminId: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(affiliateVoucherTable.id, id));

    await logAuditAction({
      voucherId: id,
      adminId: admin.id,
      action: "deleted",
      diff: { status: { from: existing.status, to: VOUCHER_STATUS.DISABLED } },
      ipAddress: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/vouchers/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete voucher" },
      { status: 500 },
    );
  }
}
