"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/auth";
import { AuthNavLink } from "../components/AuthNavLink";
import { FileText, Calendar, ChevronRight, LayoutGrid, Clock, ArrowLeft } from "lucide-react";

type HistoryItem = {
  id: number;
  jobDescription: string;
  createdAt: string;
  result: any;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

function HistoryContent() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/analyze/history?email=${user.email}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      })
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("[History] Error fetching:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading history…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center p-5 text-center">
        <div className="w-16 h-16 bg-rc-surface rounded-2xl flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-rc-muted" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Access your history</h1>
        <p className="text-rc-muted max-w-[400px] mb-8">
          Please sign in to view your past analyses and track your CV's evolution.
        </p>
        <Link 
          href="/login?redirect=/history" 
          className="px-8 py-3 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl shadow-lg shadow-rc-red/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <nav className="flex items-center justify-between px-5 py-4 md:px-[32px] border-b-[0.5px] border-rc-border sticky top-0 bg-rc-bg/80 backdrop-blur-md z-50">
        <Link href="/" className="font-sans text-[22px] tracking-wide text-rc-red flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={44} height={44} />
        </Link>
        <div className="flex items-center gap-6">
           <Link 
              href="/analyze" 
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-hint hover:text-rc-text transition-colors no-underline"
            >
              New Analysis
            </Link>
          <AuthNavLink />
          <Link
            href="/pricing"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red hover:text-rc-red/80 transition-colors no-underline"
          >
            Pricing →
          </Link>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto pt-16 px-5 md:px-[32px] pb-[80px]">
        <div className="mb-12">
          <Link href="/analyze" className="inline-flex items-center gap-2 text-rc-hint hover:text-rc-text transition-colors font-mono text-[10px] uppercase tracking-widest mb-6 no-underline bg-rc-surface px-3 py-1.5 rounded-lg">
            <ArrowLeft className="w-3 h-3" /> Back to Analyzer
          </Link>
          <h1 className="text-[40px] font-bold tracking-tight mb-2">Analysis History</h1>
          <p className="text-rc-muted font-medium">Review your past CV audits and tracked improvements.</p>
        </div>

        {error ? (
          <div className="p-8 rounded-2xl bg-rc-red/5 border border-rc-red/10 text-center">
            <p className="text-rc-red font-mono text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-rc-text underline font-mono text-xs">Try again</button>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 rounded-3xl bg-rc-surface/50 border border-rc-border border-dashed text-center">
            <div className="w-12 h-12 bg-rc-bg rounded-xl flex items-center justify-center mx-auto mb-4 border border-rc-border">
              <FileText className="w-6 h-6 text-rc-hint" />
            </div>
            <h3 className="text-lg font-bold mb-2">No history yet</h3>
            <p className="text-rc-hint text-sm mb-8 max-w-[300px] mx-auto">Perform your first analysis to start tracking your performance.</p>
            <Link 
              href="/analyze" 
              className="inline-flex items-center justify-center px-6 py-3 bg-rc-text text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Analyze CV
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Link 
                key={item.id} 
                href={`/analyze?id=${item.id}`}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-rc-surface border border-rc-border hover:border-rc-red/30 hover:bg-white transition-all duration-300 no-underline"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-rc-bg flex items-center justify-center shrink-0 border border-rc-border group-hover:bg-rc-red/5 group-hover:border-rc-red/10 transition-colors">
                    <div className="text-center">
                       <span className={`text-xl font-black ${item.result?.ats_simulation?.would_pass ? 'text-rc-green' : 'text-rc-red'}`}>
                        {item.result?.ats_simulation?.score ?? '??'}
                       </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-rc-text mb-1 line-clamp-1 group-hover:text-rc-red transition-colors">
                      {item.jobDescription.slice(0, 80)}
                      {item.jobDescription.length > 80 ? '...' : ''}
                    </h3>
                    <div className="flex items-center gap-4 text-rc-hint font-mono text-[10px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <div className="px-3 py-1 rounded-full bg-rc-bg border border-rc-border group-hover:border-rc-red/20 transition-colors">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-rc-muted group-hover:text-rc-red">View Draft →</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rc-hint group-hover:text-rc-red translate-x-0 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
