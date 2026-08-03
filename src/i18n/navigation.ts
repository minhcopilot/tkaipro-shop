import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['vi', 'en', 'ru', 'zh', 'ar', 'es', 'fr', 'de', 'ja', 'ko', 'pt'],

  // Used when no locale matches
  defaultLocale: 'vi',

  // The prefix for the default locale (e.g. /vi/about)
  // set to 'as-needed' to hide the prefix for default locale if desired, 
  // or 'always' to always show it.
  // User requested default to be /vi
  localePrefix: 'always' 
});
 
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
