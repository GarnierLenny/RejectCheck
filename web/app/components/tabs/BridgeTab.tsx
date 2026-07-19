"use client";

import { useState, useEffect, useRef, useId, useCallback } from "react";
import {
  Download, Loader2, Copy, Check,
  Target, Layers, Zap, Globe, Shield, Database,
  MessageSquare, FileText, AlertCircle, ChevronDown, ChevronUp,
  BookOpen, TestTube2, HelpCircle, TrendingUp, Star,
  CheckCircle2, Circle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult, ProjectSection, ProjectSectionStep, GapBridge } from "../types";
import { techName } from "../types";
import { ProjectRecommendationSkeleton } from "../skeletons/ProjectRecommendationSkeleton";
import { useGenerateStarterRepo, useSaveStepProgress } from "../../../lib/mutations";

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const DISPLAY_ITALIC: React.CSSProperties = {
  fontWeight: 700, color: "var(--rc-red)",
};

// ── Stack logos via simple-icons (inline SVG, no CDN) ────────────────────────

import {
  siReact, siTypescript, siJavascript, siPython, siGo, siRust,
  siNextdotjs, siNodedotjs, siExpress, siVuedotjs, siNuxt,
  siSvelte, siAngular, siAstro, siRemix, siSolid,
  siNestjs, siHono, siFastapi, siDjango, siFlask,
  siPostgresql, siMongodb, siMysql, siRedis, siSqlite,
  siPrisma, siDrizzle, siGraphql,
  siDocker, siKubernetes,
  siGooglecloud, siCloudflare, siVercel, siRailway, siSupabase, siFirebase, siNeon,
  siGithub, siGitlab, siGit,
  siTailwindcss, siVite, siVitest, siJest, siStorybook, siWebpack,
  siApachekafka, siRabbitmq, siElasticsearch,
  siStripe, siFigma, siLinear,
  siAnthropic, siLangchain, siHuggingface, siQdrant, siOpenapiinitiative,
  siTrpc, siTurborepo, siBun, siDeno,
  siPydantic, siCelery, siNginx, siLinux, siGrafana,
} from "simple-icons";

type SimpleIcon = { slug: string; hex: string; path: string; title: string };

// AWS and OpenAI aren't in simple-icons — hardcoded brandmark paths
const siAwsCustom: SimpleIcon = {
  slug: "aws", hex: "232F3E", title: "AWS",
  path: "M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.030-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.240-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.140c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .41-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.743.167-1.15.167zM21.698 16.207c-2.626 1.940-6.442 2.970-9.722 2.970-4.598 0-8.74-1.700-11.87-4.526-.247-.223-.025-.527.27-.351 3.384 1.963 7.559 3.147 11.877 3.147 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.385.612zm1.101-1.262c-.335-.432-2.22-.207-3.074-.103-.255.031-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.319-.79 1.03-2.57.695-2.994z",
};

const siOpenaiCustom: SimpleIcon = {
  slug: "openai", hex: "412991", title: "OpenAI",
  path: "M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z",
};

