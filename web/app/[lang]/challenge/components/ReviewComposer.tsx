"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { useLanguage } from "../../../../context/language";

const getMd = (ed: Editor): string =>
  (ed.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown();

const MAX_CHARS = 2400;

export type CiteData = {
  range: string;
  language: string;
  code: string;
};

export type ReviewComposerHandle = {
  insertText: (text: string) => void;
  insertCite: (data: CiteData) => void;
};

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

export const ReviewComposer = forwardRef<ReviewComposerHandle, Props>(
  function ReviewComposer(
    {
      value,
      onChange,
      onSubmit,
      pending,
      disabled,
      placeholder,
      submitLabel,
      pendingLabel,
      autoFocus = false,
    },
    ref,
  ) {
    const { t } = useLanguage();
    const ui = t.challenge.ui;

    // Refs to keep latest props/state for stable handleKeyDown closure
    const submitRef = useRef(onSubmit);
    const stateRef = useRef({ disabled, pending });
    useEffect(() => {
      submitRef.current = onSubmit;
      stateRef.current = { disabled, pending };
    });

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
        }),
        Placeholder.configure({ placeholder }),
        Markdown.configure({
          html: false,
          breaks: true,
          transformPastedText: true,
        }),
      ],
      content: value,
      editable: !disabled,
      autofocus: autoFocus,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "ch-editor__content",
          role: "textbox",
          "aria-label": ui.composerLabel as string,
        },
        handleKeyDown(_view, e) {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            const ed = editorRef.current;
            if (!ed) return true;
            const md = getMd(ed);
            const { disabled: d, pending: p } = stateRef.current;
            if (!d && !p && md.trim()) submitRef.current();
            return true;
          }
          return false;
        },
      },
      onUpdate({ editor }) {
        onChange(getMd(editor));
      },
    });

    // Mirror editor in a ref so the keydown closure can read it without re-creating the editor
    const editorRef = useRef(editor);
    useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

    // Sync external `value` -> editor (only if divergent, to avoid update loops)
    useEffect(() => {
      if (!editor) return;
      if (getMd(editor) !== value) {
        editor.commands.setContent(value || "", { emitUpdate: false });
      }
    }, [editor, value]);

    // Sync disabled prop -> editor.editable
    useEffect(() => {
      if (!editor) return;
      if (editor.isEditable === disabled) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    // Imperative handle for parent to inject text or a code-block citation
    useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string) => {
          const ed = editorRef.current;
          if (!ed) return;
          ed.chain().focus().insertContent(text).run();
        },
        insertCite: (data: CiteData) => {
          const ed = editorRef.current;
          if (!ed) return;
          ed.chain()
            .focus()
            .insertContent([
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [{ type: "bold" }],
                    text: data.range,
                  },
                ],
              },
              {
                type: "codeBlock",
                attrs: { language: data.language },
                content: data.code
                  ? [{ type: "text", text: data.code }]
                  : [],
              },
              { type: "paragraph" },
            ])
            .run();
        },
      }),
      [],
    );

    const chars = value.length;
    const words = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
    const counter = (ui.charCounter as string)
      .replace("{chars}", chars.toLocaleString())
      .replace("{max}", MAX_CHARS.toLocaleString())
      .replace("{words}", String(words));

    const isActive = (name: string, attrs?: Record<string, unknown>) =>
      editor?.isActive(name, attrs) ? "is-active" : "";

    return (
      <div className="ch-composer">
        <div className="ch-composer__head">
          <span className="ch-composer__label">{ui.composerLabel}</span>
          <span className="ch-composer__counter">{counter}</span>
        </div>

        <div
          className="ch-composer__toolbar"
          role="toolbar"
          aria-label={ui.composerLabel as string}
        >
          <button
            type="button"
            className={`ch-tb-btn ${isActive("bold")}`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
            tabIndex={-1}
            aria-pressed={!!editor?.isActive("bold")}
          >
            {ui.tbBold}
          </button>
          <button
            type="button"
            className={`ch-tb-btn ch-tb-btn--italic ${isActive("italic")}`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
            tabIndex={-1}
            aria-pressed={!!editor?.isActive("italic")}
          >
            {ui.tbItalic}
          </button>
          <button
            type="button"
            className={`ch-tb-btn ${isActive("code")}`}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!editor}
            tabIndex={-1}
            aria-pressed={!!editor?.isActive("code")}
          >
            {ui.tbCode}
          </button>
          <span className="ch-tb-divider" />
          <button
            type="button"
            className={`ch-tb-btn ${isActive("bulletList")}`}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
            tabIndex={-1}
            aria-pressed={!!editor?.isActive("bulletList")}
          >
            {ui.tbBullet}
          </button>
          <button
            type="button"
            className={`ch-tb-btn ${isActive("orderedList")}`}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
            tabIndex={-1}
            aria-pressed={!!editor?.isActive("orderedList")}
          >
            {ui.tbNumbered}
          </button>
        </div>

        <div className={`ch-editor ${disabled ? "is-disabled" : ""}`}>
          <EditorContent editor={editor} />
        </div>

        <div className="ch-composer__submit-row">
          {value.length > 0 && (
            <span className="ch-save-status">
              <span className="ch-save-status__dot" />
              {ui.draftSaved}
            </span>
          )}
          <span
            className="ch-submit-meta"
            style={{ marginLeft: value.length > 0 ? "auto" : "0" }}
          >
            <span className="ch-kbd">⌘ ↵</span>
          </span>
          <button
            type="button"
            className="ch-btn-primary"
            onClick={onSubmit}
            disabled={disabled || pending || !value.trim()}
          >
            {pending ? pendingLabel : submitLabel}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);
