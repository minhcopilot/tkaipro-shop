/**
 * Tạo URL QR VietQR (img.vietqr.io).
 * Template compact2.jpg — dùng chung cho trang thanh toán và nạp ví.
 */
export interface VietQrParams {
  accountName: string;
  accountNumber: string;
  amount: number;
  bankCode: string;
  content: string;
}

export function buildVietQrUrl({
  accountName,
  accountNumber,
  amount,
  bankCode,
  content,
}: VietQrParams): string {
  const encodedContent = encodeURIComponent(content);
  const encodedName = encodeURIComponent(accountName);

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedName}`;
}
