import "server-only";

export interface FraudAlertPayload {
  reason: string;
  ip?: string;
  email?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

/**
 * Gửi alert qua Telegram bot hoặc Discord webhook khi phát hiện đơn nghi vấn.
 * Fire-and-forget — không block request chính.
 */
export async function sendFraudAlert(payload: FraudAlertPayload): Promise<void> {
  const lines = [
    "🚨 *Fraud attempt blocked*",
    `Reason: \`${payload.reason}\``,
    payload.ip ? `IP: \`${payload.ip}\`` : null,
    payload.email ? `Email: \`${payload.email}\`` : null,
    payload.userAgent ? `UA: \`${payload.userAgent.slice(0, 120)}\`` : null,
    payload.details
      ? `Details: \`${JSON.stringify(payload.details).slice(0, 500)}\``
      : null,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean);

  const text = lines.join("\n");

  const tasks: Promise<void>[] = [];

  const telegramToken = process.env.FRAUD_ALERT_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.FRAUD_ALERT_TELEGRAM_CHAT_ID;
  if (telegramToken && telegramChatId) {
    tasks.push(
      fetch(
        `https://api.telegram.org/bot${telegramToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            parse_mode: "Markdown",
          }),
        },
      ).then(() => undefined).catch((err) => {
        console.error("Fraud alert Telegram failed:", err);
      }),
    );
  }

  const discordWebhook = process.env.FRAUD_ALERT_DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    tasks.push(
      fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      }).then(() => undefined).catch((err) => {
        console.error("Fraud alert Discord failed:", err);
      }),
    );
  }

  if (tasks.length === 0) {
    console.warn("[fraud-alert]", text);
    return;
  }

  await Promise.allSettled(tasks);
}

/** Non-blocking wrapper — dùng trong API route. */
export function notifyFraudAttempt(payload: FraudAlertPayload): void {
  void sendFraudAlert(payload).catch((err) => {
    console.error("notifyFraudAttempt error:", err);
  });
}

export interface SecurityAlertPayload {
  title: string;
  ip?: string;
  email?: string;
  details?: Record<string, unknown>;
}

/**
 * Alert bao mat chung (anomaly truy cap, scrape credential, truy cap DB la...).
 * Khac `sendFraudAlert` (vốn dành cho đơn fraud bị chặn) — dùng cho cảnh báo
 * hành vi truy cập bất thường cần admin chú ý.
 */
export async function sendSecurityAlert(
  payload: SecurityAlertPayload,
): Promise<void> {
  const lines = [
    `🛑 *Security alert: ${payload.title}*`,
    payload.ip ? `IP: \`${payload.ip}\`` : null,
    payload.email ? `Email: \`${payload.email}\`` : null,
    payload.details
      ? `Details: \`${JSON.stringify(payload.details).slice(0, 600)}\``
      : null,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean);
  const text = lines.join("\n");

  const tasks: Promise<void>[] = [];
  const telegramToken = process.env.FRAUD_ALERT_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.FRAUD_ALERT_TELEGRAM_CHAT_ID;
  if (telegramToken && telegramChatId) {
    tasks.push(
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          parse_mode: "Markdown",
        }),
      })
        .then(() => undefined)
        .catch((err) => console.error("Security alert Telegram failed:", err)),
    );
  }
  const discordWebhook = process.env.FRAUD_ALERT_DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    tasks.push(
      fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
        .then(() => undefined)
        .catch((err) => console.error("Security alert Discord failed:", err)),
    );
  }
  if (tasks.length === 0) {
    console.warn("[security-alert]", text);
    return;
  }
  await Promise.allSettled(tasks);
}

/** Non-blocking wrapper. */
export function notifySecurityEvent(payload: SecurityAlertPayload): void {
  void sendSecurityAlert(payload).catch((err) => {
    console.error("notifySecurityEvent error:", err);
  });
}
