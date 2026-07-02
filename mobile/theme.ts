import { Platform } from 'react-native';

/** RejectCheck design tokens, ported from the web design system (globals.css).
 *  One warm light theme: cream bg, ink text, a single red accent. */
export const RC = {
  bg: '#f7f5f2',
  surface: '#ffffff',
  surfaceRaised: '#fafaf9',
  surfaceHero: '#f2efe9',
  border: '#d4cfc9',
  text: '#1a1917',
  muted: '#3a3834',
  hint: '#6b6860',
  red: '#C93A39',
  redHover: '#b53231',
  redBg: 'rgba(201,58,57,0.07)',
  redBorder: 'rgba(201,58,57,0.22)',
  green: '#16a34a',
  amber: '#d97706',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  eight: 48,
} as const;

export const Radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const Font = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  android: { sans: 'sans-serif', mono: 'monospace' },
  default: { sans: 'System', mono: 'monospace' },
})!;

/** Rejection-risk colour: high score = bad. Matches the web (green <40, amber
 *  40-70, red >70). */
export function riskColor(score: number): string {
  if (score >= 70) return RC.red;
  if (score >= 40) return RC.amber;
  return RC.green;
}
