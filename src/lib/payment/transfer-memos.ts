import { randomBytes } from "node:crypto";

/** Độ dài mã ẩn nhúng trong nội dung CK — đồng bộ với regex webhook matcher. */
export const PAYMENT_TOKEN_LEN = 8;

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const TOKEN_LETTERS = "abcdefghijklmnopqrstuvwxyz";

/**
 * Pool câu chuyển khoản tự nhiên (không emoji, bank-safe ASCII).
 * Template có thể trùng giữa nhiều đơn — chỉ token là unique.
 */
const MEMO_TEMPLATES: readonly string[] = [
  // tra no / hoan tien
  "Tra no",
  "Tra tien muon",
  "Tra ban hom truoc",
  "Tra no thang truoc",
  "Hoan don hang",
  "Tra lai cu",
  "Tra no cafe thang nay",
  "Tra nho",
  "Tra no ban than",
  "Hoan lai tien thua",
  "Tra no com trua",
  "Tra tien gui do",
  // gop chung / chi ho
  "Gop tien an trua",
  "Gop tien di choi",
  "Gop tien thue nha",
  "Gop tien dien nuoc",
  "Gop tien mua do",
  "Gop tien sinh nhat",
  "Gop tien di du lich",
  "Gop tien mua qua",
  "Gop tien cuoi tuan",
  "Gop tien an toi",
  "Chi ho tien nha",
  "Chi ho tien dien",
  "Chi ho tien nuoc",
  "Chi ho tien internet",
  "Chi ho tien hoc",
  "Chi ho tien thue",
  "Chi ho tien xe",
  "Chi ho tien di cho",
  "Chi ho tien ship",
  // qua tang
  "Qua cho nguoi dep",
  "Qua sinh nhat ban",
  "Qua 8 thang 3",
  "Qua 20 thang 10",
  "Qua Noel nhe",
  "Qua Tet den roi",
  "Qua cam on ban",
  "Qua chuc mung",
  "Qua tang nho",
  "Qua tang yeu thuong",
  "Qua tang be iu",
  // ca nhan / doi song
  "Bao ban bua nay",
  "Cafe nha",
  " tra sua",
  " an sang",
  " an trua",
  " an toi",
  " an khuya",
  " an bua nay",
  " mua do an",
  " mua tra sua",
  " mua cafe",
  " mua banh",
  " mua hoa",
  " mua qua nho",
  " di cho",
  " di lai",
  " xang xe",
  " gui xe",
  " gui do",
  " mua ve",
  " dat ban",
  " dat phong",
  // chuc mung / tinh cam
  "Chuc mung sinh nhat be iu",
  "Chuc mung sinh nhat",
  "Chuc mung ky niem",
  "Chuc mung tot nghiep",
  "Chuc mung thang moi",
  "Chuc mung nam moi",
  "Chuc mung Tet",
  "Chuc mung 8 thang 3",
  "Chuc mung 20 thang 10",
  "Chuc mung thanh cong",
  // khac
  "Cam on ban nhieu",
  "Cam on giup do",
  "Cam on hom qua",
  "Chuyen nho",
  "Chuyen ve nha",
  "Gui ve nha",
  " hoc phi",
  " sach vo",
  " tap the duc",
  " gym thang",
  " net thang",
  " dien thoai",
  " nap the",
  " sua chua",
  " ve may bay",
  " khach san",
  " ship hang",
  " van chuyen",
  " giao hang",
  " goi xe",
  " xem phim",
  " karaoke",
  " choi game",
  " nap game",
  " kham benh",
  " thuoc",
  " ung ho",
  " ho tro",
  " giup ban",
  " cho ban",
  " tang ban",
  " thuong ban",
  " tra gop",
  " vay tra",
  "Chuyen khoan nhe",
  "Chuyen khoan giup",
  "Chuyen khoan cam on",
  "Chuyen khoan hom nay",
  "Chuyen khoan tuan nay",
  "Chuyen khoan thang nay",
  "Chuyen khoan cuoi thang",
  "Chuyen khoan dau thang",
  "Chuyen khoan cuoi tuan",
  "Chuyen khoan dip le",
  "Chuyen khoan dip Tet",
  "Chuyen khoan dip sinh nhat",
  "Chuyen khoan dip ky niem",
  "Chuyen khoan dip an mung",
  "Chuyen khoan dip team building",
  "Chuyen khoan dip hop mat",
  "Chuyen khoan dip du lich",
  "Chuyen khoan dip mua sam",
  "Chuyen khoan dip giam gia",
  "Chuyen khoan dip uu dai",
  "Chuyen khoan dip dat truoc",
  "Chuyen khoan dip hang moi",
  "Chuyen khoan dip gia han",
  "Chuyen khoan dip nang cap",
  "Chuyen khoan dip kich hoat",
  "Chuyen khoan dip renew",
  "Chuyen khoan dip update",
  "Chuyen khoan dip service",
  "Chuyen khoan dip support",
  "Chuyen khoan dip help",
  "Chuyen khoan dip for you",
  "Chuyen khoan dip with love",
  "Chuyen khoan dip yeu thuong",
  "Chuyen khoan dip nho ban",
  "Chuyen khoan dip nho em",
  "Chuyen khoan dip nho anh",
  "Chuyen khoan dip nho be iu",
  "Chuyen khoan dip nho nguoi dep",
  "Chuyen khoan dip nho ban than",
  "Chuyen khoan dip nho nguoi yeu",
  "Chuyen khoan dip nho nguoi thuong",
  "Chuyen khoan dip cam on nhieu",
  "Chuyen khoan dip rat cam on",
  "Chuyen khoan dip tran trong",
  "Chuyen khoan dip kinh gui",
  "Chuyen khoan dip chao ban",
  "Chuyen khoan dip hello ban",
  "Chuyen khoan dip miss you",
  "Chuyen khoan dip think of you",
  "Chuyen khoan dip remember you",
  "Chuyen khoan dip from me",
  "Chuyen khoan dip to you",
  "Chuyen khoan dip xin loi",
  "Chuyen khoan dip hen tra",
  "Chuyen khoan dip tra sau",
  "Chuyen khoan dip mai tra",
  "Chuyen khoan dip cuoi nam",
  "Chuyen khoan dip dau nam",
  "Chuyen khoan dip Valentine",
  "Chuyen khoan dip Noel",
  "Chuyen khoan dip 8 3",
  "Chuyen khoan dip 20 10",
  "Chuyen khoan dip cuoi",
  "Chuyen khoan dip dam hoi",
  "Chuyen khoan dip khai truong",
  "Chuyen khoan dip ban hang",
  "Chuyen khoan dip khuyen mai",
  "Chuyen khoan dip flash sale",
  "Chuyen khoan dip 11 11",
  "Chuyen khoan dip 12 12",
  "Chuyen khoan dip free ship",
  "Chuyen khoan dip tra truoc",
  "Chuyen khoan dip coc",
  "Chuyen khoan dip pre order",
  "Chuyen khoan dip limited",
  "Chuyen khoan dip VIP",
  "Chuyen khoan dip premium",
  "Chuyen khoan dip pro",
  "Chuyen khoan dip plus",
  "Chuyen khoan dip upgrade",
  "Chuyen khoan dip mo khoa",
  "Chuyen khoan dip active",
  "Chuyen khoan dip extend",
  "Chuyen khoan dip continue",
  "Chuyen khoan dip refresh",
  "Chuyen khoan dip reload",
  "Chuyen khoan dip fix",
  "Chuyen khoan dip repair",
  "Chuyen khoan dip maintain",
  "Chuyen khoan dip aid",
  "Chuyen khoan dip relief",
  "Chuyen khoan dip rescue",
  "Chuyen khoan dip save",
  "Chuyen khoan dip protect",
  "Chuyen khoan dip secure",
  "Chuyen khoan dip safe",
  "Chuyen khoan dip trust",
  "Chuyen khoan dip faith",
  "Chuyen khoan dip hope",
  "Chuyen khoan dip love",
  "Chuyen khoan dip care",
  "Chuyen khoan dip share",
  "Chuyen khoan dip give",
  "Chuyen khoan dip donate",
  "Chuyen khoan dip contribute",
  "Chuyen khoan dip participate",
  "Chuyen khoan dip join",
  "Chuyen khoan dip team",
  "Chuyen khoan dip group",
  "Chuyen khoan dip club",
  "Chuyen khoan dip class",
  "Chuyen khoan dip course",
  "Chuyen khoan dip lesson",
  "Chuyen khoan dip tuition",
  "Chuyen khoan dip fee",
  "Chuyen khoan dip charge",
  "Chuyen khoan dip cost",
  "Chuyen khoan dip price",
  "Chuyen khoan dip amount",
  "Chuyen khoan dip sum",
  "Chuyen khoan dip total",
  "Chuyen khoan dip balance",
  "Chuyen khoan dip extra",
  "Chuyen khoan dip bonus",
  "Chuyen khoan dip reward",
  "Chuyen khoan dip prize",
  "Chuyen khoan dip gift",
  "Chuyen khoan dip present",
  "Chuyen khoan dip surprise",
  "Chuyen khoan dip treat",
  "Chuyen khoan dip favor",
  "Chuyen khoan dip kindness",
  "Chuyen khoan dip gratitude",
  "Chuyen khoan dip thanks",
  "Chuyen khoan dip thank you",
  "Chuyen khoan dip xin cam on",
];

