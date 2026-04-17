"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInterviewHistory } from "../../../lib/queries";
import Link from "next/link";
import { ArrowRight, Sparkles, Mic, RotateCcw, Loader2, ChevronDown, ChevronUp, Play, Clock, TrendingUp } from "lucide-react";
import { useLanguage } from "../../../context/language";

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

function scoreColorClass(score: number) {
  return score >= 7 ? "text-green-400" : score >= 4 ? "text-amber-400" : "text-rc-red";
}

function scoreBgClass(score: number) {
  return score >= 7 ? "bg-green-500" : score >= 4 ? "bg-amber-500" : "bg-rc-red";
}

function VerdictChip({ verdict }: { verdict: "good" | "average" | "poor" }) {
  const { t } = useLanguage();
  const map = {
    good:    { label: t.interviewTab.verdicts.good,    cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    average: { label: t.interviewTab.verdicts.average, cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    poor:    { label: t.interviewTab.verdicts.poor,    cls: "bg-rc-red/10 text-rc-red border-rc-red/20" },
  };
  const { label, cls } = map[verdict];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[9px] tracking-widest uppercase font-bold ${cls}`}>{label}</span>;
}

function AnalysisPanel({ analysis, attemptNumber, date }: { analysis: InterviewAnalysis; attemptNumber: number; date: string }) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const { t } = useLanguage();
  const globalScore = Math.round(analysis.axes.reduce((s, a) => s + a.score, 0) / analysis.axes.length);

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-rc-hint mb-1">Attempt #{attemptNumber} · {date}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${scoreColorClass(globalScore)}`}>{globalScore}</span>
            <span className="text-rc-hint text-lg">/10</span>
          </div>
        </div>
      </div>

      {/* Global verdict */}
      <p className="text-[14px] text-rc-muted leading-relaxed border-l-2 border-rc-border pl-3">
        {analysis.globalVerdict}
      </p>

      {/* Axes */}
      <div>
        <p className="font-mono text-[10px] tracking-widest uppercase text-rc-hint mb-3">{t.interviewTab.performance}</p>
        <div className="space-y-3">
          {analysis.axes.map((axis, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-rc-text">{axis.name}</span>
                <span className={`font-mono text-[12px] font-bold ${scoreColorClass(axis.score)}`}>{axis.score}/10</span>
              </div>
              <div className="h-1 bg-rc-border rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full ${scoreBgClass(axis.score)}`} style={{ width: `${axis.score * 10}%` }} />
              </div>
              <p className="text-[11px] text-rc-hint leading-relaxed">{axis.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + improvements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
          <p className="font-mono text-[9px] tracking-widest uppercase text-green-400 mb-2.5">{t.interviewTab.strengths}</p>
          <ul className="space-y-2">
            {analysis.keyStrengths.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-[12px] text-rc-text leading-snug">
                <span className="text-green-400 shrink-0 mt-px">+</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rc-red/5 border border-rc-red/15 rounded-xl p-4">
          <p className="font-mono text-[9px] tracking-widest uppercase text-rc-red mb-2.5">{t.interviewTab.toImprove}</p>
          <ul className="space-y-2">
            {analysis.keyImprovements.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-[12px] text-rc-text leading-snug">
                <span className="text-rc-red shrink-0 mt-px">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question feedback */}
      <div>
        <p className="font-mono text-[10px] tracking-widest uppercase text-rc-hint mb-3">{t.interviewTab.questionFeedback}</p>
        <div className="border border-rc-border rounded-xl overflow-hidden divide-y divide-rc-border">
          {analysis.questionFeedback.map((qf, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rc-surface/60 transition-colors"
              >
                <VerdictChip verdict={qf.verdict} />
                <span className="text-[12px] text-rc-text flex-1 truncate">{qf.question}</span>
                {expandedQ === i ? <ChevronUp className="w-3.5 h-3.5 text-rc-hint shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-rc-hint shrink-0" />}
              </button>
              {expandedQ === i && (
                <div className="px-4 pb-4 space-y-2 bg-rc-bg/40">
                  <div className="rounded-lg border border-rc-border p-3">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint mb-1">{t.interviewTab.yourAnswer}</p>
                    <p className="text-[12px] text-rc-muted italic leading-relaxed">{qf.answer}</p>
                  </div>
                  <div className="rounded-lg border border-rc-border p-3">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint mb-1">{t.interviewTab.feedback}</p>
                    <p className="text-[12px] text-rc-text leading-relaxed">{qf.comment}</p>
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
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-rc-surface border border-rc-border flex items-center justify-center">
        <TrendingUp className="w-7 h-7 text-rc-muted" />
      </div>
      <div>
        <p className="text-[15px] font-medium text-rc-text mb-1">{t.interviewTab.noAttemptSelected}</p>
        <p className="text-[13px] text-rc-hint">{t.interviewTab.noAttemptDesc}</p>
      </div>
      {micGranted ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-5 py-2.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-lg shadow-rc-red/20"
        >
          <Play className="w-3.5 h-3.5" />{t.interviewTab.startInterview}
        </button>
      ) : (
        <button
          onClick={onRequestMic}
          className="flex items-center gap-2 px-5 py-2.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-lg shadow-rc-red/20"
        >
          <Mic className="w-3.5 h-3.5" />{t.interviewTab.allowMicrophone}
        </button>
      )}
    </div>
  );
}

export function InterviewTab({ isPremium, analysisId, email, accessToken, defaultInterviewId }: InterviewTabProps) {
  const queryClient = useQueryClient();
  const { t, localePath } = useLanguage();
  const { data: historyData = [] } = useInterviewHistory();
  const history = historyData as AttemptHistory[];

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

  // Sync selectedAttemptId when history loads or defaultInterviewId changes
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ interviewId: interviewIdRef.current }),
      });
      if (!res.ok) throw new Error();
      const data: InterviewAnalysis = await res.json();
      setLiveAnalysis(data);
      setInterviewState("done");
      queryClient.invalidateQueries({ queryKey: ['interview-history'] });
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ analysisId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      interviewIdRef.current = data.interviewId;
      setMessages([{ role: "ai", content: data.question.text }]);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); completeInterview(); return 0; } return t - 1; });
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

  // ─── PAYWALL ────────────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-rc-surface border border-rc-border rounded-[24px] p-8 md:p-12 w-full max-w-[520px] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rc-red/40 to-transparent" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">{t.interviewTab.premiumBadge}</span>
          </div>
          <h3 className="text-2xl font-bold text-rc-text mb-3 tracking-tight">{t.interviewTab.premiumTitle}</h3>
          <p className="text-[15px] text-rc-muted mb-8 leading-relaxed">
            {t.interviewTab.premiumDesc}
          </p>
          <Link href={localePath("/pricing")} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 no-underline font-bold">
            {t.interviewTab.unlockButton} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ─── IN PROGRESS ────────────────────────────────────────────────────────────
  if (interviewState === "in_progress") {
    const progress = ((INTERVIEW_DURATION - timeLeft) / INTERVIEW_DURATION) * 100;
    return (
      <div className="max-w-[680px] mx-auto py-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rc-red animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-rc-muted">{t.interviewTab.liveInterview}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-rc-hint" />
            <span className={`font-mono text-[13px] font-bold ${timeLeft < 60 ? "text-rc-red" : "text-rc-text"}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="h-0.5 bg-rc-border rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-rc-red/50 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="bg-rc-surface border border-rc-border rounded-2xl p-4 mb-3 min-h-[380px] max-h-[500px] overflow-y-auto flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${msg.role === "ai" ? "bg-rc-bg border border-rc-border text-rc-text rounded-tl-sm" : "bg-rc-red/10 border border-rc-red/20 text-rc-text rounded-tr-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 h-6">
            {isProcessing ? (
              <><Loader2 className="w-3.5 h-3.5 text-rc-muted animate-spin" /><span className="font-mono text-[10px] tracking-widest uppercase text-rc-muted">{t.interviewTab.processing}</span></>
            ) : isListening ? (
              <>
                <div className="flex gap-0.5 items-end h-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-0.5 bg-rc-red rounded-full animate-bounce" style={{ height: `${[8, 14, 10, 16, 6][i]}px`, animationDelay: `${i * 0.1}s` }} />)}
                </div>
                <span className="font-mono text-[10px] tracking-widest uppercase text-rc-red">{t.interviewTab.listening}</span>
              </>
            ) : (
              <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint">{t.interviewTab.waiting}</span>
            )}
          </div>
          <button onClick={completeInterview} className="font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-muted transition-colors">
            {t.interviewTab.endEarly}
          </button>
        </div>
      </div>
    );
  }

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (interviewState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-7 h-7 text-rc-red animate-spin" />
        <p className="font-mono text-[10px] tracking-widest uppercase text-rc-muted">{t.interviewTab.analysing}</p>
      </div>
    );
  }

  // ─── IDLE + DONE — Two-column master-detail ──────────────────────────────────
  const selectedAttempt = history.find(h => h.id === selectedAttemptId) ?? null;
  // After a completed interview, show the fresh analysis until user picks from history
  const displayedAnalysis = interviewState === "done" && liveAnalysis && !selectedAttemptId
    ? liveAnalysis
    : selectedAttempt?.analysis ?? null;

  const displayedAttemptNumber = selectedAttempt ? history.length - history.indexOf(selectedAttempt) : history.length + 1;
  const displayedDate = selectedAttempt
    ? new Date(selectedAttempt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Just now";

  return (
    <div className="flex gap-0 border border-rc-border rounded-2xl overflow-hidden" style={{ minHeight: 560 }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────────── */}
      <div className="w-[260px] shrink-0 border-r border-rc-border flex flex-col bg-rc-surface">
        {/* CTA */}
        <div className="p-4 border-b border-rc-border">
          {micGranted ? (
            <button
              onClick={startInterview}
              disabled={!analysisId || !email}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-md shadow-rc-red/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              {history.length > 0 ? t.interviewTab.newAttempt : t.interviewTab.startInterview}
            </button>
          ) : (
            <button
              onClick={requestMicPermission}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-md shadow-rc-red/20"
            >
              <Mic className="w-3.5 h-3.5" />
              {t.interviewTab.allowMicrophone}
            </button>
          )}
          {micGranted && (
            <p className="text-center font-mono text-[9px] text-rc-hint mt-2 tracking-wide">{t.interviewTab.sessionInfo}</p>
          )}
        </div>

        {/* Attempt list */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center py-8">
              <p className="text-[12px] text-rc-hint leading-relaxed">{t.interviewTab.noInterviewsYet}</p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint px-4 pt-3 pb-2">
                {history.length} {history.length > 1 ? t.interviewTab.attempts : t.interviewTab.attempt}
              </p>
              {history.map((h, i) => {
                const isSelected = h.id === selectedAttemptId;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedAttemptId(h.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-rc-border last:border-0 ${isSelected ? "bg-rc-bg" : "hover:bg-rc-bg/50"}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-1 h-6 rounded-full shrink-0 ${isSelected ? "bg-rc-red" : "bg-transparent"}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] text-rc-text font-medium truncate">
                          {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </p>
                        <p className="text-[10px] text-rc-hint">
                          #{history.length - i} · {new Date(h.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {h.globalScore !== null ? (
                      <span className={`font-mono text-[13px] font-bold shrink-0 ${scoreColorClass(h.globalScore)}`}>
                        {h.globalScore}<span className="text-rc-hint text-[10px]">/10</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-rc-hint">—</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Retry at bottom */}
        {interviewState === "done" && (
          <div className="p-3 border-t border-rc-border">
            <button
              onClick={() => { setInterviewState("idle"); setLiveAnalysis(null); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase text-rc-muted hover:text-rc-text border border-rc-border rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> {t.interviewTab.newAttempt}
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-rc-bg overflow-hidden">
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