const TECH_MAP: Record<string, SimpleIcon> = {
  // Languages
  "typescript": siTypescript, "ts": siTypescript,
  "javascript": siJavascript, "js": siJavascript,
  "python": siPython,
  "go": siGo, "golang": siGo,
  "rust": siRust,
  // Frontend frameworks
  "react": siReact, "reactjs": siReact, "react.js": siReact,
  "next.js": siNextdotjs, "nextjs": siNextdotjs, "next": siNextdotjs,
  "vue.js": siVuedotjs, "vuejs": siVuedotjs, "vue": siVuedotjs,
  "nuxt.js": siNuxt, "nuxtjs": siNuxt, "nuxt": siNuxt,
  "svelte": siSvelte, "sveltekit": siSvelte,
  "angular": siAngular,
  "astro": siAstro,
  "remix": siRemix,
  "solid": siSolid, "solidjs": siSolid, "solid.js": siSolid,
  // Backend frameworks
  "node.js": siNodedotjs, "nodejs": siNodedotjs, "node": siNodedotjs,
  "express.js": siExpress, "expressjs": siExpress, "express": siExpress,
  "nestjs": siNestjs, "nest.js": siNestjs, "nest": siNestjs,
  "hono": siHono,
  "fastapi": siFastapi,
  "django": siDjango,
  "flask": siFlask,
  // Databases
  "postgresql": siPostgresql, "postgres": siPostgresql,
  "mongodb": siMongodb, "mongo": siMongodb,
  "mysql": siMysql,
  "redis": siRedis,
  "sqlite": siSqlite,
  // ORMs / query
  "prisma": siPrisma,
  "drizzle": siDrizzle, "drizzle orm": siDrizzle,
  "graphql": siGraphql,
  // DevOps / infra
  "docker": siDocker,
  "kubernetes": siKubernetes, "k8s": siKubernetes,
  "nginx": siNginx,
  "linux": siLinux,
  "grafana": siGrafana,
  // Cloud / hosting
  "gcp": siGooglecloud, "google cloud": siGooglecloud,
  "cloudflare": siCloudflare,
  "vercel": siVercel,
  "railway": siRailway,
  "supabase": siSupabase,
  "firebase": siFirebase,
  "neon": siNeon,
  // Messaging / search
  "kafka": siApachekafka, "apache kafka": siApachekafka,
  "rabbitmq": siRabbitmq,
  "elasticsearch": siElasticsearch,
  // Tooling
  "tailwind": siTailwindcss, "tailwindcss": siTailwindcss, "tailwind css": siTailwindcss,
  "vite": siVite,
  "vitest": siVitest,
  "jest": siJest,
  "storybook": siStorybook,
  "webpack": siWebpack,
  "turborepo": siTurborepo,
  "trpc": siTrpc, "trpc.io": siTrpc,
  "bun": siBun,
  "deno": siDeno,
  // Git / CI
  "github": siGithub,
  "gitlab": siGitlab,
  "git": siGit,
  // Services
  "stripe": siStripe,
  "figma": siFigma,
  "linear": siLinear,
  // AI / ML
  "aws": siAwsCustom, "amazon": siAwsCustom, "amazon web services": siAwsCustom,
  "openai": siOpenaiCustom,
  "anthropic": siAnthropic,
  "langchain": siLangchain, "lang chain": siLangchain, "langchain.js": siLangchain, "langchainjs": siLangchain,
  "hugging face": siHuggingface, "huggingface": siHuggingface,
  "qdrant": siQdrant,
  "openapi": siOpenapiinitiative, "open api": siOpenapiinitiative, "openapi initiative": siOpenapiinitiative,
  "pydantic": siPydantic,
  "celery": siCelery,
};

const STRIP_SUFFIXES = /\s+(api|sdk|orm|ui|js|ts|db|cli|cloud|platform|framework|s3|lambda|ec2|rds|sqs|sns)$/i;

function techIcon(name: string): SimpleIcon | null {
  const base = name.toLowerCase().trim();
  if (TECH_MAP[base]) return TECH_MAP[base];
  // Prefix match for "AWS *" and "Amazon *"
  if (base.startsWith("aws ") || base.startsWith("amazon ")) return siAwsCustom;
  // Strip common suffixes and retry (e.g. "OpenAI API" → "openai", "Tailwind CSS" → "tailwind")
  const stripped = base.replace(STRIP_SUFFIXES, "").trim();
  return stripped !== base ? (TECH_MAP[stripped] ?? null) : null;
}

function StackLogo({ name }: { name: string }) {
  const icon = techIcon(name);

  if (!icon) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 4,
        background: "var(--rc-surface)", border: "1px solid var(--rc-border)",
        ...MONO, fontSize: 11, color: "var(--rc-text)",
      }}>
        {name}
      </span>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 11px", borderRadius: 5,
      background: "var(--rc-surface)", border: "1px solid var(--rc-border)",
    }}>
      <svg
        viewBox="0 0 24 24"
        width={14}
        height={14}
        fill={`#${icon.hex}`}
        style={{ display: "block", flexShrink: 0 }}
        aria-label={icon.title}
      >
        <path d={icon.path} />
      </svg>
      <span style={{ ...MONO, fontSize: 11, color: "var(--rc-text)" }}>{name}</span>
    </span>
  );
}

// ── Difficulty indicator ──────────────────────────────────────────────────────

type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

const DIFFICULTY_LEVELS: {
  level: DifficultyLevel;
  color: string;
  bg: string;
  activeBg: string;
  days: string;
  desc: string;
}[] = [
  { level: "Beginner",     color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  activeBg: "rgba(59,130,246,0.18)",  days: "~1-2 days", desc: "Great first project to start shipping" },
  { level: "Intermediate", color: "#6366f1", bg: "rgba(99,102,241,0.08)",  activeBg: "rgba(99,102,241,0.18)",  days: "~3 days",   desc: "Solid weekend project, one new concept" },
  { level: "Advanced",     color: "var(--rc-amber)", bg: "rgba(217,119,6,0.08)", activeBg: "rgba(217,119,6,0.18)", days: "~5 days", desc: "Multi-layer architecture, real tradeoffs" },
  { level: "Expert",       color: "var(--rc-red)",   bg: "var(--rc-red-bg)",     activeBg: "rgba(201,58,57,0.18)", days: "~8 days", desc: "Distributed system or production-grade complexity" },
];

