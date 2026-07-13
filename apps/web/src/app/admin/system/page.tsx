import Link from "next/link";
import { buildAgenticBootstrapReadiness } from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  getOperatorWorkbenchSurface,
  type OperatorWorkbenchSurfaceKey,
} from "@/features/admin/operatorWorkbenchSurfaces";

type HubItem = {
  title: string;
  description: string;
  href: string;
};

const NEXT_STEP_SURFACES: OperatorWorkbenchSurfaceKey[] = [
  "reviewQueue",
  "accessCenter",
  "entitlements",
  "pricingOrders",
  "organizationDashboard",
];

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

export default async function AdminSystemHubPage() {
  const systemSurface = getOperatorWorkbenchSurface("systemHub");
  const agenticReadiness = buildAgenticBootstrapReadiness();
  const materializedFollowups =
    agenticReadiness.bootstrap.followupTaskCount - agenticReadiness.bootstrap.missingFollowupTaskIds.length;
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          {systemSurface.eyebrow}
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{systemSurface.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{systemSurface.summary}</p>
      </header>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Häufige nächste Schritte</h2>
          <span className="text-xs text-[rgb(var(--muted))]">{NEXT_STEP_SURFACES.length} Wege</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {NEXT_STEP_SURFACES.map((key) => {
            const surface = getOperatorWorkbenchSurface(key);
            return <HubCard key={surface.href} title={surface.title} description={surface.summary} href={surface.href} />;
          })}
        </div>
      </section>

      <section
        data-testid="agentic-bootstrap-readiness-card"
        className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Controlled Agentic Runtime
            </p>
            <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">
              Registry Bootstrap Readiness
            </h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Validiert Registry, denied actions, shared rules und Task-Mapping ohne Runtime-Aktivierung,
              Parallel-Agenten oder externe Provider.
            </p>
          </div>
          <div className="rounded-2xl bg-[rgb(var(--soft))] px-3 py-2 text-right text-xs text-[rgb(var(--muted))]">
            <p>Bootstrap-Task</p>
            <p className="font-semibold text-[rgb(var(--fg))]">
              {agenticReadiness.bootstrap.bootstrapStatusInOpenTasks === "done"
                ? "done"
                : agenticReadiness.bootstrap.bootstrapStatusInOpenTasks}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReadinessMetric
            label="Validierte Rollen"
            value={String(agenticReadiness.registry.roleCount)}
            detail={agenticReadiness.registry.validatedRoleIds.join(", ")}
          />
          <ReadinessMetric
            label="Follow-up-Tasks materialisiert"
            value={`${materializedFollowups}/${agenticReadiness.bootstrap.followupTaskCount}`}
            detail="OpenTasks-Sync"
          />
          <ReadinessMetric
            label="Shared Rules"
            value={String(agenticReadiness.registry.sharedRuleKeys.length)}
            detail="alle erzwungen"
          />
          <ReadinessMetric
            label="Denied Actions"
            value={String(agenticReadiness.registry.deniedActionCount)}
            detail="keine stille Freigabe"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Segmentgrenzen</h3>
            <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
              {agenticReadiness.segments.map((segment) => (
                <li key={segment.id}>
                  <span className="font-medium text-[rgb(var(--fg))]">{segment.title}:</span>{" "}
                  {segment.userFacingMode}, optionale Hilfe{" "}
                  {segment.optionalGuidance ? "ja" : "nein"}, erzwungener Companion{" "}
                  {segment.forcedCompanion ? "ja" : "nein"}.
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Pflichtgrenzen</h3>
            <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
              <li>Runtime bleibt deaktiviert: {agenticReadiness.runtimeActivationAllowed ? "nein" : "ja"}.</li>
              <li>Keine Parallelarchitektur: {agenticReadiness.noParallelArchitecture ? "erzwungen" : "offen"}.</li>
              <li>
                Daily Civic Impulses bleiben optional, maximal {agenticReadiness.dailyCivicImpulses.maxPerDay} pro
                Tag.
              </li>
              <li>
                Screenshot-Intake trennt {agenticReadiness.screenshotIntakeStages.join(" -> ")}.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Nächste codex_ready Tasks</h3>
            <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
              {agenticReadiness.bootstrap.codexReadyTaskIds.map((taskId) => (
                <li key={taskId}>{taskId}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Blocked / needs_decision</h3>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Blocked: {agenticReadiness.bootstrap.blockedTaskIds.length}. Needs decision:{" "}
              {agenticReadiness.bootstrap.needsDecisionTaskIds.length}.
            </p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Personal Voxy, B2B Workbench und B2G Cockpit bleiben getrennt; Übersetzung bleibt keine Evidenz;
              Public Debattenstand bleibt frei lesbar.
            </p>
          </div>
        </div>
      </section>

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

function ReadinessMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-[rgb(var(--soft))] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{value}</p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{detail}</p>
    </div>
  );
}
