"use client";

import { useState } from "react";

// Temporary endpoint to verify Sentry wiring end-to-end. Remove after validation.
export default function DebugSentryPage() {
  const [error, setError] = useState<string | null>(null);

  function throwClient(): never {
    throw new Error("Sentry test from RejectCheck web client");
  }

  async function hitServerThrow(): Promise<void> {
    try {
      const res = await fetch("/debug-sentry-server");
      setError(`Server returned ${res.status}: ${await res.text()}`);
    } catch (e) {
      setError(`Fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Sentry debug</h1>
      <p>Two ways to verify Sentry is wired:</p>
      <button onClick={throwClient} style={{ padding: "8px 16px" }}>
        Throw on client
      </button>
      <button
        onClick={hitServerThrow}
        style={{ padding: "8px 16px", marginLeft: 12 }}
      >
        Hit /debug-sentry-server (server throw)
      </button>
      {error && (
        <pre style={{ marginTop: 16, background: "#eee", padding: 12 }}>
          {error}
        </pre>
      )}
    </div>
  );
}
