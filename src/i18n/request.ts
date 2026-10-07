import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';
import {routing} from './navigation';

export default getRequestConfig(async ({requestLocale}) => {
  // 1) Primary: `[locale]` segment (set by next-intl middleware).
  let locale = await requestLocale;

  // 2) Fallback: extract from `x-pathname` header (set by our middleware).
  // We bypass next-intl middleware on locale-prefixed paths so that the
  // takedown layout can read the request path via next/headers; that bypass
  // also drops the locale context, which otherwise makes everything fall back
  // to `defaultLocale` and renders the whole site in Vietnamese.
  if (!locale) {
    try {
      const reqHeaders = await headers();
      const pathname = reqHeaders.get('x-pathname') ?? '';
      const match = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
      if (match) {
        const candidate = match[1].toLowerCase();
        if (routing.locales.includes(candidate as any)) {
          locale = candidate;
        }
      }
    } catch {
      // headers() may throw in build-time/static contexts; fall through.
    }
  }

  // 3) Final fallback.
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Các file dịch không đồng đều (vd ru thiếu cả khối VerificationCode). Thay vì
  // để next-intl ném MISSING_MESSAGE và hiện key thô, gộp lên bản dự phòng:
  // locale hiện tại > en > vi.
  const chain = [...new Set(['vi', 'en', locale])];
  const loaded = await Promise.all(
    chain.map(async (l) => (await import(`../../messages/${l}.json`)).default as Messages)
  );

  return {
    locale,
    messages: loaded.reduce((acc, m) => deepMerge(acc, m), {} as Messages)
  };
});

type Messages = {[key: string]: unknown};

const isPlainObject = (v: unknown): v is Messages =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// Merge object lồng nhau; mảng và chuỗi của bản ưu tiên thay thế nguyên khối
// (không trộn từng phần tử, tránh lẫn danh sách của hai ngôn ngữ).
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = {...base};
  for (const [key, value] of Object.entries(override)) {
    const prev = out[key];
    out[key] = isPlainObject(prev) && isPlainObject(value) ? deepMerge(prev, value) : value;
  }
  return out;
}
