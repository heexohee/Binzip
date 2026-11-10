import { DISALLOWED_PATHS, SITE_URL } from '../../src/seo'

/**
 * AI answer engines are listed by name so the policy is explicit: they may read public pages
 * (so ChatGPT, Perplexity, Claude, Google AI and Naver can cite the service accurately)
 * but get the same disallow list as search engines.
 */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Applebot-Extended',
]

/** Daum webmaster ownership proof. It is public by design and must stay a comment line in robots.txt. */
const DAUM_VERIFICATION =
  '#DaumWebMasterTool:efd55be4dcf69020f12e0c2f5e8ebdf5e09874f2035ae79f81c7161363ed99db:rbSFXQUyqc9N1qm+e2U/ew=='

// Written by hand because the robots.ts metadata route cannot emit comment lines.
function group(userAgents: string[]): string {
  return [
    ...userAgents.map(agent => `User-Agent: ${agent}`),
    'Allow: /',
    ...DISALLOWED_PATHS.map(path => `Disallow: ${path}`),
  ].join('\n')
}

const BODY = [
  group(['*']),
  group(AI_CRAWLERS),
  `Host: ${SITE_URL}\nSitemap: ${SITE_URL}/sitemap.xml`,
  DAUM_VERIFICATION,
].join('\n\n') + '\n'

export const dynamic = 'force-static'

export function GET(): Response {
  return new Response(BODY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
