import { getCurrentUserOrRedirect } from "~/lib/auth";

import { SignInPageWrapper } from "./page-wrapper";

export default async function SignInPage() {
  await getCurrentUserOrRedirect(
    undefined,
    "/", // redirect về trang chủ nếu đã đăng nhập
    true,
  );

  return <SignInPageWrapper />;
}
