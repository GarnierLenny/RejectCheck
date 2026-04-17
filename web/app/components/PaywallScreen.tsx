"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Star, Trophy } from "lucide-react";

type SubmitState = 'idle' | 'loading' | 'success' | 'conflict' | 'error';

export function PaywallScreen() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';
      const res = await fetch(`${apiUrl}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 201) setState('success');
      else if (res.status === 409) setState('conflict');
      else setState('error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 selection:bg-rc-red/10 selection:text-rc-red">
      <div className="bg-white border border-rc-border rounded-[32px] p-8 md:p-14 w-full max-w-[620px] shadow-[0_30px_70px_rgba(201,58,57,0.08)] relative overflow-hidden group">
        {/* Background micro-accents */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <Trophy className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-rc-red animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">Free Scan Complete</span>
          </div>

          <h2 className="text-[32px] md:text-[42px] font-bold text-rc-text mb-4 leading-[1.1] tracking-tight">
            Level up your <span className="text-rc-red">job search.</span>
          </h2>

          <p className="text-[17px] text-rc-muted mb-10 mx-auto max-w-[440px] leading-relaxed font-medium">
            You've seen the red flags. Now it's time to fix them and land your next role. Unlock unlimited deep-dives and career-changing tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
            <Link 
              href="/pricing"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 no-underline font-bold"
            >
              Get Unlimited Access <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              href="/analyze"
              onClick={(e) => { e.preventDefault(); window.location.reload(); }}
              className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 font-mono text-[11px] tracking-widest uppercase rounded-xl no-underline font-bold"
            >
              Back to Analyzer
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
            {[
              { icon: <Zap className="w-4 h-4 text-rc-red" />, text: "Unlimited deep-dive scans" },
              { icon: <Star className="w-4 h-4 text-rc-red" />, text: "Priority CV optimization" },
              { icon: <ShieldCheck className="w-4 h-4 text-rc-red" />, text: "Red flag removal guide" },
              { icon: <Trophy className="w-4 h-4 text-rc-red" />, text: "Interview AI & Tracker" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rc-bg/40 border border-rc-border/50">
                {feature.icon}
                <span className="text-[13px] font-bold text-rc-muted leading-none">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-rc-border to-transparent mb-12" />

          {/* Waitlist fallback */}
          <div className="max-w-[400px] mx-auto">
            <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-4 font-bold">Or join the waitlist for early features</p>
            {state === 'success' ? (
              <div className="p-4 bg-rc-green-bg border border-rc-green-border rounded-xl">
                <p className="text-[14px] text-rc-green font-bold">You're on the priority list.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-rc-bg border border-rc-border rounded-lg px-4 py-2 text-[14px] outline-none focus:border-rc-red/20 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="bg-rc-text text-white px-4 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity font-bold disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
