import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "text-white border border-[rgb(var(--grad-from))] bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] shadow-[0_10px_24px_rgba(14,165,233,0.26)] hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(14,165,233,0.34)] focus-visible:outline-[rgb(var(--grad-from))]",
  secondary:
    "bg-[rgb(var(--card))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--fg))] focus-visible:outline-[rgb(var(--grad-from))]",
  ghost:
    "bg-[rgb(var(--card))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] focus-visible:outline-[rgb(var(--grad-from))]",
  link:
    "bg-transparent text-[rgb(var(--grad-from))] underline px-0 py-0 rounded-none hover:opacity-85 focus-visible:outline-[rgb(var(--grad-from))]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

// Benannte Basisfunktion → bessere .d.ts mit vollständigen Props
function ButtonBase(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    type, // wird unten mit Default versehen
    ...rest
  }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      // sicherstellen, dass Buttons in Forms nicht unbeabsichtigt submitten
      type={type ?? "button"}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-75 disabled:shadow-none disabled:translate-y-0",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {loading && (
        <svg
          className="-ml-0.5 mr-1 animate-spin"
          width="18"
          height="18"
          viewBox="0 0 50 50"
          aria-hidden="true"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
            stroke="currentColor"
            opacity="0.25"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
            stroke="currentColor"
            strokeDasharray="90"
            strokeDashoffset="60"
          />
        </svg>
      )}
      {!loading && leftIcon ? <span className="-ml-0.5">{leftIcon}</span> : null}
      <span>{children}</span>
      {!loading && rightIcon ? <span className="-mr-0.5">{rightIcon}</span> : null}
    </button>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(ButtonBase);
Button.displayName = "Button";

export default Button;
