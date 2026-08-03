import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory
} from "~/lib/queries/products";

// lấy tất cả categories (admin cần xem cả inactive)
export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    // admin cần xem tất cả danh mục, kể cả inactive
    const categories = await getAllCategories(true);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// tạo category mới
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;

    if (!body.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const newCategory = await createCategory(body);

    if (!newCategory) {
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// cập nhật category
export async function PUT(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const updatedCategory = await updateCategory(id, updateData);

    if (!updatedCategory) {
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// xóa category
export async function DELETE(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteCategory(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 