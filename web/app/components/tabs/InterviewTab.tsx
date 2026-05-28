"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInterviewHistory } from "../../../lib/queries";
import { Mic, RotateCcw, Loader2, ChevronDown, ChevronUp, Play, Clock } from "lucide-react";
import { useLanguage } from "../../../context/language";
import { PremiumPaywall } from "../PremiumFeature";

// ── Design tokens ─────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };

function scoreColor(score: number): string {
  return score >= 7 ? "var(--rc-green)" : score >= 4 ? "var(--rc-amber)" : "var(--rc-red)";
}

// ── Types ─────────────────────────────────────────────────────────────────────

type InterviewTabProps = {
  isPremium: boolean;
  analysisId: number | null;
  email: string | null;
  accessToken: string | null;
  defaultInterviewId?: number | null;
};

type InterviewState = "idle" | "in_progress" | "loading" | "done";
type ChatMessage = { role: "ai" | "user"; content: string };
type AxisScore = { name: string; score: number; feedback: string };
type QuestionFeedback = { question: string; answer: string; verdict: "good" | "average" | "poor"; comment: string };
type InterviewAnalysis = {
  axes: AxisScore[];
  questionFeedback: QuestionFeedback[];
  globalVerdict: string;
  keyStrengths: string[];
  keyImprovements: string[];
};
type AttemptHistory = {
  id: number;
  analysisId: number;
  createdAt: string;
  globalScore: number | null;
  analysis: InterviewAnalysis | null;
};

