/**
 * Hand-off of a staged CV (and any typed job description) from the landing
 * hero / onboarding to /analyze.
 *
 * The File itself stays in memory: persisting a 10 MB upload would mean
 * base64-ing it past the sessionStorage quota. The typed job description is
 * small and expensive to retype, so it survives a reload on the way over.
 * A lost File just leaves the dropzone in its empty state, which is its own
 * prompt to re-pick; losing typed text silently was the real damage.
 */

const JD_KEY = "rc_pending_jd";

let _file: File | null = null;

export function setPendingCv(file: File, jd: string) {
  _file = file;
  try {
    if (jd) sessionStorage.setItem(JD_KEY, jd);
    else sessionStorage.removeItem(JD_KEY);
  } catch {
    /* storage unavailable (private mode, quota): the in-memory path still works */
  }
}

export function consumePendingCv(): { file: File | null; jd: string } | null {
  let jd = "";
  try {
    jd = sessionStorage.getItem(JD_KEY) ?? "";
  } catch {
    /* ignore */
  }
  if (!_file && !jd) return null;

  const out = { file: _file, jd };
  _file = null;
  try {
    sessionStorage.removeItem(JD_KEY);
  } catch {
    /* ignore */
  }
  return out;
}
