import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/navigation';

const isDev = process.env.NODE_ENV === 'development';

// map country codes to supported locales
const countryToLocale: Record<string, string> = {
  // Vietnamese
  VN: 'vi',

  // English (default for many countries)
  US: 'en',
  GB: 'en',
  AU: 'en',
  NZ: 'en',
  CA: 'en',
  IE: 'en',
  ZA: 'en',
  IN: 'en',
  PH: 'en',
  SG: 'en',
  MY: 'en',

  // Russian
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  UA: 'ru',
  KG: 'ru',
  UZ: 'ru',

  // Chinese
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',

  // Arabic
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  IQ: 'ar',
  JO: 'ar',
  KW: 'ar',
  LB: 'ar',
  LY: 'ar',
  MA: 'ar',
  OM: 'ar',
  QA: 'ar',
  SY: 'ar',
  TN: 'ar',
  YE: 'ar',
  BH: 'ar',
  PS: 'ar',
  SD: 'ar',
  DZ: 'ar',

  // Spanish
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  PE: 'es',
  VE: 'es',
  CL: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  BO: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
  PR: 'es',

  // French
  FR: 'fr',
  BE: 'fr',
  CH: 'fr',
  LU: 'fr',
  MC: 'fr',
  SN: 'fr',
  CI: 'fr',
  ML: 'fr',
  BF: 'fr',
  NE: 'fr',
  CM: 'fr',
  MG: 'fr',
  HT: 'fr',

  // German
  DE: 'de',
  AT: 'de',
  LI: 'de',

  // Japanese
  JP: 'ja',

  // Korean
  KR: 'ko',
  KP: 'ko',

  // Portuguese
  PT: 'pt',
  BR: 'pt',
  AO: 'pt',
  MZ: 'pt',
};

// map Accept-Language codes to supported locales
const languageToLocale: Record<string, string> = {
  vi: 'vi',
  en: 'en',
  ru: 'ru',
  zh: 'zh',
  ar: 'ar',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ja: 'ja',
  ko: 'ko',
  pt: 'pt',
};

function getPreferredLocale(request: NextRequest): string {
  // dev only: test with ?_country=US
  if (isDev) {
    const testCountry = request.nextUrl.searchParams.get('_country');
    if (testCountry && countryToLocale[testCountry.toUpperCase()]) {
      console.log('[i18n] test mode:', testCountry.toUpperCase());
      return countryToLocale[testCountry.toUpperCase()];
    }
  }

  // 1. geo-location headers (vercel, cloudflare)
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code');

  if (country && countryToLocale[country.toUpperCase()]) {
    if (isDev) console.log('[i18n] geo:', country.toUpperCase());
    return countryToLocale[country.toUpperCase()];
  }

  // 2. Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, qValue] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(),
          quality: qValue ? parseFloat(qValue) : 1,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (languageToLocale[lang.code]) {
        if (isDev) console.log('[i18n] accept-language:', lang.code);
        return languageToLocale[lang.code];
      }
    }
  }

  // 3. default to english
  if (isDev) console.log('[i18n] default: en');
  return 'en';
}

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

// ---------------------------------------------------------------------------
// 301 redirects for slugs renamed during the 2026-05-19 trademark
// remediation. The DB no longer serves these paths (blog rows archived /
// product slugs unchanged but pages dropped from sitemap); we keep these
// redirects for inbound links and search-engine reindex.
//
// Format: { from: regex, to: replacement-string-with-$1-locale-group }.
// Schedule: review and remove after 2026-07-18 (60 days).
// ---------------------------------------------------------------------------
const REMEDIATION_REDIRECTS: Array<{ from: RegExp; to: string }> = [
  // Archived blog posts -> blog index
  {
    from: /^\/([a-z]{2})\/blog\/(what-is-cursor-pro-features-vs-github-copilot|cursor-pro-la-gi-tinh-nang-va-so-sanh-github-copilot|buy-cursor-pro-account-cheap-genuine-2026|mua-tai-khoan-cursor-pro-gia-re-chinh-hang-2026|huong-dan-nang-cap-cursor-pro-chinh-chu-2026)\/?$/i,
    to: '/$1/blog',
  },
  // Old marketing landings that pre-existed on the legacy domain
  {
    from: /^\/([a-z]{2})\/(?:cursor-pro-chinh-hang|mua-cursor-pro-chinh-chu)\/?$/i,
    to: '/$1/products',
  },
];

function getRemediationRedirectTarget(pathname: string): string | null {
  for (const { from, to } of REMEDIATION_REDIRECTS) {
    if (from.test(pathname)) {
      return pathname.replace(from, to);
    }
  }
  return null;
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // skip _next paths (internal Next.js routes)
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 301 trademark-remediation redirects (apply before locale handling)
  const remediationTarget = getRemediationRedirectTarget(pathname);
  if (remediationTarget && remediationTarget !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = remediationTarget;
    return NextResponse.redirect(url, 301);
  }

  // expose pathname to layouts/pages via a request header so SSR can read it
  // through next/headers (required for the takedown layout to know which
  // URL is being rendered).
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('x-pathname', pathname);

  // skip if pathname already has locale
  const hasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    // With routing.localePrefix='always' the URL already contains the locale
    // prefix, so next-intl middleware's only remaining job is locale validation
    // (which our routing config + the [locale]/layout.tsx notFound() guard
    // already handle). Bypassing the intl middleware here lets us emit a clean
    // NextResponse.next({ request: { headers } }) so x-pathname propagates to
    // the SSR handler without being clobbered by intl's own request-header
    // override directives.
    return NextResponse.next({
      request: { headers: forwardedHeaders },
    });
  }

  // check cookie (user's manual selection)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && routing.locales.includes(localeCookie as any)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeCookie}${pathname}`;
    return NextResponse.redirect(url);
  }

  // auto-detect locale
  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // include _next to intercept stale server action requests
  matcher: ['/((?!api|admin|.*\\..*).*)'],
};
