import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";

import { SEO_CONFIG } from "~/app";

import { getEmailT, normalizeLocale } from "./email-i18n";

const brevoEmailAPI = new TransactionalEmailsApi();
brevoEmailAPI.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || "");

const SENDER = {
  name: SEO_CONFIG.name,
  email: process.env.BREVO_EMAIL || "",
};
const REPLY_TO = {
  name: `${SEO_CONFIG.name} Support`,
  email: SEO_CONFIG.supportContacts.email || process.env.BREVO_EMAIL || "",
};

const FB_URL = SEO_CONFIG.supportContacts.facebook;
const TG_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";
const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email || process.env.BREVO_EMAIL || "";
// Địa chỉ nhận thông báo nội bộ (đơn hàng mới, đăng ký mới).
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || SEO_CONFIG.supportContacts.email;

// shared shell builder: header gradient + content + footer (locale-aware)
function emailShell(args: {
  headerGradient: string;
  headerTitle: string;
  headerSubtitle?: string;
  body: string;
  footerThanks: string;
  footerAuto: string;
  footerTimePrefix: string;
  nowText: string;
}): string {
  const { headerGradient, headerTitle, headerSubtitle, body, footerThanks, footerAuto, footerTimePrefix, nowText } = args;
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="background: ${headerGradient}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${headerTitle}</h1>
        ${headerSubtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${headerSubtitle}</p>` : ""}
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        ${body}
      </div>
      <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">${footerThanks}</p>
        <p style="margin: 5px 0;">${footerAuto}</p>
        <p style="margin: 5px 0;">${footerTimePrefix} ${nowText}</p>
      </div>
    </div>
  `;
}

// shared support block builder
function supportBlock(t: (k: string) => string): string {
  return `
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 20px;">${t("supportTitle")}</h2>
      <p style="color: #7f1d1d; margin: 0 0 10px 0; font-size: 14px;">
        ${t("supportIntro")}
      </p>
      <div style="color: #7f1d1d; font-size: 14px;">
        ${FB_URL || TG_URL ? `<p style="margin: 8px 0;">
          ${t("supportContactLabel")}
          ${FB_URL ? `<a href="${FB_URL}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; text-decoration: underline;">${t("supportFb")}</a>` : ""}
          ${FB_URL && TG_URL ? t("supportOr") : ""}
          ${TG_URL ? `<a href="${TG_URL}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; text-decoration: underline;">${t("supportTg")}</a>` : ""}
        </p>` : ""}
        ${SUPPORT_EMAIL ? `<p style="margin: 8px 0;">
          ${t("supportEmailLabel")} <a href="mailto:${SUPPORT_EMAIL}" style="color: #dc2626; text-decoration: underline;">${SUPPORT_EMAIL}</a>
        </p>` : ""}
      </div>
    </div>
  `;
}

// =========================
// REGISTRATION OTP (xác thực email khi đăng ký)
// =========================

export async function sendRegistrationOtpEmail(
  email: string,
  code: string,
  locale?: string,
): Promise<boolean> {
  try {
    const isVi = (locale ?? "vi") === "vi";
    const subject = isVi
      ? `Mã xác thực đăng ký: ${code}`
      : `Your registration code: ${code}`;
    const intro = isVi
      ? "Dùng mã dưới đây để hoàn tất đăng ký tài khoản. Mã có hiệu lực trong 10 phút."
      : "Use the code below to complete your registration. It expires in 10 minutes.";
    const ignore = isVi
      ? "Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này."
      : "If you did not request this, please ignore this email.";

    await brevoEmailAPI.sendTransacEmail({
      to: [{ email }],
      subject,
      htmlContent: `
        <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;">
          <h2 style="margin:0 0 12px 0;color:#111;">${isVi ? "Xác thực đăng ký" : "Verify your registration"}</h2>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px 0;">${intro}</p>
          <div style="text-align:center;margin:20px 0;">
            <div style="display:inline-block;background:#f3f4f6;border:2px dashed #9ca3af;border-radius:10px;padding:16px 28px;font-size:32px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;color:#111;">${code}</div>
          </div>
          <p style="color:#888;font-size:13px;margin:16px 0 0 0;">${ignore}</p>
        </div>
      `,
      sender: SENDER,
      replyTo: REPLY_TO,
    });
    return true;
  } catch (error) {
    console.error("Failed to send registration OTP email:", error);
    return false;
  }
}

// =========================
// VERIFICATION ACCESS OTP (xác minh email mua hàng trước khi lấy mã Google AI)
// =========================

export async function sendVerificationAccessOtpEmail(
  customerEmail: string,
  code: string,
  orderNumber: string,
  locale?: string,
): Promise<boolean> {
  try {
    const isVi = (locale ?? "vi") === "vi";
    const subject = isVi
      ? `Mã xác minh lấy OTP Google AI - đơn ${orderNumber}`
      : `Google AI OTP verification code - order ${orderNumber}`;
    const intro = isVi
      ? `Bạn đang yêu cầu lấy mã OTP Google AI cho đơn hàng ${orderNumber}. Nhập mã 6 số dưới đây trên trang lấy mã xác thực. Mã có hiệu lực trong 10 phút.`
      : `You requested a Google AI OTP code for order ${orderNumber}. Enter the 6-digit code below on the verification page. It expires in 10 minutes.`;
    const ignore = isVi
      ? "Nếu bạn không yêu cầu lấy mã OTP, hãy bỏ qua email này."
      : "If you did not request this, please ignore this email.";

    await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail }],
      subject,
      htmlContent: `
        <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;">
          <h2 style="margin:0 0 12px 0;color:#111;">${isVi ? "Xác minh email mua hàng" : "Verify your purchase email"}</h2>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px 0;">${intro}</p>
          <div style="text-align:center;margin:20px 0;">
            <div style="display:inline-block;background:#f3f4f6;border:2px dashed #9ca3af;border-radius:10px;padding:16px 28px;font-size:32px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;color:#111;">${code}</div>
          </div>
          <p style="color:#888;font-size:13px;margin:16px 0 0 0;">${ignore}</p>
        </div>
      `,
      sender: SENDER,
      replyTo: REPLY_TO,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification access OTP email:", error);
    return false;
  }
}

