import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { changeUserRole } from "~/lib/queries/users";

// thay đổi role của user
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "User ID and new role are required" },
        { status: 400 }
      );
    }

    // validate role
    const validRoles = ["USER", "ADMIN"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be USER or ADMIN" },
        { status: 400 }
      );
    }

    const updatedUser = await changeUserRole(userId, newRole);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to change user role" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json(
      { error: "Failed to change user role" },
      { status: 500 }
    );
  }
}
