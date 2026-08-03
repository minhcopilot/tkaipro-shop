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

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
