"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Cpu, Search, FileText, Handshake } from "lucide-react";
import { Anthropic, Github, Linkedin } from "react-bootstrap-icons";
import { useLanguage } from "../../context/language";

type Props = {
  currentStep: string | null;
  streamText?: string;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasML: boolean;
  isHired?: boolean;
  onFinished?: () => void;
};

type StepStatus = "pending" | "running" | "done" | "skipped";

const STEPS_CONFIG_BASE = [
  { id: "parsing_cv"           as const, Icon: FileText,  lane: "center" as const },
  { id: "matching_skills"      as const, Icon: Search,    lane: "center" as const },
  { id: "analyzing_linkedin"   as const, Icon: Linkedin,  lane: "center" as const },
  { id: "analyzing_github"     as const, Icon: Github,    lane: "center" as const },
  { id: "dual_ai_analysis"     as const, Icon: Zap,       lane: "split"  as const },
  { id: "negotiation_coaching" as const, Icon: Handshake, lane: "center" as const, hiredOnly: true },
  { id: "finalizing"           as const, Icon: Sparkles,  lane: "center" as const },
];


/**
 * Formats Claude's partial tool_use JSON into something readable by humans.
 * Strips structural tokens (braces, brackets, commas, quotes) and replaces
 * them with newlines + indentation so the output reads like a structured doc:
 *
 *   technical_analysis:
 *     reasoning: The JD is for **RejectCheck**…
 *     skill_priority:
 *       TypeScript
 *       LLM/AI Integration
 *
 * String contents are preserved verbatim. Operates on a partial JSON stream,
 * so the output may end mid-sentence — that's fine, it just keeps rendering.
 */
function prettifyPartialJSON(raw: string): string {
  let out = '';
  let inString = false;
  let escape = false;
  let depth = 0;

  const isLineBlank = () => {
    const lastNl = out.lastIndexOf('\n');
    return /^\s*$/.test(out.slice(lastNl + 1));
  };
  const newline = () => {
    // Replace any trailing whitespace (spaces or stale indent) with the
    // current depth's indent on a fresh line. Avoids blank lines when
    // structural tokens stack (e.g. `[` immediately followed by `{`).
    out = out.replace(/[ \t]+$/, '');
    if (!out.endsWith('\n')) out += '\n';
    out += '  '.repeat(Math.max(0, depth));
  };

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      // Decode the standard JSON escape sequences. Without this, `\n` (two
      // characters: backslash + 'n') would be emitted as two literal chars
      // instead of an actual newline.
      switch (ch) {
        case 'n': out += '\n'; break;
        case 't': out += '\t'; break;
        case 'r': out += '\r'; break;
        case '"': out += '"'; break;
        case '\\': out += '\\'; break;
        case '/': out += '/'; break;
        case 'b': out += '\b'; break;
        case 'f': out += '\f'; break;
        default: out += ch; // unknown escape — pass through
      }
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; continue; }
      out += ch;
      continue;
    }

    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') { depth++; newline(); continue; }
    if (ch === '}' || ch === ']') { depth = Math.max(0, depth - 1); continue; }
    if (ch === ',') { newline(); continue; }
    if (ch === ':') {
      out = out.replace(/[ \t]+$/, '');
      out += ': ';
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (isLineBlank()) continue;
      if (out.endsWith(' ')) continue;
      out += ' ';
      continue;
    }
    out += ch;
  }
  return out.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
}

