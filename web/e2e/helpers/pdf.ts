import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadFixturePdf(filename = 'sample-cv.pdf'): Buffer {
  return readFileSync(join(__dirname, '..', 'fixtures', filename));
}
