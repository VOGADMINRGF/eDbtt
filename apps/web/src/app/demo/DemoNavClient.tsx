"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { parseDemoPersona, withPersona } from "@/features/demo/personas";

const DEMO_NAV = [
  { href: "/demo", label: "Studio" },
  { href: "/demo/dossier", label: "Dossier" },
  { href: "/demo/votes", label: "Votes" },
  { href: "/demo/mandat", label: "Mandat" },
  { href: "/demo/factcheck", label: "Factcheck" },
];

export default function DemoNavClient() {
  const searchParams = useSearchParams();
  const persona = parseDemoPersona(searchParams.get("persona"));

  return (
    <nav className="flex flex-wrap gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
      {DEMO_NAV.map((item) => (
        <Link
          key={item.href}
          href={withPersona(item.href, persona)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 hover:text-[rgb(var(--fg))]"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
