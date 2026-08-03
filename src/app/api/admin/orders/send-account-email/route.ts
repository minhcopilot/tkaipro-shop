import { NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { sendAccountContactEmail } from "~/lib/email-service";
import { getOrderByNumber } from "~/lib/queries/orders";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json() as {
      orderNumber?: string;
      customerName?: string;
      customerEmail?: string;
      productName?: string;
      customMessage?: string;
    };
    const { orderNumber, customerName, customerEmail, productName, customMessage } = body;

    if (!orderNumber || !customerName || !customerEmail || !productName || !customMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // lookup order để lấy locale
    const order = await getOrderByNumber(orderNumber);

    const success = await sendAccountContactEmail({
      orderNumber,
      customerName,
      customerEmail,
      productName,
      customMessage,
      locale: order?.locale ?? undefined,
    });

    if (success) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending account contact email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
