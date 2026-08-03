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
    background_color: '#FBFBF9',
    theme_color: '#FDC800',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/tkaipro-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    categories: ['shopping', 'business', 'productivity'],
    lang: 'vi',
  };
} 