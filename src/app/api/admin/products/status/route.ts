import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { updateProductStatus } from "~/lib/queries/products";

// thay đổi trạng thái product
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { productId, status } = body;

    if (!productId || !status) {
      return NextResponse.json(
        { error: "Product ID and status are required" },
        { status: 400 }
      );
    }

    // validate status
    const validStatuses = ["active", "inactive", "draft"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be active, inactive, or draft" },
        { status: 400 }
      );
    }

    const updatedProduct = await updateProductStatus(productId, status);

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product status" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product status:", error);
    return NextResponse.json(
      { error: "Failed to update product status" },
      { status: 500 }
    );
  }
} 