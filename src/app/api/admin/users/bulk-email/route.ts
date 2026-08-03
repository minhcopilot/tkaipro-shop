import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { sendBulkPromotionalEmail } from "~/lib/email-service";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subject, content, recipients } = body as {
      subject: string;
      content: string;
      recipients: Array<{ email: string; name: string }>;
    };

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: subject, content, recipients" },
        { status: 400 }
      );
    }

    if (recipients.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 recipients per batch" },
        { status: 400 }
      );
    }

    const result = await sendBulkPromotionalEmail({
      subject,
      content,
      recipients
    });

    return NextResponse.json({
      success: result.success,
      message: `Đã gửi ${result.totalSent} email thành công${result.totalFailed > 0 ? `, ${result.totalFailed} thất bại` : ''}`,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      failedEmails: result.failedEmails
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

