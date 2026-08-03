import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { getAllUsers, updateUser, deleteUser, changeUserRole, getUserStats, type TimeFilter } from "~/lib/queries/users";

// lấy danh sách tất cả users với pagination
export async function GET(request: NextRequest) {
  try {
    // kiểm tra quyền admin
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const timeFilter = (searchParams.get("timeFilter") as TimeFilter) || "all";
    const includeStats = searchParams.get("includeStats") === "true";

    const [result, stats] = await Promise.all([
      getAllUsers({ search, page, limit, timeFilter }),
      includeStats ? getUserStats() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ...result,
      ...(stats && { stats }),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// cập nhật user
export async function PUT(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(userId, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// xóa user
export async function DELETE(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteUser(userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 