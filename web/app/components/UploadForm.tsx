"use client";

import { useRef, useState } from "react";

type Props = {
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
  liFile: File | null;
  setLiFile: (f: File | null) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  githubUsername: string;
  setGithubUsername: (v: string) => void;
  mlFile: File | null;
  setMlFile: (f: File | null) => void;
  mlText: string;
  setMlText: (v: string) => void;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  error: string | null;
};

type AccuracyLevel = {
  segments: number;
  label: string;
  color: string;
};

function getAccuracy(cvFile: File | null, jd: string, github: string, liFile: File | null): AccuracyLevel {
  const hasCV = !!cvFile;
  const hasJD = jd.trim().length > 0;
  const hasGH = github.trim().length > 0;
  const hasLI = !!liFile;

  const score = (hasCV ? 1 : 0) + (hasJD ? 1 : 0) + (hasGH ? 1 : 0) + (hasLI ? 1 : 0);

  if (score <= 1) return { segments: 1, label: "Précision basique", color: "bg-rc-red" };
  if (score === 2) return { segments: 2, label: "Précision basique", color: "bg-rc-red" };
  if (score === 3) return { segments: 3, label: "Précision améliorée", color: "bg-rc-amber" };
  return { segments: 5, label: "Signal complet", color: "bg-rc-green" };
}

/* ── Left panel helpers ──────────────────────────────────────────────────── */

function HintBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 px-3 py-2.5 bg-rc-red/8 border border-rc-red/[0.18] rounded">
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-rc-red mb-1">{title}</div>
      <div className="text-[11px] text-rc-hint leading-relaxed">{body}</div>
    </div>
  );
}

