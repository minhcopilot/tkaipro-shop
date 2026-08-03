import { getCurrentUserOrRedirect } from "~/lib/auth";

import { SignUpPageWrapper } from "./page-wrapper";

export default async function SignUpPage() {
  await getCurrentUserOrRedirect(
    undefined,
    "/", // redirect về trang chủ nếu đã đăng nhập  
    true,
  );

  return <SignUpPageWrapper />;
}
