import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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
  if (!user.user_metadata?.username && user.email) {
    const generated = `${sanitizeUsernameBase(user.email)}_${randomSuffix()}`;
    await supabase.auth.updateUser({ data: { username: generated } });
  }

  const redirectPath = next.startsWith('/') ? next : `/${next}`;
  return NextResponse.redirect(`${origin}/${lang}${redirectPath}`);
}
