/**
 * Removes surrounding ```json fences that LLMs sometimes add to JSON output,
 * even when prompted to return raw JSON. Safe to call on any string.
 */
export function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
