"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, Database, Mail } from "lucide-react";
import { useLanguage } from "../../../context/language";

export default function PrivacyPage() {
  const { t, localePath } = useLanguage();

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={32} height={32} />
          <span className="font-bold text-rc-text hidden sm:inline">RejectCheck</span>
        </Link>
        <Link href={localePath("/login")} className="font-mono text-[11px] tracking-widest uppercase text-rc-hint hover:text-rc-text transition-colors no-underline flex items-center gap-2">
          <ArrowLeft className="w-3 h-3" /> {t.common.back}
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto px-5 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rc-red/5 border border-rc-red/10 text-rc-red mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.privacy.title}</h1>
          <p className="text-rc-hint font-mono text-sm tracking-widest uppercase">Last updated: April 20, 2026</p>
        </div>

        <section className="space-y-12">
          {/* Introduction */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Eye className="w-6 h-6 text-rc-red" /> 1. {t.privacy.sections.commitment}
            </h2>
            <p className="text-rc-muted leading-relaxed">
              At RejectCheck, your privacy is not an afterthought—it&apos;s part of our DNA. As a tool built for developers, we understand the importance of data sovereignty. This document explains how we collect, use, and protect your personal data in compliance with the General Data Protection Regulation (GDPR).
            </p>
          </div>

          {/* Data Collection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Database className="w-6 h-6 text-rc-red" /> 2. {t.privacy.sections.dataCollected}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white border border-rc-border shadow-sm">
                <h3 className="font-bold mb-2">Registered Users</h3>
                <p className="text-sm text-rc-muted">We store your email, username, profile picture, and analysis history. For each analysis, we also store your CV text, job description, and — if provided — your LinkedIn profile, GitHub activity, and motivation letter, to power premium features such as CV rewriting and cover letter generation.</p>
              </div>
              <div className="p-6 rounded-2xl bg-rc-surface border border-rc-border">
                <h3 className="font-bold mb-2">Anonymous Scans</h3>
                <p className="text-sm text-rc-muted">We only log your IP address to enforce free-tier limits. Your CV and job description are NOT stored on our servers.</p>
              </div>
            </div>
          </div>

          {/* AI Handling */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Lock className="w-6 h-6 text-rc-red" /> 3. {t.privacy.sections.aiProcessing}
            </h2>
            <p className="text-rc-muted leading-relaxed">
              Your data is processed exclusively using <span className="text-rc-text font-semibold">Anthropic Claude</span> models via their API. This covers CV analysis, CV rewriting, and cover letter generation.
              <span className="text-rc-text font-semibold"> Anthropic does not train on your data:</span> data sent through the API is not used to train Anthropic&apos;s models. Your documents are processed transiently and are never stored on Anthropic&apos;s servers beyond the duration of the request. For anonymous users, your CV content is not stored on our servers either.
            </p>
          </div>

          {/* Deletion */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-rc-red" /> 4. {t.privacy.sections.deletion}
            </h2>
            <p className="text-rc-muted leading-relaxed">
              You have the right to be forgotten. Registered users can request full account and history deletion at any time by contacting us. We aim to process all deletion requests within 48 hours.
            </p>
          </div>

          {/* Contact */}
          <div className="p-8 rounded-[24px] bg-white border border-rc-red/10 border-dashed text-center">
            <Mail className="w-8 h-8 text-rc-red mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Questions or Requests?</h3>
            <p className="text-rc-muted text-sm mb-6">If you wish to exercise your data rights or have questions about our practices, reach out to our DPO.</p>
            <a href="mailto:privacy@rejectcheck.com" className="font-mono text-sm font-bold text-rc-red hover:underline">privacy@rejectcheck.com</a>
          </div>
        </section>

        <footer className="mt-24 pt-8 border-t border-rc-border flex items-center justify-center gap-8">
          <Link href={localePath("/")} className="font-mono text-[11px] tracking-widest uppercase text-rc-hint hover:text-rc-red transition-colors no-underline">
            {t.common.back}
          </Link>
          <Link href={localePath("/alternatives")} className="font-mono text-[11px] tracking-widest uppercase text-rc-hint hover:text-rc-red transition-colors no-underline">
            {t.landing.footer.alternatives}
          </Link>
        </footer>
      </main>
    </div>
  );
}