// =========================
// ADMIN ORDER NOTIFICATION (admin facing — keep VN)
// =========================

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  paymentMethod: string;
  items: Array<{
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  paidAt: Date;
}

export async function sendAdminOrderNotification(orderData: OrderNotificationData): Promise<boolean> {
  try {
    const { orderNumber, customerName, customerEmail, customerPhone, total, items, paidAt } = orderData;
    const itemsHTML = items.map(item =>
      `<li>${item.name} (${item.category}) - ${item.quantity}x - ${item.price.toLocaleString('vi-VN')}đ</li>`
    ).join('');

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: ADMIN_NOTIFICATION_EMAIL, name: `Admin ${SEO_CONFIG.name}` }],
      subject: `🎉 Đơn hàng mới #${orderNumber} - ${total.toLocaleString('vi-VN')}đ`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Đơn hàng mới!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Bạn có khách hàng mới mua hàng</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">📋 Thông tin đơn hàng</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Mã đơn hàng:</td><td style="padding: 8px 0; color: #6b7280;">#${orderNumber}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Tổng tiền:</td><td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">${total.toLocaleString('vi-VN')}đ</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Thanh toán lúc:</td><td style="padding: 8px 0; color: #6b7280;">${paidAt.toLocaleString('vi-VN')}</td></tr>
              </table>
            </div>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">👤 Thông tin khách hàng</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Tên:</td><td style="padding: 8px 0; color: #3730a3;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Email:</td><td style="padding: 8px 0; color: #3730a3;">${customerEmail}</td></tr>
                ${customerPhone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">SĐT:</td><td style="padding: 8px 0; color: #3730a3;">${customerPhone}</td></tr>` : ''}
              </table>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
              <h2 style="color: #15803d; margin: 0 0 15px 0; font-size: 20px;">🛒 Sản phẩm đã mua</h2>
              <ul style="list-style: none; padding: 0; margin: 0;">${itemsHTML}</ul>
            </div>
          </div>
        </div>
      `,
      sender: SENDER,
      replyTo: REPLY_TO,
    });
    console.log("Admin notification email sent:", result);
    return true;
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    return false;
  }
}

/** Alert admin when manager vault is missing account password for fulfilled accounts. */
export async function sendAdminMissingPasswordAlert(data: {
  orderNumber: string;
  customerEmail: string;
  missingEmails: string[];
}): Promise<boolean> {
  try {
    const list = data.missingEmails.map((e) => `<li>${e}</li>`).join("");
    await brevoEmailAPI.sendTransacEmail({
      to: [{ email: ADMIN_NOTIFICATION_EMAIL, name: `Admin ${SEO_CONFIG.name}` }],
      subject: `⚠️ Thiếu mật khẩu manager — đơn #${data.orderNumber}`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #b45309;">Cần xử lý tay — thiếu mailPassword trên manager</h2>
          <p>Đơn <strong>#${data.orderNumber}</strong> đã gán email tài khoản nhưng không lấy được mật khẩu từ manager vault. Email khách <strong>chưa</strong> được gửi (tránh gửi thiếu pass).</p>
          <p>Khách: ${data.customerEmail}</p>
          <p>Email tài khoản thiếu pass:</p>
          <ul>${list}</ul>
          <p>Kiểm tra manager Mongo: username khớp + có <code>mailPassword</code>, rồi gửi lại credentials cho khách.</p>
        </div>
      `,
      sender: SENDER,
      replyTo: REPLY_TO,
    });
    return true;
  } catch (error) {
    console.error("Failed to send missing-password admin alert:", error);
    return false;
  }
}

// =========================
// CUSTOMER ORDER CONFIRMATION (i18n)
// =========================

interface CustomerOrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  paymentMethod: string;
  items: Array<{
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  assignedCredentials: Array<{
    productName: string;
    username: string;
    password: string;
    assignedAt: string;
  }>;
  paidAt: Date;
  locale?: string;
}

export async function sendCustomerOrderConfirmation(orderData: CustomerOrderConfirmationData): Promise<boolean> {
  try {
    const loc = normalizeLocale(orderData.locale);
    const { t: tCommon, formatPrice, formatDateTime, urlFor } = await getEmailT(loc, "Email.common");
    const { t: tFields } = await getEmailT(loc, "Email.common.fields");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.customerOrderConfirmation");
    const { orderNumber, customerName, customerEmail, total, items, assignedCredentials, paidAt } = orderData;

    const itemsHTML = items.map(item =>
      `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong> (${item.category})<br/>
        ${tTpl("productItemQty", { qty: item.quantity, price: formatPrice(item.price) })}
      </li>`
    ).join('');

    const credentialsHTML = assignedCredentials.map(cred =>
      `<div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">🎯 ${cred.productName}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${cred.username === "License Key" ? `
          <tr>
            <td style="padding: 5px 0; font-weight: bold; color: #374151; width: 120px;">${tFields("licenseKey")}</td>
            <td style="padding: 5px 0; color: #1f2937; font-family: monospace; background: white; padding: 8px; border-radius: 4px; word-break: break-all;">${cred.password.trim()}</td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 5px 0; font-weight: bold; color: #374151; width: 120px;">${tFields("username")}</td>
            <td style="padding: 5px 0; color: #1f2937; font-family: monospace; background: white; padding: 8px; border-radius: 4px; word-break: break-all;">${cred.username.trim()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold; color: #374151;">${tFields("password")}</td>
            <td style="padding: 5px 0; color: #1f2937; font-family: monospace; background: white; padding: 8px; border-radius: 4px; word-break: break-all;">${cred.password.trim()}</td>
          </tr>
          `}
        </table>
      </div>`
    ).join('');

    const accountCredentials = assignedCredentials.filter((cred) => cred.username !== "License Key");
    const otpButtonsHTML = accountCredentials.map((cred) => {
      const cursorEmail = cred.username.trim();
      const otpUrl = `${urlFor("/verification-code")}?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&cursorEmail=${encodeURIComponent(cursorEmail)}`;
      return `<div style="text-align: center; margin: 12px 0 0 0;">
        <a href="${otpUrl}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
          ${tTpl("otpBtn", { email: cursorEmail })}
        </a>
      </div>`;
    }).join('');

    const otpGuideHTML = accountCredentials.length > 0 ? `
      <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #6366f1;">
        <h2 style="color: #3730a3; margin: 0 0 12px 0; font-size: 20px;">${tTpl("otpTitle")}</h2>
        <p style="color: #4338ca; margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">${tTpl("otpLead")}</p>
        <ol style="color: #312e81; margin: 0 0 16px 0; padding-left: 22px; font-size: 14px; line-height: 1.7;">
          <li style="margin-bottom: 4px;">${tTpl("otpStep1")}</li>
          <li style="margin-bottom: 4px;">${tTpl("otpStep2")}</li>
          <li style="margin-bottom: 4px;">${tTpl("otpStep3")}</li>
          <li>${tTpl("otpStep4")}</li>
        </ol>
        ${otpButtonsHTML}
        <p style="color: #4338ca; margin: 16px 0 0 0; font-size: 13px; font-style: italic;">${tTpl("otpNote")}</p>
      </div>` : '';

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: customerName })}
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
        ${tTpl("intro", { orderNumber })}
      </p>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">${tTpl("orderTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("orderNumber")}</td><td style="padding: 8px 0; color: #3730a3;">#${orderNumber}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("total")}</td><td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">${formatPrice(total)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("paidAt")}</td><td style="padding: 8px 0; color: #3730a3;">${formatDateTime(paidAt)}</td></tr>
        </table>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">${tTpl("productsTitle")}</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">${itemsHTML}</ul>
      </div>

      ${assignedCredentials.length > 0 ? `
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #fbbf24;">
        <h2 style="color: #b45309; margin: 0 0 15px 0; font-size: 20px;">${tTpl("credsTitle")}</h2>
        <p style="color: #92400e; margin: 0 0 15px 0; font-size: 14px;">${tTpl("credsWarning")}</p>
        ${credentialsHTML}
        <p style="color: #92400e; margin: 15px 0 0 0; font-size: 14px; font-style: italic;">${tTpl("credsNote")}</p>
      </div>` : ''}

      ${otpGuideHTML}

      ${supportBlock(tCommon)}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${urlFor(`/payment/${orderNumber}`)}"
           style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${tTpl("viewOrderBtn")}
        </a>
      </div>
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: tSubj("customerOrderConfirmation", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tCommon("shopSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: tCommon("footerAuto"),
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log("Customer confirmation email sent:", result);
    return true;
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
    return false;
  }
}

