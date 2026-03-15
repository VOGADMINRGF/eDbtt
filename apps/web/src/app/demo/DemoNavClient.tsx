"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parseDemoPersona, withPersona } from "@/features/demo/personas";

const DEMO_NAV = [
  { href: "/demo", label: "Studio" },
  { href: "/demo/runden", label: "Runden" },
  { href: "/demo/dossier", label: "Dossier" },
  { href: "/demo/abstimmungen", label: "Abstimmungen" },
  { href: "/demo/mandat", label: "Mandat" },
  { href: "/demo/factcheck", label: "Factcheck" },
  { href: "/demo/swipes", label: "Swipes" },
  { href: "/demo/create", label: "Mitwirken" },
];

export default function DemoNavClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const persona = parseDemoPersona(searchParams.get("persona"));

  return (
    <nav className="flex flex-wrap gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
      {DEMO_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={withPersona(item.href, persona)}
            aria-current={active ? "page" : undefined}
            className={`vog-tab ${active ? "vog-tab--active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
