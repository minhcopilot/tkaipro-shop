import { desc, eq, ilike, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import { db } from "~/db";
import { accountOtpKeysTable } from "~/db/schema";
import {
  generateAccessKey,
  hashAccessKey,
  isValidEmail,
  normalizeEmail,
} from "~/lib/account-otp-keys";
import { getCurrentAdmin } from "~/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BULK = 500;

const publicColumns = {
  id: accountOtpKeysTable.id,
  email: accountOtpKeysTable.email,
  isActive: accountOtpKeysTable.isActive,
  note: accountOtpKeysTable.note,
  createdBy: accountOtpKeysTable.createdBy,
  createdAt: accountOtpKeysTable.createdAt,
  updatedAt: accountOtpKeysTable.updatedAt,
  lastUsedAt: accountOtpKeysTable.lastUsedAt,
};

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function cleanNote(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().slice(0, 500);
  return s || null;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden();

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  try {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const rows = await db
      .select(publicColumns)
      .from(accountOtpKeysTable)
      .where(
        q
          ? or(
              ilike(accountOtpKeysTable.email, pattern),
              ilike(accountOtpKeysTable.note, pattern),
            )
          : undefined,
      )
      .orderBy(desc(accountOtpKeysTable.createdAt))
      .limit(500);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[admin/account-otp-keys GET] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_BODY" }, { status: 400 });
  }

  const note = cleanNote(body?.note);
  const rawList: string[] =
    typeof body?.emails === "string"
      ? body.emails.split(/[\r\n,;]+/)
      : [String(body?.email ?? "")];

  const invalid: string[] = [];
  const seen = new Set<string>();
  const inputDuplicates: string[] = [];
  const candidates: string[] = [];
  for (const raw of rawList) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const email = normalizeEmail(trimmed);
    if (!isValidEmail(email)) {
      invalid.push(trimmed);
      continue;
    }
    if (seen.has(email)) {
      inputDuplicates.push(email);
      continue;
    }
    seen.add(email);
    candidates.push(email);
  }

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "NO_VALID_EMAIL", created: [], invalid, duplicates: [] },
      { status: 400 },
    );
  }
  if (candidates.length > MAX_BULK) {
    return NextResponse.json(
      { error: "TOO_MANY", message: `Tối đa ${MAX_BULK} email mỗi lần` },
      { status: 400 },
    );
  }

  try {
    const existing = await db
      .select({ email: accountOtpKeysTable.email })
      .from(accountOtpKeysTable)
      .where(inArray(accountOtpKeysTable.email, candidates));
    const existingSet = new Set(existing.map((r) => r.email));
    const duplicates = candidates.filter((e) => existingSet.has(e));
    const toCreate = candidates.filter((e) => !existingSet.has(e));

    const now = new Date();
    const created: { email: string; accessKey: string }[] = [];
    const values = toCreate.map((email) => {
      const accessKey = generateAccessKey();
      created.push({ email, accessKey });
      return {
        id: nanoid(),
        email,
        keyHash: hashAccessKey(accessKey),
        isActive: true,
        note,
        createdBy: admin.id,
        createdAt: now,
        updatedAt: now,
      };
    });

    if (values.length > 0) {
      const inserted = await db
        .insert(accountOtpKeysTable)
        .values(values)
        .onConflictDoNothing({ target: accountOtpKeysTable.email })
        .returning({ email: accountOtpKeysTable.email });
      const insertedSet = new Set(inserted.map((r) => r.email));
      for (let i = created.length - 1; i >= 0; i--) {
        const item = created[i]!;
        if (!insertedSet.has(item.email)) {
          duplicates.push(item.email);
          created.splice(i, 1);
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        created,
        duplicates: [...duplicates, ...inputDuplicates],
        invalid,
      },
      { status: created.length > 0 ? 201 : 200 },
    );
  } catch (err) {
    console.error("[admin/account-otp-keys POST] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_BODY" }, { status: 400 });
  }

  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const updates: Partial<typeof accountOtpKeysTable.$inferInsert> = {};
  let accessKey: string | null = null;

  if (body?.action === "rotate") {
    accessKey = generateAccessKey();
    updates.keyHash = hashAccessKey(accessKey);
  }
  if (typeof body?.isActive === "boolean") updates.isActive = body.isActive;
  if ("note" in (body ?? {})) updates.note = cleanNote(body.note);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }
  updates.updatedAt = new Date();

  try {
    const [row] = await db
      .update(accountOtpKeysTable)
      .set(updates)
      .where(eq(accountOtpKeysTable.id, id))
      .returning(publicColumns);
    if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json(accessKey ? { ok: true, row, accessKey } : { ok: true, row });
  } catch (err) {
    console.error("[admin/account-otp-keys PATCH] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden();

  let id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    const body = (await request.json().catch(() => null)) as {
      id?: unknown;
    } | null;
    id = String(body?.id ?? "");
  }
  id = id.trim();
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  try {
    const deleted = await db
      .delete(accountOtpKeysTable)
      .where(eq(accountOtpKeysTable.id, id))
      .returning({ id: accountOtpKeysTable.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/account-otp-keys DELETE] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
