"use client";

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="thinking">
      <span className="w-1.5 h-1.5 rounded-full bg-rc-red [animation:typing-pulse_1.4s_ease-in-out_infinite_both]" />
      <span className="w-1.5 h-1.5 rounded-full bg-rc-red [animation:typing-pulse_1.4s_ease-in-out_infinite_both] [animation-delay:0.2s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-rc-red [animation:typing-pulse_1.4s_ease-in-out_infinite_both] [animation-delay:0.4s]" />
    </span>
  );
}
