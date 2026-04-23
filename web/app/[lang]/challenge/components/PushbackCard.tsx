"use client";

import Image from "next/image";
import { useLanguage } from "../../../../context/language";
import { TypingDots } from "./TypingDots";

type Props = {
  text?: string;
  loading?: boolean;
};

export function PushbackCard({ text, loading }: Props) {
  const { t } = useLanguage();
  return (
    <section className="border border-rc-red-border rounded-2xl p-4 bg-gradient-to-b from-rc-red-bg to-rc-red-bg/40">
      <div className="flex items-center gap-3 mb-3">
        <Image
          src="/RejectCheck_500_bg_less.png"
          alt="RejectCheck"
          width={28}
          height={28}
          className="flex-shrink-0"
        />
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">
          {t.challenge.socratic.heading}
        </p>
        {loading && <TypingDots />}
      </div>
      {loading ? (
        <p className="text-[13px] italic text-rc-hint leading-relaxed">
          {t.challenge.pushbackGenerating}
        </p>
      ) : (
        <p className="text-[14px] text-rc-text leading-relaxed font-medium">{text}</p>
      )}
    </section>
  );
}
