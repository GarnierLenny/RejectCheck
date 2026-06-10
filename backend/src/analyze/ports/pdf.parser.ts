export interface PdfParser {
  /** Returns plain text with whitespace collapsed to single spaces (for LLM prompts). Throws on parse failure. */
  parse(buffer: Buffer): Promise<string>;
  /** Returns text with newlines preserved and per-line whitespace normalized (for display/highlighting). Throws on parse failure. */
  parseFormatted(buffer: Buffer): Promise<string>;
}
