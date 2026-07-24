/**
 * Single source of truth for CV upload constraints, mirrored from the backend
 * guardrails (analyze.controller.ts: ALLOWED_UPLOAD_MIMETYPES + 10MB multer
 * cap). Every surface that takes a CV file (hero widget, upload form, drops)
 * must validate through here so the advertised rules match what the server
 * actually accepts.
 */

export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_MAX_LABEL = "10MB";

export const CV_ACCEPT_ATTR =
  ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";

const ALLOWED_MIMETYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

export type CvFileError = "type" | "size";

/** Returns null when the file is acceptable, or the reason it isn't. */
export function validateCvFile(file: File): CvFileError | null {
  const name = file.name.toLowerCase();
  const typeOk =
    ALLOWED_MIMETYPES.has(file.type) ||
    // Some browsers/OSes hand over an empty MIME type on drag-and-drop; fall
    // back to the extension so a valid PDF isn't rejected.
    (file.type === "" && ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext)));
  if (!typeOk) return "type";
  if (file.size > CV_MAX_BYTES) return "size";
  return null;
}
