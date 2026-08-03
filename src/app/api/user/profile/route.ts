import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUserOrRedirect } from "~/lib/auth";
import { updateUser } from "~/lib/queries/users";

// user cập nhật profile của họ
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserOrRedirect();

    if (!user) {
      return NextResponse.json(
        { error: "Người dùng không được xác thực" },
        { status: 401 }
      );
    }

    const body = await request.json() as any;
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Tên và email là bắt buộc" },
        { status: 400 }
      );
    }

    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Định dạng email không hợp lệ" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(user.id, { name, email });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Không thể cập nhật thông tin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Cập nhật thông tin thành công",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật thông tin" },
      { status: 500 }
    );
  }
} 