// =========================
// SUBSCRIPTION EXPIRATION REMINDER (i18n)
// =========================

interface SubscriptionReminderData {
  customerEmail: string;
  customerName?: string;
  productName: string;
  username: string;
  expiresAt: Date;
  daysLeft: number;
  locale?: string;
}

export async function sendSubscriptionExpirationReminder(data: SubscriptionReminderData): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateLong, formatDateTime, urlFor } = await getEmailT(loc, "Email.common");
    const { t: tFields } = await getEmailT(loc, "Email.common.fields");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.subscriptionReminder");
    const { customerEmail, customerName, productName, username, expiresAt, daysLeft } = data;

    const expiresAtFormatted = formatDateLong(expiresAt);
    const isUrgent = daysLeft <= 1;
    const urgencyColor = isUrgent ? '#dc2626' : '#f59e0b';
    const urgencyText = isUrgent ? tTpl("urgencyEmergency") : tTpl("urgencyWarning");
    const urgencyBg = isUrgent ? '#fef2f2' : '#fffbeb';
    const headerBg = isUrgent
      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    const headerTitle = isUrgent ? tTpl("headerTitleUrgent") : tTpl("headerTitleWarning");
    const subjectKey = isUrgent ? "subscriptionReminderUrgent" : "subscriptionReminderWarning";

    const displayName = customerName || customerEmail.split('@')[0] || customerEmail;

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: displayName })}
      </p>

      <div style="background: ${urgencyBg}; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${urgencyColor};">
        <p style="color: ${urgencyColor}; margin: 0; font-size: 16px; font-weight: bold;">
          ${tTpl("warningBody", { urgency: urgencyText, daysLeft })}
        </p>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${tTpl("accountTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">${tFields("product")}</td><td style="padding: 8px 0; color: #1f2937;">${productName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">${tFields("username")}</td><td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${username}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">${tFields("expiresAt")}</td><td style="padding: 8px 0; color: ${urgencyColor}; font-weight: bold;">${expiresAtFormatted}</td></tr>
        </table>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">${tTpl("cta.title")}</h2>
        <p style="color: #3730a3; margin: 0 0 15px 0; font-size: 14px;">${tTpl("cta.body")}</p>
        <div style="text-align: center;">
          <a href="${urlFor("/products")}"
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            ${tTpl("cta.btn")}
          </a>
        </div>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">${tTpl("benefits.title")}</h2>
        <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>${tTpl("benefits.item1")}</li>
          <li>${tTpl("benefits.item2")}</li>
          <li>${tTpl("benefits.item3")}</li>
          <li>${tTpl("benefits.item4")}</li>
        </ul>
      </div>

      ${supportBlock(tCommon)}
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: displayName }],
      subject: tSubj(subjectKey, { productName, daysLeft }),
      htmlContent: emailShell({
        headerGradient: headerBg,
        headerTitle,
        headerSubtitle: tTpl("headerSubtitle", { daysLeft }),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: `${tCommon("footerAutoShort")} ${formatDateTime(new Date())}`,
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Expiration reminder sent to ${customerEmail} for ${productName}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send expiration reminder to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// ACCOUNT CONTACT EMAIL (i18n)
// =========================

interface AccountContactEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  customMessage: string;
  locale?: string;
}

export async function sendAccountContactEmail(data: AccountContactEmailData): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime } = await getEmailT(loc, "Email.common");
    const { t: tFields } = await getEmailT(loc, "Email.common.fields");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.accountContact");
    const { orderNumber, customerName, customerEmail, productName, customMessage } = data;

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: customerName })}
      </p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${tTpl("orderTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">${tFields("orderNumber")}</td><td style="padding: 8px 0; color: #1f2937;">#${orderNumber}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">${tFields("product")}</td><td style="padding: 8px 0; color: #1f2937;">${productName}</td></tr>
        </table>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">${tTpl("messageTitle")}</h2>
        <div style="color: #3730a3; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${customMessage.replace(/\n/g, '<br/>')}</div>
      </div>

      <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
        <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">${tTpl("cta.title")}</h2>
        <p style="color: #166534; margin: 0 0 20px 0; font-size: 14px;">${tTpl("cta.lead")}</p>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          ${FB_URL ? `<a href="${FB_URL}" style="display: inline-block; background: #1877f2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">${tTpl("cta.fb")}</a>` : ""}
          ${TG_URL ? `<a href="${TG_URL}" style="display: inline-block; background: #0088cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">${tTpl("cta.tg")}</a>` : ""}
        </div>
        ${SUPPORT_EMAIL ? `<p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px;">
          ${tTpl("cta.emailIntro")} <a href="mailto:${SUPPORT_EMAIL}" style="color: #059669;">${SUPPORT_EMAIL}</a>
        </p>` : ""}
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">${tTpl("note", { orderNumber })}</p>
      </div>
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: tSubj("accountContact", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tTpl("headerSubtitle"),
        body,
        footerThanks: tCommon("footerSupport24x7"),
        footerAuto: "",
        footerTimePrefix: "",
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Account contact email sent to ${customerEmail}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send account contact email to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// UPGRADE COMPLETED EMAIL (i18n)
// =========================

interface UpgradeCompletedEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  upgradeEmail: string;
  locale?: string;
}

export async function sendUpgradeCompletedEmail(data: UpgradeCompletedEmailData): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime } = await getEmailT(loc, "Email.common");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.upgradeCompleted");
    const { orderNumber, customerName, customerEmail, productName, upgradeEmail } = data;

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: customerName })}
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
        ${tTpl("intro", { orderNumber })}
      </p>

      <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #10b981; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
        <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 22px;">${tTpl("successTitle")}</h2>
        <p style="color: #166534; margin: 0; font-size: 16px;">
          ${tTpl("successBody", { upgradeEmail, productName })}
        </p>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">${tTpl("nextSteps.title")}</h2>
        <ul style="color: #3730a3; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>${tTpl("nextSteps.item1")}</li>
          <li>${tTpl("nextSteps.item2")}</li>
          <li>${tTpl("nextSteps.item3")}</li>
        </ul>
      </div>

      ${supportBlock(tCommon)}
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: tSubj("upgradeCompleted", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tTpl("headerSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: `${tCommon("footerAutoShort")} ${formatDateTime(new Date())}`,
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Upgrade completed email sent to ${customerEmail}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send upgrade completed email to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// UPGRADE ISSUE EMAIL (i18n)
// =========================

interface UpgradeIssueEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  upgradeEmail: string;
  customMessage: string;
  locale?: string;
}

export async function sendUpgradeIssueEmail(data: UpgradeIssueEmailData): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime } = await getEmailT(loc, "Email.common");
    const { t: tFields } = await getEmailT(loc, "Email.common.fields");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.upgradeIssue");
    const { orderNumber, customerName, customerEmail, productName, upgradeEmail, customMessage } = data;

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: customerName })}
      </p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${tTpl("orderTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">${tFields("orderNumber")}</td><td style="padding: 8px 0; color: #1f2937;">#${orderNumber}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">${tFields("product")}</td><td style="padding: 8px 0; color: #1f2937;">${productName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">${tFields("upgradeEmail")}</td><td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${upgradeEmail}</td></tr>
        </table>
      </div>

      <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
        <h2 style="color: #b45309; margin: 0 0 15px 0; font-size: 18px;">${tTpl("messageTitle")}</h2>
        <div style="color: #92400e; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${customMessage.replace(/\n/g, '<br/>')}</div>
      </div>

      <div style="background: #eff6ff; padding: 25px; border-radius: 8px; text-align: center;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">${tTpl("cta.title")}</h2>
        <p style="color: #3730a3; margin: 0 0 20px 0; font-size: 14px;">${tTpl("cta.lead")}</p>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          ${FB_URL ? `<a href="${FB_URL}" style="display: inline-block; background: #1877f2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">${tTpl("cta.fb")}</a>` : ""}
          ${TG_URL ? `<a href="${TG_URL}" style="display: inline-block; background: #0088cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">${tTpl("cta.tg")}</a>` : ""}
        </div>
        ${SUPPORT_EMAIL ? `<p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px;">
          ${tTpl("cta.emailIntro")} <a href="mailto:${SUPPORT_EMAIL}" style="color: #1e40af;">${SUPPORT_EMAIL}</a>
        </p>` : ""}
      </div>
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: tSubj("upgradeIssue", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tTpl("headerSubtitle"),
        body,
        footerThanks: tCommon("footerSupport24x7"),
        footerAuto: "",
        footerTimePrefix: "",
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Upgrade issue email sent to ${customerEmail}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send upgrade issue email to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// LOGIN LINK ORDER EMAIL (i18n)
// =========================

interface LoginLinkOrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  paidAt: Date;
  activationCode?: string | null;
  locale?: string;
}

export async function sendLoginLinkOrderEmail(data: LoginLinkOrderEmailData): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatPrice, formatDateTime, urlFor } = await getEmailT(loc, "Email.common");
    const { t: tFields } = await getEmailT(loc, "Email.common.fields");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.loginLinkOrder");
    const { t: tWarn } = await getEmailT(loc, "ActivationWarning");
    const { orderNumber, customerName, customerEmail, total, items, paidAt, activationCode } = data;

    const itemsHTML = items.map(item =>
      `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong> (${item.category})<br/>
        ${tTpl("productItemQty", { qty: item.quantity, price: formatPrice(item.price) })}
      </li>`
    ).join('');

    // Build activate URL with locale prefix and pre-fill params
    const activateUrl = `${urlFor("/activate")}?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}${activationCode ? `&code=${encodeURIComponent(activationCode)}` : ''}`;

    // Order: greeting → WARNING (đỏ, đọc kỹ trước khi active) → AUTO ACTIVATE
    // box (mã active + CTA "Active ngay") → order info → products →
    // instructions chi tiết → video → contact. Đưa 2 box quan trọng nhất lên
    // top để khách thấy mã + bấm active luôn, không cần scroll.
    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: customerName })}
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
        ${tTpl("intro", { orderNumber })}
      </p>

      <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 18px 20px; border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px; font-weight: 800; line-height: 1.4;">
          ${tWarn("title")}
        </p>
        <ul style="color: #b91c1c; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7;">
          <li style="margin-bottom: 4px;">${tWarn("line1")}</li>
          <li>${tWarn("line2")}</li>
        </ul>
      </div>

      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: white; margin: 0 0 10px 0; font-size: 22px;">${tTpl("autoActivate.title")}</h2>
        <p style="color: rgba(255,255,255,0.92); margin: 0 0 18px 0; font-size: 14px; line-height: 1.6;">
          ${tTpl("autoActivate.desc")}
        </p>
        ${activationCode ? `
        <div style="background: rgba(255,255,255,0.15); border: 2px dashed rgba(255,255,255,0.6); border-radius: 8px; padding: 16px; margin: 0 0 18px 0;">
          <div style="color: rgba(255,255,255,0.85); font-size: 12px; margin-bottom: 6px;">${tTpl("autoActivate.codeLabel")}</div>
          <div style="color: white; font-size: 28px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 4px;">
            ${activationCode}
          </div>
          <div style="color: rgba(255,255,255,0.75); font-size: 11px; margin-top: 6px;">
            ${tTpl("autoActivate.codeNote")}
          </div>
        </div>
        ` : ''}
        <a href="${activateUrl}"
           style="display: inline-block; background: white; color: #059669; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          ${tTpl("autoActivate.cta")}
        </a>
        <p style="color: rgba(255,255,255,0.85); margin: 14px 0 0 0; font-size: 12px;">
          ${activationCode ? tTpl("autoActivate.prefillWithCode") : tTpl("autoActivate.prefillWithoutCode")}
        </p>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">${tTpl("orderTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("orderNumber")}</td><td style="padding: 8px 0; color: #3730a3;">#${orderNumber}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("total")}</td><td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">${formatPrice(total)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${tFields("paidAt")}</td><td style="padding: 8px 0; color: #3730a3;">${formatDateTime(paidAt)}</td></tr>
        </table>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">${tTpl("productsTitle")}</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">${itemsHTML}</ul>
      </div>

      <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #fbbf24;">
        <h2 style="color: #b45309; margin: 0 0 15px 0; font-size: 20px;">${tTpl("instructions.title")}</h2>
        <p style="color: #92400e; margin: 0 0 15px 0; font-size: 15px;">${tTpl("instructions.lead")}</p>
        <ol style="color: #92400e; margin: 0; padding-left: 20px; line-height: 2.2; font-size: 14px;">
          <li>${tTpl("instructions.step1")}</li>
          <li>${tTpl("instructions.step2")}</li>
          <li>
            ${tTpl("instructions.step3")}<br/>
            <code style="background: #fde68a; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">
              ${tTpl("instructions.linkExample")}
            </code>
          </li>
          <li>${tTpl("instructions.step4")}</li>
        </ol>
        <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #dc2626;">
          <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: bold;">${tTpl("instructions.noteTitle")}</p>
          <ul style="color: #991b1b; margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
            <li>${tTpl("instructions.note1")}</li>
            <li>${tTpl("instructions.note2")}</li>
            <li>${tTpl("instructions.note3")}</li>
          </ul>
        </div>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
        <h2 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">${tTpl("video.title")}</h2>
        <a href="https://www.youtube.com/watch?v=v1UmbhPN8uA"
           target="_blank" rel="noopener noreferrer"
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          ${tTpl("video.btn")}
        </a>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">${tTpl("contact.title")}</h3>
        <p style="color: #3730a3; margin: 0 0 15px 0; font-size: 13px;">
          ${tTpl("contact.lead", { orderNumber })}
        </p>
        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
          ${FB_URL ? `<a href="${FB_URL}" style="display: inline-block; background: #1877f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">📘 Facebook</a>` : ""}
          ${TG_URL ? `<a href="${TG_URL}" style="display: inline-block; background: #0088cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">✈️ Telegram</a>` : ""}
        </div>
      </div>
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: tSubj("loginLinkOrder", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tTpl("headerSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: tCommon("footerAuto"),
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Login link order email sent to ${customerEmail}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send login link order email to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// ACTIVATION SUCCESS EMAIL (i18n)
// =========================

interface ActivationSuccessEmailData {
  orderNumber: string;
  customerEmail: string;
  accountEmail: string;
  planDays: number;
  completedAt: Date;
  locale?: string;
}

export async function sendActivationSuccessEmail(
  data: ActivationSuccessEmailData,
): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime } = await getEmailT(loc, "Email.common");
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.activationSuccess");
    const { orderNumber, customerEmail, accountEmail, planDays, completedAt } = data;

    const expiresAt = new Date(completedAt);
    expiresAt.setDate(expiresAt.getDate() + planDays);

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tTpl("intro", { orderNumber })}
      </p>

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0;">
        <h2 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">${tTpl("accountTitle")}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #065f46;">${tTpl("accountEmailLabel")}</td><td style="padding: 8px 0; color: #047857;"><code style="background:#d1fae5;padding:2px 6px;border-radius:4px;">${accountEmail}</code></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #065f46;">${tTpl("durationLabel")}</td><td style="padding: 8px 0; color: #047857;">${planDays} ${tTpl("daysSuffix")}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #065f46;">${tTpl("expiresLabel")}</td><td style="padding: 8px 0; color: #047857;">${formatDateTime(expiresAt)}</td></tr>
        </table>
      </div>

      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          ${tTpl("note")}
        </p>
      </div>

      ${supportBlock(tCommon)}
    `;

    const result = await brevoEmailAPI.sendTransacEmail({
      to: [{ email: customerEmail, name: customerEmail.split("@")[0] || customerEmail }],
      subject: tSubj("activationSuccess", { orderNumber }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tTpl("headerSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: `${tCommon("footerAutoShort")} ${formatDateTime(new Date())}`,
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    console.log(`Activation success email sent to ${customerEmail}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send activation success email to ${data.customerEmail}:`, error);
    return false;
  }
}

// =========================
// BULK PROMOTIONAL EMAIL (admin-driven content; greeting localized via locale param)
// =========================

interface BulkEmailData {
  subject: string;
  content: string;
  recipients: Array<{
    email: string;
    name: string;
  }>;
}

interface BulkEmailResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  failedEmails: string[];
}

export async function sendBulkPromotionalEmail(data: BulkEmailData): Promise<BulkEmailResult> {
  const { subject, content, recipients } = data;
  let totalSent = 0;
  let totalFailed = 0;
  const failedEmails: string[] = [];

  for (const recipient of recipients) {
    try {
      await brevoEmailAPI.sendTransacEmail({
        to: [{ email: recipient.email, name: recipient.name }],
        subject,
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${SEO_CONFIG.name}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thông báo quan trọng dành cho bạn</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Xin chào <strong>${recipient.name}</strong>,
              </p>
              <div style="font-size: 16px; color: #374151; line-height: 1.6;">
                ${content.replace(/\n/g, '<br/>')}
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_SERVER_APP_URL}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  🛒 Ghé thăm cửa hàng
                </a>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Nếu cần hỗ trợ, liên hệ chúng tôi qua:</p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
                  ${FB_URL ? `📞 <a href="${FB_URL}" style="color: #667eea;">Facebook</a>` : ""}
                  ${TG_URL ? `${FB_URL ? "|" : ""} <a href="${TG_URL}" style="color: #667eea;">Telegram</a>` : ""}
                  ${SUPPORT_EMAIL ? `${FB_URL || TG_URL ? "|" : ""} ✉️ <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea;">${SUPPORT_EMAIL}</a>` : ""}
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
              <p style="margin: 5px 0;">Cảm ơn bạn đã tin tưởng ${SEO_CONFIG.name}! 🎉</p>
              <p style="margin: 5px 0; font-size: 12px;">Bạn nhận được email này vì đã đăng ký tài khoản tại ${SEO_CONFIG.name}.</p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                ${SEO_CONFIG.name} là đại lý phân phối độc lập (third-party reseller). Không liên kết với Google LLC
                "Google AI" và "Google AI" là nhãn hiệu của Google LLC
              </p>
            </div>
          </div>
        `,
        sender: SENDER,
        replyTo: REPLY_TO,
      });
      totalSent++;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error);
      totalFailed++;
      failedEmails.push(recipient.email);
    }
  }

  console.log(`Bulk email completed: ${totalSent} sent, ${totalFailed} failed`);
  return { success: totalFailed === 0, totalSent, totalFailed, failedEmails };
}

// =========================
// WALLET — TOPUP / DECISION EMAILS (i18n)
// =========================

interface WalletTopupSuccessData {
  customerEmail: string;
  customerName: string;
  amount: number; // VND nguyên hoặc USD cents
  currency: "vnd" | "usd";
  balanceAfter: number; // cùng đơn vị với amount
  paidAt: Date;
  locale?: string;
}

function formatWalletAmount(amount: number, currency: "vnd" | "usd"): string {
  if (currency === "vnd") {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  }
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Email xác nhận nạp ví thành công (cho cả VND auto và USD admin-approve).
 * Reuse i18n shell + `Email.common` cho greeting/footer; nội dung topup
 * nằm trong namespace `Email.walletTopupSuccess`.
 */
export async function sendWalletTopupSuccessEmail(
  data: WalletTopupSuccessData,
): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime, urlFor } = await getEmailT(
      loc,
      "Email.common",
    );
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.walletTopupSuccess");

    const amountFmt = formatWalletAmount(data.amount, data.currency);
    const balanceFmt = formatWalletAmount(data.balanceAfter, data.currency);

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: data.customerName })}
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
        ${tTpl("intro", { amount: amountFmt })}
      </p>

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #065f46;">${tTpl("amountLabel")}</td>
            <td style="padding: 6px 0; color: #059669; font-weight: bold; font-size: 18px; text-align: right;">${amountFmt}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #065f46;">${tTpl("balanceLabel")}</td>
            <td style="padding: 6px 0; color: #047857; font-weight: bold; text-align: right;">${balanceFmt}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #065f46;">${tTpl("paidAtLabel")}</td>
            <td style="padding: 6px 0; color: #047857; text-align: right;">${formatDateTime(data.paidAt)}</td>
          </tr>
        </table>
      </div>

      ${supportBlock(tCommon)}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${urlFor("/dashboard/wallet")}"
           style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${tTpl("viewWalletBtn")}
        </a>
      </div>
    `;

    await brevoEmailAPI.sendTransacEmail({
      to: [{ email: data.customerEmail, name: data.customerName }],
      subject: tSubj("walletTopupSuccess", { amount: amountFmt }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tCommon("shopSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: tCommon("footerAuto"),
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    return true;
  } catch (error) {
    console.error("Failed to send wallet topup success email:", error);
    return false;
  }
}

interface WalletTopupRejectedData {
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: "vnd" | "usd";
  reason: string;
  locale?: string;
}

export async function sendWalletTopupRejectedEmail(
  data: WalletTopupRejectedData,
): Promise<boolean> {
  try {
    const loc = normalizeLocale(data.locale);
    const { t: tCommon, formatDateTime, urlFor } = await getEmailT(
      loc,
      "Email.common",
    );
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.walletTopupRejected");

    const amountFmt = formatWalletAmount(data.amount, data.currency);

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tCommon("greeting", { name: data.customerName })}
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
        ${tTpl("intro", { amount: amountFmt })}
      </p>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>${tTpl("reasonLabel")}</strong> ${data.reason}
        </p>
      </div>

      ${supportBlock(tCommon)}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${urlFor("/dashboard/wallet")}"
           style="display: inline-block; background: #6b7280; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${tTpl("viewWalletBtn")}
        </a>
      </div>
    `;

    await brevoEmailAPI.sendTransacEmail({
      to: [{ email: data.customerEmail, name: data.customerName }],
      subject: tSubj("walletTopupRejected", { amount: amountFmt }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tCommon("shopSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: tCommon("footerAuto"),
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    return true;
  } catch (error) {
    console.error("Failed to send wallet topup rejected email:", error);
    return false;
  }
}

// =========================
// RESTOCK ALERT (thông báo khi sản phẩm có hàng lại)
// =========================

export async function sendRestockAlertEmail(input: {
  email: string;
  productName: string;
  productSlug: string;
  price: number;
  locale?: string;
}): Promise<boolean> {
  try {
    const loc = normalizeLocale(input.locale);
    const { t: tCommon, formatPrice, formatDateTime, urlFor } = await getEmailT(
      loc,
      "Email.common",
    );
    const { t: tSubj } = await getEmailT(loc, "Email.subjects");
    const { t: tTpl } = await getEmailT(loc, "Email.restockAlert");

    const priceFmt = formatPrice(input.price);
    const productUrl = urlFor(`/products/${input.productSlug}`);

    const body = `
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        ${tTpl("intro", { productName: input.productName })}
      </p>

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #065f46;">${tTpl("productLabel")}</td>
            <td style="padding: 6px 0; color: #047857; font-weight: bold; text-align: right;">${input.productName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #065f46;">${tTpl("priceLabel")}</td>
            <td style="padding: 6px 0; color: #059669; font-weight: bold; font-size: 18px; text-align: right;">${priceFmt}</td>
          </tr>
        </table>
      </div>

      ${supportBlock(tCommon)}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${productUrl}"
           style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${tTpl("viewProductBtn")}
        </a>
      </div>
    `;

    await brevoEmailAPI.sendTransacEmail({
      to: [{ email: input.email }],
      subject: tSubj("restockAlert", { productName: input.productName }),
      htmlContent: emailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerTitle: tTpl("headerTitle"),
        headerSubtitle: tCommon("shopSubtitle"),
        body,
        footerThanks: tCommon("footerThanks"),
        footerAuto: tCommon("footerAuto"),
        footerTimePrefix: tCommon("footerTimePrefix"),
        nowText: formatDateTime(new Date()),
      }),
      sender: SENDER,
      replyTo: REPLY_TO,
    });

    return true;
  } catch (error) {
    console.error("Failed to send restock alert email:", error);
    return false;
  }
}
