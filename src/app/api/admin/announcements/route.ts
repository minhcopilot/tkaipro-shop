import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "~/db";
import { announcements } from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db.query.announcements.findMany({
      orderBy: [desc(announcements.priority), desc(announcements.createdAt)],
    });

    return NextResponse.json({ announcements: items });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, type, imageUrl, linkUrl, linkText, isActive, priority, startDate, endDate } = body;

    if (!title?.vi || !content?.vi) {
      return NextResponse.json(
        { error: "Tiêu đề và nội dung tiếng Việt là bắt buộc" },
        { status: 400 }
      );
    }

    const newAnnouncement = await db.insert(announcements).values({
      title,
      content,
      type: type || "general",
      imageUrl,
      linkUrl,
      linkText: linkText || null,
      isActive: isActive ?? true,
      priority: priority ?? 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ announcement: newAnnouncement[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
