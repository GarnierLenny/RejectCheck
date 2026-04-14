import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Cpu, Search, FileText } from "lucide-react";
import { Openai, Anthropic, Github, Linkedin } from "react-bootstrap-icons";

type Props = {
  currentStep: string | null;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasML: boolean;
  onFinished?: () => void;
};

type StepStatus = "pending" | "running" | "done" | "skipped";

const STEPS_CONFIG = [
  { id: "parsing_cv",         label: "CV Parsing",           Icon: FileText,  lane: "center" },
  { id: "matching_skills",    label: "Job Analysis",          Icon: Search,    lane: "center" },
  { id: "analyzing_linkedin", label: "LinkedIn Signal",       Icon: Linkedin,  lane: "center" },
  { id: "analyzing_github",   label: "GitHub Signal",         Icon: Github,    lane: "center" },
  { id: "dual_ai_analysis",   label: "Split-Brain Analytics", Icon: Zap,       lane: "split"  },
  { id: "finalizing",         label: "Final Diagnostic",      Icon: Sparkles,  lane: "center" },
] as const;

const GPT_TASKS    = ["ATS Simulation", "Motivation Letter", "ATS Audit", "Red Flags", "Tone & Seniority"];
const CLAUDE_TASKS = ["Tech Radar", "Tech Fit Analysis", "Project Blueprint"];

const GPT_THOUGHTS = [
  "Scanning ATS keyword density...",
  "Detected formatting inconsistency in header",
  "Evaluating tone vs. seniority signals...",
  "Cross-referencing similar profiles...",
  "Employment gap flagged for contextualization",
  "Bullet point impact score below median",
  "Action verb frequency: insufficient",
  "Quantified achievements: sparse",
  "Checking recruiter readability score...",
  "Red flag pattern detected in job history",
];

const CLAUDE_THOUGHTS = [
  "Mapping depth of technical stack...",
  "Commit cadence suggests strong ownership",
  "Inferring system design from project scope",
  "Breadth vs. specialization: assessing...",
  "Open source signal: collaborative mindset",
  "Framework maturity curve detected",
  "Architecture patterns identified",
  "Cross-referencing job description fit...",
  "Evaluating technology stack coherence",
];

function useTypewriter(thoughts: string[], speed: number, active: boolean) {
  const [displayed,  setDisplayed]  = useState("");
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [charIdx,    setCharIdx]    = useState(0);
  const [pausing,    setPausing]    = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(""); setThoughtIdx(0); setCharIdx(0); setPausing(false); return; }
    if (pausing) {
      const t = setTimeout(() => { setThoughtIdx(i => (i + 1) % thoughts.length); setCharIdx(0); setDisplayed(""); setPausing(false); }, 1200);
      return () => clearTimeout(t);
    }
    const current = thoughts[thoughtIdx];
    if (charIdx >= current.length) { setPausing(true); return; }
    const t = setTimeout(() => { setDisplayed(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }, speed);
    return () => clearTimeout(t);
  }, [active, pausing, thoughtIdx, charIdx, thoughts, speed]);

  return displayed;
}

// ---------- Horizontal pipeline layout ----------
const CY     = 155;  // Center Y (spine of the pipeline)
const LANE_H = 85;   // Vertical distance from center to GPT / Claude tracks
const X0     = 50;   // Starting X
const W      = 120;  // Width per main step
const SUB_W  = 95;   // Width per AI sub-node

const GET_X = (idx: number) => {
  if (idx <= 4) return X0 + idx * W;
  return X0 + 4 * W + 5 * SUB_W + 60; // finalizing — after all sub-nodes
};

const MERGE_X = GET_X(4) + 5 * SUB_W + 30;

