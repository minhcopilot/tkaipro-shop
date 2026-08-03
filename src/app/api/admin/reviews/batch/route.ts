import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { db } from "~/db";
import { reviewTable, productTable } from "~/db/schema";
import { inArray, eq, sql, count, and } from "drizzle-orm";

// Schema for validation
const batchActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["delete", "reply"]),
  reply: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdminOrRedirect();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = batchActionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { ids, action, reply } = result.data;

    if (action === "delete") {
        // 1. Get product IDs to update stats later
        const reviewsToDelete = await db
            .select({ productId: reviewTable.productId })
            .from(reviewTable)
            .where(inArray(reviewTable.id, ids));
        
        const productIds = Array.from(new Set(reviewsToDelete.map(r => r.productId)));

        // 2. Delete reviews
        await db.delete(reviewTable).where(inArray(reviewTable.id, ids));

        // 3. Update stats for each product
        for (const pid of productIds) {
            await updateProductRatingStats(pid);
        }

        return NextResponse.json({ success: true, count: ids.length });
    } 
    
    if (action === "reply") {
        if (!reply) {
            return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
        }

        // Update all selected reviews
        await db
            .update(reviewTable)
            .set({
                reply,
                replyAt: new Date(),
                updatedAt: new Date(),
            })
            .where(inArray(reviewTable.id, ids));
        
        return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Batch operation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Copy of helper from queries/reviews.ts to avoid circular deps or complex exports if not exported
// Ideally this should be imported from queries/reviews.ts if exported.
// Let's check queries/reviews.ts content from previous steps. 
// It was not exported. I should probably export it or duplicate it here safely.
// Since it was 'async function updateProductRatingStats', getting it from queries/reviews.ts is better if I export it.
// But for now to be quick and safe (since I didn't export it in previous turns explicitly, although I might have),
// I'll duplicate the logic here or modify queries/reviews.ts to export it.
// Checking previous turn... I did NOT export `updateProductRatingStats`.
// I will duplicate it here to avoid modifying `queries/reviews.ts` just for this.

async function updateProductRatingStats(productId: string) {
    try {
        const stats = await db
            .select({
                avgRating: sql<number>`avg(${reviewTable.rating})::real`,
                count: count(),
            })
            .from(reviewTable)
            .where(
                and(
                    eq(reviewTable.productId, productId),
                    eq(reviewTable.isPublished, true)
                )
            );

        if (stats.length > 0) {
            await db
                .update(productTable)
                .set({
                    rating: stats[0].avgRating || 0,
                    reviewCount: stats[0].count || 0,
                })
                .where(eq(productTable.id, productId));
        }
    } catch (error) {
        console.error("Failed to update product stats:", error);
    }
}
