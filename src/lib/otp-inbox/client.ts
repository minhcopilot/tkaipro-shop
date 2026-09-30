import "server-only";

/**
 * Client cho OTP Inbox API (Developer API bằng Bearer key).
 *
 * Đọc mailbox nuit.edu.vn qua HTTP để lấy mã đăng nhập Cursor (one-time /
 * sign-in code) tương ứng với 1 địa chỉ email — thay cho việc gọi manager mở
 * Chrome scrape Outlook.
 *
 * Nguyên tắc: KHÔNG tin field `otp` của API (nó bắt nhầm số trong CSS `#333333`
 * hoặc số trong token) — luôn tự parse từ raw MIME sau khi quoted-printable
 * decode.
 *
 * Config: OTP_INBOX_API_BASE (mặc định https://webmail.nuit.edu.vn),
 * OTP_INBOX_API_KEY (bắt buộc).
 */

const DEFAULT_BASE = "https://webmail.nuit.edu.vn";

export interface InboxItem {
  id: number;
  address: string;
  envelope_from: string;
  envelope_to: string;
  subject: string;
  received_at: string; // ISO
  otp: string | null; // KHÔNG tin — chỉ tham khảo
  body_text?: string;
  has_attachments?: number;
}

export interface SigninCodeResult {
  code: string;
  messageId: number;
  receivedAt: string;
  subject: string;
}

function getConfig(): { base: string; key: string } | null {
  const base = (process.env.OTP_INBOX_API_BASE || DEFAULT_BASE).replace(
    /\/+$/,
    "",
  );
  const key = process.env.OTP_INBOX_API_KEY;
  if (!key) return null;
  return { base, key };
}

/** Regex lấy mã 6 số (EN / RU / VI). Ưu tiên pattern có ngữ cảnh. */
const OTP_CODE_PATTERNS: RegExp[] = [
  /one-time code is[:\s]+(\d{6})/i,
  /your one-time code[:\s]+(\d{6})/i,
  /sign-?in code[:\s]+(\d{3})[-\s]?(\d{3})/i, // "sign-in code: 358-428"
  /code[:\s]+(\d{3})[-\s](\d{3})/i,
  /одноразовый код[:\s]+(\d{6})/i,
  /ваш одноразовый код[:\s]+(\d{6})/i,
  /mã đăng nhập[:\s]+(\d{6})/i,
  /mã xác thực[:\s]+(\d{6})/i,
  /mã[:\s]+(\d{6})/i,
  /verification code[:\s]+(\d{6})/i,
  /(?:code|mã|код)[:\s]+(\d{6})/i,
];

const SIGNIN_SUBJECT_MATCHERS = [
  // EN
  "one-time code",
  "sign-in code",
  "sign in code",
  "sign in to cursor",
  "sign-in to cursor",
  "code challenge",
  "complete code challenge",
  "verification",
  "verify",
  "your code",
  // VI (Cursor gửi tiếng Việt: "Đăng nhập vào Cursor", "Hoàn thành thử thách mã")
  "đăng nhập vào cursor",
  "đăng nhập cursor",
  "đăng nhập",
  "mã đăng nhập",
  "mã xác thực",
  "thử thách mã",
  // RU
  "вход в cursor",
  "проверку кодом",
  "проверка",
  "одноразовый код",
];

function normAddr(a: string): string {
  return (a || "").trim().toLowerCase();
}

function subjectMatches(subject: string, matchers: string[]): boolean {
  const s = (subject || "").toLowerCase();
  return matchers.some((m) => s.includes(m));
}

/**
 * Giải mã quoted-printable: bỏ soft line-break (`=\r?\n`) rồi đổi `=XX` → byte,
 * decode UTF-8. Cần vì link/code trong raw MIME có thể bị encode + đứt dòng.
 */
export function decodeQuotedPrintable(input: string): string {
  if (!input) return "";
  const noBreaks = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < noBreaks.length; i++) {
    const ch = noBreaks[i];
    if (ch === "=" && i + 2 < noBreaks.length) {
      const hex = noBreaks.substr(i + 1, 2);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(ch.charCodeAt(0) & 0xff);
  }
  try {
    return Buffer.from(bytes).toString("utf-8");
  } catch {
    return noBreaks;
  }
}

