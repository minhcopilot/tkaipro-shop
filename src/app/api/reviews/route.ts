import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "~/lib/auth";
import { createReview, getReviewsByProductId } from "~/lib/queries/reviews";

// Schema for creating a review
const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = createReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { productId, rating, comment } = validation.data;

    const review = await createReview({
      userId: user.id,
      productId,
      rating,
      comment: comment || null,
      isPublished: true, // Auto-publish for now
    });

    if (!review) {
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const result = await getReviewsByProductId(productId, { page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
