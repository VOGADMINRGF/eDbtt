"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DossierAtlasLandscapeContract } from "@features/anlassraum/dossierAtlasLandscapeContract";

type AtlasClientProps = {
  atlas: DossierAtlasLandscapeContract;
  sourceState?: "live" | "fallback";
};

type AtlasMode = "struktur" | "fluss";

function statusLabel(value: string) {
  if (value === "open") return "Offen";
  if (value === "active") return "Aktiv";
  if (value === "closed") return "Abgeschlossen";
  if (value === "archived") return "Archiviert";
  if (value === "monitoring") return "Monitoring";
  if (value === "in_progress") return "In Bearbeitung";
  if (value === "review") return "In Prüfung";
  if (value === "completed") return "Abgeschlossen";
  return "Unbekannt";
}

function contextLabel(key: string) {
  if (key === "association") return "Verband/Verein";
  if (key === "initiative") return "Initiative";
  if (key === "organization") return "Organisation";
  if (key === "editorial_publisher") return "Redaktion/Publisher";
  if (key === "civic_creator") return "Civic/Creator";
  if (key === "expert_voice") return "Experten/Fachstimme";
  return key;
}

export default function AtlasClient({
  atlas,
  sourceState = "live",
}: AtlasClientProps) {
  const [mode, setMode] = useState<AtlasMode>("struktur");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    atlas.topicAxis.clusters[0]?.topicKey ?? null,
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        anlaesse: Array<{ id: string; label: string; lifecycle: string; workState: string }>;
        dossiers: Array<{ id: string; label: string; lifecycle: string }>;
        runden: Array<{ id: string; label: string; lifecycle: string; workState: string }>;
        ergebnisse: Array<{ id: string; label: string }>;
        companions: Array<{ id: string; label: string }>;
      }
    >();

    for (const node of atlas.nodes) {
      const topicKey = node.topicAxis?.topicKey;
      if (!topicKey) continue;
      const bucket = map.get(topicKey) ?? {
        anlaesse: [],
        dossiers: [],
        runden: [],
        ergebnisse: [],
        companions: [],
      };

      if (node.nodeType === "anlass_node") {
        bucket.anlaesse.push({
          id: node.nodeId,
          label: node.label,
          lifecycle: node.statusLayer.lifecycle,
          workState: node.statusLayer.workState,
        });
      } else if (node.nodeType === "dossier_node") {
        bucket.dossiers.push({
          id: node.nodeId,
          label: node.label,
          lifecycle: node.statusLayer.lifecycle,
        });
      } else if (node.nodeType === "round_node") {
        bucket.runden.push({
          id: node.nodeId,
          label: node.label,
          lifecycle: node.statusLayer.lifecycle,
          workState: node.statusLayer.workState,
        });
      } else if (node.nodeType === "result_node") {
        bucket.ergebnisse.push({
          id: node.nodeId,
          label: node.label,
        });
      } else if (node.nodeType === "companion_node") {
        bucket.companions.push({
          id: node.nodeId,
          label: node.label,
        });
      }

      map.set(topicKey, bucket);
    }

    return map;
  }, [atlas.nodes]);

  const selectedCluster = atlas.topicAxis.clusters.find(
    (cluster) => cluster.topicKey === selectedTopic,
  );
  const selectedGroup = selectedTopic ? grouped.get(selectedTopic) : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[98rem] space-y-6 px-4 py-6 md:px-8 md:py-8 lg:px-10">
      <header className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[rgb(var(--grad-from))]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />

        <div className="relative space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            DOSSIER-ATLAS
          </p>
          <h1
            className="text-3xl font-semibold leading-tight md:text-4xl"
            style={{
              backgroundImage: `linear-gradient(120deg,
                rgba(var(--fg),0.98) 0%,
                rgba(var(--grad-to),0.82) 92%)`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Themenlandschaft als Makrostruktur
          </h1>
          <p className="max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            Read-only Sicht auf Themen, Anlassräume, Dossiers, Runden, Ergebnisse und
            Kontextmarker. Thema und Region bleiben getrennt, ohne Wahrheits- oder Prioritätsranking.
          </p>
          <div className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]">
            Read-only • kein Auto-Publish • keine Toplist-Logik
          </div>
          <p className="text-xs text-[rgb(var(--muted))]">
            Wochen-Snapshot ist als exportierbarer Payload auf Contract-Basis ableitbar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/atlas/weekly"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              Wochenatlas öffnen →
            </Link>
            <Link
              href="/atlas/social-review"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              Social-Review-Queue
            </Link>
            <Link
              href="/runden"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--card))]"
            >
              Zur Betriebsfläche /runden
            </Link>
          </div>
        </div>
      </header>

      <section id="atlas-summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Themencluster" value={atlas.aggregates.totals.topics} />
        <MetricCard label="Anlassräume" value={atlas.aggregates.totals.anlaesse} />
        <MetricCard label="Runden aktiv" value={atlas.aggregates.weeklySnapshot.activeRounds} />
        <MetricCard label="Folgeverläufe" value={atlas.aggregates.weeklySnapshot.followupFlows} />
      </section>

      <nav
        aria-label="Atlas-Bereiche"
        className="overflow-x-auto rounded-xl border bg-[rgb(var(--card))] px-2 py-2"
      >
        <div className="flex min-w-max gap-2">
          <SectionAnchor href="#atlas-summary" label="Summary" />
          <SectionAnchor href={mode === "struktur" ? "#atlas-structure" : "#atlas-flow"} label="Ansicht" />
          <SectionAnchor href="#atlas-region-context" label="Region/Kontext" />
          <SectionAnchor href="#atlas-guardrails" label="Guardrails" />
        </div>
      </nav>

      {sourceState === "fallback" ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Atlas-Daten sind gerade nicht vollständig verfügbar. Die Oberfläche zeigt einen
          degradierten Read-only Stand ohne Schreib- oder Publikationsfunktion.
        </section>
      ) : null}

      <section className="space-y-3">
        <nav className="inline-flex w-full gap-1 rounded-xl border bg-[rgb(var(--card))] p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setMode("struktur")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "struktur"
                ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted))]"
            }`}
          >
            Strukturansicht
          </button>
          <button
            type="button"
            onClick={() => setMode("fluss")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "fluss"
                ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted))]"
            }`}
          >
            Flussansicht
          </button>
        </nav>
      </section>

      {mode === "struktur" ? (
        <section id="atlas-structure" className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <article className="space-y-4 rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                Themenachse
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Cluster zeigen Zusammenhänge, nicht Wichtigkeitsränge.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {atlas.topicAxis.clusters
                .slice()
                .sort((a, b) => a.topicLabel.localeCompare(b.topicLabel, "de"))
                .map((cluster) => {
                  const selected = selectedTopic === cluster.topicKey;
                  return (
                    <button
                      key={cluster.topicKey}
                      type="button"
                      onClick={() => setSelectedTopic(cluster.topicKey)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[rgb(var(--grad-from))]/55 bg-[rgb(var(--bg))]"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                        {cluster.topicLabel}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[rgb(var(--muted))]">
                        <FlowChip label={`Anlass ${cluster.anlassCount}`} />
                        <FlowChip label={`Dossier ${cluster.dossierCount}`} />
                        <FlowChip label={`Runde ${cluster.roundCount}`} />
                        <FlowChip label={`Ergebnis ${cluster.resultCount}`} />
                      </div>
                    </button>
                  );
                })}
            </div>

            {selectedCluster && selectedGroup ? (
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                    {selectedCluster.topicLabel}
                  </h3>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">
                    Detailansicht
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <NodeBlock
                    title="Anlassräume"
                    items={selectedGroup.anlaesse.map((item) => ({
                      key: item.id,
                      label: item.label,
                      meta: `${statusLabel(item.lifecycle)} · ${statusLabel(item.workState)}`,
                    }))}
                  />
                  <NodeBlock
                    title="Dossiers"
                    items={selectedGroup.dossiers.map((item) => ({
                      key: item.id,
                      label: item.label,
                      meta: statusLabel(item.lifecycle),
                    }))}
                  />
                  <NodeBlock
                    title="Runden"
                    items={selectedGroup.runden.map((item) => ({
                      key: item.id,
                      label: item.label,
                      meta: `${statusLabel(item.lifecycle)} · ${statusLabel(item.workState)}`,
                    }))}
                  />
                  <NodeBlock
                    title="Ergebnisse / Companion"
                    items={[
                      ...selectedGroup.ergebnisse.map((item) => ({
                        key: item.id,
                        label: item.label,
                        meta: "Ergebnis",
                      })),
                      ...selectedGroup.companions.map((item) => ({
                        key: item.id,
                        label: item.label,
                        meta: "Companion",
                      })),
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </article>

          <aside id="atlas-region-context" className="space-y-4">
            <article className="rounded-2xl border bg-[rgb(var(--card))] p-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                Regionenachse
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Regionen sind eigener Sichtmodus, keine Themenhoheit.
              </p>
              <div className="mt-3 space-y-2">
                {atlas.regionAxis.regions.length === 0 ? (
                  <p className="text-xs text-[rgb(var(--muted))]">Keine Regionszuordnung vorhanden.</p>
                ) : (
                  atlas.regionAxis.regions
                    .slice()
                    .sort((a, b) => a.label.localeCompare(b.label, "de"))
                    .map((region) => (
                      <div
                        key={region.regionKey}
                        className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2.5"
                      >
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                          {region.label}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Anlass {region.anlassCount} · Runden {region.roundCount} · Ergebnisse {region.resultCount}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border bg-[rgb(var(--card))] p-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                Kontextmarker
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Sichtbarkeit von Arbeitskontexten ohne Wahrheitsprivileg.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(atlas.contextGroups).map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs text-[rgb(var(--muted))]"
                  >
                    {contextLabel(key)}: {value}
                  </span>
                ))}
              </div>
            </article>
          </aside>
        </section>
      ) : (
        <section id="atlas-flow" className="space-y-4 rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
            Flussansicht (light)
          </h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Thema → Anlassraum → Dossier → Runde → Ergebnis als Lesefluss.
          </p>
          <div className="space-y-3">
            {atlas.topicAxis.clusters
              .slice()
              .sort((a, b) => a.topicLabel.localeCompare(b.topicLabel, "de"))
              .map((cluster) => (
                <article
                  key={cluster.topicKey}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                >
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                    {cluster.topicLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-[rgb(var(--muted))]">
                    <FlowChip label={`Anlass ${cluster.anlassCount}`} />
                    <span>→</span>
                    <FlowChip label={`Dossiers ${cluster.dossierCount}`} />
                    <span>→</span>
                    <FlowChip label={`Runden ${cluster.roundCount}`} />
                    <span>→</span>
                    <FlowChip label={`Ergebnisse ${cluster.resultCount}`} />
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}

      <section id="atlas-guardrails" className="rounded-2xl border bg-[rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
          Guardrails
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
          <li>Thema und Region bleiben getrennte Achsen.</li>
          <li>Kontextmarker erzeugen kein Wahrheits-, Prioritäts- oder Abstimmungsprivileg.</li>
          <li>Feed bleibt Signalquelle, kein Auto-Publish im Atlas.</li>
          <li>Read-only first: keine Schreib- oder Freigabefunktion in dieser Oberfläche.</li>
        </ul>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-[rgb(var(--card))] p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))] md:text-3xl">{value}</p>
    </article>
  );
}

function FlowChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5">
      {label}
    </span>
  );
}

function SectionAnchor({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--card))] hover:text-[rgb(var(--fg))]"
    >
      {label}
    </a>
  );
}

function NodeBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; meta: string }>;
}) {
  return (
    <section className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {title}
        </h4>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--muted))]">
          {items.length}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-[rgb(var(--muted))]">Keine Einträge</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div key={item.key} className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2">
              <p className="text-xs font-semibold text-[rgb(var(--fg))]">{item.label}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">{item.meta}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
