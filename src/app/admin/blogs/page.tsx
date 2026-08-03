import { getAllBlogPosts } from "~/lib/queries/blogs";

import AdminBlogsClient from "./page.client";

export default async function AdminBlogsPage() {
  const result = await getAllBlogPosts({ page: 1, limit: 50 });

  return (
    <AdminBlogsClient 
      initialPosts={result.posts} 
      initialTotal={result.total}
    />
  );
}

