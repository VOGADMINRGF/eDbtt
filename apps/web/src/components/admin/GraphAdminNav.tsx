"use client";

import Link from "next/link";

const LINKS = [
  { href: "/admin/graph/impact", label: "Impact" },
  { href: "/admin/graph/health", label: "Health" },
  { href: "/admin/graph/repairs", label: "Repairs" },
] as const;

export function GraphAdminNav({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.href === current;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-[rgb(var(--grad-from))] text-[rgb(var(--fg))] bg-[color-mix(in_oklab,rgb(var(--grad-from))_12%,transparent)]"
                : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))]",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
