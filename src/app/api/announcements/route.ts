import { NextResponse } from "next/server";
import { and, desc, eq, lte, gte, or, isNull } from "drizzle-orm";

import { db } from "~/db";
import { announcements, type LocaleMap } from "~/db/schema";

function resolveLocale(map: LocaleMap | null | undefined, locale: string): string {
  if (!map) return "";
  return map[locale] || map["vi"] || map["en"] || Object.values(map)[0] || "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "vi";
    const now = new Date();

    const items = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          or(isNull(announcements.startDate), lte(announcements.startDate, now)),
          or(isNull(announcements.endDate), gte(announcements.endDate, now))
        )
      )
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));

    const resolved = items.map(item => ({
      id: item.id,
      title: resolveLocale(item.title, locale),
      content: resolveLocale(item.content, locale),
      type: item.type,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      linkText: resolveLocale(item.linkText, locale),
      priority: item.priority,
    }));

    return NextResponse.json({ announcements: resolved });
  } catch (error) {
    console.error("Error fetching public announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