function DifficultyBar({ level }: { level: DifficultyLevel }) {
  const [hovered, setHovered] = useState<DifficultyLevel | null>(null);
  const activeLevel = hovered ?? level;
  const activeCfg = DIFFICULTY_LEVELS.find((d) => d.level === activeLevel)!;
  const currentIdx = DIFFICULTY_LEVELS.findIndex((d) => d.level === level);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      {/* Segments */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {DIFFICULTY_LEVELS.map((d, i) => {
          const isActive = d.level === level;
          const isHovered = d.level === hovered;
          const isPast = i < currentIdx;
          return (
            <div
              key={d.level}
              onMouseEnter={() => setHovered(d.level)}
              onMouseLeave={() => setHovered(null)}
              style={{
                height: isHovered ? 10 : isActive ? 8 : 5,
                width: isActive ? 40 : 28,
                borderRadius: 99,
                background: isHovered ? d.activeBg : (isActive || isPast) ? d.bg : "var(--rc-border)",
                border: isActive ? `1.5px solid ${d.color}` : isHovered ? `1px solid ${d.color}` : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: activeCfg.color, transition: "color 0.15s" }}>
          {activeLevel}
        </span>
        <span style={{ width: 1, height: 9, background: activeCfg.color, opacity: 0.3 }} />
        <span style={{ ...MONO, fontSize: 9, color: activeCfg.color, opacity: 0.7, transition: "color 0.15s" }}>
          {activeCfg.days}
        </span>
      </div>
      {/* Description on hover */}
      {hovered && hovered !== level && (
        <p style={{ ...SANS, fontSize: 11, color: "var(--rc-hint)", margin: 0, textAlign: "right", maxWidth: 200, lineHeight: 1.4 }}>
          {activeCfg.desc}
        </p>
      )}
    </div>
  );
}

// ── Feature icon auto-assign ──────────────────────────────────────────────────

function featureIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("auth") || t.includes("security") || t.includes("permiss")) return Shield;
  if (t.includes("api") || t.includes("endpoint") || t.includes("rest") || t.includes("http")) return Globe;
  if (t.includes("database") || t.includes("storage") || t.includes("persist") || t.includes("sql") || t.includes("db")) return Database;
  if (t.includes("real-time") || t.includes("stream") || t.includes("websocket") || t.includes("queue")) return Zap;
  return Target;
}

// ── Mermaid diagram ───────────────────────────────────────────────────────────

function MermaidDiagram({ diagram, fallback }: { diagram: string; fallback: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const reactId = useId();
  // useId may contain colons which are invalid in HTML ids — sanitise
  const id = useRef(reactId.replace(/:/g, "m"));

  useEffect(() => {
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#fde8e8",
          primaryBorderColor: "#c93a39",
          primaryTextColor: "#1a1a1a",
          lineColor: "#c93a39",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
        },
        // 'strict' (not 'loose'): the diagram source is LLM-generated from the
        // user's CV/JD, so it must not be trusted to emit HTML/click handlers.
        securityLevel: "strict",
      });
      mermaid.render(id.current, diagram)
        .then(({ svg: rendered }) => setSvg(rendered))
        .catch(() => setError(true));
    });
  }, [diagram]);

  if (error) return (
    <p style={{ ...MONO, fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0 }}>{fallback}</p>
  );
  if (!svg) return (
    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={14} className="animate-spin" style={{ color: "var(--rc-hint)" }} />
    </div>
  );
  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ display: "flex", justifyContent: "center", overflow: "auto" }}
    />
  );
}

// ── Gap bridge section ────────────────────────────────────────────────────────

