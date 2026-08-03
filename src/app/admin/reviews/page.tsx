"use client";

import dynamic from "next/dynamic";

const AdminReviewsContent = dynamic(
  () => import("./reviews-content"),
  { ssr: false, loading: () => <div className="p-6">Loading...</div> }
);

export default function AdminReviewsPage() {
  return <AdminReviewsContent />;
}
