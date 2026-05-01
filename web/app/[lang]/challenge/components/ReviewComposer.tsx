"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/language";

const MAX_CHARS = 2400;

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  disabled: boolean;
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  rows?: number;
  autoFocus?: boolean;
};

export function ReviewComposer({
  value,
  onChange,
  onSubmit,
  pending,
  disabled,
  placeholder,
  submitLabel,
  pendingLabel,
  rows = 12,
  autoFocus = false,
}: Props) {
  const { t } = useLanguage();
  const ui = t.challenge.ui;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [citing, setCiting] = useState(false);
  const [citeValue, setCiteValue] = useState("");
  const citeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (citing) citeInputRef.current?.focus();
  }, [citing]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!disabled && !pending && value.trim()) onSubmit();
    }
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function commitCite() {
    const n = Number.parseInt(citeValue, 10);
    if (Number.isFinite(n) && n > 0) insertAtCursor(`L${n} `);
    setCiteValue("");
    setCiting(false);
  }

  const chars = value.length;
  const words = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const counter = (ui.charCounter as string)
    .replace("{chars}", chars.toLocaleString())
    .replace("{max}", MAX_CHARS.toLocaleString())
    .replace("{words}", String(words));

  return (
    <div className="ch-composer">
      <div className="ch-composer__head">
        <span className="ch-composer__label">{ui.composerLabel}</span>
        <span className="ch-composer__counter">{counter}</span>
      </div>

      <div className="ch-composer__toolbar" role="toolbar" aria-label={ui.composerLabel}>
        <button type="button" className="ch-tb-btn" tabIndex={-1}>
          {ui.tbBold}
        </button>
        <button type="button" className="ch-tb-btn ch-tb-btn--italic" tabIndex={-1}>
          {ui.tbItalic}
        </button>
        <button type="button" className="ch-tb-btn" tabIndex={-1}>
          {ui.tbCode}
        </button>
        <span className="ch-tb-divider" />
        <button type="button" className="ch-tb-btn" tabIndex={-1}>
          {ui.tbBullet}
        </button>
        {citing ? (
          <input
            ref={citeInputRef}
            type="number"
            min={1}
            value={citeValue}
            onChange={(e) => setCiteValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitCite();
              } else if (e.key === "Escape") {
                setCiting(false);
                setCiteValue("");
              }
            }}
            onBlur={commitCite}
            placeholder="L#"
            className="ch-cite-input"
            style={{ marginLeft: "auto" }}
          />
        ) : (
          <button
            type="button"
            className="ch-tb-btn ch-tb-btn--cite"
            onClick={() => setCiting(true)}
          >
            {ui.citeLine}
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={MAX_CHARS}
        className="ch-composer__textarea"
      />

      <div className="ch-composer__submit-row">
        {value.length > 0 && (
          <span className="ch-save-status">
            <span className="ch-save-status__dot" />
            {ui.draftSaved}
          </span>
        )}
        <span className="ch-submit-meta" style={{ marginLeft: value.length > 0 ? "auto" : "0" }}>
          <span className="ch-kbd">⌘ ↵</span>
        </span>
        <button
          type="button"
          className="ch-btn-primary"
          onClick={onSubmit}
          disabled={disabled || pending || !value.trim()}
        >
          {pending ? pendingLabel : submitLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
