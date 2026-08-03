import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '~/app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_CONFIG.fullName,
    short_name: SEO_CONFIG.name,
    description:
      SEO_CONFIG.description ||
      SEO_CONFIG.affiliationDisclaimer,
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1220',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/android-chrome-192x192-v2.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512-v2.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/tkaipro-mark-v2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon-v2.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32-v2.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16-v2.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    categories: ['shopping', 'business', 'productivity'],
    lang: 'vi',
  };
} 