function StepList({ current }: { current: 1 | 2 | 3 }) {
  const items: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "Candidature" },
    { n: 2, label: "Signaux" },
    { n: 3, label: "Lancer" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ n, label }) => {
        const state = current > n ? "done" : current === n ? "active" : "idle";
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[7px] font-bold flex-shrink-0 ${
              state === "done" ? "bg-rc-green text-white"
              : state === "active" ? "bg-rc-red text-white"
              : "border border-white/10 text-white/20"
            }`}>
              {state === "done" ? "✓" : n}
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
              state === "done" ? "text-rc-green"
              : state === "active" ? "text-white font-semibold"
              : "text-[#3a3834]"
            }`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeftPanel({ stepTag, title, description, hint }: {
  stepTag: string;
  title: React.ReactNode;
  description: string;
  hint: { title: string; body: string };
}) {
  return (
    <div>
      <div className="font-mono text-[8px] tracking-[0.18em] uppercase text-rc-red flex items-center gap-1.5 mb-4">
        <div className="w-3 h-px bg-rc-red" />
        {stepTag}
      </div>
      <div className="text-[20px] font-bold text-[#f7f5f2] leading-[1.2] tracking-[-0.01em]">{title}</div>
      <p className="text-[12px] text-rc-hint mt-2.5 leading-[1.65]">{description}</p>
      <HintBox title={hint.title} body={hint.body} />
    </div>
  );
}

function LeftStep1() {
  return (
    <LeftPanel
      stepTag="Étape 1 sur 3"
      title={<>Ta candidature<em className="text-rc-red not-italic" style={{ fontFamily: "Georgia, serif" }}>.</em></>}
      description="CV + offre forment un tout indissociable. L'un sans l'autre, l'analyse ne peut pas cibler."
      hint={{ title: "Pourquoi l'offre complète ?", body: "Titre, stack, responsabilités, nice-to-haves — chaque ligne affecte le score ATS." }}
    />
  );
}

function LeftStep2() {
  return (
    <LeftPanel
      stepTag="Étape 2 sur 3"
      title={<>Signaux<em className="text-rc-red not-italic" style={{ fontFamily: "Georgia, serif" }}>.</em></>}
      description="Chaque signal supplémentaire affine le diagnostic. GitHub révèle ce que le CV ne dit pas. LinkedIn confirme la cohérence."
      hint={{ title: "Tous optionnels", body: "Passe cette étape si tu veux. Tu peux analyser avec CV + offre uniquement." }}
    />
  );
}

function LeftStep3({ cvFile, jobDescription, githubUsername, liFile, mlFile, mlText }: {
  cvFile: File | null; jobDescription: string; githubUsername: string;
  liFile: File | null; mlFile: File | null; mlText: string;
}) {
  const recap = [
    cvFile ? { icon: "CV", name: cvFile.name, val: `${(cvFile.size / 1024).toFixed(0)} KB · PDF` } : null,
    jobDescription.trim() ? { icon: "JD", name: "Offre d'emploi", val: `${jobDescription.trim().split(/\s+/).length} mots · collée` } : null,
    githubUsername.trim() ? { icon: "GH", name: `github.com/${githubUsername}`, val: "Signal actif" } : null,
    liFile ? { icon: "in", name: liFile.name, val: "LinkedIn PDF" } : null,
    (mlFile || mlText.trim()) ? { icon: "✉", name: mlFile ? mlFile.name : "Lettre de motivation", val: mlFile ? "PDF" : "Texte collé" } : null,
  ].filter((x): x is { icon: string; name: string; val: string } => x !== null);

  return (
    <div>
      <div className="font-mono text-[8px] tracking-[0.18em] uppercase text-rc-red flex items-center gap-1.5 mb-4">
        <div className="w-3 h-px bg-rc-red" />
        Étape 3 sur 3
      </div>
      <div className="text-[20px] font-bold text-[#f7f5f2] leading-[1.2] tracking-[-0.01em]">
        Tout est prêt<em className="text-rc-red not-italic" style={{ fontFamily: "Georgia, serif" }}>.</em>
      </div>
      <p className="text-[12px] text-rc-hint mt-2.5 leading-[1.65]">
        L'analyse prend ~45 secondes. Score, radar compétences, simulation ATS, réécriture CV.
      </p>
      <div className="mt-5">
        <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#3a3834] mb-2">Récapitulatif</div>
        <div className="flex flex-col gap-1.5">
          {recap.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.04] border border-white/[0.06] rounded">
              <div className="w-5 h-5 rounded flex items-center justify-center font-mono text-[7px] font-bold bg-white/10 text-[#f7f5f2] shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[#f7f5f2] truncate">{item.name}</div>
                <div className="font-mono text-[9px] text-[#3a3834]">{item.val}</div>
              </div>
              <span className="text-rc-green text-[11px]">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Right panel helpers ─────────────────────────────────────────────────── */

function RightStep1({ cvFile, setCvFile, fileRef, jobDescription, setJobDescription }: {
  cvFile: File | null; setCvFile: (f: File | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  jobDescription: string; setJobDescription: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 flex-1">
      {/* CV Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-rc-hint">Ton CV</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-rc-red border border-rc-red/30 px-1.5 py-0.5 rounded">Requis</span>
        </div>
        {!cvFile ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="group border border-dashed border-rc-red/40 bg-rc-red/[0.025] hover:bg-rc-red/[0.05] hover:border-rc-red/60 rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-8 gap-2.5"
          >
            <div className="w-9 h-9 rounded bg-rc-red/8 border border-rc-red/20 group-hover:bg-rc-red/12 flex items-center justify-center transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.8)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[13px] text-rc-muted group-hover:text-rc-text transition-colors font-medium">
                Drop ton CV ou <span className="text-rc-red underline decoration-dotted underline-offset-2">parcourir</span>
              </p>
              <p className="font-mono text-[10px] text-rc-hint mt-0.5">PDF · max 5MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-rc-surface border border-rc-green/30 rounded">
            <div className="w-8 h-8 rounded bg-rc-green/10 border border-rc-green/20 flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-rc-text font-medium truncate">{cvFile.name}</p>
              <p className="font-mono text-[9px] text-rc-hint mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB · PDF</p>
            </div>
            <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setCvFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors p-1 rounded hover:bg-rc-red/8">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
      </div>

      {/* Job Description */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-rc-hint">Offre d'emploi</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-rc-red border border-rc-red/30 px-1.5 py-0.5 rounded">Requis</span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={"Développeur Full Stack Senior — React / Node.js\n\nRequis : TypeScript, AWS, 5 ans XP…\nNice-to-have : Kubernetes, contributions OS…"}
          className="flex-1 min-h-[140px] w-full bg-rc-bg border border-rc-border hover:border-rc-border/70 focus:border-rc-red/20 rounded px-4 py-3 text-rc-text text-[13px] resize-y outline-none transition-colors placeholder:text-rc-hint leading-[1.65]"
        />
        <p className="font-mono text-[9px] text-rc-hint mt-1.5">Plus elle est complète, plus le diagnostic est précis.</p>
      </div>
    </div>
  );
}

function RightStep2({
  githubUsername, setGithubUsername,
  liFile, setLiFile, liRef,
  mlFile, setMlFile, mlRef,
  mlText, setMlText,
  mlMode, setMlMode,
}: {
  githubUsername: string; setGithubUsername: (v: string) => void;
  liFile: File | null; setLiFile: (f: File | null) => void;
  liRef: React.RefObject<HTMLInputElement | null>;
  mlFile: File | null; setMlFile: (f: File | null) => void;
  mlRef: React.RefObject<HTMLInputElement | null>;
  mlText: string; setMlText: (v: string) => void;
  mlMode: "file" | "text"; setMlMode: (m: "file" | "text") => void;
}) {
  return (
    <div className="flex flex-col gap-3 flex-1">

      {/* GitHub */}
      <div className="border border-rc-border rounded overflow-hidden">
        <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <img src="/icons/github.svg" alt="GitHub" width="12" height="12" className="invert" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-rc-text">GitHub</div>
            <p className="font-mono text-[9px] text-rc-hint">repos · langages · activité</p>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-rc-amber border border-rc-amber/30 px-1.5 py-0.5 rounded">+précision</span>
        </div>
        <div className="px-3 py-2.5">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-rc-hint pointer-events-none select-none">github.com/</span>
            <input
              type="text"
              placeholder="username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="w-full bg-rc-bg border border-rc-border rounded py-2 pr-3 pl-[74px] text-rc-text font-mono text-[11px] outline-none focus:border-rc-red/20 transition-colors placeholder:text-rc-hint/50"
            />
          </div>
        </div>
      </div>

      {/* LinkedIn */}
      <div className="border border-rc-border rounded overflow-hidden">
        <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0A66C2] flex items-center justify-center shrink-0">
            <span className="font-mono text-[9px] font-bold text-white">in</span>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-rc-text">LinkedIn</div>
            <p className="font-mono text-[9px] text-rc-hint">export profil PDF</p>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-rc-amber border border-rc-amber/30 px-1.5 py-0.5 rounded">+précision</span>
        </div>
        <div className="px-3 py-2.5">
          {!liFile ? (
            <div
              onClick={() => liRef.current?.click()}
              className="border border-[#0a66c2]/30 hover:border-[#0a66c2]/55 rounded py-2.5 px-3 text-center cursor-pointer transition-all bg-[#0a66c2]/[0.05] hover:bg-[#0a66c2]/[0.09]"
            >
              <p className="text-[12px] text-[#5ba3d9] font-medium">Drop l'export LinkedIn PDF</p>
              <span className="font-mono text-[9px] text-rc-hint">Paramètres → Données → Obtenir une copie</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-2 bg-rc-bg border border-rc-green/30 rounded">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-[11px] text-rc-text flex-1 truncate">{liFile.name}</span>
              <button type="button" onClick={() => { if (liRef.current) liRef.current.value = ""; setLiFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <input type="file" ref={liRef} accept=".pdf" className="hidden" onChange={(e) => setLiFile(e.target.files?.[0] || null)} />
        </div>
      </div>

      {/* Motivation Letter */}
      <div className="border border-rc-border rounded overflow-hidden">
        <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rc-red/5 border border-rc-red/20 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.8)" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-rc-text">Lettre de motivation</div>
            <p className="font-mono text-[9px] text-rc-hint">PDF ou texte</p>
          </div>
          <div className="flex bg-rc-surface border border-rc-border rounded p-0.5">
            <button onClick={() => setMlMode("file")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "file" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>PDF</button>
            <button onClick={() => setMlMode("text")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "text" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>Texte</button>
          </div>
        </div>
        <div className="px-3 py-2.5">
          {mlMode === "file" ? (
            <>
              {!mlFile ? (
                <div
                  onClick={() => mlRef.current?.click()}
                  className="border border-rc-border border-dashed hover:border-rc-red/30 rounded py-2.5 px-3 text-center cursor-pointer transition-all bg-rc-bg hover:bg-rc-red/[0.025]"
                >
                  <p className="text-[12px] text-rc-muted font-medium">Drop la lettre de motivation</p>
                  <span className="font-mono text-[9px] text-rc-hint">ou <span className="text-rc-red decoration-dotted underline">parcourir</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-2 bg-rc-bg border border-rc-green/30 rounded">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="text-[11px] text-rc-text flex-1 truncate">{mlFile.name}</span>
                  <button type="button" onClick={() => { if (mlRef.current) mlRef.current.value = ""; setMlFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
              <input type="file" ref={mlRef} accept=".pdf" className="hidden" onChange={(e) => { setMlFile(e.target.files?.[0] || null); setMlText(""); }} />
            </>
          ) : (
            <textarea
              value={mlText}
              onChange={(e) => { setMlText(e.target.value); setMlFile(null); }}
              onBlur={() => { if (mlText.trim()) setMlFile(null); }}
              placeholder="Colle ta lettre de motivation ici…"
              className="w-full bg-rc-bg border border-rc-border focus:border-rc-red/20 rounded px-3 py-2.5 text-rc-text text-[12px] min-h-[80px] resize-y outline-none transition-colors placeholder:text-rc-hint/50"
            />
          )}
        </div>
      </div>

    </div>
  );
}

function RightStep3({ accuracy, onSubmit, loading, error, hasRequired }: {
  accuracy: AccuracyLevel;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean; error: string | null; hasRequired: boolean;
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">
        {/* Accuracy */}
        <div className="mb-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rc-hint mb-2">Précision de l'analyse</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-[3px] w-7 rounded-full transition-all duration-300 ${i <= accuracy.segments ? accuracy.color : "bg-rc-border"}`} />
              ))}
            </div>
            <span className="font-mono text-[9px] text-rc-hint">{accuracy.label}</span>
          </div>
        </div>

        {/* What you'll get */}
        <div className="p-4 bg-rc-bg border border-rc-border rounded mb-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-rc-hint mb-3">Ce que tu vas recevoir</div>
          <div className="flex flex-col gap-2">
            {[
              "Score de rejet global + verdict",
              "Simulation ATS + mots-clés manquants",
              "Radar compétences vs. poste",
              "Réécriture CV + Interview IA",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px] text-rc-muted">
                <span className="text-rc-red font-bold text-[10px]">✦</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-rc-hint">Coût</span>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-rc-green/8 border border-rc-green/20 rounded">
            <span className="text-[10px] text-rc-green">✦</span>
            <span className="font-mono text-[9px] text-rc-green font-medium uppercase tracking-tight">1 crédit gratuit disponible</span>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading || !hasRequired}
          className="w-full relative group font-mono text-[11px] tracking-[0.14em] uppercase font-medium text-white/90 bg-rc-red rounded py-3.5 border-none cursor-pointer transition-all duration-200 hover:bg-[#c93a39] hover:shadow-[0_6px_24px_rgba(226,75,74,0.2)] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analyse en cours…
              </>
            ) : (
              <>
                Lancer l'analyse
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </span>
          {!loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          )}
        </button>

        <div className="flex items-center justify-center gap-4 mt-2.5">
          {[
            { icon: "⏱", text: "~45s" },
            { icon: "🔒", text: "Données non stockées" },
            { icon: "✦", text: "1 crédit" },
          ].map(({ icon, text }) => (
            <span key={text} className="font-mono text-[8px] text-rc-hint flex items-center gap-1">
              <span className="opacity-50">{icon}</span>{text}
            </span>
          ))}
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rc-red/5 border border-rc-red/20 rounded text-[11px] text-rc-red text-center font-mono">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function UploadForm({
  cvFile, setCvFile,
  liFile, setLiFile,
  jobDescription, setJobDescription,
  githubUsername, setGithubUsername,
  mlFile, setMlFile,
  mlText, setMlText,
  onSubmit, loading, error,
}: Props) {
  const [mlMode, setMlMode] = useState<"file" | "text">("file");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);
  const mlRef = useRef<HTMLInputElement>(null);

  const hasRequired = !!cvFile && jobDescription.trim().length > 0;
  const hasStep1 = hasRequired;
  const accuracy = getAccuracy(cvFile, jobDescription, githubUsername, liFile);

  const stepItems = [
    { n: 1 as const, label: "Candidature" },
    { n: 2 as const, label: "Signaux" },
    { n: 3 as const, label: "Lancer" },
  ] as const;

  return (
    <div className="bg-rc-surface border border-rc-border overflow-hidden max-w-[900px] mx-auto">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <div className="bg-rc-surface border-b border-rc-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rc-red" />
          <span className="font-mono text-[13px] font-bold text-rc-red tracking-wide">RejectCheck</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5">
          {stepItems.map(({ n, label }, i) => {
            const state = step > n ? "done" : step === n ? "active" : "idle";
            return (
              <div key={n} className="flex items-center gap-1.5">
                {i > 0 && (
                  <div className={`w-5 h-px ${step > n ? "bg-rc-green" : "bg-rc-border"}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[8px] font-bold ${
                    state === "done" ? "bg-rc-green text-white"
                    : state === "active" ? "bg-rc-red text-white"
                    : "bg-white border border-rc-border text-rc-hint"
                  }`}>
                    {state === "done" ? "✓" : n}
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
                    state === "done" ? "text-rc-green"
                    : state === "active" ? "text-rc-red font-bold"
                    : "text-rc-hint"
                  }`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-[140px]" />
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[260px_1fr] min-h-[440px]">

        {/* LEFT DARK PANEL */}
        <div className="bg-[#1a1917] px-6 py-7 flex flex-col justify-between">
          {step === 1 && <LeftStep1 />}
          {step === 2 && <LeftStep2 />}
          {step === 3 && (
            <LeftStep3
              cvFile={cvFile}
              jobDescription={jobDescription}
              githubUsername={githubUsername}
              liFile={liFile}
              mlFile={mlFile}
              mlText={mlText}
            />
          )}
          <StepList current={step} />
        </div>

        {/* RIGHT WHITE PANEL */}
        <div className="bg-rc-surface border-l border-rc-border px-7 py-7 flex flex-col">
          {step === 1 && (
            <RightStep1
              cvFile={cvFile} setCvFile={setCvFile} fileRef={fileRef}
              jobDescription={jobDescription} setJobDescription={setJobDescription}
            />
          )}
          {step === 2 && (
            <RightStep2
              githubUsername={githubUsername} setGithubUsername={setGithubUsername}
              liFile={liFile} setLiFile={setLiFile} liRef={liRef}
              mlFile={mlFile} setMlFile={setMlFile} mlRef={mlRef}
              mlText={mlText} setMlText={setMlText}
              mlMode={mlMode} setMlMode={setMlMode}
            />
          )}
          {step === 3 && (
            <RightStep3
              accuracy={accuracy}
              onSubmit={onSubmit}
              loading={loading}
              error={error}
              hasRequired={hasRequired}
            />
          )}

          {/* Nav row */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-rc-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-rc-hint hover:text-rc-text transition-colors flex items-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M12 7H2M6.5 3L2 7l4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retour
              </button>
            ) : <div />}

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                disabled={step === 1 && !hasStep1}
                className="bg-rc-red text-white font-mono text-[10px] tracking-[0.14em] uppercase px-5 py-2.5 rounded flex items-center gap-2 transition-all hover:bg-[#c93a39] hover:shadow-[0_4px_16px_rgba(201,58,57,0.25)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-rc-red"
              >
                Continuer
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
