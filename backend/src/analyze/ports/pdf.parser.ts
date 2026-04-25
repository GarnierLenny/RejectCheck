export interface PdfParser {
  /** Returns plain text extracted from the PDF buffer. Throws on parse failure. */
  parse(buffer: Buffer): Promise<string>;
}
