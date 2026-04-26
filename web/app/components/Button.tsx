import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

// Primer-aligned button.
// Heights: sm=28, md=32, lg=40. Radius 6px. 14/500 text. Border 1px.

type Variant = "default" | "danger" | "invisible";
type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[13px] gap-1.5",
  md: "h-8 px-3 text-[14px] gap-2",
  lg: "h-10 px-4 text-[14px] gap-2",
};

const VARIANT: Record<Variant, { base: string; filled?: string }> = {
  default: {
    base:
      "bg-rc-surface border border-rc-border text-rc-text hover:bg-rc-bg hover:border-rc-border",
  },
  danger: {
    base:
      "bg-rc-surface border border-rc-red/40 text-rc-red hover:bg-rc-red/5 hover:border-rc-red/60",
    filled:
      "bg-rc-red border border-rc-red text-white hover:bg-[#b53231] hover:border-[#b53231]",
  },
  invisible: {
    base:
      "border border-transparent text-rc-text hover:bg-rc-bg",
  },
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rc-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-rc-surface";

const COMMON =
  "inline-flex items-center justify-center font-sans font-medium leading-5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

type Props<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  size?: Size;
  filled?: boolean;
  block?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "variant" | "size" | "filled" | "block" | "loading" | "leadingIcon" | "trailingIcon" | "className" | "children"
>;

export function Button<T extends ElementType = "button">({
  as,
  variant = "default",
  size = "md",
  filled = false,
  block = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className = "",
  children,
  disabled,
  ...rest
}: Props<T>) {
  const Tag = (as ?? "button") as ElementType;
  const variantSpec = VARIANT[variant];
  const variantClass = filled && variantSpec.filled ? variantSpec.filled : variantSpec.base;
  const widthClass = block ? "w-full" : "";
  const isDisabled = disabled || loading;

  return (
    <Tag
      className={`${COMMON} ${SIZE[size]} ${variantClass} ${FOCUS} ${widthClass} ${className}`}
      disabled={Tag === "button" ? isDisabled : undefined}
      aria-disabled={Tag !== "button" && isDisabled ? true : undefined}
      {...rest}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </Tag>
  );
}
