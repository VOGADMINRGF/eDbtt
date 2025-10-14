"use client";

import Link from "next/link";
import { useUser } from "@features/user/context/UserContext";
import { DASHBOARD_MODULES } from "src/app/dashboard/config/dashboardConfig";

export default function SidebarNav() {
  const { role, roleCompat } = useUser();

  const visibleModules = (DASHBOARD_MODULES ?? []).filter((mod) => {
    const roles: string[] = Array.isArray(mod.roles) ? mod.roles : [];
    return roles.includes(roleCompat) || roles.includes(role);
  });

  if (visibleModules.length === 0) return null;

  return (
    <aside className="w-56 bg-white shadow flex flex-col gap-1 p-4">
      <div className="mb-4 font-bold text-xl">VOG Dashboard</div>
      {visibleModules.map((nav) => (
        <Link key={nav.href} href={nav.href} className="block px-3 py-2 rounded hover:bg-violet-100 text-gray-800 font-medium">
          {nav.label}
        </Link>
      ))}
    </aside>
  );
}
