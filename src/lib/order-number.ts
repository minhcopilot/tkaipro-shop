import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Số ký tự ngẫu nhiên crypto trong mã đơn (giữ đồng bộ với regex matcher SePay). */
export const ORDER_RANDOM_LEN = 10;

/** Sinh chuỗi ngẫu nhiên crypto-strong từ [A-Z0-9]. */
function cryptoRandom(len: number): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return s;
}

/**
 * Sinh mã đơn hàng.
 *
 * Format: `<prefix><10 ký tự random crypto><_giáK ...>`.
 *  - Bỏ phần timestamp 8 số (thông tin thời gian đã có ở cột `createdAt`) để
 *    rút mã ngắn lại: `ORD` + 10 random + `_399K` = 18 ký tự (đơn 1 sản phẩm).
 *  - GIỮ hậu tố `_<giá>K` cho từng dòng sản phẩm (theo yêu cầu — admin trace
 *    loại đơn theo mệnh giá).
 *  - Phần random: crypto + 10 ký tự (36^10 ≈ 3.6e15) -> chống brute-force/quét mã.
 *
 * LƯU Ý: độ dài random (ORDER_RANDOM_LEN) phải đồng bộ với regex base-prefix
 * trong findOrderByTransactionContent để khớp đơn khi ngân hàng strip dấu `_`.
 */
export function generateOrderNumber(
  prices: number[] = [],
  prefix: "ORD" | "ORDA" = "ORD",
): string {
  const random = cryptoRandom(ORDER_RANDOM_LEN);
  const priceSuffix = prices
    .map((p) => `_${Math.round(p / 1000)}K`)
    .join("");
  return `${prefix}${random}${priceSuffix}`;
}
