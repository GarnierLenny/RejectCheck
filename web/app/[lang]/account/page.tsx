"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/language";

export default function AccountRedirect() {
  const router = useRouter();
  const { localePath, t } = useLanguage();

  useEffect(() => {
    router.replace(localePath("/settings"));
  }, [router, localePath]);

  return (
    <div className="min-h-screen bg-rc-bg flex items-center justify-center">
      <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">
        {t.settingsTab.account.redirecting}
      </span>
    </div>
  );
}
