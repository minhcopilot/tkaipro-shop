import { NextRequest, NextResponse } from "next/server";

import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { normalizeLocale } from "~/lib/email-i18n";
import { getProductBySlug } from "~/lib/queries/products";
import { subscribeRestockAlert } from "~/lib/queries/restock-alerts";
import { guardBannedRequest } from "~/lib/security/ban-guard";
import { validateCustomerEmail } from "~/lib/security/email-blocklist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errJson(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ip = getClientIp(request);

    const ipBanResp = await guardBannedRequest(request);
    if (ipBanResp) return ipBanResp;

    const ipLimit = rateLimit(`restock-alert-ip:${ip}`, 8, 60_000);
    if (!ipLimit.ok) {
      return errJson(
        "TOO_MANY_REQUESTS",
        "Quá nhiều request, vui lòng thử lại sau",
        429,
      );
    }

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return errJson("BAD_BODY", "Body không hợp lệ", 400);
    }

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const emailCheck = validateCustomerEmail(email);
    if (!emailCheck.ok) {
      return errJson(
        "INVALID_EMAIL",
        emailCheck.message ?? "Email không hợp lệ",
        400,
      );
    }

    const emailBanResp = await guardBannedRequest(request, { email });
    if (emailBanResp) return emailBanResp;

    const emailLimit = rateLimit(`restock-alert-email:${email}`, 5, 3_600_000);
    if (!emailLimit.ok) {
      return errJson(
        "TOO_MANY_REQUESTS",
        "Email này đăng ký quá nhiều lần, thử lại sau",
        429,
      );
    }

    const product = await getProductBySlug(slug);
    if (!product || product.status !== "active") {
      return errJson("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm", 404);
    }

    if (product.inStock) {
      return errJson(
        "PRODUCT_IN_STOCK",
        "Sản phẩm hiện đang còn hàng",
        409,
      );
    }

    const locale = normalizeLocale(
      typeof body.locale === "string" ? body.locale : undefined,
    );

    const result = await subscribeRestockAlert({
      productId: product.id,
      email,
      locale,
    });

    if (!result.ok) {
      if (result.code === "PRODUCT_IN_STOCK") {
        return errJson(
          "PRODUCT_IN_STOCK",
          "Sản phẩm hiện đang còn hàng",
          409,
        );
      }
      if (result.code === "PRODUCT_INACTIVE") {
        return errJson("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm", 404);
      }
      return errJson("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST restock-alert] error:", err);
    return errJson("INTERNAL", "Lỗi hệ thống", 500);
  }
}
