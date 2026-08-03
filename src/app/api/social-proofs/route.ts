import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";

import { db } from "~/db";
import { socialProofs, PROOF_PRODUCT_TYPES } from "~/db/schema";

// GET - lấy danh sách social proofs công khai (chỉ active)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const productType = searchParams.get("productType");
    const limit = searchParams.get("limit");
    const includeStats = searchParams.get("stats") === "true";

    let conditions = [eq(socialProofs.isActive, true)];
    
    if (platform) {
      conditions.push(eq(socialProofs.platform, platform));
    }
    
    if (productType) {
      conditions.push(eq(socialProofs.productType, productType));
    }

    const query = db.query.socialProofs.findMany({
      where: and(...conditions),
      orderBy: [desc(socialProofs.isFeatured), desc(socialProofs.displayOrder), desc(socialProofs.createdAt)],
      columns: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        platform: true,
        productType: true,
        orderNumber: true,
        customerName: true,
        amount: true,
        orderDate: true,
        isFeatured: true,
        createdAt: true,
      },
    });

    let proofs = await query;
    
    if (limit) {
      proofs = proofs.slice(0, parseInt(limit));
    }

    const response: { proofs: typeof proofs; stats?: any } = { proofs };

    // tính toán thống kê nếu được yêu cầu
    if (includeStats) {
      const allProofs = await db.query.socialProofs.findMany({
        where: eq(socialProofs.isActive, true),
        columns: {
          productType: true,
        },
      });

      response.stats = {
        total: allProofs.length,
        byProduct: {
          cursor: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL || p.productType === PROOF_PRODUCT_TYPES.CURSOR_PRO_OFFICIAL_239K).length,
          github: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.GITHUB_COPILOT).length,
          figma: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.FIGMA_PRO).length,
          jetbrains: allProofs.filter(p => p.productType === PROOF_PRODUCT_TYPES.JETBRAINS_EDU).length,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching social proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch social proofs" },
      { status: 500 }
    );
  }
}

