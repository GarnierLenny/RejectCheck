export type PortfolioSnapshot = {
  /** The user-supplied URL, normalised (https, trimmed). */
  url: string;
  /** Markdown rendering of the page (Jina Reader output). */
  markdown: string;
  /** Length in chars — exposed for telemetry / token-budgeting. */
  charCount: number;
  /** When the snapshot was fetched. */
  fetchedAt: Date;
};

export interface PortfolioScraper {
  /**
   * Fetches a portfolio page and returns its content as markdown.
   *
   * Soft-fail contract: if the URL is invalid, unreachable, blocked by SSRF
   * checks, or times out, returns `null` instead of throwing — the digest
   * generation continues without the portfolio.
   *
   * Caches by URL (short-lived) to avoid hammering Jina on repeated
   * regenerations triggered by other source changes.
   */
  fetch(url: string): Promise<PortfolioSnapshot | null>;
}
