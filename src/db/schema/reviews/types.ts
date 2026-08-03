import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { reviewTable } from "./tables";
import { userTable } from "../users/tables";

export type Review = InferSelectModel<typeof reviewTable>;
export type ReviewInsert = InferInsertModel<typeof reviewTable>;

export type ReviewWithUser = Review & {
  user: {
    name: string;
    image: string | null;
  };
};

export type ReviewWithProductUser = ReviewWithUser & {
  product: {
    name: string;
    image: string | null;
  };
};

export interface ReviewListOptions {
  page?: number;
  limit?: number;
  productId?: string;
  isPublished?: boolean;
}
