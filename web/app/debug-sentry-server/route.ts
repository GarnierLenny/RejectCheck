// Temporary endpoint to verify Sentry wiring on the Next.js server runtime.
// Remove after validation. Path is outside /api/ to avoid the dev rewrite to backend.
export async function GET(): Promise<Response> {
  throw new Error("Sentry test from RejectCheck web server");
}
