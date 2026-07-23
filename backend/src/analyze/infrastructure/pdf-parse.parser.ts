import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type { PdfParser } from '../ports/pdf.parser';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class PdfParseParser implements PdfParser {
  private async extractRaw(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      if (!parsed.text?.trim()) throw new Error('Empty PDF');
      return parsed.text;
    } finally {
      await parser.destroy();
    }
  }

  async parse(buffer: Buffer): Promise<string> {
    try {
      const raw = await this.extractRaw(buffer);
      return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS);
    } catch {
      throw new UnprocessableEntityException(
        'Failed to parse PDF. Make sure it is a valid, text-based PDF.',
      );
    }
  }

  async parseFormatted(buffer: Buffer): Promise<string> {
    try {
      const raw = await this.extractRaw(buffer);
      return raw
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, MAX_TEXT_CHARS);
    } catch {
      throw new UnprocessableEntityException(
        'Failed to parse PDF. Make sure it is a valid, text-based PDF.',
      );
    }
  }
}
