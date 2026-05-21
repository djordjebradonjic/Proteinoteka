import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/*?*sort=',
          '/*?*query=',
          '/*?*brand=',
          '/*?*store=',
          '/*?*minPrice=',
          '/*?*maxPrice=',
        ],
      },
    ],
    sitemap: 'https://proteinoteka.rs/sitemap.xml',
  };
}
