import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type InventoryItem = {
  path: string;
  file: string;
  kind: "page" | "api";
};

const FOCUS_ROUTES = [
  "/create",
  "/sw",
  "/swipes",
  "/beitraege",
  "/contributions/new",
  "/statements/new",
  "/streams",
  "/dossier/:id",
  "/analyze",
];

function isMatch(path: string, target: string) {
  if (target.endsWith(":id")) {
    const base = target.replace(":id", "");
    return path.startsWith(base);
  }
  if (target.endsWith("*")) {
    return path.startsWith(target.slice(0, -1));
  }
  return path === target;
}

async function loadInventory(): Promise<InventoryItem[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    const base = host ? `${proto}://${host}` : "";
    const res = await fetch(`${base}/api/admin/access/routes/inventory`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    const json = (await res.json()) as { ok?: boolean; items?: InventoryItem[] };
    return json.items ?? [];
  } catch {
    return [];
  }
}

export default async function AdminRoutesPage() {
  const items = await loadInventory();
  const pages = items.filter((item) => item.kind === "page");

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-10 text-[rgb(var(--fg))]">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Route Inventory
        </p>
        <h1 className="text-2xl font-semibold">Routen-Abgleich (Dossier-Standard)</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Übersicht der aktiven Pages. Fokus-Routen markieren, wo Dossier-Standards gelten sollen.
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Fokus-Routen
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {FOCUS_ROUTES.map((route) => {
            const exists = pages.some((item) => isMatch(item.path, route));
            return (
              <div
                key={route}
                className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                <span className="font-semibold">{route}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    exists ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"
                  }`}
                >
                  {exists ? "ok" : "fehlt"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Pages ({pages.length})
          </div>
          <Link href="/admin/access" className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
            Admin Access
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((item) => (
            <div key={item.path} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
              <div className="text-sm font-semibold">{item.path}</div>
              <div className="text-[11px] text-[rgb(var(--muted))]">{item.file}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}