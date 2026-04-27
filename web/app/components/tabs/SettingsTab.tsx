"use client";

import { useState } from "react";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Wand2,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Caption } from "../typography";
import { PublicProfileSettings } from "../settings/PublicProfileSettings";
import { AutofillAnalyzeSettings } from "../settings/AutofillAnalyzeSettings";
import { AccountSettings } from "../settings/AccountSettings";
import { useLanguage } from "../../../context/language";
import type { Profile, Subscription } from "../../../lib/queries";

type Section = "public-profile" | "autofill" | "account";

interface SettingsTabProps {
  profile: Profile | null;
  profileLoading: boolean;
  subscription: Subscription | null;
  session: Session | null;
  onSignOut: () => void;
  lang: string;
}

export function SettingsTab({
  profile,
  subscription,
  session,
  onSignOut,
  lang,
}: SettingsTabProps) {
  const { t } = useLanguage();
  const [section, setSection] = useState<Section>("public-profile");

  const sections: { id: Section; label: string; icon: typeof UserIcon }[] = [
    { id: "public-profile", label: t.settingsTab.sections.publicProfile, icon: UserIcon },
    { id: "autofill", label: t.settingsTab.sections.autofill, icon: Wand2 },
    { id: "account", label: t.settingsTab.sections.account, icon: SettingsIcon },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 lg:gap-12">
      <aside className="md:border-r md:border-rc-border md:pr-4">
        <Caption
          as="p"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-rc-hint mb-2 px-3"
        >
          {t.settingsTab.sidebarLabel}
        </Caption>
        <nav className="flex flex-col gap-0.5">
          {sections.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] text-left transition-colors ${
                  active
                    ? "bg-rc-bg text-rc-text font-medium border-l-2 border-rc-red -ml-[2px] pl-[10px]"
                    : "text-rc-muted hover:text-rc-text hover:bg-rc-bg/50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main>
        {section === "public-profile" && (
          <PublicProfileSettings profile={profile} lang={lang} />
        )}
        {section === "autofill" && (
          <AutofillAnalyzeSettings profile={profile} session={session} />
        )}
        {section === "account" && (
          <AccountSettings
            subscription={subscription}
            session={session}
            onSignOut={onSignOut}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}
