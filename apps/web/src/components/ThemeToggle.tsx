"use client";

import * as React from "react";
import { useTheme } from "next-themes";

const BASE_CLASS =
  "rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] focus:outline-none";

type ThemeToggleProps = {
  className?: string;
  variant?: "select" | "icon";
};

function IconSun() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSystem() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="12" rx="2" strokeWidth="1.5" />
      <path d="M8 20h8M12 16v4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ThemeToggle({ className, variant = "select" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (variant === "icon") {
    const order: Array<"dark" | "light" | "system"> = ["dark", "light", "system"];
    const current = (theme ?? "system") as "dark" | "light" | "system";
    const next = order[(order.indexOf(current) + 1) % order.length];

    const label =
      current === "dark" ? "Dunkel" : current === "light" ? "Hell" : "System";
    const Icon = current === "dark" ? IconMoon : current === "light" ? IconSun : IconSystem;

    return (
      <button
        type="button"
        aria-label={`Theme wechseln (aktuell ${label})`}
        onClick={() => setTheme(next)}
        className={[
          "inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon />
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <label className={className}>
      <span className="sr-only">Theme wählen</span>
      <select
        aria-label="Theme wählen"
        className={BASE_CLASS}
        value={theme ?? "system"}
        onChange={(event) => setTheme(event.target.value)}
      >
        <option value="light">Hell</option>
        <option value="dark">Dunkel</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
