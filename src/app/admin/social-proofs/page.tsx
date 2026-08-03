import { desc } from "drizzle-orm";

import { db } from "~/db";
import { socialProofs } from "~/db/schema";
import { getCurrentAdminOrRedirect } from "~/lib/auth";

import SocialProofsClientPage from "./page.client";

export const metadata = {
  title: "Quản lý minh chứng đơn hàng | Admin",
  description: "Quản lý minh chứng đơn hàng để xây dựng lòng tin với khách hàng",
};

export default async function SocialProofsPage() {
  await getCurrentAdminOrRedirect();

  const proofs = await db.query.socialProofs.findMany({
    orderBy: [desc(socialProofs.isFeatured), desc(socialProofs.createdAt)],
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return <SocialProofsClientPage proofs={proofs} />;
}

