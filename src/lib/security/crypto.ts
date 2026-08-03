import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * Ma hoa secret at-rest (mat khau account/khach hang) bang AES-256-GCM.
 *
 * Muc dich: sau su co lo DB, du ke tan cong doc lai duoc database cung KHONG
 * dung duoc ngay vi password da ma hoa. Key (`CREDENTIAL_ENC_KEY`) phai luu
 * NGOAI database (env / secret manager).
 *
 * Format luu trong DB: `enc:v1:<iv_b64>:<tag_b64>:<ciphertext_b64>`.
 *
 * Tolerant migration: `decryptSecret()` tra ve nguyen van neu chuoi chua ma
 * hoa (chua chay migrate) -> co the deploy truoc, migrate sau ma khong vo
 * du lieu cu.
 */

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM standard nonce length

let cachedKey: Buffer | null = null;
let warnedMissingKey = false;

/**
 * Lay key 32 bytes tu env. Chap nhan: hex 64 ky tu, base64 32 bytes, hoac
 * raw utf8 dung 32 ky tu. Tra null neu chua cau hinh.
 */
function getKey(): Buffer | null {
  if (cachedKey) return cachedKey;
  const raw = process.env.CREDENTIAL_ENC_KEY?.trim();
  if (!raw) return null;

  let key: Buffer | null = null;
  // hex 64 -> 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    // thu base64
    try {
      const b = Buffer.from(raw, "base64");
      if (b.length === 32) key = b;
    } catch {
      // ignore
    }
    // fallback raw utf8 32 ky tu
    if (!key && Buffer.byteLength(raw, "utf8") === 32) {
      key = Buffer.from(raw, "utf8");
    }
  }

  if (!key || key.length !== 32) {
    throw new Error(
      "CREDENTIAL_ENC_KEY khong hop le: can 32 bytes (hex 64 ky tu, base64 32 bytes, hoac raw 32 ky tu).",
    );
  }
  cachedKey = key;
  return cachedKey;
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Ma hoa 1 chuoi. Neu chua cau hinh key -> tra nguyen van + canh bao 1 lan
 * (de dev khong set key van chay duoc; prod BAT BUOC set key).
 */
export function encryptSecret(plain: string | null | undefined): string {
  if (plain == null || plain === "") return plain ?? "";
  if (isEncrypted(plain)) return plain; // idempotent
  const key = getKeyOrWarn();
  if (!key) return plain;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([
    cipher.update(String(plain), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/**
 * Giai ma 1 chuoi. Tolerant: tra nguyen van neu khong phai dang ma hoa.
 */
export function decryptSecret(value: string | null | undefined): string {
  if (value == null || value === "") return value ?? "";
  if (!isEncrypted(value)) return value; // plaintext cu chua migrate
  const key = getKey();
  if (!key) {
    // Co ciphertext nhung mat key -> khong the giai ma. Khong throw de tranh
    // sap luong; tra placeholder de admin biet can khoi phuc key.
    console.error("[crypto] decryptSecret: CREDENTIAL_ENC_KEY missing, cannot decrypt");
    return "";
  }
  try {
    const parts = value.slice(PREFIX.length).split(":");
    const [ivB64, tagB64, ctB64] = parts;
    if (!ivB64 || !tagB64 || !ctB64) return "";
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch (err) {
    console.error("[crypto] decryptSecret failed:", err);
    return "";
  }
}

function getKeyOrWarn(): Buffer | null {
  const key = getKey();
  if (!key && !warnedMissingKey) {
    warnedMissingKey = true;
    console.error(
      "[crypto] CREDENTIAL_ENC_KEY chua duoc set — credential se luu PLAINTEXT. Hay set key o production!",
    );
  }
  return key;
}

/**
 * Normalize account pool entry to email-only.
 * Accepts legacy `email|password` (strips password) or plain email.
 * Does not touch license keys (caller decides by productType).
 */
export function normalizeAccountPoolEmail(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  if (isEncrypted(trimmed)) return trimmed; // whole-string ciphertext (email or license)
  const idx = trimmed.indexOf("|");
  if (idx === -1) return trimmed;
  return trimmed.slice(0, idx).trim();
}

/**
 * Ma hoa 1 credential pool string.
 * - Account email-only (khong co `|`) -> ma hoa toan bo email at-rest.
 * - Legacy `username|password` -> giu username, ma hoa password (migrate se strip).
 * - License key (khong co `|`) -> ma hoa toan bo.
 */
export function encryptAccountCredential(raw: string): string {
  if (isEncrypted(raw)) return raw;
  // Email-only / license key (khong co separator) -> ma hoa toan bo.
  if (!raw.includes("|")) return encryptSecret(raw);
  const idx = raw.indexOf("|");
  const username = raw.slice(0, idx);
  const password = raw.slice(idx + 1);
  return `${username}|${encryptSecret(password)}`;
}

/**
 * Giai ma 1 credential pool string.
 * Tra email plaintext, legacy `email|password`, hoac license key plaintext.
 */
export function decryptAccountCredential(raw: string): string {
  if (isEncrypted(raw)) return decryptSecret(raw); // email/license ma hoa toan bo
  if (!raw.includes("|")) return raw;
  const idx = raw.indexOf("|");
  const username = raw.slice(0, idx);
  const password = raw.slice(idx + 1);
  return `${username}|${decryptSecret(password)}`;
}