export function LoadingScreen({ currentStep, hasGithub, hasLinkedin, hasML, onFinished }: Props) {
  const config = { hasGithub, hasLinkedin, hasML };

  const [internalStepIdx, setInternalStepIdx] = useState(0);
  const [gptP,            setGptP]            = useState(0);
  const [claudeP,         setClaudeP]         = useState(0);
  const [isFullyDone,     setIsFullyDone]     = useState(false);

  const backendIdx = (() => {
    if (!currentStep) return -1;
    if (currentStep === "done") return STEPS_CONFIG.length;
    if (currentStep === "parsing_motivation_letter" || currentStep === "running_ats") return 4;
    return STEPS_CONFIG.findIndex(s => s.id === currentStep);
  })();

  // 1. Step progression timer
  useEffect(() => {
    if (isFullyDone) return;
    const timer = setInterval(() => {
      setInternalStepIdx(prev => {
        const next = prev + 1;
        if (next >= STEPS_CONFIG.length) return prev;
        if (next > backendIdx && backendIdx !== -1) return prev;
        if (prev === 4) return prev; // hold at split — finalization handles exit
        return next;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [backendIdx, isFullyDone]);

  // 2. AI progression
  useEffect(() => {
    if (internalStepIdx === 4) {
      const g = setInterval(() => setGptP(p => p < 5 ? p + 1 : p), 1500 + Math.random() * 500);
      const c = setInterval(() => setClaudeP(p => p < 3 ? p + 1 : p), 2500 + Math.random() * 800);
      return () => { clearInterval(g); clearInterval(c); };
    }
  }, [internalStepIdx]);

  // 3. Finalization
  useEffect(() => {
    const virtualSplitDone = gptP === 5 && claudeP === 3;
    if (internalStepIdx === 4 && virtualSplitDone) {
      const t = setTimeout(() => setInternalStepIdx(5), 1500);
      return () => clearTimeout(t);
    }
    if (internalStepIdx === 5 && !isFullyDone) {
      const t = setTimeout(() => { setIsFullyDone(true); onFinished?.(); }, 3000);
      return () => clearTimeout(t);
    }
  }, [internalStepIdx, gptP, claudeP, isFullyDone, onFinished]);

  function getVisualStatus(stepId: string, idx: number): StepStatus {
    const step = STEPS_CONFIG[idx];
    if (step.id === "analyzing_github"  && !config.hasGithub)   return "skipped";
    if (step.id === "analyzing_linkedin" && !config.hasLinkedin) return "skipped";
    if (isFullyDone) return "done";
    if (idx < internalStepIdx) return "done";
    if (idx === internalStepIdx) return "running";
    return "pending";
  }

  const virtualSplitDone = gptP === 5 && claudeP === 3;
  const splitActive   = internalStepIdx >= 4 && !isFullyDone;
  const gptThought    = useTypewriter(GPT_THOUGHTS,    35, splitActive);
  const claudeThought = useTypewriter(CLAUDE_THOUGHTS, 42, splitActive);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 bg-rc-bg transition-colors duration-700">
      <div className="relative w-full max-w-[1200px] flex justify-center">
        <svg width="1100" height="290" className="overflow-visible">
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
                if (i === 3) {
                  return (
                    <g key="skel-fork">
                      <path d={`M ${x},${CY} C ${x+25},${CY} ${nextX},${CY-LANE_H+20} ${nextX},${CY-LANE_H}`} fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
                      <path d={`M ${x},${CY} C ${x+25},${CY} ${nextX},${CY+LANE_H-20} ${nextX},${CY+LANE_H}`} fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
                    </g>
                  );
                }
                return <line key={`skel-line-${i}`} x1={x} y1={CY} x2={nextX} y2={CY} stroke="#cbd5e1" strokeWidth="2.5" />;
              }
              return null;
            })}
            {/* GPT sub-thread (above) */}
            {[0,1,2,3,4].map(idx => (
              <line key={`skel-sub-g-${idx}`}
                x1={GET_X(4)+idx*SUB_W} y1={CY-LANE_H}
                x2={GET_X(4)+(idx+1)*SUB_W} y2={CY-LANE_H}
                stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
            ))}
            {/* Claude sub-thread (below) */}
            {[0,1,2].map(idx => {
              const subW = (5 * SUB_W) / 3;
              return (
                <line key={`skel-sub-c-${idx}`}
                  x1={GET_X(4)+idx*subW} y1={CY+LANE_H}
                  x2={GET_X(4)+(idx+1)*subW} y2={CY+LANE_H}
                  stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
              );
            })}
            {/* Merge paths */}
            <path d={`M ${GET_X(4)+5*SUB_W},${CY-LANE_H} C ${GET_X(4)+5*SUB_W+20},${CY-LANE_H} ${MERGE_X},${CY-20} ${MERGE_X},${CY}`} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
            <path d={`M ${GET_X(4)+5*SUB_W},${CY+LANE_H} C ${GET_X(4)+5*SUB_W+20},${CY+LANE_H} ${MERGE_X},${CY+20} ${MERGE_X},${CY}`} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
            <line x1={MERGE_X} y1={CY} x2={GET_X(5)} y2={CY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
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
              if (i === 3) {
                return (
                  <g key="active-fork">
                    <motion.path animate={{ stroke: "#e24b4a", opacity }}
                      d={`M ${x1},${CY} C ${x1+25},${CY} ${x2},${CY-LANE_H+20} ${x2},${CY-LANE_H}`}
                      fill="none" strokeWidth="2.5" />
                    <motion.path animate={{ stroke: "#e24b4a", opacity }}
                      d={`M ${x1},${CY} C ${x1+25},${CY} ${x2},${CY+LANE_H-20} ${x2},${CY+LANE_H}`}
                      fill="none" strokeWidth="2.5" />
                  </g>
                );
              }
              return (
                <motion.line key={`active-line-${i}`}
                  x1={x1} y1={CY} x2={x2} y2={CY}
                  animate={{ stroke: "#e24b4a", opacity }} strokeWidth="2.5" />
              );
            }
            return null;
          })}

          {/* 3. SIMULATED SPLIT PROGRESSION */}
          {[0,1,2,3,4].map(idx => {
            const xStart      = GET_X(4) + idx * SUB_W;
            const xEnd        = GET_X(4) + (idx + 1) * SUB_W;
            const dualRunning = internalStepIdx >= 4;
            return (
              <motion.path key={`gpt-seg-${idx}`}
                animate={{ stroke: "#e24b4a", opacity: dualRunning && gptP >= idx ? 1 : 0 }}
                d={`M ${xStart},${CY-LANE_H} L ${xEnd},${CY-LANE_H}`}
                fill="none" strokeWidth="2.5" strokeDasharray="4 4" />
            );
          })}
          {[0,1,2].map(idx => {
            const subW        = (5 * SUB_W) / 3;
            const xStart      = GET_X(4) + idx * subW;
            const xEnd        = GET_X(4) + (idx + 1) * subW;
            const dualRunning = internalStepIdx >= 4;
            return (
              <motion.path key={`claude-seg-${idx}`}
                animate={{ stroke: "#e24b4a", opacity: dualRunning && claudeP >= idx ? 1 : 0 }}
                d={`M ${xStart},${CY+LANE_H} L ${xEnd},${CY+LANE_H}`}
                fill="none" strokeWidth="2.5" strokeDasharray="4 4" />
            );
          })}

          {/* Merge active paths */}
          <motion.path
            animate={{ stroke: "#e24b4a", opacity: virtualSplitDone ? 1 : 0 }}
            d={`M ${GET_X(4)+5*SUB_W},${CY-LANE_H} C ${GET_X(4)+5*SUB_W+20},${CY-LANE_H} ${MERGE_X},${CY-20} ${MERGE_X},${CY}`}
            fill="none" strokeWidth="2.5" strokeDasharray="5 5" />
          <motion.path
            animate={{ stroke: "#e24b4a", opacity: virtualSplitDone ? 1 : 0 }}
            d={`M ${GET_X(4)+5*SUB_W},${CY+LANE_H} C ${GET_X(4)+5*SUB_W+20},${CY+LANE_H} ${MERGE_X},${CY+20} ${MERGE_X},${CY}`}
            fill="none" strokeWidth="2.5" strokeDasharray="5 5" />
          <motion.line
            x1={MERGE_X} y1={CY} x2={GET_X(5)} y2={CY}
            animate={{ stroke: "#e24b4a", opacity: virtualSplitDone && internalStepIdx === 5 ? 1 : 0 }}
            strokeWidth="2.5" strokeDasharray="5 5" />

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
                  {/* GPT head — above the spine */}
                  <g transform={`translate(${x}, ${CY - LANE_H})`}>
                    <motion.circle r="18" fill={gptP === 5 || isDone ? "#e24b4a" : "white"}
                      stroke={dualRunning ? "#e24b4a" : "#e5e7eb"} strokeWidth="2.5"
                      animate={{ opacity: 1 }} />
                    <Openai size={16} x="-8" y="-8"
                      className={gptP === 5 || isDone ? "text-white" : dualRunning ? "text-rc-red" : "text-rc-hint"} />
                    <text x="0" y="-26" textAnchor="middle"
                      className={`font-mono text-[10px] font-bold uppercase ${dualRunning ? "fill-rc-red" : "fill-rc-hint"}`}>
                      GPT-4o
                    </text>
                    {GPT_TASKS.map((task, idx) => {
                      const sx     = (idx + 1) * SUB_W;
                      const sDone  = gptP > idx || isDone;
                      const sActive = dualRunning && gptP === idx;
                      return (
                        <g key={`gt-${idx}`} transform={`translate(${sx}, 0)`}>
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
                  {/* Claude head — below the spine */}
                  <g transform={`translate(${x}, ${CY + LANE_H})`}>
                    <motion.circle r="18" fill={claudeP === 3 || isDone ? "#e24b4a" : "white"}
                      stroke={dualRunning ? "#e24b4a" : "#e5e7eb"} strokeWidth="2.5"
                      animate={{ opacity: 1 }} />
                    <Anthropic size={16} x="-8" y="-8"
                      className={claudeP === 3 || isDone ? "text-white" : dualRunning ? "text-rc-red" : "text-rc-hint"} />
                    <text x="0" y="30" textAnchor="middle"
                      className={`font-mono text-[10px] font-bold uppercase ${dualRunning ? "fill-rc-red" : "fill-rc-hint"}`}>
                      Claude 3.5
                    </text>
                    {CLAUDE_TASKS.map((task, idx) => {
                      const SUB_W_CLAUDE = (5 * SUB_W) / 3;
                      const sx     = (idx + 1) * SUB_W_CLAUDE;
                      const sDone  = claudeP > idx || isDone;
                      const sActive = dualRunning && claudeP === idx;
                      return (
                        <g key={`ct-${idx}`} transform={`translate(${sx}, 0)`}>
                          <circle r="6" fill="white" stroke="#e5e7eb" strokeWidth="2" opacity="0.3" />
                          <motion.circle r="6" fill={sDone ? "#e24b4a" : "white"}
                            stroke={sDone || sActive ? "#e24b4a" : "#e5e7eb"} strokeWidth="2"
                            animate={{ opacity: 1 }} />
                          <text x="0" y="20" textAnchor="middle"
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
                  {step.label}
                </text>
                {isDone && (
                  <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }}
                    cx="12" cy="-12" r="6" fill="#e24b4a" stroke="white" strokeWidth="1" />
                )}
              </g>
            );
          })}
          {/* 5. THOUGHTS */}
          {splitActive && (
            <>
              <text
                x={GET_X(4) + (5 * SUB_W) / 2} y={CY - LANE_H - 42}
                textAnchor="middle" className="font-mono text-[9px] fill-rc-hint italic"
              >
                {gptThought}▋
              </text>
              <text
                x={GET_X(4) + (5 * SUB_W) / 2} y={CY + LANE_H + 50}
                textAnchor="middle" className="font-mono text-[9px] fill-rc-hint italic"
              >
                {claudeThought}▋
              </text>
            </>
          )}
        </svg>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 bg-rc-surface/50 px-6 py-2.5 rounded-xl border border-rc-border">
          <Cpu size={14} className="text-rc-hint" />
          <p className="font-mono text-[9px] text-rc-hint tracking-wide italic text-center px-4">
            Parallel AI Engines Synchronized : Specialized Technical Audit in Progress
          </p>
        </div>
      </motion.div>
    </div>
  );
}
