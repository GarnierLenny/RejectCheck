// Holds the claimToken of an analysis a logged-out user just ran, so it can be
// attached to their account right after signup. localStorage (not in-memory)
// because the signup flow can full-reload the page (OAuth redirect).
const KEY = "rc_pending_claim";

export function setPendingClaim(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable — claiming is best-effort */
  }
}

export function getPendingClaim(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingClaim(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
