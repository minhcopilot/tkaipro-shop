/**
 * Phòng ngừa khiếu nại nhãn hiệu.
 *
 * Shop bán lại tài khoản của bên thứ ba luôn có rủi ro bị chủ sở hữu nhãn hiệu
 * gửi yêu cầu gỡ bỏ tới nhà đăng ký tên miền. Rủi ro cao nhất không nằm ở việc
 * nhắc tên sản phẩm (nhắc đúng sự thật là hợp lệ) mà ở những slug ghép tên
 * thương hiệu với từ ngụ ý được uỷ quyền — "chính hãng", "chính chủ",
 * "official", "genuine" — hoặc slug so sánh trực diện "X vs Y".
 *
 * Shop tiền nhiệm đã dính đúng kiểu này: một yêu cầu gỡ bỏ gửi tới nhà đăng ký
 * khiến tên miền suýt bị treo. Vì vậy cơ chế chặn được giữ lại ở đây và chỉnh
 * sang Figma, dùng như hàng rào phòng thủ chứ không phải để khắc phục sự cố.
 *
 * Slug khớp blacklist sẽ bị loại khỏi sitemap, trả 404 ở route bài viết, và
 * không sinh article schema.
 *
 * Hai cờ dưới đây là công tắc khẩn cấp: bật lên khi nhận được khiếu nại, để
 * trang chủ và trang giới thiệu trả về thông báo trung tính trong lúc xử lý,
 * thay vì phải deploy gấp giữa lúc rối.
 */

/** Bật thì mọi trang chủ theo ngôn ngữ trả về thông báo trung tính. */
export const TAKEDOWN_HOMEPAGE = false;

/** Bật thì mọi trang giới thiệu theo ngôn ngữ trả về thông báo trung tính. */
export const TAKEDOWN_ABOUT = false;

/** Slug cụ thể bị chặn — điền khi có khiếu nại chỉ đích danh bài nào. */
export const TAKEDOWN_BLOG_SLUGS: ReadonlySet<string> = new Set<string>([]);

/**
 * Blacklist theo mẫu, chặn các dạng slug rủi ro cao: ghép "figma" với từ ngụ ý
 * được uỷ quyền, hoặc so sánh trực diện với đối thủ.
 *
 * Chạy song song với việc đặt tên bài viết cẩn thận từ đầu; một lớp là đủ,
 * giữ cả hai để phòng khi có bài được nhập lại vào DB mà quên rà tên.
 */
export const TAKEDOWN_BLOG_SLUG_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:genuine|authentic|chinh[-_]?hang|chinh[-_]?chu|official|oficial|authentique|offiziell|original).*figma/i,
  /figma.*(?:genuine|authentic|chinh[-_]?hang|chinh[-_]?chu|official|oficial|authentique|offiziell)/i,
  /figma.*vs.*(?:sketch|adobe[-_]?xd|canva|penpot|framer)/i,
  /(?:sketch|adobe[-_]?xd|canva|penpot|framer).*vs.*figma/i,
  /buy[-_]?figma[-_]?pro.*(?:cheap|gia[-_]?re).*(?:genuine|authentic)/i,
  /mua[-_]?tai[-_]?khoan[-_]?figma.*(?:chinh[-_]?hang|chinh[-_]?chu)/i,
  /huong[-_]?dan[-_]?nang[-_]?cap[-_]?figma[-_]?chinh[-_]?(?:chu|hang)/i,
];

export function isBlogSlugTakenDown(slug: string): boolean {
  if (TAKEDOWN_BLOG_SLUGS.has(slug)) return true;
  return TAKEDOWN_BLOG_SLUG_PATTERNS.some((re) => re.test(slug));
}

/**
 * Detect whether a request pathname matches one of the URLs that should
 * render a minimal layout (no global header/footer/JSON-LD/scripts).
 *
 * The pathname may or may not include a locale prefix.
 */
export function isPathnameTakenDown(pathname: string): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (TAKEDOWN_HOMEPAGE) {
    if (normalized === "/" || /^\/[a-z]{2}$/i.test(normalized)) {
      return true;
    }
  }

  if (TAKEDOWN_ABOUT) {
    if (/^\/[a-z]{2}\/about$/i.test(normalized)) {
      return true;
    }
  }

  const blogMatch = normalized.match(/^\/[a-z]{2}\/blog\/([^/]+)$/i);
  if (blogMatch && isBlogSlugTakenDown(blogMatch[1])) {
    return true;
  }

  return false;
}
