/**
 * Owner detection for the teaser "audit mode" (running free audits for
 * strangers from the owner's own account). The email always comes from the
 * verified JWT — never from the request body — so this is safe to gate
 * privileged behavior (lean generation, quota bypass, auto-share) on.
 */
export function isOwnerEmail(
  email: string | undefined | null,
  csv: string | undefined | null,
): boolean {
  if (!email || !csv) return false;
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return csv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}
