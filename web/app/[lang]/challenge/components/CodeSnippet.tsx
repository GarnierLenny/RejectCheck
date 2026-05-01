"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/language";

type Props = {
  code: string;
  language?: string;
  withChrome?: boolean;
  fileName?: string;
  onCiteLines?: (range: string) => void;
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
  onCiteLines,
}: Props) {
  const { t } = useLanguage();
  const [html, setHtml] = useState<string | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const [floatTop, setFloatTop] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ anchor: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { codeToHtml } = await import("shiki");
      const shikiLang = SHIKI_LANG_MAP[language] ?? "typescript";
      const out = await codeToHtml(code, {
        lang: shikiLang,
        theme: "github-dark",
      });
      if (!cancelled) setHtml(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  // Apply selection highlight whenever selection or html changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const lines = container.querySelectorAll<HTMLElement>(".line");
    const lo = selection ? Math.min(selection[0], selection[1]) : -1;
    const hi = selection ? Math.max(selection[0], selection[1]) : -1;
    lines.forEach((el, i) => {
      const lineNum = i + 1;
      el.classList.toggle("is-selected", lineNum >= lo && lineNum <= hi);
    });
  }, [selection, html]);

  // Compute float position next to first selected line
  useEffect(() => {
    if (!selection || !containerRef.current || !bodyRef.current) {
      setFloatTop(null);
      return;
    }
    const lo = Math.min(selection[0], selection[1]);
    const lines = containerRef.current.querySelectorAll<HTMLElement>(".line");
    const firstLine = lines[lo - 1];
    if (!firstLine) {
      setFloatTop(null);
      return;
    }
    const lineRect = firstLine.getBoundingClientRect();
    const bodyRect = bodyRef.current.getBoundingClientRect();
    setFloatTop(lineRect.top - bodyRect.top);
  }, [selection, html]);

  function lineNumberOf(target: HTMLElement | null): number | null {
    if (!target || !containerRef.current) return null;
    const lineEl = target.closest(".line") as HTMLElement | null;
    if (!lineEl) return null;
    const all = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(".line"),
    );
    const idx = all.indexOf(lineEl);
    return idx >= 0 ? idx + 1 : null;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!onCiteLines) return;
    const lineNum = lineNumberOf(e.target as HTMLElement);
    if (lineNum == null) return;
    e.preventDefault();
    if (e.shiftKey && selection) {
      const anchor = selection[0]; // keep previous anchor
      dragRef.current = { anchor };
      setSelection([anchor, lineNum]);
    } else {
      dragRef.current = { anchor: lineNum };
      setSelection([lineNum, lineNum]);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const lineNum = lineNumberOf(e.target as HTMLElement);
    if (lineNum == null) return;
    const { anchor } = dragRef.current;
    setSelection((prev) =>
      prev && prev[0] === anchor && prev[1] === lineNum ? prev : [anchor, lineNum],
    );
  }

  // End drag on global mouseup so the user can release anywhere
  useEffect(() => {
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const hideScrollbars =
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  const lineCount = code.split("\n").length;
  const ext = EXT_MAP[language] ?? language;
  const resolvedFileName =
    fileName ??
    (t.challenge.ui.fileNameDefault as string).replace("{ext}", ext);
  const linesLabel = (t.challenge.ui.fileMetaLines as string).replace(
    "{count}",
    String(lineCount),
  );

  const inner = html ? (
    <div
      ref={containerRef}
      onMouseDown={onCiteLines ? handleMouseDown : undefined}
      onMouseMove={onCiteLines ? handleMouseMove : undefined}
      className={`shiki-wrapper overflow-auto bg-[#14131a] text-[13px] ${hideScrollbars} [&_pre]:!bg-transparent [&_pre]:!p-5 [&_pre]:!m-0 [&_pre]:w-max [&_pre]:min-w-full [&_pre]:[scrollbar-width:none] [&_pre::-webkit-scrollbar]:hidden [&_code]:!bg-transparent`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <div className={`bg-[#14131a] overflow-auto ${hideScrollbars}`}>
      <pre className="text-[#e1e4e8] p-5 text-[13px] font-mono leading-6 w-max min-w-full">
        {code.split("\n").map((line, i) => (
          <div key={i}>
            <span
              aria-hidden="true"
              className="inline-block w-9 pr-3 mr-3 text-right text-[rgba(225,228,232,0.32)] select-none border-r border-[rgba(225,228,232,0.08)]"
            >
              {i + 1}
            </span>
            {line || " "}
          </div>
        ))}
      </pre>
    </div>
  );

  if (!withChrome) {
    return <div className="rounded-xl overflow-hidden">{inner}</div>;
  }

  const range = selection ? formatRange(selection) : null;
  const count =
    selection
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
        {selection && range && onCiteLines && floatTop != null && (
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
                onCiteLines(range);
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
