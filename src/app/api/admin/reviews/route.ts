import { NextResponse } from "next/server";
import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { getAllReviews } from "~/lib/queries/reviews";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdminOrRedirect();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getAllReviews({ page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
