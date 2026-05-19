import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { buildReviewQueueReadModel } from "@features/reviewQueue";
import ContentReleaseWorkbenchActions from "./ContentReleaseWorkbenchActions";

export const metadata = {
  title: "Admin Review Queue · eDebatte",
};

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Noch keine offenen Review-Aufgaben.</p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Sobald reviewpflichtige Signale, Intelligence-Vorschläge, Drafts, Studio-Workspaces,
        Output-Artefakte oder amtliche Freigabeschritte offen sind, erscheinen sie hier.
      </p>
    </div>
  );
}

export default async function AdminReviewPage() {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;

  if (!user || !user.sessionValid || !userId) {
    redirect(`/login?next=${encodeURIComponent("/admin/review")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization/dashboard");
  }

  const readModel = await buildReviewQueueReadModel({
    mode: "global_operator",
    userId,
    isAdmin: true,
    visibleRegionIds: [],
    organizationIds: [],
    canApproveOfficial: true,
    governanceActor: {
      userId,
      role: "admin",
      isAdmin: true,
      scopedOwnerIds: [userId],
      scopedEntityIds: [userId],
      personTrust: null,
    },
  });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin · Review
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">Zentrale Review-Queue</h1>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Betreiberbereich für reviewpflichtige Beteiligungssignale, Anlassraum Public Input,
          Region-Intelligence-Vorschläge, reviewpflichtige Source Results aus expliziten
          URL-Auswertungen, RegionSignalDrafts,
          Dossier Studio Workspaces, Output-/Distribution-Artefakte, Create-Handoffs und
          explizite public_official-Freigaben.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Keine Sammelentscheidung, keine automatische Amtlichkeit, keine automatische
          Dossier-/Anlassraum-Finalisierung.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Offene Aufgaben
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{readModel.summary.total}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Alle Einträge bleiben review-first und verlinken zurück in die bestehenden
            Fach-Surfaces.
          </p>
        </article>
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Amtliche Freigaben
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">
            {readModel.summary.officialApprovalCount}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            public_official bleibt ein expliziter menschlicher Schritt für berechtigte Rollen.
          </p>
        </article>
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Verteilung
          </p>
          <div className="mt-3 space-y-2">
            {readModel.summary.byDomain.length === 0 ? (
              <p className="text-sm text-[rgb(var(--muted))]">Noch keine Domains mit offenen Aufgaben.</p>
            ) : (
              readModel.summary.byDomain.map((entry) => (
                <div key={entry.domain} className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted))]">{entry.label}</span>
                  <span className="font-semibold text-[rgb(var(--fg))]">{entry.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Queue
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Die Queue bündelt nur bestehende Review-Runtimes. Entscheidungen bleiben in den
              jeweiligen Fachpfaden.
            </p>
          </div>
          <Link
            href="/admin/create/attach-drafts"
            className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
          >
            Create-Handoffs separat öffnen
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {readModel.items.length === 0 ? (
            <EmptyState />
          ) : (
            readModel.items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.domainLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.workflowLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.visibilityLabel}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
                    <p className="max-w-4xl text-sm text-[rgb(var(--muted))]">{item.summary}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {item.regionName ?? "Übergreifend"} · {item.reviewAuthorityLabel}
                    </p>
                    {item.sourceSnapshotTemplate ? (
                      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.label}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.seedKindLabel}
                          {item.sourceSnapshotTemplate.isExampleSeed
                            ? " · Beispiel-Seed"
                            : " · Region-generic"}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.reviewHint}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Prüfen
                  </Link>
                </div>
                {item.contentReleaseWorkbench ? (
                  <ContentReleaseWorkbenchActions
                    itemId={item.id}
                    sourceKind={item.contentReleaseWorkbench.sourceKind}
                    sourceId={item.contentReleaseWorkbench.sourceId}
                    contentReleaseWorkbench={item.contentReleaseWorkbench}
                  />
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
