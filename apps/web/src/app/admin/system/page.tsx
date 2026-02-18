import Link from "next/link";

type HubItem = {
  title: string;
  description: string;
  href: string;
};

const SECTIONS: Array<{ title: string; items: HubItem[] }> = [
  {
    title: "Operations",
    items: [
      {
        title: "Telemetry Hub",
        description: "AI Usage, Health, Logs",
        href: "/admin/telemetry",
      },
      {
        title: "Audit Logs",
        description: "Mutationen und Zugriffspfad",
        href: "/admin/audit",
      },
      {
        title: "Error Logs",
        description: "Systemfehler & Trace IDs",
        href: "/admin/errors",
      },
      {
        title: "Analytics (Legacy)",
        description: "Registrierungen, Rollen, Pakete",
        href: "/admin/analytics",
      },
    ],
  },
  {
    title: "Konfiguration",
    items: [
      {
        title: "Admin Settings",
        description: "Pricing und Systemwerte",
        href: "/admin/settings",
      },
    ],
  },
];

export default function AdminSystemHubPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · System
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">System Hub</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Betriebs- und Konfigurationsbereiche schnell erreichbar.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{section.title}</h2>
            <span className="text-xs text-[rgb(var(--muted))]">{section.items.length} Bereiche</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <HubCard key={item.href} {...item} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function HubCard({ title, description, href }: HubItem) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))] transition hover:-translate-y-0.5 hover:ring-sky-200"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
    </Link>
  );
}
