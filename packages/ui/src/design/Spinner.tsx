import React from "react";

export type SpinnerProps = {
  size?: number;
  text?: string;
  className?: string;
};

export default function Spinner({ size = 24, text, className }: SpinnerProps) {
  const s = { width: size, height: size } as const;
  return (
    <div className={className ?? ""} role="status" aria-live="polite" aria-label={text ?? "Laden"}>
      <svg viewBox="0 0 50 50" style={s} className="animate-spin">
        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" opacity="0.2" />
        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" strokeDasharray="90" strokeDashoffset="60" />
      </svg>
      {text ? <div className="text-xs mt-1">{text}</div> : null}
    </div>
  );
}
