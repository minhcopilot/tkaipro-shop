import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";

import { db } from "~/db";
import { socialProofs } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

// GET - lấy danh sách social proofs
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const productType = searchParams.get("productType");
    const isActive = searchParams.get("isActive");

    let conditions = [];
    
    if (platform) {
      conditions.push(eq(socialProofs.platform, platform));
    }
    
    if (productType) {
      conditions.push(eq(socialProofs.productType, productType));
    }
    
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(socialProofs.isActive, isActive === "true"));
    }

    const proofs = await db.query.socialProofs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(socialProofs.isFeatured), desc(socialProofs.createdAt)],
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

    return NextResponse.json({ proofs });
  } catch (error) {
    console.error("Error fetching social proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch social proofs" },
      { status: 500 }
    );
  }
}

// POST - tạo social proof mới
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!title || !imageUrl || !platform || !productType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newProof = await db.insert(socialProofs).values({
      title,
      description,
      imageUrl,
      platform,
      productType,
      orderNumber,
      customerName,
      amount,
      orderDate: orderDate ? new Date(orderDate) : undefined,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      displayOrder: displayOrder ?? "0",
      createdBy: admin.id,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ proof: newProof[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating social proof:", error);
    return NextResponse.json(
      { error: "Failed to create social proof" },
      { status: 500 }
    );
  }
}

