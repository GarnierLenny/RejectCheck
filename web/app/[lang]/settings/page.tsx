"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase";
import { useAuth } from "../../../context/auth";
import { useSubscription, useProfile } from "../../../lib/queries";
import { useClaimUsername, UsernameTakenError, useUpdateProfile } from "../../../lib/mutations";
import { SettingsTab } from "../../components/tabs/SettingsTab";
import { useLanguage } from "../../../context/language";
import { Navbar } from "../../components/Navbar";

function SettingsContent() {
  const router = useRouter();
  const supabase = createClient();
  const { t, localePath, locale } = useLanguage();
  const { user, session, loading: authLoading } = useAuth();

  const { data: subscription } = useSubscription();
  const { data: profile } = useProfile();
  const claimUsername = useClaimUsername();
  const updateProfile = useUpdateProfile();

  const [, setSigningOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(localePath("/login"));
    }
  }, [authLoading, user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile || !user) return;
    const metaUsername: string | undefined = user.user_metadata?.username;
    if (
      !profile.username &&
      metaUsername &&
      /^[A-Za-z0-9_-]{3,30}$/.test(metaUsername)
    ) {
      claimUsername.mutate(metaUsername.toLowerCase(), {
        onError: (err) => {
          if (!(err instanceof UsernameTakenError)) {
            // swallow — user can claim manually
          }
        },
      });
    }
    if (profile.username && profile.username !== metaUsername) {
      supabase.auth.updateUser({ data: { username: profile.username } });
    }
    const metaAvatar: string | undefined = user.user_metadata?.avatar_url;
    if (!profile.avatarUrl && metaAvatar) {
      updateProfile.mutate({ avatarUrl: metaAvatar });
    }
  }, [profile, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    localStorage.removeItem("rc_subscription");
    router.push(localePath("/"));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">{t.common.loading}</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col items-center">
      <Navbar />

      <div className="max-w-[1200px] w-full px-5 pt-8 pb-12">
        <SettingsTab
          profile={profile ?? null}
          profileLoading={false}
          subscription={subscription ?? null}
          session={session}
          onSignOut={handleSignOut}
          lang={locale}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
