"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/language";
import { passwordStrength, type StrengthLevel } from "@/lib/passwordStrength";

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
  /** show the segmented strength meter + hint below the field (signup / new password) */
  showStrength?: boolean;
};

const STRENGTH_COLOR: Record<StrengthLevel, string> = {
  weak: "var(--rc-red)",
  medium: "var(--rc-amber)",
  strong: "var(--rc-green)",
};

/**
 * Password input with a reveal toggle (eye) and an optional strength meter.
 * Shared by the login/signup form and the reset-password page so the two stay
 * visually identical. Reads its micro-copy from `t.login.*`.
 */
export function PasswordField({
  value,
  onChange,
  label,
  autoComplete,
  placeholder = "••••••••",
  required = true,
  showStrength = false,
}: Props) {
  const { t } = useLanguage();
  const [reveal, setReveal] = useState(false);
  const fieldId = useId();

  const { level, fill } = passwordStrength(value);
  const strengthLabel =
    level === "weak" ? t.login.strengthWeak : level === "medium" ? t.login.strengthMedium : t.login.strengthStrong;
  const color = STRENGTH_COLOR[level];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full pl-4 pr-11 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-sans text-rc-text placeholder:text-rc-hint focus:outline-none focus:border-rc-red/40 transition-colors"
        />
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          aria-label={reveal ? t.login.hidePassword : t.login.showPassword}
          aria-pressed={reveal}
          tabIndex={-1}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-rc-hint hover:text-rc-text hover:bg-rc-bg transition-colors"
        >
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-[3px] flex-1 rounded-full transition-colors duration-200"
                style={{ background: i < fill ? color : "var(--rc-border)" }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ color }}>
              {strengthLabel}
            </span>
            <span className="font-mono text-[9.5px] tracking-wide text-rc-hint">{t.login.passwordHint}</span>
          </div>
        </div>
      )}
    </div>
  );
}
