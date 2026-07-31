import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getPostHogClient } from '@/lib/posthog-server';

const SUPPORTED_LANGS = ['en', 'fr'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function sanitizeUsernameBase(email: string): string {
  const local = email.split('@')[0] ?? '';
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
  return cleaned || 'user';
}

function randomSuffix(len = 4): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const langParam = searchParams.get('lang');
  const lang: Lang = SUPPORTED_LANGS.includes(langParam as Lang)
    ? (langParam as Lang)
    : 'en';

  if (!code) {
    return NextResponse.redirect(`${origin}/${lang}/login?error=missing_code`);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/${lang}/login?error=auth_failed`);
  }

  const user = data.session.user;
  const isNewUser = !user.user_metadata?.username;
  if (isNewUser && user.email) {
    const generated = `${sanitizeUsernameBase(user.email)}_${randomSuffix()}`;
    await supabase.auth.updateUser({ data: { username: generated } });
  }

  // Serverless: fire-and-forget capture() dies with the lambda before the HTTP
  // request leaves (the redirect below returns immediately), so these events
  // never reached PostHog. captureImmediate() awaits the send. Analytics must
  // never block auth, hence the swallowed failure.
  const posthog = getPostHogClient();
  const provider = user.app_metadata?.provider ?? 'unknown';
  try {
    const sends: Promise<unknown>[] = [
      posthog.captureImmediate({
        distinctId: user.id,
        event: 'oauth_login_completed',
        properties: {
          provider,
          is_new_user: isNewUser,
          $set: { email: user.email },
        },
      }),
    ];
    if (isNewUser) {
      // Mirrors the email-path event (login/page.tsx) so the signup funnel
      // counts OAuth accounts too — previously only email signups were counted.
      sends.push(
        posthog.captureImmediate({
          distinctId: user.id,
          event: 'user_signed_up',
          properties: { method: provider },
        }),
      );
    }
    await Promise.all(sends);
  } catch {
    // ignore: losing one analytics event is better than failing the login
  }

  const redirectPath = next.startsWith('/') ? next : `/${next}`;
  return NextResponse.redirect(`${origin}/${lang}${redirectPath}`);
}
