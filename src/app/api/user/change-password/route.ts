import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth, getCurrentUser } from "~/lib/auth";

/**
 * Đổi mật khẩu user/admin.
 *
 * FIX: trước đây route verify bằng bcrypt, nhưng better-auth lưu hash bằng
 * scrypt -> bcrypt.compare luôn fail ("Mật khẩu hiện tại không đúng"). Giờ
 * uỷ quyền hoàn toàn cho better-auth `changePassword` để dùng đúng thuật toán
 * hash + xử lý session.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Người dùng không được xác thực" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có ít nhất 8 ký tự" },
        { status: 400 },
      );
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: request.headers,
      });
    } catch (err: any) {
      // better-auth ném lỗi khi sai mật khẩu hiện tại HOẶC tài khoản chưa có
      // mật khẩu (đăng nhập bằng Google/GitHub).
      const msg = String(err?.message ?? err ?? "").toLowerCase();
      const status = err?.statusCode ?? err?.status;
      if (
        msg.includes("credential") ||
        msg.includes("no password") ||
        msg.includes("not found") ||
        msg.includes("provider")
      ) {
        return NextResponse.json(
          {
            error:
              "Tài khoản của bạn đăng nhập bằng Google/GitHub nên chưa có mật khẩu. Hãy dùng chức năng 'Quên mật khẩu' để đặt mật khẩu mới.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không đúng" },
        { status: status === 401 ? 400 : 400 },
      );
    }

    return NextResponse.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi đổi mật khẩu" },
      { status: 500 },
    );
  }
}