/**
 * Renders inline markdown from streamed prose into React nodes:
 *   **bold**   → <strong className="text-rc-red font-semibold">
 *   *italic*   → <em className="italic">
 *   `code`     → backticks stripped (the panel is already monospace)
 *   ~~ __ #    → markers stripped, content preserved
 *
 * Handles partial streaming gracefully: closed pairs render styled, any
 * trailing unclosed marker is dropped so we don't flash raw `**` at the end.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  // Drop noise that we don't visually distinguish in this panel.
  text = text
    .replace(/`+/g, '')
    .replace(/__/g, '')
    .replace(/~~/g, '')
    .replace(/^#+\s+/gm, '');

  const out: React.ReactNode[] = [];
  // Bold first (greedy on `**...**`), italics second (`*...*`).
  const tokenRegex = /(\*\*[\s\S]+?\*\*)|(\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      out.push(
        <strong key={key++} className="text-rc-red font-semibold">
          {match[1].slice(2, -2)}
        </strong>,
      );
    } else if (match[2]) {
      out.push(
        <em key={key++} className="italic">
          {match[2].slice(1, -1)}
        </em>,
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    // Strip unclosed trailing markers so a mid-stream `**hello` shows as `hello`
    // until the closing `**` arrives.
    const trailing = text.slice(lastIndex).replace(/\*+$/, '');
    out.push(trailing);
  }
  return out;
}

// ---------- Horizontal pipeline layout ----------
const CY    = 155;  // Center Y (spine of the pipeline)
const X0    = 50;   // Starting X
const W     = 120;  // Width per main step
const SUB_W = 95;   // Width per sub-node

// First post-split node (idx 5). Subsequent post-split nodes step by W.
const POST_SPLIT_X = X0 + 4 * W + 5 * SUB_W + 60;

const GET_X = (idx: number) => {
  if (idx <= 4) return X0 + idx * W;
  return POST_SPLIT_X + (idx - 5) * W;
};

const MERGE_X = GET_X(4) + 5 * SUB_W + 30;

const CLAUDE_TASKS_COUNT = 5;

export function LoadingScreen({ currentStep, streamText = "", hasGithub, hasLinkedin, hasML, isHired = false, onFinished }: Props) {
  const { t } = useLanguage();
  const config = { hasGithub, hasLinkedin, hasML };

  const CLAUDE_TASKS = t.loadingScreen.claudeTasks as string[];

  // Filter the optional hired-only steps so non-premium users get a 6-node
  // pipeline and hired users get the 7-node version including negotiation.
  const STEPS_CONFIG = STEPS_CONFIG_BASE.filter((s) => !s.hiredOnly || isHired);
  const SVG_W = STEPS_CONFIG.length === 7 ? 1230 : 1100;

  const [internalStepIdx, setInternalStepIdx] = useState(0);
  const [isFullyDone,     setIsFullyDone]     = useState(false);

  // Each Claude sub-task is detected when its top-level JSON key appears in
  // the streamed tool_use input. Order matches the schema's declaration order
  // (which Claude tends to follow under strict tool_choice).
  const CLAUDE_TASK_KEYS = [
    'technical_analysis',
    'project_recommendation',
    'ats_simulation',
    'cv_tone',
    'hidden_red_flags',
  ] as const;

  const backendIdx = (() => {
    if (!currentStep) return -1;
    if (currentStep === "done") return STEPS_CONFIG.length;
    if (currentStep === "parsing_motivation_letter" || currentStep === "running_ats") return 4;
    return STEPS_CONFIG.findIndex(s => s.id === currentStep);
  })();

  // 1. Step progression timer — gated by the backend signal. Holds at the
  // split (idx 4) until either the sub-tasks are visually complete or the
  // backend has explicitly moved past split (e.g. emitted negotiation_coaching).
  useEffect(() => {
    if (isFullyDone) return;
    const timer = setInterval(() => {
      setInternalStepIdx(prev => {
        const next = prev + 1;
        if (next >= STEPS_CONFIG.length) return prev;
        if (next > backendIdx && backendIdx !== -1) return prev;
        if (prev === 4 && backendIdx <= 4) return prev;
        return next;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [backendIdx, isFullyDone, STEPS_CONFIG.length]);

  // 2. Claude sub-task progression — each task's key is searched in
  // streamText; once found, that task flips to done. Per-task tracking so a
  // field generated out of order shows as done immediately (vs. a sequential
  // counter which would mislabel earlier tasks). When the backend signals
  // completion, force all to done.
  const backendDone = backendIdx >= STEPS_CONFIG.length;
  const taskDone = CLAUDE_TASK_KEYS.map(
    (key) => backendDone || streamText.includes(`"${key}"`),
  );
  const firstActiveIdx = taskDone.findIndex((d) => !d);
  const claudeP = backendDone
    ? CLAUDE_TASKS_COUNT
    : taskDone.filter(Boolean).length;

  // 3. Finalization — fires onFinished once the last step has been "running"
  // for 3 s. The 4 → 5 transition is handled by the step timer once the
  // backend signal allows it (or once the sub-task split is visually done).
  useEffect(() => {
    const lastIdx = STEPS_CONFIG.length - 1;
    const virtualSplitDone = claudeP === CLAUDE_TASKS_COUNT;
    if (internalStepIdx === 4 && virtualSplitDone && backendDone) {
      const t = setTimeout(() => setInternalStepIdx(5), 1500);
      return () => clearTimeout(t);
    }
    if (internalStepIdx === lastIdx && !isFullyDone) {
      const t = setTimeout(() => { setIsFullyDone(true); onFinished?.(); }, 3000);
      return () => clearTimeout(t);
    }
  }, [internalStepIdx, claudeP, isFullyDone, onFinished, backendDone, STEPS_CONFIG.length]);

  function getVisualStatus(stepId: string, idx: number): StepStatus {
    const step = STEPS_CONFIG[idx];
    if (step.id === "analyzing_github"  && !config.hasGithub)   return "skipped";
    if (step.id === "analyzing_linkedin" && !config.hasLinkedin) return "skipped";
    if (isFullyDone) return "done";
    if (idx < internalStepIdx) return "done";
    if (idx === internalStepIdx) return "running";
    return "pending";
  }

  const virtualSplitDone = claudeP === CLAUDE_TASKS_COUNT;
  const splitActive      = internalStepIdx >= 4 && !isFullyDone;

  const liveRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (liveRef.current) liveRef.current.scrollTop = liveRef.current.scrollHeight;
  }, [streamText]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 bg-rc-bg transition-colors duration-700">
      <div className="relative w-full max-w-[1200px] flex justify-center">
        <svg width={SVG_W} height="230" className="overflow-visible">
          <defs>
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feFlood floodColor="#e24b4a" floodOpacity="0.3" result="flood" />
              <feComposite in="flood" in2="blur" operator="in" />
              <feComposite in="SourceGraphic" operator="over" />
            </filter>
          </defs>

          {/* 1. SKELETON LAYER */}
          <g opacity="0.15">
            {STEPS_CONFIG.map((step, i) => {
              const x = GET_X(i);
              if (i < 4) {
                const nextX = GET_X(i + 1);
                return <line key={`skel-line-${i}`} x1={x} y1={CY} x2={nextX} y2={CY} stroke="#cbd5e1" strokeWidth="2.5" />;
              }
              return null;
            })}
            {/* Claude sub-task thread */}
            {[0,1,2,3,4].map(idx => (
              <line key={`skel-sub-c-${idx}`}
                x1={GET_X(4)+idx*SUB_W} y1={CY}
                x2={GET_X(4)+(idx+1)*SUB_W} y2={CY}
                stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
            ))}
            {/* Post-merge to first post-split node (negotiation if hired, else finalizing) */}
            <line x1={MERGE_X} y1={CY} x2={GET_X(5)} y2={CY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
            {/* Hired-only: line between negotiation (idx 5) and finalizing (idx 6) */}
            {STEPS_CONFIG.length === 7 && (
              <line x1={GET_X(5)} y1={CY} x2={GET_X(6)} y2={CY} stroke="#cbd5e1" strokeWidth="2.5" />
            )}
          </g>

          {/* 2. ACTIVE PATHS LAYER */}
          {STEPS_CONFIG.map((step, i) => {
            const status  = getVisualStatus(step.id, i);
            const x1      = GET_X(i);
            if (i < 4) {
              const x2      = GET_X(i + 1);
              const isActive = status === "running";
              const isDone   = status === "done";
              const opacity  = isActive || isDone ? 1 : 0;
              return (
                <motion.line key={`active-line-${i}`}
                  x1={x1} y1={CY} x2={x2} y2={CY}
                  animate={{ stroke: "#e24b4a", opacity }} strokeWidth="2.5" />
              );
            }
            return null;
          })}

          {/* 3. CLAUDE PROGRESSION — segment lights up when its target sub-task is done */}
          {[0,1,2,3,4].map(idx => {
            const xStart      = GET_X(4) + idx * SUB_W;
            const xEnd        = GET_X(4) + (idx + 1) * SUB_W;
            const dualRunning = internalStepIdx >= 4;
            return (
              <motion.path key={`claude-seg-${idx}`}
                animate={{ stroke: "#e24b4a", opacity: dualRunning && taskDone[idx] ? 1 : 0 }}
                d={`M ${xStart},${CY} L ${xEnd},${CY}`}
                fill="none" strokeWidth="2.5" strokeDasharray="4 4" />
            );
          })}

          {/* Post-merge active path — lights up once we've left split */}
          <motion.line
            x1={MERGE_X} y1={CY} x2={GET_X(5)} y2={CY}
            animate={{ stroke: "#e24b4a", opacity: virtualSplitDone && internalStepIdx >= 5 ? 1 : 0 }}
            strokeWidth="2.5" strokeDasharray="5 5" />

          {/* Hired-only: active path between negotiation (idx 5) and finalizing (idx 6) */}
          {STEPS_CONFIG.length === 7 && (
            <motion.line
              x1={GET_X(5)} y1={CY} x2={GET_X(6)} y2={CY}
              animate={{ stroke: "#e24b4a", opacity: internalStepIdx >= 6 ? 1 : 0 }}
              strokeWidth="2.5" />
          )}

          {/* 4. NODES LAYER */}
          {STEPS_CONFIG.map((step, i) => {
            const status   = getVisualStatus(step.id, i);
            const isActive = status === "running";
            const isDone   = status === "done";
            const x        = GET_X(i);

            if (step.lane === "split") {
              const dualRunning = status === "running" || status === "done";
              return (
                <g key="split-heads">
                  {/* Claude head - center spine */}
                  <g transform={`translate(${x}, ${CY})`}>
                    <motion.circle r="18" fill={claudeP === CLAUDE_TASKS_COUNT || isDone ? "#e24b4a" : "white"}
                      stroke={dualRunning ? "#e24b4a" : "#e5e7eb"} strokeWidth="2.5"
                      animate={{ opacity: 1 }} />
                    <Anthropic size={16} x="-8" y="-8"
                      className={claudeP === CLAUDE_TASKS_COUNT || isDone ? "text-white" : dualRunning ? "text-rc-red" : "text-rc-hint"} />
                    <text x="0" y="-26" textAnchor="middle"
                      className={`font-mono text-[10px] font-bold uppercase ${dualRunning ? "fill-rc-red" : "fill-rc-hint"}`}>
                      Claude Sonnet
                    </text>
                    {CLAUDE_TASKS.map((task, idx) => {
                      const sx      = (idx + 1) * SUB_W;
                      const sDone   = taskDone[idx] || isDone;
                      const sActive = dualRunning && firstActiveIdx === idx;
                      return (
                        <g key={`ct-${idx}`} transform={`translate(${sx}, 0)`}>
                          <circle r="6" fill="white" stroke="#e5e7eb" strokeWidth="2" opacity="0.3" />
                          <motion.circle r="6" fill={sDone ? "#e24b4a" : "white"}
                            stroke={sDone || sActive ? "#e24b4a" : "#e5e7eb"} strokeWidth="2"
                            animate={{ opacity: 1 }} />
                          <text x="0" y="-14" textAnchor="middle"
                            className={`font-mono text-[8px] uppercase tracking-tight ${sDone || sActive ? "fill-rc-text font-bold" : "fill-rc-hint opacity-40"}`}>
                            {task}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>
              );
            }

            return (
              <g key={`node-${step.id}`} transform={`translate(${x}, ${CY})`}>
                <circle r="16" fill="white" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.3" />
                <motion.circle r="16" fill={isDone ? "#e24b4a" : "white"}
                  stroke={isDone ? "#e24b4a" : isActive ? "#e24b4a" : "#e5e7eb"} strokeWidth="2.5"
                  animate={{ opacity: 1 }} />
                <step.Icon size={14} x="-7" y="-7"
                  className={isDone ? "text-white" : isActive ? "text-rc-red" : "text-rc-hint"} />
                <text x="0" y="-24" textAnchor="middle"
                  className={`font-mono text-[10px] ${isDone || isActive ? "fill-rc-text font-bold" : "fill-rc-hint"}`}>
                  {t.loadingScreen.steps[step.id as keyof typeof t.loadingScreen.steps]}
                </text>
                {isDone && (
                  <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }}
                    cx="12" cy="-12" r="6" fill="#e24b4a" stroke="white" strokeWidth="1" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {splitActive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 w-full max-w-[1100px] px-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={12} className="text-rc-hint" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-rc-hint">
              {t.loadingScreen.liveThoughtsLabel}
            </span>
            <span className="ml-auto font-mono text-[9px] text-rc-hint italic">
              Claude Sonnet
            </span>
          </div>
          <div
            ref={liveRef}
            className="relative bg-rc-surface/60 border border-rc-border rounded-lg overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-rc-text/80 whitespace-pre-wrap break-words"
            style={{
              height: 220,
              maskImage:
                "linear-gradient(to bottom, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
            }}
          >
            {streamText.length === 0 ? (
              <span className="italic text-rc-hint">
                {t.loadingScreen.liveThoughtsPlaceholder}
              </span>
            ) : (
              <>
                {renderMarkdown(prettifyPartialJSON(streamText))}
                <span className="inline-block w-[6px] h-[12px] bg-rc-red ml-[2px] align-middle animate-pulse" />
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
