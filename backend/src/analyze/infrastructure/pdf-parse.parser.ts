import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type { PdfParser } from '../ports/pdf.parser';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class PdfParseParser implements PdfParser {
  async parse(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        const text = parsed.text
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, MAX_TEXT_CHARS);
        if (!text) throw new Error('Empty PDF');
        return text;
      } finally {
        await parser.destroy();
      }
    } catch {
      throw new UnprocessableEntityException(
        'Failed to parse PDF. Make sure it is a valid, text-based PDF.',
      );
    }
  }
}
