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
  /** optional right-aligned slot under the field (e.g. "Forgot password?") */
  meta?: React.ReactNode;
};

const STRENGTH_COLOR: Record<StrengthLevel, string> = {
  weak: "var(--rc-red)",
  medium: "var(--rc-amber)",
  strong: "var(--rc-green)",
};

/**
 * Password input with a reveal toggle (eye) and an optional strength meter,
 * styled with the shared rc-auth-* classes so login and reset-password stay
 * visually identical. Reads its micro-copy from t.login.*.
 */
export function PasswordField({
  value,
  onChange,
  label,
  autoComplete,
  placeholder = "••••••••",
  required = true,
  showStrength = false,
  meta,
}: Props) {
  const { t } = useLanguage();
  const [reveal, setReveal] = useState(false);
  const fieldId = useId();

  const { level, fill } = passwordStrength(value);
  const strengthLabel =
    level === "weak" ? t.login.strengthWeak : level === "medium" ? t.login.strengthMedium : t.login.strengthStrong;
  const color = STRENGTH_COLOR[level];

  return (
    <div className="rc-auth-field">
      <label htmlFor={fieldId} className="rc-auth-field-label">
        {label}
      </label>
      <div className="rc-auth-input-wrap">
        <input
          id={fieldId}
          className="rc-auth-input"
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="rc-auth-eye"
          onClick={() => setReveal((r) => !r)}
          aria-label={reveal ? t.login.hidePassword : t.login.showPassword}
          aria-pressed={reveal}
          tabIndex={-1}
        >
          {reveal ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="rc-auth-strength">
          <div className="rc-auth-strength-track">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="rc-auth-strength-seg"
                style={i < fill ? { background: color } : undefined}
              />
            ))}
          </div>
          <div className="rc-auth-strength-meta">
            <span className="rc-auth-strength-label" style={{ color }}>
              {strengthLabel}
            </span>
            <span className="rc-auth-strength-hint">{t.login.passwordHint}</span>
          </div>
        </div>
      )}

      {meta && <div className="rc-auth-pw-meta">{meta}</div>}
    </div>
  );
}
