import type { Metadata } from "next";

import { getCurrentUserOrRedirect } from "~/lib/auth";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/ui/components/page-header";
import { Shell } from "~/ui/primitives/shell";

import { SignOutPageWrapper } from "./page-wrapper";

export const metadata: Metadata = {
  description: "Sign out of your account",
  metadataBase: new URL(
    process.env.NEXT_SERVER_APP_URL || "",
  ),
  title: "Sign out",
};

export default async function SignOutPage() {
  await getCurrentUserOrRedirect();

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Sign out</PageHeaderHeading>
        <PageHeaderDescription>
          Are you sure you want to sign out?
        </PageHeaderDescription>
      </PageHeader>
      <SignOutPageWrapper />
    </Shell>
  );
}
