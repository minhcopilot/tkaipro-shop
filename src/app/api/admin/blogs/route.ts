import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { 
  getAllBlogPosts, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
} from "~/lib/queries/blogs";

// lấy danh sách blog posts với filter và pagination
export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;
    const sortBy = searchParams.get("sortBy") as any || "createdAt";
    const sortOrder = searchParams.get("sortOrder") as any || "desc";
    
    // filters
    const filters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      isFeatured: searchParams.get("isFeatured") ? searchParams.get("isFeatured") === "true" : undefined,
    };

    const result = await getAllBlogPosts({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// tạo blog post mới
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    
    // validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const newPost = await createBlogPost({
      ...body,
      authorId: admin.id,
      authorName: admin.name || undefined,
      status: body.status || "draft",
      publishedAt: body.status === "published" ? new Date() : undefined,
    });

    if (!newPost) {
      return NextResponse.json(
        { error: "Failed to create blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

// cập nhật blog post
export async function PUT(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { postId, ...updateData } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // nếu status là published và chưa có publishedAt, set publishedAt
    if (updateData.status === "published") {
      if (!updateData.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (typeof updateData.publishedAt === "string") {
        // convert ISO string to Date object
        updateData.publishedAt = new Date(updateData.publishedAt);
      }
    }

    // đảm bảo tags và metaKeywords là arrays
    if (updateData.tags && !Array.isArray(updateData.tags)) {
      updateData.tags = [];
    }
    if (updateData.metaKeywords && !Array.isArray(updateData.metaKeywords)) {
      updateData.metaKeywords = [];
    }

    const updatedPost = await updateBlogPost(postId, updateData);

    if (!updatedPost) {
      console.error("updateBlogPost returned null for postId:", postId);
      return NextResponse.json(
        { error: "Failed to update blog post. Check server logs for details." },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update blog post: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// xóa blog post
export async function DELETE(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteBlogPost(postId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}

