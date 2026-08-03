import { relations } from "drizzle-orm";

import { announcements } from "./tables";

export const announcementsRelations = relations(announcements, () => ({}));
