"use client";

import { ReactNode } from "react";

export function StepHeader({
  eyebrow,
  title,
  titleAccent,
  titleSuffix,
  centered,
  children,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  titleSuffix?: string;
  centered?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`max-w-[760px] mb-7 ${centered ? "text-center mx-auto" : ""}`}
    >
      <div
        className={`flex items-center gap-2.5 mb-4 font-mono text-[10px] tracking-[0.24em] uppercase text-rc-red ${
          centered ? "justify-center" : ""
        }`}
      >
        <span className="h-px w-[22px] bg-rc-red" />
        <span>{eyebrow}</span>
        {centered ? <span className="h-px w-[22px] bg-rc-red" /> : null}
      </div>
      <h1
        className="m-0 mb-3 font-semibold leading-[1.05] tracking-[-0.028em] text-rc-text text-balance"
        style={{ fontSize: "clamp(28px, 3.6vw, 44px)" }}
      >
        {title}{" "}
        <em className="italic text-rc-red font-semibold">{titleAccent}</em>
        {titleSuffix ? <span> {titleSuffix}</span> : null}
      </h1>
      {children ? (
        <p
          className={`m-0 text-rc-muted text-[16px] leading-[1.55] max-w-[640px] ${
            centered ? "mx-auto" : ""
          }`}
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}
