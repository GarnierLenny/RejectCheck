"use client";

import { useEffect, useState } from "react";

type Props = { code: string; language?: string };

const SHIKI_LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  python: "python",
  java: "java",
};

export function CodeSnippet({ code, language = "typescript" }: Props) {
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

  if (!html) {
    const lines = code.split("\n");
    return (
      <div className={`bg-[#24292e] rounded-xl overflow-auto ${hideScrollbars}`}>
        <pre className="text-[#e1e4e8] p-5 text-[13px] font-mono leading-6 w-max min-w-full">
          {lines.map((line, i) => (
            <div key={i}>
              <span
                aria-hidden="true"
                className="inline-block w-9 pr-3 mr-3 text-right text-[rgba(225,228,232,0.32)] select-none border-r border-[rgba(225,228,232,0.08)]"
              >
                {i + 1}
              </span>
              {line || " "}
            </div>
          ))}
        </pre>
      </div>
    );
  }
  return (
    <div
      className={`shiki-wrapper rounded-xl overflow-auto bg-[#24292e] text-[13px] ${hideScrollbars} [&_pre]:!bg-transparent [&_pre]:!p-5 [&_pre]:!m-0 [&_pre]:w-max [&_pre]:min-w-full [&_pre]:[scrollbar-width:none] [&_pre::-webkit-scrollbar]:hidden [&_code]:!bg-transparent`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
