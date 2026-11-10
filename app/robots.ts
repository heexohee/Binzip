import type { MetadataRoute } from 'next'
import { DISALLOWED_PATHS, SITE_URL } from '../src/seo'

/**
 * AI answer engines are listed by name so the policy is explicit: they may read public pages
 * (so ChatGPT, Perplexity, Claude, Google AI and Naver can cite the service accurately)
 * but get the same disallow list as search engines.
 */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