function GapBridgeSection({
  bridges,
  result,
  completed,
  sections,
}: {
  bridges: GapBridge[];
  result: AnalysisResult;
  completed: number[];
  sections?: ProjectSection[];
}) {
  const skills = result.technical_analysis?.skills ?? [];

  const sectionCompleted = (phaseTitle: string): boolean => {
    if (!sections) return false;
    let globalIdx = 0;
    for (const sec of sections) {
      const stepCount = sec.steps.length;
      if (sec.title === phaseTitle) {
        return Array.from({ length: stepCount }, (_, i) => globalIdx + i).every((i) => completed.includes(i));
      }
      globalIdx += stepCount;
    }
    return false;
  };

  if (!bridges.length) return null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "var(--rc-hint)" }}>Gap bridge</span>
        <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)" }}>
          {bridges.filter((b) => sectionCompleted(b.phase_title)).length}/{bridges.length} closed
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "36px 64px" }}>
        {bridges.map((bridge) => {
          const skill = skills.find((s) => s.name === bridge.skill_name);
          const phaseDone = sectionCompleted(bridge.phase_title);
          const gain = skill ? Math.max(0, skill.expected - skill.current) : 0;
          const currentPct = skill ? Math.min((skill.current / 10) * 100, 100) : 0;
          const gainPct = skill ? Math.min((gain / 10) * 100, 100 - currentPct) : 0;

          return (
            <div key={bridge.skill_name} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* Score gain box — mirrors core stack icon box */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: phaseDone ? "rgba(22,163,74,0.1)" : "var(--rc-surface)",
                border: phaseDone ? "1px solid rgba(22,163,74,0.3)" : "1px solid var(--rc-border)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
              }}>
                <span style={{ ...MONO, fontSize: 13, fontWeight: 800, color: phaseDone ? "var(--rc-green)" : "var(--rc-red)", lineHeight: 1 }}>
                  +{gain.toFixed(0)}
                </span>
                <span style={{ ...MONO, fontSize: 8, color: phaseDone ? "var(--rc-green)" : "var(--rc-hint)", opacity: 0.7 }}>pts</span>
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                {/* Name + done indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: phaseDone ? "var(--rc-green)" : "var(--rc-text)" }}>
                    {bridge.skill_name}
                  </span>
                  {phaseDone && <CheckCircle2 size={13} style={{ color: "var(--rc-green)", flexShrink: 0 }} />}
                </div>

                {/* Before → after bar */}
                {skill && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 14, borderRadius: 99, background: "var(--rc-border)", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${currentPct}%`, background: "var(--rc-red)", opacity: 0.7, transition: "width 0.4s" }} />
                      <div style={{
                        width: `${gainPct}%`,
                        background: phaseDone
                          ? "var(--rc-green)"
                          : "repeating-linear-gradient(-45deg, #3b82f6, #3b82f6 4px, rgba(59,130,246,0.45) 4px, rgba(59,130,246,0.45) 8px)",
                        opacity: phaseDone ? 1 : 0.85,
                        borderRadius: "0 8px 8px 0",
                        transition: "width 0.4s",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ ...MONO, fontSize: 8, color: "var(--rc-hint)" }}>now {skill.current}/10</span>
                      <span style={{ ...MONO, fontSize: 8, color: phaseDone ? "var(--rc-green)" : "var(--rc-hint)" }}>target {skill.expected}/10</span>
                    </div>
                  </div>
                )}

                {/* Phase chip */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ ...MONO, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)" }}>via</span>
                  <span style={{
                    ...MONO, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                    background: phaseDone ? "rgba(22,163,74,0.1)" : "rgba(201,58,57,0.08)",
                    color: phaseDone ? "var(--rc-green)" : "var(--rc-red)",
                    border: phaseDone ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(201,58,57,0.15)",
                  }}>{bridge.phase_title}</span>
                </div>

                {/* Claim */}
                <p style={{ ...SANS, fontSize: 12, lineHeight: 1.55, color: "var(--rc-muted)", margin: 0, fontStyle: "italic" }}>
                  &ldquo;{bridge.claim}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        ...MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "var(--rc-hint)", background: "none", border: "none", cursor: "pointer", padding: 0,
      }}
    >
      {copied ? <Check size={11} style={{ color: "var(--rc-green)" }} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Step progress hook ────────────────────────────────────────────────────────

const LS_KEY = (id: number | null) => id ? `rc_bridge_steps_${id}` : null;

function useStepProgress(analysisId: number | null, initialSteps: number[] = []) {
  const [completed, setCompleted] = useState<number[]>(() => {
    if (typeof window === "undefined") return initialSteps;
    const key = LS_KEY(analysisId);
    if (key) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) ?? "null");
        if (Array.isArray(stored)) return stored;
      } catch { /* ignore */ }
    }
    return initialSteps;
  });

  const { mutate: saveProgress } = useSaveStepProgress();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = useCallback((idx: number) => {
    setCompleted((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      const key = LS_KEY(analysisId);
      if (key) {
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      }
      if (analysisId) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveProgress({ analysisId, completedSteps: next });
        }, 600);
      }
      return next;
    });
  }, [analysisId, saveProgress]);

  // Sync initial steps from server once they arrive (e.g. polling hydrates them)
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !initialSteps.length) return;
    seededRef.current = true;
    setCompleted(initialSteps);
  }, [initialSteps]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { completed, toggle };
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  completedSteps?: number[];
};

const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Frontend", backend: "Backend", database: "Database",
  infra: "Infrastructure", "ai/ml": "AI / ML", tooling: "Tooling", cloud: "Cloud",
};
const CATEGORY_ORDER = ["frontend", "backend", "database", "ai/ml", "cloud", "infra", "tooling"];

export function BridgeTab({ result, analysisId, completedSteps: initialCompletedSteps }: Props) {
  const project = result.project_recommendation;
  const { mutate: generateRepo, isPending: isGenerating } = useGenerateStarterRepo();
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const { completed, toggle } = useStepProgress(analysisId, initialCompletedSteps);

  if (!project) return <ProjectRecommendationSkeleton />;

  function handleDownloadRepo() {
    if (!analysisId || !project) return;
    generateRepo(analysisId, {
      onSuccess: (blob) => {
        const slug = project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "starter-repo";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${slug}.zip`; a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  // Group tech by category (new format only)
  const hasCategories = project.technologies.some((t) => typeof t === "object");
  const grouped = hasCategories
    ? CATEGORY_ORDER.reduce<Record<string, typeof project.technologies>>((acc, cat) => {
        const items = project.technologies.filter((t) => typeof t === "object" && (t as { category: string }).category === cat);
        if (items.length) acc[cat] = items;
        return acc;
      }, {})
    : null;
  const ungroupedOther = hasCategories
    ? project.technologies.filter((t) => typeof t === "object" && !CATEGORY_ORDER.includes((t as { category: string }).category.toLowerCase()))
    : [];

  // Shared section divider style
  const SEC: React.CSSProperties = { borderTop: "1px solid var(--rc-border)", paddingTop: 40, marginTop: 8 };
  const SEC_LABEL: React.CSSProperties = { ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 20 };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Hero: title + project name + description ── */}
      <div style={{ paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
          <div>
            <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-0.025em", margin: "0 0 6px", lineHeight: 1.1 }}>
              Bridge the gap,{" "}<span style={DISPLAY_ITALIC}>ship the proof.</span>
            </h2>
            <p style={{ ...MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--rc-hint)", margin: 0 }}>
              A project engineered to close your specific skill gaps
            </p>
          </div>
          <DifficultyBar level={project.difficulty_level} />
        </div>

        <h3 style={{ ...SANS, fontWeight: 600, fontSize: "clamp(18px,2vw,26px)", letterSpacing: "-0.02em", color: "var(--rc-text)", margin: "0 0 12px", lineHeight: 1.2 }}>{project.name}</h3>
        <p style={{ ...SANS, fontSize: 15, lineHeight: 1.7, color: "var(--rc-muted)", margin: "0 0 24px", maxWidth: 680 }}>{project.description}</p>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingLeft: 16 }}>
          <p style={{ ...SANS, fontSize: 13, lineHeight: 1.65, color: "var(--rc-muted)", margin: 0, fontStyle: "italic" }}>{project.why_it_matters}</p>
        </div>

        {/* ── Starter repo .zip ── */}
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 20px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6 }}>
          <div>
            <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 4 }}>Starter repo</div>
            <p style={{ ...SANS, fontSize: 13, color: "var(--rc-muted)", margin: 0 }}>README + boilerplate + Cursor prompt. Unzip and go.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button
              onClick={handleDownloadRepo}
              disabled={isGenerating || !analysisId}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
                ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "10px 20px", background: "var(--rc-red)", color: "#fff",
                border: "none", borderRadius: 5, cursor: isGenerating || !analysisId ? "not-allowed" : "pointer",
                opacity: isGenerating || !analysisId ? 0.6 : 1, boxShadow: "0 4px 14px rgba(201,58,57,0.2)",
              }}
            >
              {isGenerating ? <><Loader2 size={12} className="animate-spin" />Generating…</> : <><Download size={12} />Download .zip</>}
            </button>
            {!analysisId && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={11} style={{ color: "var(--rc-amber)", flexShrink: 0 }} />
                <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)" }}>Sign in to generate the starter repo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Core stack ── */}
      <div style={SEC}>
        <div style={SEC_LABEL}>Core stack</div>
        {grouped ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "36px 64px" }}>
            {[...Object.entries(grouped), ...(ungroupedOther.length ? [["other", ungroupedOther] as [string, typeof project.technologies]] : [])].map(([cat, items]) => (
              <div key={cat}>
                <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", opacity: 0.45, marginBottom: 16 }}>{CATEGORY_LABELS[cat as string] ?? cat}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {items.map((item) => {
                    const name = techName(item);
                    const reason = typeof item === "object" ? (item as { reason: string }).reason : null;
                    const icon = techIcon(name);
                    return (
                      <div key={name} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {icon
                            ? <svg viewBox="0 0 24 24" width={20} height={20} fill={`#${icon.hex}`} aria-label={icon.title}><path d={icon.path} /></svg>
                            : <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: "var(--rc-hint)" }}>{name.slice(0, 2).toUpperCase()}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                          <div style={{ ...MONO, fontSize: 13, fontWeight: 700, color: "var(--rc-text)", marginBottom: 4 }}>{name}</div>
                          {reason && <div style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.5 }}>{reason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {project.technologies.map((item) => <StackLogo key={techName(item)} name={techName(item)} />)}
          </div>
        )}
      </div>

      {/* ── Gap bridges ── */}
      {project.gap_bridges && project.gap_bridges.length > 0 && (
        <div style={SEC}>
          <GapBridgeSection
            bridges={project.gap_bridges}
            result={result}
            completed={completed}
            sections={project.sections}
          />
        </div>
      )}

      {/* ── Architecture diagram ── */}
      {project.architecture_diagram && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <Layers size={11} style={{ color: "var(--rc-hint)" }} />
            <span style={SEC_LABEL}>Architecture</span>
          </div>
          <div style={{ background: "#fff", borderRadius: 6, padding: "20px 16px", border: "1px solid var(--rc-border)" }}>
            <MermaidDiagram diagram={project.architecture_diagram} fallback={project.architecture} />
          </div>
          <p style={{ ...MONO, fontSize: 11, lineHeight: 1.65, color: "var(--rc-hint)", margin: "12px 0 0", fontStyle: "italic" }}>{project.architecture}</p>
        </div>
      )}

      {/* ── Key features ── */}
      {project.key_features.length > 0 && (
        <div style={SEC}>
          <div style={SEC_LABEL}>What to build</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.key_features.map((feat, i) => {
              const Icon = featureIcon(feat);
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <Icon size={12} style={{ color: "var(--rc-hint)" }} />
                  </div>
                  <span style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", lineHeight: 1.6 }}>{feat}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Implementation guide (sections) ── */}
      {(() => {
        if (project.sections && project.sections.length > 0) {
          let globalIdx = 0;
          type SectionWithIdx = ProjectSection & { steps: (ProjectSectionStep & { globalIdx: number })[] };
          const sectionsWithIndices: SectionWithIdx[] = project.sections.map((sec: ProjectSection) => ({
            ...sec,
            steps: sec.steps.map((step: ProjectSectionStep) => ({ ...step, globalIdx: globalIdx++ })),
          }));
          const totalSteps = globalIdx;

          return (
            <div style={SEC}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <BookOpen size={11} style={{ color: "var(--rc-hint)" }} />
                  <span style={{ ...SEC_LABEL, marginBottom: 0 }}>Implementation guide</span>
                </div>
                <span style={{ ...MONO, fontSize: 10, color: completed.length === totalSteps && totalSteps > 0 ? "var(--rc-green)" : "var(--rc-hint)" }}>
                  {completed.length}/{totalSteps} done
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sectionsWithIndices.map((sec: SectionWithIdx, si: number) => {
                  const sectionDone = sec.steps.filter((s: ProjectSectionStep & { globalIdx: number }) => completed.includes(s.globalIdx)).length;
                  const allDone = sectionDone === sec.steps.length;
                  return (
                    <div key={si} style={{ border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 16px", background: "var(--rc-surface)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ ...MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", opacity: 0.45 }}>Phase {si + 1}</span>
                          <span style={{ width: 1, height: 9, background: "var(--rc-border)" }} />
                          <span style={{ ...SANS, fontSize: 13, fontWeight: 600, color: allDone ? "var(--rc-green)" : "var(--rc-text)", textDecoration: allDone ? "line-through" : "none", opacity: allDone ? 0.6 : 1 }}>{sec.title}</span>
                          <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", opacity: 0.5 }}>{sec.duration}</span>
                        </div>
                        <span style={{ ...MONO, fontSize: 9, color: allDone ? "var(--rc-green)" : "var(--rc-hint)" }}>{sectionDone}/{sec.steps.length}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {sec.steps.map((step: ProjectSectionStep & { globalIdx: number }, ki: number) => {
                          const isDone = completed.includes(step.globalIdx);
                          return (
                            <div
                              key={ki}
                              style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--rc-border)", cursor: "pointer", background: isDone ? "rgba(22,163,74,0.03)" : "transparent", transition: "background 0.1s" }}
                              onClick={() => toggle(step.globalIdx)}
                            >
                              <div style={{ flexShrink: 0, paddingTop: 1 }}>
                                {isDone ? <CheckCircle2 size={16} style={{ color: "var(--rc-green)" }} /> : <Circle size={16} style={{ color: "var(--rc-border)" }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ ...SANS, fontSize: 13, fontWeight: 500, color: isDone ? "var(--rc-hint)" : "var(--rc-text)", textDecoration: isDone ? "line-through" : "none", lineHeight: 1.4 }}>
                                  {step.title}
                                </div>
                                <p style={{
                                  ...SANS, fontSize: 12, lineHeight: 1.6, color: "var(--rc-muted)",
                                  margin: 0, overflow: "hidden",
                                  maxHeight: isDone ? 0 : 120,
                                  opacity: isDone ? 0 : 1,
                                  marginTop: isDone ? 0 : 4,
                                  transition: "max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease",
                                }}>{step.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        if (project.steps && project.steps.length > 0) {
          return (
            <div style={SEC}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
                <BookOpen size={11} style={{ color: "var(--rc-hint)" }} />
                <span style={{ ...SEC_LABEL, marginBottom: 0 }}>Implementation guide</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {project.steps.map((step, i) => {
                  const isDone = completed.includes(i);
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < project.steps!.length - 1 ? 16 : 0, cursor: "pointer" }} onClick={() => toggle(i)}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        {isDone ? <CheckCircle2 size={20} style={{ color: "var(--rc-green)" }} /> : <Circle size={20} style={{ color: "var(--rc-border)" }} />}
                        {i < project.steps!.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--rc-border)", marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingBottom: i < project.steps!.length - 1 ? 4 : 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                          <span style={{ ...SANS, fontSize: 13, fontWeight: 600, color: isDone ? "var(--rc-hint)" : "var(--rc-text)", textDecoration: isDone ? "line-through" : "none" }}>{step.title}</span>
                          <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", opacity: 0.6 }}>{step.duration}</span>
                        </div>
                        <p style={{
                          ...SANS, fontSize: 12, lineHeight: 1.6, color: "var(--rc-muted)",
                          margin: 0, overflow: "hidden",
                          maxHeight: isDone ? 0 : 120,
                          opacity: isDone ? 0 : 1,
                          marginTop: isDone ? 0 : 4,
                          transition: "max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease",
                        }}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* ── Edge cases ── */}
      {project.edge_cases && project.edge_cases.length > 0 && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <AlertCircle size={11} style={{ color: "var(--rc-amber)" }} />
            <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-amber)", fontWeight: 700, marginBottom: 0 }}>Watch out for</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {project.edge_cases.map((ec, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: "16px 18px", background: "var(--rc-amber-bg)", border: "1px solid var(--rc-amber-border)", borderRadius: 6 }}>
                <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: "var(--rc-amber)", letterSpacing: "0.06em", paddingTop: 2, opacity: 0.7 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-amber)", marginBottom: 5, lineHeight: 1.3 }}>{ec.problem}</div>
                  <p style={{ ...SANS, fontSize: 13, lineHeight: 1.6, color: "var(--rc-muted)", margin: 0 }}>{ec.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Testing strategy ── */}
      {project.testing_strategy && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <TestTube2 size={11} style={{ color: "var(--rc-green)" }} />
            <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700 }}>Testing strategy</span>
          </div>
          <div style={{ padding: "20px 24px", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)", borderRadius: 6 }}>
            <ReactMarkdown components={{
              p: ({ children }) => <p style={{ ...SANS, fontSize: 13, lineHeight: 1.75, color: "var(--rc-muted)", margin: "0 0 10px" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: "var(--rc-text)", fontWeight: 600 }}>{children}</strong>,
              ul: ({ children }) => <ul style={{ margin: "8px 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>{children}</ul>,
              li: ({ children }) => <li style={{ ...SANS, fontSize: 13, lineHeight: 1.6, color: "var(--rc-muted)" }}>{children}</li>,
            }}>{project.testing_strategy}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── Going further ── */}
      {project.going_further && project.going_further.length > 0 && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <TrendingUp size={11} style={{ color: "var(--rc-red)" }} />
            <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700 }}>Going further</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {project.going_further.map((idea, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--rc-border)" }}>
                <span style={{ ...MONO, fontSize: 9, color: "var(--rc-red)", fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0, opacity: 0.6 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", lineHeight: 1.5 }}>{idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interview prep ── */}
      {project.interview_questions && project.interview_questions.length > 0 && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <HelpCircle size={11} style={{ color: "var(--rc-hint)" }} />
            <span style={{ ...SEC_LABEL, marginBottom: 0 }}>Interview prep</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {project.interview_questions.map((iq, i) => {
              const isOpen = openQuestion === i;
              return (
                <div key={i} style={{ border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden", background: isOpen ? "var(--rc-surface)" : "transparent", transition: "background 0.15s" }}>
                  <button
                    onClick={() => setOpenQuestion(isOpen ? null : i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: isOpen ? "var(--rc-red)" : "var(--rc-hint)", letterSpacing: "0.06em", flexShrink: 0, transition: "color 0.15s" }}>
                      Q{String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ ...SANS, fontSize: 13, fontWeight: 500, color: "var(--rc-text)", lineHeight: 1.4, flex: 1 }}>{iq.question}</span>
                    {isOpen
                      ? <ChevronUp size={13} style={{ color: "var(--rc-hint)", flexShrink: 0 }} />
                      : <ChevronDown size={13} style={{ color: "var(--rc-hint)", flexShrink: 0 }} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px 44px", borderTop: "1px solid var(--rc-border)" }}>
                      <p style={{ ...SANS, fontSize: 13, lineHeight: 1.7, color: "var(--rc-muted)", margin: "14px 0 0" }}>{iq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── How to sell ── */}
      {project.how_to_sell && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <Star size={11} style={{ color: "var(--rc-hint)" }} />
            <span style={{ ...SEC_LABEL, marginBottom: 0 }}>How to get the most out of this project</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { label: "Interview pitch", value: project.how_to_sell.interview_pitch },
              { label: "GitHub README", value: project.how_to_sell.github_readme_tip },
              { label: "Get stars", value: project.how_to_sell.star_tactics },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ ...MONO, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 8 }}>{label}</div>
                <p style={{ ...SANS, fontSize: 13, lineHeight: 1.6, color: "var(--rc-text)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Success criteria ── */}
      <div style={SEC}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
          <CheckCircle2 size={11} style={{ color: "var(--rc-green)" }} />
          <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700 }}>Success criteria</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {project.success_criteria.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--rc-border)" }}>
              <div style={{ width: 20, height: 20, borderRadius: 99, background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <CheckCircle2 size={11} style={{ color: "var(--rc-green)" }} />
              </div>
              <span style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", lineHeight: 1.6 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CV bullet + Signal boost ── */}
      {(project.cv_bullet || project.signal_boost) && (
        <div style={SEC}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <Star size={11} style={{ color: "var(--rc-hint)" }} />
            <span style={{ ...SEC_LABEL, marginBottom: 0 }}>After you ship</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {project.cv_bullet && (
              <div style={{ borderRadius: 6, border: "1px solid var(--rc-green-border)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--rc-green-bg)", borderBottom: "1px solid var(--rc-green-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FileText size={10} style={{ color: "var(--rc-green)" }} />
                    <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700 }}>CV bullet: paste once shipped</span>
                  </div>
                  <CopyButton text={project.cv_bullet} />
                </div>
                <div style={{ padding: "16px 18px", background: "var(--rc-surface)" }}>
                  <p style={{ ...MONO, fontSize: 13, lineHeight: 1.75, color: "var(--rc-text)", margin: 0 }}>{project.cv_bullet}</p>
                </div>
              </div>
            )}

            {project.signal_boost && (
              <div style={{ borderRadius: 6, border: "1px solid var(--rc-red-border)", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "var(--rc-red-bg)", borderBottom: "1px solid var(--rc-red-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <MessageSquare size={10} style={{ color: "var(--rc-red)" }} />
                    <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700 }}>Cover letter · first round</span>
                  </div>
                </div>
                <div style={{ padding: "18px 20px", background: "var(--rc-surface)" }}>
                  <p style={{ ...SANS, fontSize: 14, lineHeight: 1.75, color: "var(--rc-text)", margin: 0, fontStyle: "italic" }}>
                    <span style={{ ...MONO, fontSize: 18, color: "var(--rc-red)", opacity: 0.4, lineHeight: 1, verticalAlign: "top", marginRight: 4 }}>&ldquo;</span>
                    {project.signal_boost}
                    <span style={{ ...MONO, fontSize: 18, color: "var(--rc-red)", opacity: 0.4, lineHeight: 1, verticalAlign: "bottom", marginLeft: 4 }}>&rdquo;</span>
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
