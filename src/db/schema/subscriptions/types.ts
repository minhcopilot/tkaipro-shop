import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { subscriptionTable } from "./tables";

export type Subscription = InferSelectModel<typeof subscriptionTable>;
export type SubscriptionInsert = InferInsertModel<typeof subscriptionTable>;
export type SubscriptionUpdate = Partial<SubscriptionInsert>;

export interface SubscriptionWithDetails extends Subscription {
  productName: string;
  orderNumber?: string;
} 