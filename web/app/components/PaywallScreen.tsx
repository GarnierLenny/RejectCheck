"use client";

import { useState } from "react";

type Props = { reason: 'local' | 'global' };
type SubmitState = 'idle' | 'loading' | 'success' | 'conflict' | 'error';

export function PaywallScreen({ reason }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminError, setAdminError] = useState(false);

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

  async function handleAdminReset(e: React.FormEvent) {
    setAdminError(false);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';
      const res = await fetch(`${apiUrl}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey }),
      });
      if (res.ok) {
        localStorage.removeItem('rc_free_used');
        window.location.reload();
      } else {
        setAdminError(true);
      }
    } catch {
      setAdminError(true);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12">
      <div className="bg-white border border-rc-border rounded-2xl p-10 md:p-12 w-full max-w-[540px] shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{
            background: 'rgba(201, 58, 57, 0.08)',
            border: '1px solid rgba(201, 58, 57, 0.15)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rc-red)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 
          className="text-[28px] md:text-[34px] font-semibold text-rc-text mb-4 text-center leading-tight tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {reason === 'local'
            ? "Hope that scan helped!"
            : "We're a bit busy."}
        </h2>

        <p className="text-[15px] text-rc-muted mb-8 text-center leading-relaxed">
          {reason === 'local'
            ? "To keep RejectCheck free for everyone, we offer one deep-dive per user. We're building a version for power-users—join the waitlist to be at the front of the line."
            : "RejectCheck is seeing a lot of love today and our servers need a breather. Drop your email and we'll send you a priority link as soon as a slot opens up."}
        </p>

        <div className="bg-rc-bg/50 border border-rc-border rounded-xl p-5 mb-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-3">Waitlist Benefits</p>
          <ul className="space-y-2.5">
            {[
              "Unlimited deep-dive scans",
              "Priority support for CV optimization",
              "Exclusive developer job network access",
              "Early access to new features"
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-[13px] text-rc-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rc-green)" strokeWidth="3">
                  <path d="M20 6L9 17 4 12" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {state === 'success' ? (
          <div className="p-4 bg-rc-green-bg border border-rc-green-border rounded-xl text-center">
            <p className="text-[14px] text-rc-green font-medium">You&apos;re now on the priority list.</p>
            <p className="font-mono text-[11px] text-rc-green mt-1">We&apos;ll notify you soon.</p>
          </div>
        ) : state === 'conflict' ? (
          <div className="p-4 bg-rc-amber-border/10 border border-rc-amber-border rounded-xl text-center">
            <p className="text-[14px] text-rc-amber font-medium">Already on the list.</p>
            <p className="font-mono text-[11px] text-rc-amber mt-1 italic">Check your inbox for updates.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="email"
                placeholder="developer@work.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-rc-bg border border-rc-border hover:border-rc-border/80 focus:border-rc-red/40 rounded-xl px-5 py-3.5 text-rc-text text-[15px] outline-none transition-all placeholder:text-rc-hint"
                required
              />
            </div>
            <button
              type="submit"
              disabled={state === 'loading' || !email.trim()}
              className="w-full relative group font-mono text-[12px] tracking-[0.12em] uppercase font-semibold text-white bg-rc-red rounded-xl py-4 border-none cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden shadow-[0_8px_25px_rgba(201,58,57,0.2)]"
            >
              <span className="relative z-10">
                {state === 'loading' ? 'Enrolling...' : 'Join Waitlist'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
            {state === 'error' && (
              <p className="font-mono text-[11px] text-rc-red text-center mt-2 animate-pulse">Connection error. Please try again.</p>
            )}
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-rc-border/50 text-center">
          {showAdmin ? (
            <form onSubmit={handleAdminReset} className="flex gap-2">
              <input 
                type="password" 
                placeholder="Admin Secret Key" 
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className={`flex-1 bg-rc-bg border ${adminError ? 'border-rc-red/50' : 'border-rc-border'} rounded-lg px-3 py-2 text-[12px] font-mono outline-none`}
                autoFocus
              />
              <button 
                type="submit" 
                className="bg-rc-text text-white px-4 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wider hover:opacity-90"
              >
                Reset
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setShowAdmin(true)}
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint hover:text-rc-muted transition-colors"
            >
              Admin Access
            </button>
          )}
        </div>
      </div>
    </div>
  );

}
