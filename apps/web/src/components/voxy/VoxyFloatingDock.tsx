"use client";

import Link from "next/link";
import VoxyInlineHint from "./VoxyInlineHint";

type VoxyFloatingDockProps = {
  title: string;
  body: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  chips?: readonly string[];
};

export default function VoxyFloatingDock({
  title,
  body,
  primaryAction,
  secondaryAction,
  chips = [],
}: VoxyFloatingDockProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] z-30 flex justify-end px-4 md:bottom-5 md:px-5">
      <aside
        data-voxy-floating-dock=""
        className="pointer-events-auto w-full max-w-[19rem] rounded-[1.45rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] p-3 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur md:p-3.5"
      >
        <VoxyInlineHint title={title} compact={false}>
          <p className="text-sm leading-6">{body}</p>
        </VoxyInlineHint>

        {chips.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={`${title}-${chip}`}
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-medium text-[rgb(var(--muted))]"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={primaryAction.href} className="btn-primary inline-flex min-h-[40px] items-center px-4 py-2 text-sm">
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="btn-secondary inline-flex min-h-[40px] items-center px-4 py-2 text-sm"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
