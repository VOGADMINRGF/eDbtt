"use client";
import * as React from "react";

export type InputSize = "sm" | "md" | "lg";
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  size?: InputSize;
  invalid?: boolean;
  left?: boolean;
  right?: boolean;
  fullWidth?: boolean;
};

const sizeClass: Record<InputSize, string> = {
  sm: "h-9 text-sm px-3",
  md: "h-10 text-base px-4",
  lg: "h-11 text-base px-4",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = "md", invalid = false, left, right, fullWidth, ...rest },
  ref
) {
  const key: keyof typeof sizeClass = size ?? "md";
  const padLeft = left ? " pl-10" : "";
  const padRight = right ? " pr-10" : "";

  return (
    <input
      ref={ref}
      className={[
        "block rounded-md border transition outline-none",
        sizeClass[key],
        invalid ? "border-destructive ring-1 ring-destructive/30" : "border-input focus:ring-2 ring-ring",
        fullWidth !== false ? "w-full" : "",
        padLeft, padRight,
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
export default Input;
