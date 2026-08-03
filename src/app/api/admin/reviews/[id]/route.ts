import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminOrRedirect } from "~/lib/auth"; // Ensures admin check
import { deleteReview, replyToReview } from "~/lib/queries/reviews";

// Schema for replying
const replySchema = z.object({
  reply: z.string().min(1, "Reply content is required"),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next 15
) {
  try {
    // Verify admin access
    const admin = await getCurrentAdminOrRedirect();
    if (!admin) {
        // getCurrentAdminOrRedirect redirects, but just in case
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const success = await deleteReview(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete review or review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     // Verify admin access
     const admin = await getCurrentAdminOrRedirect();
     if (!admin) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }
 
     const { id } = await params;
     const body = await request.json();

     const validation = replySchema.safeParse(body);
     if (!validation.success) {
       return NextResponse.json(
         { error: "Invalid request data", details: validation.error.format() },
         { status: 400 }
       );
     }

     const review = await replyToReview(id, validation.data.reply);

     if (!review) {
        return NextResponse.json(
            { error: "Failed to reply to review" },
            { status: 500 }
        );
     }

     return NextResponse.json({ review });
  } catch (error) {
    console.error("Error replying to review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
