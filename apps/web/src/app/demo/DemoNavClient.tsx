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
  const isSwipeRoute = pathname?.startsWith("/demo/swipes");

  return (
    <nav className={`hide-scrollbar flex w-full gap-1 overflow-x-auto whitespace-nowrap pb-0.5 text-[11px] font-semibold text-[rgb(var(--muted))] md:w-auto md:flex-wrap md:gap-2 md:overflow-visible md:whitespace-normal ${isSwipeRoute ? "md:max-w-[42rem]" : ""}`}>
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
