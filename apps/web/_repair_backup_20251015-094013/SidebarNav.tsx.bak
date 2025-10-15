import Link from "next/link";
import { cookies } from "next/headers";
import clsx from "clsx";
import type { Route } from "next";

type NavItem = { href: string; label: string; roles?: string[] };

export default async function SidebarNav({ items }: { items: NavItem[] }) {
  const store = await cookies(); // <- await
  const role = store.get("u_role")?.value ?? null; // klappt mit React 19

  const visible = items.filter(
    (it) => !it.roles || (role && it.roles.includes(role)),
  );

  return (
    <nav className="space-y-1">
      {visible.map((it) => (
        <Link
          key={it.href}
          href={it.href as any} // Fix für die neue Link-Types
          className={clsx("block px-3 py-2 rounded hover:bg-neutral-100")}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
