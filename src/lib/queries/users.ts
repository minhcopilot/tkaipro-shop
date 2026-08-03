import "server-only";
import { eq, ilike, or, desc, sql, gte, and } from "drizzle-orm";

import type { User } from "~/db/schema/users/types";

import { db } from "~/db";
import { userTable, accountTable } from "~/db/schema";

/**
 * Fetches a user from the database by their ID.
 * @param userId - The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(userId: string): Promise<null | User> {
  try {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, userId),
    });
    return user ?? null; // Return user or null if undefined
  } catch (error) {
    console.error("Failed to fetch user by ID:", error);
    return null;
  }
}

export type UserWithPassword = User & {
  password: string | null;
  banned?: boolean;
};

export type TimeFilter = "all" | "today" | "week" | "month";

export interface UserStats {
  total: number;
  today: number;
  week: number;
  month: number;
}

function getDateFromFilter(filter: TimeFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return monthAgo;
    default:
      return null;
  }
}

/**
 * lấy thống kê users
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userTable),
      db.select({ count: sql<number>`count(*)` }).from(userTable).where(gte(userTable.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)` }).from(userTable).where(gte(userTable.createdAt, weekAgo)),
      db.select({ count: sql<number>`count(*)` }).from(userTable).where(gte(userTable.createdAt, monthAgo)),
    ]);

    return {
      total: Number(totalResult[0]?.count ?? 0),
      today: Number(todayResult[0]?.count ?? 0),
      week: Number(weekResult[0]?.count ?? 0),
      month: Number(monthResult[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return { total: 0, today: 0, week: 0, month: 0 };
  }
}

/**
 * lấy tất cả users với pagination và tìm kiếm, bao gồm password hash
 */
export async function getAllUsers({
  search = "",
  page = 1,
  limit = 10,
  timeFilter = "all",
}: {
  search?: string;
  page?: number;
  limit?: number;
  timeFilter?: TimeFilter;
} = {}): Promise<{ users: UserWithPassword[]; total: number }> {
  try {
    const offset = (page - 1) * limit;
    
    // điều kiện tìm kiếm
    const searchCondition = search
      ? or(
          ilike(userTable.name, `%${search}%`),
          ilike(userTable.email, `%${search}%`),
          ilike(userTable.firstName, `%${search}%`),
          ilike(userTable.lastName, `%${search}%`)
        )
      : undefined;

    // điều kiện filter theo thời gian
    const filterDate = getDateFromFilter(timeFilter);
    const timeCondition = filterDate ? gte(userTable.createdAt, filterDate) : undefined;

    // combine conditions
    const whereCondition = searchCondition && timeCondition
      ? and(searchCondition, timeCondition)
      : searchCondition || timeCondition;

    // lấy users với password từ accountTable (chỉ lấy account có password)
    const usersWithPassword = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        image: userTable.image,
        role: userTable.role,
        age: userTable.age,
        twoFactorEnabled: userTable.twoFactorEnabled,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
        password: sql<string | null>`(
          SELECT password 
          FROM ${accountTable} 
          WHERE ${accountTable.userId} = ${userTable.id} 
            AND password IS NOT NULL 
          LIMIT 1
        )`,
        banned: sql<boolean>`EXISTS(
          SELECT 1 FROM ban_list
          WHERE kind = 'email'
            AND value = lower(${userTable.email})
            AND (banned_until IS NULL OR banned_until > NOW())
        )`,
      })
      .from(userTable)
      .where(whereCondition)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    // đếm tổng số users
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTable)
      .where(whereCondition);
    
    const total = Number(totalResult[0]?.count ?? 0);

    return { users: usersWithPassword, total };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { users: [], total: 0 };
  }
}

/**
 * helper function để lấy password cho user
 */
async function getUserPassword(userId: string): Promise<string | null> {
  try {
    const account = await db
      .select({ password: accountTable.password })
      .from(accountTable)
      .where(eq(accountTable.userId, userId))
      .limit(1);
    
    return account[0]?.password ?? null;
  } catch (error) {
    console.error("Failed to get user password:", error);
    return null;
  }
}

/**
 * cập nhật thông tin user
 */
export async function updateUser(
  userId: string,
  updateData: Partial<Pick<User, "name" | "email" | "role" | "firstName" | "lastName" | "age">>
): Promise<UserWithPassword | null> {
  try {
    const result = await db
      .update(userTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId))
      .returning();

    const updatedUser = result[0];
    if (!updatedUser) return null;

    const password = await getUserPassword(userId);
    return { ...updatedUser, password };
  } catch (error) {
    console.error("Failed to update user:", error);
    return null;
  }
}

/**
 * xóa user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(userTable)
      .where(eq(userTable.id, userId))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Failed to delete user:", error);
    return false;
  }
}

/**
 * thay đổi role của user
 */
export async function changeUserRole(userId: string, newRole: string): Promise<UserWithPassword | null> {
  try {
    const result = await db
      .update(userTable)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId))
      .returning();

    const updatedUser = result[0];
    if (!updatedUser) return null;

    const password = await getUserPassword(userId);
    return { ...updatedUser, password };
  } catch (error) {
    console.error("Failed to change user role:", error);
    return null;
  }
}
