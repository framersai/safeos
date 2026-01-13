/**
 * Dynamic robots.txt generation
 *
 * @module app/robots
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://safeos.sh').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/monitor/',
          '/history/',
          '/settings/',
          '/profiles/',
          '/export/',
          '/analytics/',
          '/webhooks/',
          '/lost-found/',
          '/wildlife/',
          '/security/',
          '/setup/',
          '/nap/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
