"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase";
import { useAuth } from "../../../context/auth";
import { useSubscription, useProfile } from "../../../lib/queries";
import { useUpdateProfile } from "../../../lib/mutations";
import { SettingsTab } from "../../components/tabs/SettingsTab";
import { useLanguage } from "../../../context/language";
import { Navbar } from "../../components/Navbar";

function AccountContent() {
  const router = useRouter();
  const supabase = createClient();
  const { t, localePath, locale } = useLanguage();
  const { user, session, loading: authLoading } = useAuth();

  const { data: subscription } = useSubscription();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(localePath("/login"));
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!profile || !user) return;
    const metaUsername = user.user_metadata?.username;
    if (!profile.username && metaUsername) {
      updateProfile.mutate({ username: metaUsername });
    }
    if (profile.username && profile.username !== metaUsername) {
      supabase.auth.updateUser({ data: { username: profile.username } });
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

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
