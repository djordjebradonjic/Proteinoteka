import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
        '/checkout/',
        '/cart/',
        '/account/',
      ],
    },
    sitemap: 'https://proteinoteka.rs/sitemap.xml',
  };
}