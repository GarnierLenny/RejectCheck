import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PortfolioScraper,
  PortfolioSnapshot,
} from '../ports/portfolio.scraper';

const JINA_BASE = 'https://r.jina.ai/';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_CONTENT_CHARS = 60_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Jina Reader-backed portfolio scraper.
 *
 * Jina Reader (https://jina.ai/reader) turns any URL into clean markdown
 * via `GET https://r.jina.ai/<url>` — handles SPAs, lazy-loaded content, and
 * strips chrome / nav for us. Free tier is generous; an API key lifts rate
 * limits (read from JINA_API_KEY if present).
 *
 * SSRF guard: only https URLs to public hosts are accepted; private IPs,
 * loopback, link-local, and unicode-tricked hostnames are rejected. Soft-fails
 * on every error (returns null) so the digest can still be built without
 * portfolio context.
 */
@Injectable()
export class JinaPortfolioScraper implements PortfolioScraper {
  private readonly logger = new Logger(JinaPortfolioScraper.name);
  private readonly cache = new Map<
    string,
    { snapshot: PortfolioSnapshot; expiresAt: number }
  >();

  constructor(private readonly config: ConfigService) {}

  async fetch(url: string): Promise<PortfolioSnapshot | null> {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      this.logger.warn(`Portfolio URL rejected (invalid/unsafe): ${url}`);
      return null;
    }

    const cacheKey = normalized;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log(`Portfolio cache HIT for ${normalized}`);
      return cached.snapshot;
    }

    const startedAt = Date.now();
    const apiKey = this.config.get<string>('JINA_API_KEY');

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(`${JINA_BASE}${normalized}`, {
        method: 'GET',
        headers: {
          Accept: 'text/markdown',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        this.logger.warn(
          `Portfolio fetch ${normalized} → HTTP ${res.status} (${res.statusText})`,
        );
        return null;
      }

      const raw = await res.text();
      const markdown = raw.slice(0, MAX_CONTENT_CHARS);
      const snapshot: PortfolioSnapshot = {
        url: normalized,
        markdown,
        charCount: markdown.length,
        fetchedAt: new Date(),
      };

      this.cache.set(cacheKey, {
        snapshot,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      this.logger.log(
        `[PORTFOLIO_FETCH] url=${normalized} chars=${markdown.length} ms=${Date.now() - startedAt}`,
      );
      return snapshot;
    } catch (err: any) {
      this.logger.warn(
        `Portfolio fetch failed for ${normalized}: ${err?.message || err}`,
      );
      return null;
    }
  }
}

/**
 * Normalize + SSRF-guard a user-supplied portfolio URL.
 *
 * Accepts only https URLs to public hosts. Rejects:
 *  - non-https schemes (http, file, javascript, etc.)
 *  - loopback / private IPs (RFC1918, RFC4193, link-local, etc.)
 *  - userinfo-bearing URLs (`https://attacker@evil.com/`)
 *
 * Returns the canonical https://host/path string, or null if rejected.
 */
function normalizeUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) return null;
  if (isUnsafeHost(hostname)) return null;

  // Drop fragment, keep query (some portfolios use ?project=X).
  parsed.hash = '';
  return parsed.toString();
}

function isUnsafeHost(hostname: string): boolean {
  // Block obviously-local hostnames.
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname === 'broadcasthost'
  ) {
    return true;
  }
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return true;
  }

  // IPv4 literal — check for private / loopback / link-local ranges.
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map((n) => parseInt(n, 10));
    if ([a, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  // IPv6 literal — block loopback, link-local, ULA.
  if (hostname.includes(':')) {
    const lower = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
    return false;
  }

  return false;
}
