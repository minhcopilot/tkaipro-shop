import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { db } from "~/db";
import { licenseTable } from "~/db/schema";
import { desc, eq, ilike, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // build query
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(licenseTable.productName, `%${search}%`),
          ilike(licenseTable.licenseName, `%${search}%`),
          ilike(licenseTable.assigneeName, `%${search}%`)
        )
      );
    }

    if (status) {
      whereConditions.push(eq(licenseTable.status, status));
    }

    // get licenses
    const licenses = await db
      .select()
      .from(licenseTable)
      .where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
      .orderBy(desc(licenseTable.createdAt))
      .limit(limit)
      .offset(offset);

    // get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(licenseTable)
      .where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined);

    return NextResponse.json({
      licenses,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "License ID is required" },
        { status: 400 }
      );
    }

    await db.delete(licenseTable).where(eq(licenseTable.id, id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting license:', error);
    return NextResponse.json(
      { error: 'Failed to delete license' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json();
    const { id, status, isUsed, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "License ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (isUsed !== undefined) {
      updateData.isUsed = isUsed;
      if (isUsed) updateData.usedAt = new Date();
    }
    if (notes !== undefined) updateData.notes = notes;

    const [updatedLicense] = await db
      .update(licenseTable)
      .set(updateData)
      .where(eq(licenseTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      license: updatedLicense,
    });

  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json(
      { error: 'Failed to update license' },
      { status: 500 }
    );
  }
} 