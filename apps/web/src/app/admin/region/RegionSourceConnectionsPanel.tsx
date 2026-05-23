"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ORGANIZATION_SOURCE_CONNECTION_TYPES,
  REGION_SOURCE_SNAPSHOT_SEED_KINDS,
  regionSourceConnectionCategoryLabel,
  regionSourceConnectionTypeLabel,
  regionSourceSnapshotSeedKindLabel,
  sourceConnectionScopeLabel,
  sourceConnectionStatusLabel,
  sourceConnectionTestResultLabel,
  type RegionSourceConnection,
  type RegionSourceTestResult,
  type SourceConnectionType,
} from "@features/region/sourceConnections";

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

function renderSuggestionList(
  items: Array<{ title: string; confidence: number; openQuestions?: string[] }>,
  emptyLabel: string,
) {
  if (items.length === 0) {
    return <p className="text-xs text-[rgb(var(--muted))]">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.title}-${item.confidence}`} className="rounded-2xl border border-[rgb(var(--border))] p-2">
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

    const payload = {
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
    };

    const res = await fetch("/api/admin/region/source-connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Konfiguration konnte nicht gespeichert werden.");
      return;
    }

    const statusLabel = body?.connection?.status
      ? sourceConnectionStatusLabel(body.connection.status)
      : "Quelle gespeichert.";
    setMessage(statusLabel);
    setForm(INITIAL_FORM);
    startTransition(() => router.refresh());
  }

  async function runDryRun(connectionId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/region/source-connections/${encodeURIComponent(connectionId)}/test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Dry Run konnte nicht ausgeführt werden.");
      return;
    }
    setMessage("Reviewpflichtiger Snapshot gespeichert.");
    startTransition(() => router.refresh());
  }

  return (
    <section
      id="source-results"
      data-testid="admin-region-source-connections"
      className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"
    >
      <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Quelle auswerten
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
          Explizite URL kontrolliert und reviewpflichtig auswerten
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Keine allgemeine Live-Suche, kein unkontrolliertes Scraping und kein automatischer
          DeepSearch- oder Research-Lauf. Der Dry Run prüft nur leichte Erreichbarkeit und Format,
          liest höchstens die angegebene Seite oder einen manuellen Snapshot, erzeugt daraus
          reviewpflichtige Vorschläge und veröffentlicht nichts automatisch.
        </p>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Regionale Source-Snapshot-Templates funktionieren für beliebige `regionId` und halten
          Demo-/Pilotstände reproduzierbar. Beispiel-Seeds bleiben optional und markieren keinen
          Produkt-Sonderfall.
        </p>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Quellentyp</span>
            <select
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourceType: event.target.value as SourceConnectionType }))
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
            <span>Label</span>
            <input
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="z. B. Stadtportal Nord, Kreisverwaltung News oder Lokalredaktion Mitte"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Explizite URL</span>
            <input
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Notiz</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-[84px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="Warum diese Quelle relevant ist."
            />
          </label>
          <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] p-3">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">
              Regionales Source-Snapshot-Template
            </p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Dieser Eintrag bleibt reviewpflichtig und kann zugleich als reproduzierbarer
              Snapshot für die regionale Startlage dienen. Kein Live-Crawler, kein Scraping und
              keine automatische Veröffentlichung.
            </p>
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
                placeholder="z. B. Regionales Snapshot-Template"
              />
            </label>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Titel</span>
              <input
                value={form.sampleTitle}
                onChange={(event) => setForm((current) => ({ ...current, sampleTitle: event.target.value }))}
                className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Optionale Beispielüberschrift"
              />
            </label>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Zusammenfassung</span>
              <textarea
                value={form.sampleSummary}
                onChange={(event) => setForm((current) => ({ ...current, sampleSummary: event.target.value }))}
                className="min-h-[84px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Optionale Beispielzusammenfassung"
              />
            </label>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Themen, komma-getrennt</span>
              <input
                value={form.sampleTopics}
                onChange={(event) => setForm((current) => ({ ...current, sampleTopics: event.target.value }))}
                className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Schule, Verkehr"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Quelle speichern
            </button>
            {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
            {error ? <span className="text-sm text-rose-700">{error}</span> : null}
          </div>
        </form>
      </article>

      <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Quellen und Dry Runs
        </p>
        <div className="mt-4 space-y-3">
          {props.connections.length > 0 ? (
            props.connections.map((connection) => (
              <div key={connection.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                    onClick={() => void runDryRun(connection.id)}
                    className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Dry Run testen
                  </button>
                </div>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {connection.url || "Keine externe URL hinterlegt."}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Scope: {sourceConnectionScopeLabel(connection.scope ?? "organization_region")} · Test:{" "}
                  {sourceConnectionTestResultLabel(connection.latestTestResult?.status ?? "not_run")}
                </p>
                {connection.latestTestResult?.summary ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {connection.latestTestResult.summary}
                  </p>
                ) : null}
                {connection.sourceSnapshotTemplate ? (
                  <div className="mt-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      {connection.sourceSnapshotTemplate.label}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {connection.sourceSnapshotTemplate.seedKindLabel}
                      {connection.sourceSnapshotTemplate.isExampleSeed
                        ? " · Beispiel-Seed"
                        : " · Region-generic"}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {connection.sourceSnapshotTemplate.reviewHint}
                    </p>
                  </div>
                ) : null}
                {connection.notes ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">{connection.notes}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine Quellen konfiguriert.</p>
          )}
        </div>

        <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Reviewpflichtige Source Results</p>
          {props.results.length > 0 ? (
            props.results.map((result) => (
              <div key={result.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{result.title}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  {regionSourceConnectionTypeLabel(result.sourceType)} · {result.visibilityLabel} ·{" "}
                  {sourceConnectionTestResultLabel(result.testResult.status)} · Confidence{" "}
                  {result.confidence.toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{result.summary}</p>
                {result.sourceSnapshotTemplate ? (
                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      {result.sourceSnapshotTemplate.label}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {result.sourceSnapshotTemplate.seedKindLabel}
                      {result.sourceSnapshotTemplate.isExampleSeed
                        ? " · Beispiel-Seed"
                        : " · Region-generic"}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {result.sourceSnapshotTemplate.reviewHint}
                    </p>
                  </div>
                ) : null}
                {result.sourceSnapshotTitle ? (
                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Gelesene Quelle
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{result.sourceSnapshotTitle}</p>
                    {result.sourceSnapshotSummary ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{result.sourceSnapshotSummary}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Mögliche Aussagen / Claims
                    </p>
                    {result.possibleClaims.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {result.possibleClaims.map((claim, index) => (
                          <div key={`${result.id}-claim-${index}`} className="rounded-2xl border border-[rgb(var(--border))] p-2">
                            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
                            <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                              {claim.basisLabel} · Confidence {claim.confidence.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        Noch keine möglichen Aussagen aus dieser Quelle erkannt.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Betroffene Region / Ortsteil / Fachbereich
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                      <p>Region: {result.affectedScope.regionName ?? "offen"}</p>
                      <p>
                        Ortsteil: {result.affectedScope.ortsteilHints.join(", ") || "noch kein klarer Hinweis"}
                      </p>
                      <p>
                        Fachbereich: {result.affectedScope.fachbereichHints.join(", ") || "noch kein klarer Hinweis"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Themencluster
                    </p>
                    <div className="mt-2">
                      {renderSuggestionList(
                        (result.sourceSnapshotTemplate?.topicCandidates ?? result.topicClusters).map((item) => ({
                          title: item.label,
                          confidence: item.confidence,
                          openQuestions: item.openQuestions,
                        })),
                        "Noch keine Themencluster vorbereitet.",
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Offene Fragen
                    </p>
                    {result.openQuestions.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                        {result.openQuestions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">Noch keine offenen Fragen erkannt.</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Anlassraum-Vorschläge
                    </p>
                    <div className="mt-2">
                      {renderSuggestionList(result.anlassraumSuggestions, "Noch kein Anlassraum-Vorschlag vorbereitet.")}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Dossier-Vorschläge
                    </p>
                    <div className="mt-2">
                      {renderSuggestionList(result.dossierSuggestions, "Noch kein Dossier-Vorschlag vorbereitet.")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Quellen / Belege
                    </p>
                    {result.evidenceReferences.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {(result.sourceSnapshotTemplate?.evidenceHints ?? result.evidenceReferences).map((reference, index) => (
                          <div key={`${result.id}-evidence-${index}`} className="rounded-2xl border border-[rgb(var(--border))] p-2">
                            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{reference.label}</p>
                            {reference.excerpt ? (
                              <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{reference.excerpt}</p>
                            ) : null}
                            {reference.url ? (
                              <p className="mt-1 break-all text-[11px] text-[rgb(var(--muted))]">{reference.url}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">Noch keine Belegauszüge verfügbar.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Review-Aufgaben
                    </p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {result.reviewTaskSummary.label}
                    </p>
                    {result.reviewSuggestions.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {result.reviewSuggestions.slice(0, 3).map((suggestion) => (
                          <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-2">
                            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{suggestion.title}</p>
                            <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{suggestion.summary}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        Noch keine zusätzlichen Review-Verdichtungen vorbereitet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine Dry-Run-Ergebnisse vorhanden.</p>
          )}
        </div>
      </article>
    </section>
  );
}
