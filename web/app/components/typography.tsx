import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

// Primer-aligned typography primitives.
// Heading: section titles inside cards (16/600/lh-24).
// FieldLabel: form-field labels (14/600/lh-20).
// Caption: helper text, meta (12/400/lh-16).
// Text: body / values fallback (14/400/lh-20 by default).

type Tone = "default" | "muted" | "subtle" | "red" | "green" | "amber";

const TONE: Record<Tone, string> = {
  default: "text-rc-text",
  muted: "text-rc-muted",
  subtle: "text-rc-hint",
  red: "text-rc-red",
  green: "text-rc-green",
  amber: "text-rc-amber",
};

// ── Heading ────────────────────────────────────────────────────────────────
type HeadingSize = "sm" | "md" | "lg";

const HEADING_SIZE: Record<HeadingSize, string> = {
  sm: "text-[14px] leading-5",
  md: "text-[16px] leading-6",
  lg: "text-[20px] leading-7",
};

type HeadingProps<T extends ElementType> = {
  as?: T;
  size?: HeadingSize;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "size" | "tone" | "className" | "children">;

export function Heading<T extends ElementType = "h3">({
  as,
  size = "md",
  tone = "default",
  className = "",
  children,
  ...rest
}: HeadingProps<T>) {
  const Tag = (as ?? "h3") as ElementType;
  return (
    <Tag
      className={`font-sans font-semibold ${HEADING_SIZE[size]} ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── FieldLabel ─────────────────────────────────────────────────────────────
type FieldLabelProps = {
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"label">, "htmlFor" | "className" | "children">;

export function FieldLabel({
  htmlFor,
  required,
  className = "",
  children,
  ...rest
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`font-sans font-semibold text-[14px] leading-5 text-rc-text ${className}`}
      {...rest}
    >
      {children}
      {required && <span className="text-rc-red ml-0.5">*</span>}
    </label>
  );
}

// ── Caption ────────────────────────────────────────────────────────────────
type CaptionProps<T extends ElementType> = {
  as?: T;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "tone" | "className" | "children">;

export function Caption<T extends ElementType = "span">({
  as,
  tone = "muted",
  className = "",
  children,
  ...rest
}: CaptionProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={`font-sans font-normal text-[12px] leading-4 ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── Text (generic body) ────────────────────────────────────────────────────
type TextSize = "sm" | "md" | "lg";
type TextWeight = "regular" | "medium" | "semibold";

const TEXT_SIZE: Record<TextSize, string> = {
  sm: "text-[12px] leading-4",
  md: "text-[14px] leading-5",
  lg: "text-[16px] leading-6",
};

const TEXT_WEIGHT: Record<TextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
};

type TextProps<T extends ElementType> = {
  as?: T;
  size?: TextSize;
  weight?: TextWeight;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "size" | "weight" | "tone" | "className" | "children">;

export function Text<T extends ElementType = "span">({
  as,
  size = "md",
  weight = "regular",
  tone = "default",
  className = "",
  children,
  ...rest
}: TextProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={`font-sans ${TEXT_SIZE[size]} ${TEXT_WEIGHT[weight]} ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
