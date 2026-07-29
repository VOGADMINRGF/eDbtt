"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ORGANIZATION_SOURCE_CONNECTION_TYPES,
  REGION_SOURCE_SNAPSHOT_SEED_KINDS,
  regionSourceConnectionCategoryLabel,
  regionSourceConnectionTypeLabel,
  regionSourceSnapshotSeedKindLabel,
  sourceConnectionStatusLabel,
  sourceConnectionTestResultLabel,
  type RegionSourceConnection,
  type RegionSourceTestResult,
  type SourceConnectionType,
} from "@features/region/sourceConnections";
import FeedSourceIntakeSurfaceTruthCallout from "@/features/review/FeedSourceIntakeSurfaceTruthCallout";

type FormState = {
  sourceType: SourceConnectionType;
  label: string;
  url: string;
  notes: string;
  snapshotSeedKind: "configured_region_source" | "example_seed";
  snapshotTemplateLabel: string;
  sampleTitle: string;
  sampleSummary: string;
  sampleTopics: string;
};

const INITIAL_FORM: FormState = {
  sourceType: "website_url",
  label: "",
  url: "",
  notes: "",
  snapshotSeedKind: "configured_region_source",
  snapshotTemplateLabel: "",
  sampleTitle: "",
  sampleSummary: "",
  sampleTopics: "",
};

