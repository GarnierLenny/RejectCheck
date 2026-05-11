"use client";

import { useState } from "react";
import { useRefreshProfileDigest } from "../../../../lib/mutations";
import { useAuth } from "../../../../context/auth";
import { useProfile } from "../../../../lib/queries";

export default function DigestDebugPage() {
  const { user, session } = useAuth();
  const { data: profile } = useProfile();
  const refresh = useRefreshProfileDigest();
  const [cvText, setCvText] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [locale, setLocale] = useState<"fr" | "en">("fr");

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-rc-bg p-12 font-sans">
        <h1 className="text-2xl font-bold mb-4">Digest debug</h1>
        <p className="text-rc-red">You must be signed in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rc-bg p-12 font-sans space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">ProfileDigest debug</h1>
        <p className="text-rc-muted text-sm">
          Signed in as <span className="font-mono">{user.email}</span>. Hits{" "}
          <span className="font-mono">/api/analyze/profile/refresh-digest</span>
          .
        </p>
      </div>

      <div className="bg-rc-surface border border-rc-border p-4 font-mono text-xs space-y-1">
        <div>
          githubUsername:{" "}
          <span className="text-rc-text">
            {profile?.githubUsername ?? "(not set)"}
          </span>
        </div>
        <div>
          portfolioUrl:{" "}
          <span className="text-rc-text">
            {profile?.portfolioUrl ?? "(not set)"}
          </span>
        </div>
        <div className="text-rc-hint pt-1 border-t border-rc-border mt-2">
          These are read from your Profile row. Set them via the normal profile
          flow before calling refresh-digest (or they&apos;ll be null in the
          generation).
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-widest text-rc-hint mb-1">
            CV text (paste raw text — no PDF here)
          </label>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            rows={10}
            placeholder="Lenny Garnier — Product Designer · 5 years..."
            className="w-full bg-rc-surface border border-rc-border p-3 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-rc-hint mb-1">
            LinkedIn text (optional, paste profile export or summary)
          </label>
          <textarea
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
            rows={5}
            placeholder="Senior Product Designer @ Acme · 2022 - present..."
            className="w-full bg-rc-surface border border-rc-border p-3 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-rc-hint">
            Locale:
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as "fr" | "en")}
            className="bg-rc-surface border border-rc-border px-2 py-1 font-mono text-xs"
          >
            <option value="fr">fr</option>
            <option value="en">en</option>
          </select>
        </div>
      </div>

      <button
        onClick={() =>
          refresh.mutate({
            cvText: cvText.trim() || undefined,
            linkedinText: linkedinText.trim() || undefined,
            locale,
          })
        }
        disabled={refresh.isPending}
        className="px-6 py-3 bg-rc-red text-white font-mono uppercase tracking-widest text-sm hover:bg-rc-red-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {refresh.isPending ? "Generating…" : "Generate digest"}
      </button>

      {refresh.isError && (
        <div className="p-4 bg-rc-red/10 border border-rc-red/30 text-rc-red font-mono text-xs">
          Error:{" "}
          {refresh.error instanceof Error
            ? refresh.error.message
            : "Unknown error"}
        </div>
      )}

      {refresh.isSuccess && refresh.data && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-rc-green font-mono">
            Success
          </div>
          <details open className="bg-rc-surface border border-rc-border">
            <summary className="p-3 cursor-pointer text-xs uppercase tracking-widest text-rc-hint font-mono border-b border-rc-border">
              digest
            </summary>
            <pre className="p-3 font-mono text-xs overflow-x-auto">
              {JSON.stringify(refresh.data.digest, null, 2)}
            </pre>
          </details>
          <details className="bg-rc-surface border border-rc-border">
            <summary className="p-3 cursor-pointer text-xs uppercase tracking-widest text-rc-hint font-mono border-b border-rc-border">
              hashes
            </summary>
            <pre className="p-3 font-mono text-xs overflow-x-auto">
              {JSON.stringify(refresh.data.hashes, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
