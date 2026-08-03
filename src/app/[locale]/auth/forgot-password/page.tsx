import type { Metadata } from "next";

import { SEO_CONFIG } from "~/app";
import { getCurrentUserOrRedirect } from "~/lib/auth";

import { ForgotPasswordPageWrapper } from "./page-wrapper";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: `Đặt lại mật khẩu cho tài khoản ${SEO_CONFIG.name} của bạn`,
};

export default async function ForgotPasswordPage() {
  // redirect nếu user đã đăng nhập
  await getCurrentUserOrRedirect("/", "/", true);

  return <ForgotPasswordPageWrapper />;
} 