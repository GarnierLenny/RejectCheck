"use client";

import { useState, useRef } from "react";

interface AnalysisResult {
  score: number;
  verdict: string;
  top_reasons: string[];
  improvements: string[];
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Please upload a PDF CV.");
    if (!jobDescription.trim()) return setError("Please paste a job description.");

    const formData = new FormData();
    formData.append("cv", file);
    formData.append("jobDescription", jobDescription);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8888/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    result == null
      ? ""
      : result.score >= 70
      ? "text-red-500"
      : result.score >= 40
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">RejectCheck</h1>
          <p className="mt-2 text-zinc-400">
            Find out why your CV will be rejected — before you apply.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Your CV (PDF)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here..."
              className="w-full rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing your CV..." : "Analyze →"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-12 space-y-8">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
                {result.score}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                  Rejection risk score
                </div>
                <div className={`text-lg font-semibold ${scoreColor}`}>
                  {result.verdict}
                </div>
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Top reasons */}
            <div>
              <h2 className="text-xl font-bold text-red-500 mb-4">
                🚨 Why you&#39;ll get rejected
              </h2>
              <ul className="space-y-3">
                {result.top_reasons.map((reason, i) => (
                  <li key={i} className="flex gap-3 text-zinc-200 text-sm leading-relaxed">
                    <span className="text-red-500 font-bold shrink-0">{i + 1}.</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-300 mb-4">
                What to fix
              </h2>
              <ul className="space-y-3">
                {result.improvements.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-zinc-400 text-sm leading-relaxed">
                    <span className="text-zinc-500 shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
