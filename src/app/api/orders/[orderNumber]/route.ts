import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { getOrderByNumber } from "~/lib/queries/orders";
import { getCurrentUser, isAdmin } from "~/lib/auth";
import { guardBannedRequest } from "~/lib/security/ban-guard";
import {
  detectCredentialScrape,
  getDeviceIdFromRequest,
  getFingerprintFromRequest,
  logUserIp,
} from "~/lib/security/ip-log";
import { autoBanScraper, recordOrderProbe } from "~/lib/security/abuse-detect";

// Public endpoint: khách hàng xem đơn của mình ở thank-you page.
// Sensitive fields (assignedCredentials, customerPhone,
// customerName) chỉ trả khi ?email=<order.customerEmail> KHỚP. Frontend
// thank-you/order-status đã có sẵn email từ form checkout -> chỉ cần truyền
// kèm. Bỏ CORS * để ngăn site ngoài XHR scrape.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const ip = getClientIp(request);

    const ipBanResp = await guardBannedRequest(request);
    if (ipBanResp) return ipBanResp;

    const rl = rateLimit(`order-detail:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Quá nhiều request, thử lại sau ${Math.ceil(rl.resetInMs / 1000)}s`,
        },
        { status: 429 }
      );
    }

    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 }
      );
    }

    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Quyết định quyền xem dữ liệu nhạy cảm:
    //  1) Chủ đơn đã đăng nhập (order.userId === session.user.id) -> cho xem,
    //     KHÔNG cần email.
    //  2) Admin -> cho xem.
    //  3) Guest -> phải nhập đúng ?email= khớp order.customerEmail.
    // SECURITY: KHÔNG echo customerEmail/notes/phone ở payload "safe" nữa, vì
    // làm vậy sẽ tiết lộ chính giá trị dùng để mở khoá (bypass email gate).
    const sessionUser = await getCurrentUser().catch(() => null);
    const isOwner = Boolean(
      sessionUser && order.userId && order.userId === sessionUser.id,
    );
    const isAdminUser = isAdmin(sessionUser);

    const emailParam = (
      new URL(request.url).searchParams.get("email") ?? ""
    )
      .trim()
      .toLowerCase();
    const emailMatch =
      emailParam.length > 0 &&
      order.customerEmail.trim().toLowerCase() === emailParam;

    const granted = isOwner || isAdminUser || emailMatch;

    // SECURITY: never return upgradeCredentials.password in web responses.
    // Ungranted callers: strip upgradeCredentials entirely (may contain password).
    // Granted callers: keep email/contactInfo only — password stays out.
    const sanitizeItems = (items: typeof order.items, includeUpgradeMeta: boolean) => {
      if (!Array.isArray(items)) return items;
      return items.map((item) => {
        if (!item || typeof item !== "object") return item;
        const { upgradeCredentials, ...rest } = item as typeof item & {
          upgradeCredentials?: {
            email?: string;
            password?: string;
            contactInfo?: string;
          };
        };
        if (!includeUpgradeMeta || !upgradeCredentials) {
          return rest;
        }
        return {
          ...rest,
          upgradeCredentials: {
            email: upgradeCredentials.email,
            contactInfo: upgradeCredentials.contactInfo,
            // password: intentionally omitted
          },
        };
      });
    };

    // Base payload an toàn cho mọi caller: CHỈ status thanh toán + QR + items.
    // Tuyệt đối không có PII (email/tên/SĐT/notes) ở mode chưa cấp quyền.
    const safePayload = {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentMemo: order.paymentMemo,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      discountCode: order.discountCode,
      items: sanitizeItems(order.items, false),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      sepayQrCode: order.sepayQrCode,
      sepayReference: order.sepayReference,
      // Snapshot TK gắn lúc tạo đơn (QR ổn định)
      bankAccountId: order.bankAccountId,
      bankName: order.bankName,
      bankCode: order.bankCode,
      bankAccountNumber: order.bankAccountNumber,
      bankAccountName: order.bankAccountName,
    };

    // SECURITY: KHONG bao gio tra `password` ra web. Chi tra username/account;
    // mat khau khach nhan qua email don hang. Tranh lo password hang loat neu
    // API/DB bi doc.
    const sanitizedCredentials = Array.isArray(order.assignedCredentials)
      ? order.assignedCredentials.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          username: c.username,
          assignedAt: c.assignedAt,
          // password: bi loai bo co y
        }))
      : order.assignedCredentials;

    const payload = granted
      ? {
          ...safePayload,
          items: sanitizeItems(order.items, true),
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes,
          assignedCredentials: sanitizedCredentials,
        }
      : {
          ...safePayload,
          // Báo client biết phải truyền ?email= để lấy thông tin nhạy cảm
          requiresEmail: true,
        };

    // SECURITY forensics: chỉ log + phát hiện bất thường khi caller truy cập
    // được dữ liệu nhạy cảm. Ghi IP cho event 'credential_view' rồi kiểm tra
    // hành vi scrape (1 IP xem nhiều đơn/email trong thời gian ngắn) -> auto-ban.
    // Fire-and-forget, không chặn response.
    if (granted) {
      void (async () => {
        const userAgent = request.headers.get("user-agent") ?? undefined;
        await logUserIp({
          email: order.customerEmail,
          eventType: "credential_view",
          ip,
          userAgent,
          orderId: order.id,
        });
        const signal = await detectCredentialScrape({ ip });
        if (signal.suspicious) {
          // TỰ ĐỘNG BAN kẻ scrape: IP (tạm) + fingerprint (vĩnh viễn).
          // KHÔNG ban email (là email khách/đơn, không phải attacker).
          await autoBanScraper(
            {
              ip,
              fingerprint: getFingerprintFromRequest(request),
              did: getDeviceIdFromRequest(request),
            },
            {
              source: "order_detail_scrape",
              details: {
                windowMinutes: signal.windowMinutes,
                totalViews: signal.totalViews,
                distinctOrders: signal.distinctOrders,
                distinctEmails: signal.distinctEmails,
                lastOrder: order.orderNumber,
              },
            },
          );
        }
          })().catch((err) => console.error("[order-detail] forensics failed:", err));
    } else {
      // Không cấp quyền (không email/không phải chủ đơn): theo dõi quét mã đơn.
      // 1 IP tra nhiều orderNumber khác nhau trong thời gian ngắn -> auto-ban.
      void (async () => {
        const probe = recordOrderProbe(ip, order.orderNumber);
        if (probe.suspicious) {
          await autoBanScraper(
            {
              ip,
              fingerprint: getFingerprintFromRequest(request),
              did: getDeviceIdFromRequest(request),
            },
            {
              source: "order_enumeration",
              details: { distinctOrders: probe.distinctOrders },
            },
          );
        }
      })().catch((err) =>
        console.error("[order-detail] enum-detect failed:", err),
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}