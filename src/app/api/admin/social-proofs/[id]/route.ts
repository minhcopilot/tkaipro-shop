import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { socialProofs } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

// GET - lấy chi tiết social proof
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const proof = await db.query.socialProofs.findFirst({
      where: eq(socialProofs.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    return NextResponse.json({ proof });
  } catch (error) {
    console.error("Error fetching social proof:", error);
    return NextResponse.json(
      { error: "Failed to fetch social proof" },
      { status: 500 }
    );
  }
}

// PATCH - cập nhật social proof
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      imageUrl,
      platform,
      productType,
      orderNumber,
      customerName,
      amount,
      orderDate,
      isActive,
      isFeatured,
      displayOrder,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (platform !== undefined) updateData.platform = platform;
    if (productType !== undefined) updateData.productType = productType;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (amount !== undefined) updateData.amount = amount;
    if (orderDate !== undefined) updateData.orderDate = orderDate ? new Date(orderDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const updatedProof = await db
      .update(socialProofs)
      .set(updateData)
      .where(eq(socialProofs.id, id))
      .returning();

    if (updatedProof.length === 0) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    return NextResponse.json({ proof: updatedProof[0] });
  } catch (error) {
    console.error("Error updating social proof:", error);
    return NextResponse.json(
      { error: "Failed to update social proof" },
      { status: 500 }
    );
  }
}

// DELETE - xóa social proof
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deletedProof = await db
      .delete(socialProofs)
      .where(eq(socialProofs.id, id))
      .returning();

    if (deletedProof.length === 0) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social proof:", error);
    return NextResponse.json(
      { error: "Failed to delete social proof" },
      { status: 500 }
    );
  }
}

