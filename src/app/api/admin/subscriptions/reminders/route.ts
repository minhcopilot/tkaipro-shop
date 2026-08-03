import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { processExpirationReminders, getSubscriptionsNeedingReminders } from "~/lib/queries/subscriptions";

/**
 * GET - get subscriptions that need reminder emails (preview)
 */
export async function GET(request: NextRequest) {
  try {
    // check admin permission
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // get subscriptions needing reminders
    const [subs3Day, subs1Day] = await Promise.all([
      getSubscriptionsNeedingReminders(3),
      getSubscriptionsNeedingReminders(1),
    ]);

    return NextResponse.json({
      pending3Day: subs3Day.map(s => ({
        id: s.id,
        customerEmail: s.customerEmail,
        productName: s.productName,
        expiresAt: s.expiresAt,
      })),
      pending1Day: subs1Day.map(s => ({
        id: s.id,
        customerEmail: s.customerEmail,
        productName: s.productName,
        expiresAt: s.expiresAt,
      })),
      total3Day: subs3Day.length,
      total1Day: subs1Day.length,
    });
  } catch (error) {
    console.error("Error getting reminder preview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST - process and send reminder emails
 */
export async function POST(request: NextRequest) {
  try {
    // check admin permission OR cron secret
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get("secret");
    
    // allow cron job with secret
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      console.log("Reminder processing triggered by cron job");
    } else {
      // check admin permission
      const user = await getCurrentUser();
      if (!user || user.role.toUpperCase() !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      console.log("Reminder processing triggered by admin:", user.email);
    }

    // process reminders
    const result = await processExpirationReminders();

    return NextResponse.json({
      success: result.errors.length === 0,
      processed3Day: result.processed3Day,
      processed1Day: result.processed1Day,
      totalProcessed: result.processed3Day + result.processed1Day,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

