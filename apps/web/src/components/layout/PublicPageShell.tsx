"use client";

import type { ReactNode } from "react";

type PublicPageShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export default function PublicPageShell({ children, contentClassName }: PublicPageShellProps) {
  const contentClass = contentClassName ?? "max-w-5xl";
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(55%_45%_at_80%_15%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(55%_45%_at_20%_15%,rgba(34,197,94,0.10),transparent_55%)]" />
      <section className={`relative mx-auto w-full px-4 py-14 sm:py-16 ${contentClass}`}>
        {children}
      </section>
    </main>
  );
}