const INTERVIEW_DURATION = 600;
const apiUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com" : "";

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerdictChip({ verdict }: { verdict: "good" | "average" | "poor" }) {
  const { t } = useLanguage();
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    good:    { label: t.interviewTab.verdicts.good,    color: "var(--rc-green)", bg: "var(--rc-green-bg)", border: "var(--rc-green-border)" },
    average: { label: t.interviewTab.verdicts.average, color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" },
    poor:    { label: t.interviewTab.verdicts.poor,    color: "var(--rc-red)",   bg: "var(--rc-red-bg)",   border: "var(--rc-red-border)" },
  };
  const { label, color, bg, border } = map[verdict];
  return (
    <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color, background: bg, border: `1px solid ${border}`, padding: "1px 6px", borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

function AnalysisPanel({ analysis, attemptNumber, date }: { analysis: InterviewAnalysis; attemptNumber: number; date: string }) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const { t } = useLanguage();
  const globalScore = Math.round(analysis.axes.reduce((s, a) => s + a.score, 0) / analysis.axes.length);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Score header */}
      <div>
        <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 8 }}>
          Attempt #{attemptNumber} · {date}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ ...MONO, fontSize: 52, fontWeight: 700, letterSpacing: "-0.04em", color: scoreColor(globalScore), lineHeight: 1 }}>
            {globalScore}
          </span>
          <span style={{ ...MONO, fontSize: 20, color: "var(--rc-hint)" }}>/10</span>
        </div>
      </div>

      {/* Global verdict */}
      <p style={{ ...SANS, fontSize: 13, lineHeight: 1.65, color: "var(--rc-muted)", borderLeft: "2px solid var(--rc-border)", paddingLeft: 12, margin: 0 }}>
        {analysis.globalVerdict}
      </p>

      {/* Axes */}
      <div>
        <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 16 }}>
          {t.interviewTab.performance}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {analysis.axes.map((axis, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ ...SANS, fontSize: 13, color: "var(--rc-text)" }}>{axis.name}</span>
                <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: scoreColor(axis.score) }}>{axis.score}/10</span>
              </div>
              <div style={{ height: 3, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
                <div style={{ height: "100%", borderRadius: 99, background: scoreColor(axis.score), width: `${axis.score * 10}%` }} />
              </div>
              <p style={{ ...SANS, fontSize: 11, color: "var(--rc-hint)", lineHeight: 1.55, margin: 0 }}>{axis.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)", borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700, marginBottom: 10 }}>
            {t.interviewTab.strengths}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.keyStrengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <span style={{ color: "var(--rc-green)", flexShrink: 0, ...MONO, fontSize: 11 }}>+</span>
                <span style={{ ...SANS, fontSize: 12, color: "var(--rc-text)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--rc-red-bg)", border: "1px solid var(--rc-red-border)", borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 10 }}>
            {t.interviewTab.toImprove}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.keyImprovements.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <span style={{ color: "var(--rc-red)", flexShrink: 0, ...MONO, fontSize: 11 }}>→</span>
                <span style={{ ...SANS, fontSize: 12, color: "var(--rc-text)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question feedback */}
      <div>
        <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 12 }}>
          {t.interviewTab.questionFeedback}
        </div>
        <div style={{ border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden" }}>
          {analysis.questionFeedback.map((qf, i) => (
            <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--rc-border)" }}>
              <button
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: expandedQ === i ? "var(--rc-surface)" : "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
              >
                <VerdictChip verdict={qf.verdict} />
                <span style={{ ...SANS, fontSize: 12, color: "var(--rc-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {qf.question}
                </span>
                {expandedQ === i
                  ? <ChevronUp size={14} style={{ color: "var(--rc-hint)", flexShrink: 0 }} />
                  : <ChevronDown size={14} style={{ color: "var(--rc-hint)", flexShrink: 0 }} />
                }
              </button>
              {expandedQ === i && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8, background: "var(--rc-surface)" }}>
                  <div style={{ borderRadius: 4, border: "1px solid var(--rc-border)", padding: "10px 12px" }}>
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 5 }}>
                      {t.interviewTab.yourAnswer}
                    </div>
                    <p style={{ ...SANS, fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{qf.answer}</p>
                  </div>
                  <div style={{ borderRadius: 4, border: "1px solid var(--rc-border)", padding: "10px 12px" }}>
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 5 }}>
                      {t.interviewTab.feedback}
                    </div>
                    <p style={{ ...SANS, fontSize: 12, color: "var(--rc-text)", lineHeight: 1.6, margin: 0 }}>{qf.comment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyRight({ onStart, micGranted, onRequestMic }: { onStart: () => void; micGranted: boolean; onRequestMic: () => void }) {
  const { t } = useLanguage();
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "48px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mic size={24} style={{ color: "var(--rc-muted)" }} />
      </div>
      <div>
        <p style={{ ...SANS, fontSize: 15, fontWeight: 500, color: "var(--rc-text)", margin: "0 0 5px" }}>{t.interviewTab.noAttemptSelected}</p>
        <p style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)", margin: 0 }}>{t.interviewTab.noAttemptDesc}</p>
      </div>
      <button
        onClick={micGranted ? onStart : onRequestMic}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "12px 22px", background: "var(--rc-red)", color: "#fff",
          border: "none", borderRadius: 6, cursor: "pointer",
          boxShadow: "0 6px 20px rgba(201,58,57,0.22)",
        }}
      >
        {micGranted
          ? <><Play size={13} />{t.interviewTab.startInterview}</>
          : <><Mic size={13} />{t.interviewTab.allowMicrophone}</>
        }
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InterviewTab({ isPremium, analysisId, email, accessToken, defaultInterviewId }: InterviewTabProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { data: historyResponse } = useInterviewHistory(1);
  const history = (historyResponse?.data ?? []) as AttemptHistory[];

  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [micGranted, setMicGranted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<InterviewAnalysis | null>(null);

  const interviewIdRef = useRef<number | null>(null);
  const questionIndexRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (history.length === 0) return;
    setSelectedAttemptId(prev => {
      if (defaultInterviewId && history.some(h => h.id === defaultInterviewId)) return defaultInterviewId;
      return prev ?? history[0].id;
    });
  }, [history, defaultInterviewId]);

  const playAudio = useCallback((base64: string) => new Promise<void>(resolve => {
    if (currentAudioRef.current) currentAudioRef.current.pause();
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    currentAudioRef.current = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  }), []);

  const stopVad = useCallback(() => {
    if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    isSpeakingRef.current = false;
  }, []);

  const stopRecording = useCallback(() => {
    stopVad();
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  }, [stopVad]);

  const completeInterview = useCallback(async () => {
    if (!interviewIdRef.current || !email || !accessToken) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setInterviewState("loading");
    try {
      const res = await fetch(`${apiUrl}/api/interview/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ interviewId: interviewIdRef.current }),
      });
      if (!res.ok) throw new Error();
      const data: InterviewAnalysis = await res.json();
      setLiveAnalysis(data);
      setInterviewState("done");
      queryClient.invalidateQueries({ queryKey: ["interview-history"] });
    } catch {
      setInterviewState("done");
    }
  }, [email, accessToken, queryClient]);

  const sendAnswer = useCallback(async (audioBlob: Blob) => {
    if (!interviewIdRef.current || !email || !accessToken) return;
    setIsListening(false);
    setIsProcessing(true);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "audio.webm");
      fd.append("interviewId", String(interviewIdRef.current));
      fd.append("questionIndex", String(questionIndexRef.current));
      const res = await fetch(`${apiUrl}/api/interview/answer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { role: "user", content: data.transcript }]);
      if (data.next) {
        questionIndexRef.current += data.next.isFollowUp ? 0 : 1;
        setMessages(prev => [...prev, { role: "ai", content: data.next.text }]);
        setIsProcessing(false);
        await playAudio(data.next.audioBase64);
        startListening(); // eslint-disable-line
      } else {
        await completeInterview();
      }
    } catch {
      setIsProcessing(false);
      startListening(); // eslint-disable-line
    }
  }, [email, playAudio, completeInterview]); // eslint-disable-line

  const startListening = useCallback(() => {
    if (!streamRef.current) return;
    setIsListening(true);
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "audio/webm" });
    recorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    recorder.onstop = () => sendAnswer(new Blob(audioChunksRef.current, { type: "audio/webm" }));
    recorder.start(100);

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const src = audioCtxRef.current.createMediaStreamSource(streamRef.current);
    const analyser = audioCtxRef.current.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > 20) {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        if (!isSpeakingRef.current && !speakingTimerRef.current) {
          speakingTimerRef.current = setTimeout(() => { isSpeakingRef.current = true; speakingTimerRef.current = null; }, 300);
        }
      } else if (isSpeakingRef.current && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => stopRecording(), 1500);
      }
      vadFrameRef.current = requestAnimationFrame(loop);
    };
    vadFrameRef.current = requestAnimationFrame(loop);
  }, [sendAnswer, stopRecording]);

  const requestMicPermission = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
    } catch { /* denied */ }
  }, []);

  const startInterview = useCallback(async () => {
    if (!analysisId || !email || !accessToken) return;
    setInterviewState("in_progress");
    setMessages([]);
    setTimeLeft(INTERVIEW_DURATION);
    setLiveAnalysis(null);
    questionIndexRef.current = 0;
    try {
      const res = await fetch(`${apiUrl}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ analysisId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      interviewIdRef.current = data.interviewId;
      setMessages([{ role: "ai", content: data.question.text }]);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); completeInterview(); return 0; }
          return t - 1;
        });
      }, 1000);
      await playAudio(data.question.audioBase64);
      startListening();
    } catch { setInterviewState("idle"); }
  }, [analysisId, email, playAudio, startListening, completeInterview]);

  useEffect(() => () => {
    stopVad();
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    currentAudioRef.current?.pause();
  }, [stopVad]);

  // ── Paywall ──────────────────────────────────────────────────────────────────

  if (!isPremium) {
    return (
      <PremiumPaywall
        badge={t.interviewTab.premiumBadge}
        title={t.interviewTab.premiumTitle}
        description={t.interviewTab.premiumDesc}
        ctaLabel={t.interviewTab.unlockButton}
      />
    );
  }

  // ── In progress ──────────────────────────────────────────────────────────────

  if (interviewState === "in_progress") {
    const progress = ((INTERVIEW_DURATION - timeLeft) / INTERVIEW_DURATION) * 100;
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Timer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", display: "inline-block", animation: "pulse 1.5s infinite" }} />
            <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-muted)" }}>{t.interviewTab.liveInterview}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} style={{ color: "var(--rc-hint)" }} />
            <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: timeLeft < 60 ? "var(--rc-red)" : "var(--rc-text)" }}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "rgba(201,58,57,0.5)", borderRadius: 99, width: `${progress}%`, transition: "width 1s linear" }} />
        </div>

        {/* Chat */}
        <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 8, padding: "16px", minHeight: 380, maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "ai" ? "flex-start" : "flex-end" }}>
              <div style={{
                maxWidth: "78%", borderRadius: msg.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                padding: "12px 16px", ...SANS, fontSize: 14, lineHeight: 1.6,
                background: msg.role === "ai" ? "var(--rc-bg)" : "var(--rc-red-bg)",
                border: `1px solid ${msg.role === "ai" ? "var(--rc-border)" : "var(--rc-red-border)"}`,
                color: "var(--rc-text)",
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Status + end button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 24 }}>
            {isProcessing ? (
              <>
                <Loader2 size={13} className="animate-spin" style={{ color: "var(--rc-muted)" }} />
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-muted)" }}>{t.interviewTab.processing}</span>
              </>
            ) : isListening ? (
              <>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                  {[8, 14, 10, 16, 6].map((h, i) => (
                    <div key={i} className="animate-bounce" style={{ width: 2, borderRadius: 99, background: "var(--rc-red)", height: h, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-red)" }}>{t.interviewTab.listening}</span>
              </>
            ) : (
              <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)" }}>{t.interviewTab.waiting}</span>
            )}
          </div>
          <button
            onClick={completeInterview}
            style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {t.interviewTab.endEarly}
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (interviewState === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--rc-red)" }} />
        <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)" }}>
          {t.interviewTab.analysing}
        </span>
      </div>
    );
  }

  // ── Idle + Done — two-column master-detail ────────────────────────────────────

  const selectedAttempt = history.find(h => h.id === selectedAttemptId) ?? null;
  const displayedAnalysis = interviewState === "done" && liveAnalysis && !selectedAttemptId
    ? liveAnalysis
    : selectedAttempt?.analysis ?? null;
  const displayedAttemptNumber = selectedAttempt ? history.length - history.indexOf(selectedAttempt) : history.length + 1;
  const displayedDate = selectedAttempt
    ? new Date(selectedAttempt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Just now";

  return (
    <div style={{ display: "flex", border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden", minHeight: 560 }}>

      {/* Left sidebar */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid var(--rc-border)", display: "flex", flexDirection: "column", background: "var(--rc-surface)" }}>
        {/* CTA */}
        <div style={{ padding: 14, borderBottom: "1px solid var(--rc-border)" }}>
          <button
            onClick={micGranted ? startInterview : requestMicPermission}
            disabled={micGranted && (!analysisId || !email)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "10px 0", background: "var(--rc-red)", color: "#fff",
              border: "none", borderRadius: 4, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(201,58,57,0.22)",
              opacity: micGranted && (!analysisId || !email) ? 0.4 : 1,
            }}
          >
            {micGranted ? <><Play size={12} />{history.length > 0 ? t.interviewTab.newAttempt : t.interviewTab.startInterview}</> : <><Mic size={12} />{t.interviewTab.allowMicrophone}</>}
          </button>
          {micGranted && (
            <p style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", textAlign: "center", marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
              {t.interviewTab.sessionInfo}
            </p>
          )}
        </div>

        {/* History list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {history.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "24px 16px", textAlign: "center" }}>
              <p style={{ ...SANS, fontSize: 12, color: "var(--rc-hint)", lineHeight: 1.6, margin: 0 }}>{t.interviewTab.noInterviewsYet}</p>
            </div>
          ) : (
            <>
              <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", padding: "12px 16px 8px" }}>
                {history.length} {history.length > 1 ? t.interviewTab.attempts : t.interviewTab.attempt}
              </div>
              {history.map((h, i) => {
                const isSelected = h.id === selectedAttemptId;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedAttemptId(h.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 16px", background: isSelected ? "var(--rc-bg)" : "none",
                      border: "none", borderTop: "1px solid var(--rc-border)", cursor: "pointer", textAlign: "left" as const,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ width: 2, height: 22, borderRadius: 99, background: isSelected ? "var(--rc-red)" : "transparent", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ ...SANS, fontSize: 12, color: "var(--rc-text)", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </p>
                        <p style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", margin: 0 }}>
                          #{history.length - i} · {new Date(h.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {h.globalScore !== null ? (
                      <span style={{ ...MONO, fontSize: 13, fontWeight: 700, flexShrink: 0, color: scoreColor(h.globalScore) }}>
                        {h.globalScore}<span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)" }}>/10</span>
                      </span>
                    ) : (
                      <span style={{ ...MONO, fontSize: 10, color: "var(--rc-hint)" }}>—</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Retry */}
        {interviewState === "done" && (
          <div style={{ padding: 12, borderTop: "1px solid var(--rc-border)" }}>
            <button
              onClick={() => { setInterviewState("idle"); setLiveAnalysis(null); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                ...MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)",
                padding: "8px 0", background: "none", border: "1px solid var(--rc-border)", borderRadius: 4, cursor: "pointer",
              }}
            >
              <RotateCcw size={11} /> {t.interviewTab.newAttempt}
            </button>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: "var(--rc-bg)", overflow: "hidden" }}>
        {displayedAnalysis ? (
          <AnalysisPanel
            analysis={displayedAnalysis}
            attemptNumber={displayedAttemptNumber}
            date={displayedDate}
          />
        ) : (
          <EmptyRight
            onStart={startInterview}
            micGranted={micGranted}
            onRequestMic={requestMicPermission}
          />
        )}
      </div>

    </div>
  );
}
