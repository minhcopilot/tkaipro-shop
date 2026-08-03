import { NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { sendUpgradeCompletedEmail, sendUpgradeIssueEmail } from "~/lib/email-service";
import { getOrderByNumber } from "~/lib/queries/orders";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json() as {
      type?: string;
      orderNumber?: string;
      customerName?: string;
      customerEmail?: string;
      productName?: string;
      upgradeEmail?: string;
      customMessage?: string;
    };
    const { type, orderNumber, customerName, customerEmail, productName, upgradeEmail, customMessage } = body;

    if (!type || !orderNumber || !customerName || !customerEmail || !productName || !upgradeEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // lookup order để lấy locale
    const order = await getOrderByNumber(orderNumber);
    const locale = order?.locale ?? undefined;

    let success = false;

    if (type === "completed") {
      success = await sendUpgradeCompletedEmail({
        orderNumber,
        customerName,
        customerEmail,
        productName,
        upgradeEmail,
        locale,
      });
    } else if (type === "issue") {
      if (!customMessage) {
        return NextResponse.json(
          { error: "Custom message is required for issue emails" },
          { status: 400 }
        );
      }
      success = await sendUpgradeIssueEmail({
        orderNumber,
        customerName,
        customerEmail,
        productName,
        upgradeEmail,
        customMessage,
        locale,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid email type. Use 'completed' or 'issue'" },
        { status: 400 }
      );
    }

    if (success) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending upgrade email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
