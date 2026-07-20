#!/usr/bin/env node
// Bans the section sign "§" from the repo. It reads like a legal/technical
// artifact and was removed from the whole product; this guard fails CI if it
// ever comes back in authored source. Run locally with:
//   node scripts/check-no-section-sign.mjs
//
// Scans every git-tracked file, skipping binaries (matched by extension or a
// NUL byte in the first chunk) and generated artifacts that we don't hand-edit.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BANNED = '§'; // §

// Generated / vendored paths we never author by hand. Section signs here come
// from embedded font glyph tables, not from us, and would be a false positive.
const SKIP_PREFIXES = ['web/playwright-report/', 'web/public/'];

// The only place "§" is allowed: the sanitizer that strips it from AI output
// and this guard itself both have to name the character literally.
const ALLOW_FILES = new Set([
  'backend/src/common/strip-long-dashes.ts',
  'backend/src/common/strip-long-dashes.spec.ts',
  'scripts/check-no-section-sign.mjs',
]);

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'icns',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'pdf', 'zip', 'gz', 'mp4', 'mov', 'webm', 'mp3', 'wav',
]);

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { encoding: 'buffer' });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function ext(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot + 1).toLowerCase();
}

const violations = [];

for (const file of trackedFiles()) {
  if (ALLOW_FILES.has(file)) continue;
  if (SKIP_PREFIXES.some((p) => file.startsWith(p))) continue;
  if (BINARY_EXT.has(ext(file))) continue;

  let buf;
  try {
    buf = readFileSync(file);
  } catch {
    continue; // deleted / unreadable — nothing to scan
  }
  // Heuristic binary check: a NUL byte in the first 8KB means not text.
  if (buf.subarray(0, 8192).includes(0)) continue;
  if (!buf.includes(0xa7)) continue; // fast path: no § anywhere

  const lines = buf.toString('utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes(BANNED)) {
      violations.push(`${file}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    `✗ Banned character "${BANNED}" found in ${violations.length} location(s):\n`,
  );
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\nThe section sign "§" is banned in RejectCheck. Remove it (use the ' +
      'section number on its own, e.g. "01 · Title").',
  );
  process.exit(1);
}

console.log('✓ No banned "§" character found in tracked source.');
