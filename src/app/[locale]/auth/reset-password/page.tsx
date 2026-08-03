import type { Metadata } from "next";

import { SEO_CONFIG } from "~/app";
import { getCurrentUserOrRedirect } from "~/lib/auth";

import { ResetPasswordPageWrapper } from "./page-wrapper";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: `Tạo mật khẩu mới cho tài khoản ${SEO_CONFIG.name} của bạn`,
};

export default async function ResetPasswordPage() {
  // redirect nếu user đã đăng nhập
  await getCurrentUserOrRedirect("/", "/", true);

  return <ResetPasswordPageWrapper />;
} 