function cryptoPick(len: number, alphabet: string): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += alphabet[bytes[i]! % alphabet.length];
  }
  return s;
}

/** Sinh token 8 ký tự [a-z0-9], tối thiểu 2 chữ cái. */
function generatePaymentToken(): string {
  let token = cryptoPick(PAYMENT_TOKEN_LEN, TOKEN_ALPHABET);
  const letterCount = [...token].filter(
    (c) => c >= "a" && c <= "z",
  ).length;
  if (letterCount < 2) {
    const chars = token.split("");
    chars[0] = TOKEN_LETTERS[randomBytes(1)[0]! % TOKEN_LETTERS.length]!;
    chars[1] = TOKEN_LETTERS[randomBytes(1)[0]! % TOKEN_LETTERS.length]!;
    token = chars.join("");
  }
  return token;
}

function pickTemplate(): string {
  const idx = randomBytes(2).readUInt16BE(0) % MEMO_TEMPLATES.length;
  return MEMO_TEMPLATES[idx]!;
}

function assembleMemo(template: string, token: string): string {
  const roll = randomBytes(1)[0]! % 100;

  if (roll < 80) {
    return `${template} ${token}`;
  }
  if (roll < 90) {
    return `${token} ${template}`;
  }

  const words = template.split(" ");
  if (words.length >= 2) {
    const mid = Math.max(1, Math.floor(words.length / 2));
    const left = words.slice(0, mid).join(" ");
    const right = words.slice(mid).join(" ");
    return `${left} ${token} ${right}`;
  }
  return `${template} ${token}`;
}

/**
 * Sinh nội dung CK tự nhiên + mã ẩn. Template có thể trùng — token là unique key.
 */
export function generatePaymentMemo(): { memo: string; token: string } {
  const template = pickTemplate();
  const token = generatePaymentToken();
  const memo = assembleMemo(template, token);
  return { memo, token };
}

/**
 * Trích mọi chuỗi [a-z0-9]{8} từ nội dung webhook (đã normalize lowercase).
 */
export function extractPaymentTokens(content: string): string[] {
  const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
  const re = new RegExp(`[a-z0-9]{${PAYMENT_TOKEN_LEN}}`, "g");
  const matches = [...normalized.matchAll(re)].map((m) => m[0]!);
  return [...new Set(matches)];
}
