"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/language";

type Token = { content: string; color?: string };
type Line = Token[];

type Props = {
  code: string;
  language?: string;
  withChrome?: boolean;
  fileName?: string;
  onCite?: (data: { range: string; language: string; code: string }) => void;
};

const SHIKI_LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  python: "python",
  java: "java",
};

const EXT_MAP: Record<string, string> = {
  typescript: "ts",
  python: "py",
  java: "java",
};

function formatRange([a, b]: [number, number]): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo === hi ? `L${lo}` : `L${lo}-L${hi}`;
}

export function CodeSnippet({
  code,
  language = "typescript",
  withChrome = false,
  fileName,
  onCite,
}: Props) {
  const { t } = useLanguage();
  const [lines, setLines] = useState<Line[] | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const [floatTop, setFloatTop] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<{ anchor: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { codeToTokens } = await import("shiki");
      const shikiLang = SHIKI_LANG_MAP[language] ?? "typescript";
      const out = await codeToTokens(code, {
        lang: shikiLang as "typescript" | "python" | "java",
        theme: "github-dark",
      });
      if (!cancelled) {
        setLines(
          out.tokens.map((line) =>
            line.map((tok) => ({ content: tok.content, color: tok.color })),
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  // Compute float position next to first selected line
  useEffect(() => {
    if (!selection || !bodyRef.current) {
      setFloatTop(null);
      return;
    }
    const lo = Math.min(selection[0], selection[1]);
    const firstLine = lineRefs.current[lo - 1];
    if (!firstLine) {
      setFloatTop(null);
      return;
    }
    const lineRect = firstLine.getBoundingClientRect();
    const bodyRect = bodyRef.current.getBoundingClientRect();
    setFloatTop(lineRect.top - bodyRect.top);
  }, [selection, lines]);

  const isInRange = (lineNum: number): boolean => {
    if (!selection) return false;
    const lo = Math.min(selection[0], selection[1]);
    const hi = Math.max(selection[0], selection[1]);
    return lineNum >= lo && lineNum <= hi;
  };

  function handleLineDown(lineNum: number, e: React.MouseEvent) {
    if (!onCite) return;
    if (e.shiftKey && selection) {
      const lo = Math.min(selection[0], selection[1], lineNum);
      const hi = Math.max(selection[0], selection[1], lineNum);
      setSelection([lo, hi]);
      return;
    }
    dragRef.current = { anchor: lineNum };
    setSelection([lineNum, lineNum]);
  }

  function handleLineEnter(lineNum: number) {
    if (!dragRef.current) return;
    const { anchor } = dragRef.current;
    const lo = Math.min(anchor, lineNum);
    const hi = Math.max(anchor, lineNum);
    setSelection((prev) =>
      prev && prev[0] === lo && prev[1] === hi ? prev : [lo, hi],
    );
  }

  // End drag globally so user can release anywhere
  useEffect(() => {
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const totalLines = lines?.length ?? code.split("\n").length;
  const ext = EXT_MAP[language] ?? language;
  const resolvedFileName =
    fileName ??
    (t.challenge.ui.fileNameDefault as string).replace("{ext}", ext);
  const linesLabel = (t.challenge.ui.fileMetaLines as string).replace(
    "{count}",
    String(totalLines),
  );

  const inner = (
    <div
      className="shiki-wrapper bg-[#14131a] text-[13px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-auto"
    >
      <pre className="!bg-transparent !p-5 !m-0 w-max min-w-full">
        <code className="block">
          {lines
            ? lines.map((line, i) => {
                const lineNum = i + 1;
                const selected = isInRange(lineNum);
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    className={`line${selected ? " is-selected" : ""}`}
                    onMouseDown={
                      onCite
                        ? (e) => {
                            e.preventDefault();
                            handleLineDown(lineNum, e);
                          }
                        : undefined
                    }
                    onMouseEnter={
                      onCite ? () => handleLineEnter(lineNum) : undefined
                    }
                  >
                    {line.length === 0 ? (
                      <span>{" "}</span>
                    ) : (
                      line.map((tok, j) => (
                        <span key={j} style={tok.color ? { color: tok.color } : undefined}>
                          {tok.content}
                        </span>
                      ))
                    )}
                  </div>
                );
              })
            : // Loading fallback: plain code text
              code.split("\n").map((line, i) => (
                <div key={i} className="line">
                  {line || " "}
                </div>
              ))}
        </code>
      </pre>
    </div>
  );

  if (!withChrome) {
    return <div className="rounded-xl overflow-hidden">{inner}</div>;
  }

  const range = selection ? formatRange(selection) : null;
  const count = selection
    ? Math.max(selection[0], selection[1]) -
      Math.min(selection[0], selection[1]) +
      1
    : 0;
  const countLabel =
    count === 1
      ? (t.challenge.ui.citeCountOne as string).replace("{n}", "1")
      : (t.challenge.ui.citeCountMany as string).replace("{n}", String(count));
  const citeActionLabel = (t.challenge.ui.citeAction as string).replace(
    "{range}",
    range ?? "",
  );

  return (
    <div className="ch-code-shell">
      <div className="ch-code-shell__head">
        <div className="ch-code-shell__traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="ch-code-shell__tab">
          <span className="ch-code-shell__tab-dot" />
          {resolvedFileName}
        </span>
        <div className="ch-code-shell__meta">
          <span>{linesLabel}</span>
          <span className="ch-code-shell__meta-sep" />
          <span>{t.challenge.ui.fileMetaReadOnly}</span>
        </div>
      </div>
      <div className="ch-code-shell__body" ref={bodyRef}>
        {inner}
        {selection && range && onCite && floatTop != null && (
          <div className="ch-code-shell__float" style={{ top: floatTop }}>
            <span className="ch-code-shell__float-range">{range}</span>
            <span className="ch-code-shell__float-count">{countLabel}</span>
            <button
              type="button"
              className="ch-code-shell__float-clear"
              onClick={() => setSelection(null)}
              aria-label={t.challenge.ui.citeClear as string}
            >
              ×
            </button>
            <button
              type="button"
              className="ch-code-shell__float-action"
              onClick={() => {
                const lo = Math.min(selection[0], selection[1]);
                const hi = Math.max(selection[0], selection[1]);
                const codeText = code
                  .split("\n")
                  .slice(lo - 1, hi)
                  .join("\n");
                onCite({
                  range,
                  language: language ?? "typescript",
                  code: codeText,
                });
                setSelection(null);
              }}
            >
              {citeActionLabel} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
