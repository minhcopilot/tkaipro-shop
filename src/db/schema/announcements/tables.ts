import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  varchar,
  integer,
  json,
} from "drizzle-orm/pg-core";

export type LocaleMap = Record<string, string>;

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: json("title").$type<LocaleMap>().notNull(),
  content: json("content").$type<LocaleMap>().notNull(),
  type: varchar("type", { length: 20 }).notNull().default("general"),

  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkText: json("link_text").$type<LocaleMap>(),

  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(),

  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