async function apiGet(path: string): Promise<Response> {
  const cfg = getConfig();
  if (!cfg) throw new Error("OTP_INBOX_NOT_CONFIGURED");
  return fetch(`${cfg.base}${path}`, {
    headers: { Authorization: `Bearer ${cfg.key}` },
    cache: "no-store",
  });
}

/** GET /api/v1/inbox — trả mọi mailbox key có quyền (lọc address ở client). */
export async function fetchInbox(
  opts: { limit?: number; since?: string } = {},
): Promise<InboxItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 200);
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts.since) params.set("since", opts.since);
  const res = await apiGet(`/api/v1/inbox?${params.toString()}`);
  if (!res.ok) throw new Error(`OTP Inbox /inbox HTTP ${res.status}`);
  const data = (await res.json()) as { items?: InboxItem[] };
  return Array.isArray(data.items) ? data.items : [];
}

/** GET /api/v1/messages/{id}/raw — raw MIME dạng text. */
export async function fetchRawMessage(id: number): Promise<string> {
  const res = await apiGet(`/api/v1/messages/${id}/raw`);
  if (!res.ok) throw new Error(`OTP Inbox /messages/${id}/raw HTTP ${res.status}`);
  return res.text();
}

/** Lọc message theo address (đã normalize), sort mới → cũ. */
export async function listMessagesForAddress(
  address: string,
): Promise<InboxItem[]> {
  const target = normAddr(address);
  const items = await fetchInbox();
  return items
    .filter((it) => normAddr(it.address) === target)
    .sort(
      (a, b) =>
        new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
    );
}

/** Làm sạch raw thành text để dò mã 6 số độc lập. */
function cleanForOtp(decoded: string): string {
  return decoded
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/#[0-9a-fA-F]{3,8}\b/g, " ") // mã màu CSS (#333333, #202020)
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/[ ]/g, " ")
    .replace(/\s+/g, " ");
}

function extractOtpFromRaw(raw: string): string | null {
  const decoded = decodeQuotedPrintable(raw);
  for (const re of OTP_CODE_PATTERNS) {
    const m = decoded.match(re);
    if (m) {
      if (m[2]) return `${m[1]}${m[2]}`;
      if (m[1]) return m[1];
    }
  }
  const cleaned = cleanForOtp(decoded);
  const standalone = cleaned.match(
    /(?<![0-9A-Za-z#+/_-])(\d{6})(?![0-9A-Za-z])/,
  );
  if (standalone) return standalone[1];
  return null;
}

/**
 * Lấy mã đăng nhập Cursor (one-time / sign-in code) mới nhất cho 1 email.
 * @param maxAgeMs bỏ mail cũ hơn (mặc định 10 phút — mã Cursor hết hạn ~10').
 */
export async function getLatestSigninCode(
  address: string,
  opts: { maxAgeMs?: number } = {},
): Promise<SigninCodeResult | null> {
  const maxAgeMs = opts.maxAgeMs ?? 10 * 60 * 1000;
  const now = Date.now();
  const msgs = await listMessagesForAddress(address);
  const candidates = msgs.filter((it) => {
    // Subject phải khớp mẫu sign-in/one-time code để tránh mail marketing
    // ("Connect your repos") dù cũng từ Cursor.
    if (!subjectMatches(it.subject, SIGNIN_SUBJECT_MATCHERS)) return false;
    const t = new Date(it.received_at).getTime();
    return now - t <= maxAgeMs;
  });

  for (const it of candidates) {
    const raw = await fetchRawMessage(it.id);
    const code = extractOtpFromRaw(raw);
    if (code) {
      return {
        code,
        messageId: it.id,
        receivedAt: it.received_at,
        subject: it.subject,
      };
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Poll ngắn phòng khi mail về hơi trễ sau khi khách bấm đăng nhập trên
 * cursor.com. Mặc định thử 5 lần × 3s (~15s).
 */
export async function pollLatestSigninCode(
  address: string,
  opts: { maxAgeMs?: number; attempts?: number; intervalMs?: number } = {},
): Promise<SigninCodeResult | null> {
  const attempts = opts.attempts ?? 5;
  const intervalMs = opts.intervalMs ?? 3000;
  for (let i = 0; i < attempts; i++) {
    const found = await getLatestSigninCode(address, {
      maxAgeMs: opts.maxAgeMs,
    });
    if (found) return found;
    if (i < attempts - 1) await sleep(intervalMs);
  }
  return null;
}
