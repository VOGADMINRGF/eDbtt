"use client";

import Link from "next/link";
import type { RathausDemoGraphSeedPreview } from "@features/region/rathausDemoSeed";

type CreateRathausDemoSourcePreviewProps = {
  preview: RathausDemoGraphSeedPreview;
};

function GuardrailBadge(props: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-300/70 bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
      {props.children}
    </span>
  );
}

export default function CreateRathausDemoSourcePreview({
  preview,
}: CreateRathausDemoSourcePreviewProps) {
  const isAdminPreview = preview.access.accessMode === "region_admin";

  return (
    <section className="rounded-[1.6rem] border border-sky-300/40 bg-[linear-gradient(180deg,rgba(240,249,255,0.98),rgba(232,244,255,0.98))] px-4 py-4 text-slate-950 shadow-[0_20px_48px_rgba(14,116,144,0.08)] md:px-5 md:py-5 dark:border-sky-300/25 dark:bg-slate-950 dark:text-slate-50 dark:shadow-none">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-800 dark:text-sky-200">
        <span>Offizielle regionale Quelle erkannt</span>
        <span>Reinickendorf</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold md:text-xl">{preview.procedureTitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {preview.source.sourceHostLabel}. Frist {preview.deadlineLabel} ist abgelaufen; Verfahren bleibt
        als {preview.procedureStatus} / {preview.archiveStatus} reviewpflichtig.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <GuardrailBadge>Frist abgelaufen</GuardrailBadge>
        <GuardrailBadge>closed</GuardrailBadge>
        <GuardrailBadge>archived</GuardrailBadge>
        <GuardrailBadge>reviewpflichtig</GuardrailBadge>
        <GuardrailBadge>kein Auto-Merge</GuardrailBadge>
      </div>

      <div className="mt-4 rounded-2xl border border-sky-300/45 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-sky-300/25 dark:bg-slate-900/80 dark:shadow-none">
        <p className="font-semibold text-slate-950 dark:text-slate-50">{preview.access.accessLabel}</p>
        {preview.access.warning ? (
          <p className="mt-2 text-slate-700 dark:text-slate-200">{preview.access.warning}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href={preview.source.canonicalUrl}
          className="rounded-full border border-sky-400/40 px-3 py-2 font-medium text-sky-900 hover:bg-sky-100 dark:text-sky-100 dark:hover:bg-slate-800"
        >
          Offizielle Quelle öffnen
        </Link>
        {isAdminPreview ? (
          <>
            <Link
              href={`/admin/region?regionId=${encodeURIComponent(preview.regionId)}`}
              className="rounded-full border border-slate-300/80 px-3 py-2 font-medium text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Region-Cockpit öffnen
            </Link>
            <Link
              href="/admin/review"
              className="rounded-full border border-slate-300/80 px-3 py-2 font-medium text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Review-Queue öffnen
            </Link>
          </>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
          Öffentliche Vorschau
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {preview.publicPreviewClusters.map((cluster) => (
            <article
              key={cluster.id}
              className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <p className="text-sm font-semibold">{cluster.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {cluster.summary}
              </p>
            </article>
          ))}
        </div>
      </div>

      {isAdminPreview ? (
        <div className="mt-6 space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Vollständige Seed-Kandidaten
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <GuardrailBadge>{preview.counts.dossiers} Dossiers</GuardrailBadge>
              <GuardrailBadge>{preview.counts.anlassraeume} Anlassräume</GuardrailBadge>
              <GuardrailBadge>{preview.counts.claims} Claims / Fragen / Optionen</GuardrailBadge>
              <GuardrailBadge>alle internal_review</GuardrailBadge>
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold">Dossiers</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {preview.dossiers.map((dossier) => (
                <article
                  key={dossier.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <span>{dossier.status}</span>
                    <span>{dossier.visibilityLabel}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{dossier.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {dossier.summary}
                  </p>
                  <Link
                    href={dossier.href}
                    className="mt-3 inline-flex rounded-full border border-slate-300/80 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Arbeitsstand öffnen
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold">Anlassräume</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {preview.anlassraeume.map((anlassraum) => (
                <article
                  key={anlassraum.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <span>{anlassraum.visibilityLabel}</span>
                    <span>3 Seed-Bausteine</span>
                    <span>{anlassraum.dossierIds.length} Dossier-Link(s)</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{anlassraum.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {anlassraum.summary}
                  </p>
                  <div className="mt-3 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
                    <p>{anlassraum.sourceStatement}</p>
                    <p>{anlassraum.understandingQuestion}</p>
                    <p>{anlassraum.decisionOption}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={anlassraum.href}
                      className="rounded-full border border-slate-300/80 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Anlassraum öffnen
                    </Link>
                    <Link
                      href={anlassraum.aliasHref}
                      className="rounded-full border border-slate-300/80 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Alias öffnen
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
