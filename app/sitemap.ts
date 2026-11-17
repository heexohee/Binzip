import type { MetadataRoute } from 'next'
import { INDEXED_PATHS, SITE_URL } from '../src/seo'

const PRIORITY: Partial<Record<(typeof INDEXED_PATHS)[number], number>> = { '/': 1, '/management': 0.9, '/resources': 0.7 }

// No lastModified: a per-request timestamp would tell crawlers every page changed on every fetch.
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PATHS.map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}`, priority: PRIORITY[path] ?? 0.3 }))
}
