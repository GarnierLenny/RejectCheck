"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../../../context/language";

type Props = {
  code: string;
  language?: string;
  withChrome?: boolean;
  fileName?: string;
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

export function CodeSnippet({ code, language = "typescript", withChrome = false, fileName }: Props) {
  const { t } = useLanguage();
  const [html, setHtml] = useState<string | null>(null);

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
      <div className="ch-code-shell__body">{inner}</div>
    </div>
  );
}