function topicsFromInput(input: string) {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function SuggestionList(props: {
  items: Array<{ title: string; confidence: number; openQuestions?: string[] }>;
  emptyLabel: string;
}) {
  if (props.items.length === 0) {
    return <p className="text-xs text-[rgb(var(--muted))]">{props.emptyLabel}</p>;
  }
  return (
    <div className="space-y-2">
      {props.items.map((item) => (
        <div
          key={`${item.title}-${item.confidence}`}
          className="rounded-2xl border border-[rgb(var(--border))] p-2"
        >
          <p className="text-xs font-semibold text-[rgb(var(--fg))]">{item.title}</p>
          <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
            Confidence {item.confidence.toFixed(2)}
            {item.openQuestions?.length ? ` · ${item.openQuestions.length} offene Fragen` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function RegionSourceConnectionsPanel(props: {
  regionId: string;
  connections: RegionSourceConnection[];
  results: RegionSourceTestResult[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/region/source-connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        regionId: props.regionId,
        sourceType: form.sourceType,
        label: form.label,
        url: form.url.trim() || null,
        notes: form.notes.trim() || null,
        enabled: true,
        snapshotSeedKind: form.snapshotSeedKind,
        snapshotTemplateLabel: form.snapshotTemplateLabel.trim() || undefined,
        sampleItems:
          form.sampleTitle.trim() && form.sampleSummary.trim()
            ? [
                {
                  title: form.sampleTitle.trim(),
                  summary: form.sampleSummary.trim(),
                  url: form.url.trim() || null,
                  detectedTopics: topicsFromInput(form.sampleTopics),
                },
              ]
            : [],
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Quelle konnte nicht gespeichert werden.");
      return;
    }

    setMessage("Quelle gespeichert. Prüfe sie vor jeder weiteren Verwendung.");
    setForm(INITIAL_FORM);
    startTransition(() => router.refresh());
  }

  async function runSourceCheck(connectionId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(
      `/api/admin/region/source-connections/${encodeURIComponent(connectionId)}/test`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Quelle konnte nicht geprüft werden.");
      return;
    }
    setMessage("Prüfergebnis gespeichert. Aussagen und Vorschläge bleiben reviewpflichtig.");
    startTransition(() => router.refresh());
  }

  return (
    <section
      data-testid="admin-region-source-connections"
      className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]"
    >
      <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Quelle ergänzen
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
          Eine konkrete regionale Quelle aufnehmen
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Hinterlege Herkunft und Relevanz. Die Quelle wird nicht automatisch als verlässlich,
          amtlich oder veröffentlichungsfähig eingestuft.
        </p>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Quellentyp</span>
            <select
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sourceType: event.target.value as SourceConnectionType,
                }))
              }
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
            >
              {ORGANIZATION_SOURCE_CONNECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {regionSourceConnectionTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Name der Quelle</span>
            <input
              required
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="z. B. Bezirksamt – aktuelle Meldungen"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Adresse</span>
            <input
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({ ...current, url: event.target.value }))
              }
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Warum ist diese Quelle relevant?</span>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="min-h-[84px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="Zuständigkeit, Themenbezug oder bekannte Grenzen."
            />
          </label>

          <details className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
              Reproduzierbaren Pilot-Snapshot ergänzen
            </summary>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Optionale Beispieldaten bleiben klar als Pilot-/Fixture-Stand gekennzeichnet.
            </p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
                <span>Snapshot-Typ</span>
                <select
                  value={form.snapshotSeedKind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      snapshotSeedKind: event.target.value as FormState["snapshotSeedKind"],
                    }))
                  }
                  className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                >
                  {REGION_SOURCE_SNAPSHOT_SEED_KINDS.map((seedKind) => (
                    <option key={seedKind} value={seedKind}>
                      {regionSourceSnapshotSeedKindLabel(seedKind)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
                <span>Snapshot-Label</span>
                <input
                  value={form.snapshotTemplateLabel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      snapshotTemplateLabel: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
                <span>Beispieltitel</span>
                <input
                  value={form.sampleTitle}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sampleTitle: event.target.value }))
                  }
                  className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
                <span>Beispielzusammenfassung</span>
                <textarea
                  value={form.sampleSummary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sampleSummary: event.target.value }))
                  }
                  className="min-h-[72px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
                <span>Themen, komma-getrennt</span>
                <input
                  value={form.sampleTopics}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sampleTopics: event.target.value }))
                  }
                  className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                />
              </label>
            </div>
          </details>

          <details className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
              Sicherheits- und Prüfhinweise
            </summary>
            <div className="mt-3">
              <FeedSourceIntakeSurfaceTruthCallout surface="admin_region" />
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Quelle hinzufügen
            </button>
            {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
            {error ? <span className="text-sm text-rose-700">{error}</span> : null}
          </div>
        </form>
      </article>

      <div className="grid content-start gap-4">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Quellenbasis
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            {props.connections.length} verbundene Quellen
          </h2>
          <div className="mt-4 space-y-3">
            {props.connections.length > 0 ? (
              props.connections.map((connection) => (
                <div key={connection.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{connection.label}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {regionSourceConnectionTypeLabel(connection.sourceType)} ·{" "}
                        {regionSourceConnectionCategoryLabel(connection.sourceType)} ·{" "}
                        {sourceConnectionStatusLabel(
                          connection.status ??
                            (connection.enabled ? "active_review_required" : "draft"),
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void runSourceCheck(connection.id)}
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                    >
                      Quelle testen
                    </button>
                  </div>
                  <p className="mt-2 break-all text-sm text-[rgb(var(--muted))]">
                    {connection.url || "Keine externe Adresse hinterlegt."}
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Letzte Prüfung:{" "}
                    {sourceConnectionTestResultLabel(connection.latestTestResult?.status ?? "not_run")}
                  </p>
                  {connection.notes ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">{connection.notes}</p>
                  ) : null}
                  {connection.sourceSnapshotTemplate ? (
                    <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[rgb(var(--fg))]">
                        Pilot-Snapshot und Grenzen
                      </summary>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        {connection.sourceSnapshotTemplate.label} ·{" "}
                        {connection.sourceSnapshotTemplate.seedKindLabel}
                      </p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {connection.sourceSnapshotTemplate.reviewHint}
                      </p>
                    </details>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[rgb(var(--muted))]">
                Noch keine Quelle verbunden. Ergänze links eine konkrete Herkunft.
              </p>
            )}
          </div>
        </article>

        <article
          id="source-results"
          className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Prüfergebnisse
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            {props.results.length} reviewpflichtige Ergebnisse
          </h2>
          <div className="mt-4 space-y-3">
            {props.results.length > 0 ? (
              props.results.map((result) => (
                <div key={result.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{result.title}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {result.visibilityLabel} ·{" "}
                    {sourceConnectionTestResultLabel(result.testResult?.status ?? "not_run")} · Confidence{" "}
                    {result.confidence.toFixed(2)}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{result.summary}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-[rgb(var(--border))] p-2 text-xs text-[rgb(var(--muted))]">
                      {result.possibleClaims.length} Claim-Kandidaten
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] p-2 text-xs text-[rgb(var(--muted))]">
                      {result.evidenceReferences.length} Belege
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] p-2 text-xs text-[rgb(var(--muted))]">
                      {result.openQuestions.length} offene Fragen
                    </div>
                  </div>
                  <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                      Claims, Themen und Übergaben prüfen
                    </summary>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Claim-Kandidaten</p>
                        <div className="mt-2 space-y-2">
                          {result.possibleClaims.length > 0 ? (
                            result.possibleClaims.map((claim, index) => (
                              <p key={`${result.id}-claim-${index}`} className="text-xs text-[rgb(var(--muted))]">
                                {claim.text} · {claim.basisLabel} · Confidence {claim.confidence.toFixed(2)}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-[rgb(var(--muted))]">
                              Noch keine Claim-Kandidaten.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Offene Fragen</p>
                        <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                          {result.openQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Themencluster</p>
                        <div className="mt-2">
                          <SuggestionList
                            items={result.topicClusters.map((item) => ({
                              title: item.label,
                              confidence: item.confidence,
                              openQuestions: item.openQuestions,
                            }))}
                            emptyLabel="Noch keine Themencluster."
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Dossier-Vorschläge</p>
                        <div className="mt-2">
                          <SuggestionList
                            items={result.dossierSuggestions}
                            emptyLabel="Noch kein Dossier-Vorschlag."
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[rgb(var(--border))] p-3 lg:col-span-2">
                        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Quellen und Belege</p>
                        <div className="mt-2 space-y-2">
                          {result.evidenceReferences.length > 0 ? (
                            result.evidenceReferences.map((reference, index) => (
                              <div key={`${result.id}-evidence-${index}`}>
                                <p className="text-xs font-semibold text-[rgb(var(--fg))]">
                                  {reference.label}
                                </p>
                                {reference.excerpt ? (
                                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                                    {reference.excerpt}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[rgb(var(--muted))]">
                              Noch keine Belegauszüge verfügbar.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <p className="text-sm text-[rgb(var(--muted))]">
                Noch keine Prüfergebnisse. Teste zuerst eine konkrete Quelle.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
