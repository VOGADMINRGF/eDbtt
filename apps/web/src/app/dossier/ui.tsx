"use client";

import * as React from "react";
import Link from "next/link";
import VoxyGuide from "@/components/voxy/VoxyGuide";

const DOSSIER_VOXY_COPY =
  "Ich zeige dir, was aus deinem Beitrag schon verständlich wird, welche Fragen offen bleiben und was vor einer Veröffentlichung geprüft werden muss.";

const HANDOFF_STORAGE_KEY = "edb_create_handoff_drafts_v1";

type DossierHandoffPreview = {
  id: string;
  sourceText?: string;
  resumeHref?: string;
  plannerResult?: {
    plannerTopic?: string;
    plannerCore?: string;
  };
  openQuestions?: Array<{ id?: string; question?: string }>;
  claims?: Array<{ id?: string; text?: string }>;
};

function readableNextStepLabel(action?: string | null): string {
  switch (action) {
    case "append_to_dossier":
      return "Zusammenfassung ergänzen";
    case "create_dossier":
      return "Neue Themen-Zusammenfassung vorbereiten";
    case "request_factcheck":
      return "Prüfung vorbereiten";
    default:
      return "Nächsten Schritt auswählen";
  }
}

function readPreviewFromStorage(handoffId: string | null | undefined): DossierHandoffPreview | null {
  if (typeof window === "undefined") return null;
  const normalized = String(handoffId ?? "").trim();
  if (!normalized) return null;
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Record<string, DossierHandoffPreview>;
    const preview = store?.[normalized];
    return preview && typeof preview === "object" ? preview : null;
  } catch {
    return null;
  }
}

function DossierHandoffPreviewCard({ preview }: { preview: DossierHandoffPreview }) {
  const title = preview.plannerResult?.plannerCore?.trim() || preview.plannerResult?.plannerTopic?.trim() || "Aus deinem Beitrag vorbereitet";
  const topic = preview.plannerResult?.plannerTopic?.trim();
  const questions = (preview.openQuestions ?? []).filter((item) => item.question?.trim()).slice(0, 3);
  const claims = (preview.claims ?? []).filter((item) => item.text?.trim()).slice(0, 3);

  return (
    <section className="rounded-3xl border border-cyan-200/70 bg-[rgb(var(--card))] px-4 py-4 shadow-[0_18px_42px_rgba(2,6,23,0.06)] dark:border-cyan-300/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Aus deinem Beitrag vorbereitet</p>
      <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
      {topic ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">Thema: {topic}</p> : null}
      {preview.sourceText ? (
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{preview.sourceText}</p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Kernaussagen</p>
          {claims.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--fg))]">
              {claims.map((claim, index) => <li key={claim.id ?? index}>{claim.text}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keine Kernaussagen übernommen.</p>
          )}
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Offene Fragen</p>
          {questions.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--fg))]">
              {questions.map((question, index) => <li key={question.id ?? index}>{question.question}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keine offenen Fragen übernommen.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {preview.resumeHref ? (
          <Link href={preview.resumeHref} className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
            Beitrag weiter bearbeiten
          </Link>
        ) : null}
        <Link href="/community/contributions" className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
          Zur Prüfung
        </Link>
      </div>
    </section>
  );
}

export default function DossierIndexClient(props: {
  handoffId?: string | null;
  createAction?: string | null;
  seedTopic?: string | null;
}) {
  const [preview, setPreview] = React.useState<DossierHandoffPreview | null>(null);

  React.useEffect(() => {
    setPreview(readPreviewFromStorage(props.handoffId));
  }, [props.handoffId]);

  return (
    <div className="public-shell mx-auto w-full px-4 py-8 sm:px-6 sm:py-10">
      <div className="public-reader-grid">
        <aside className="public-voxy-rail">
          <VoxyGuide appearance="compact" title="Voxy als Prüfhinweis" variant="hint">
            {DOSSIER_VOXY_COPY}
          </VoxyGuide>
        </aside>

        <div className="public-dialog-area">
          <div className="public-section space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Themen-Zusammenfassung</p>
            <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Aus deinem Beitrag wird ein verständlicher Überblick.</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Eine Themen-Zusammenfassung bündelt Anliegen, prüfbare Aussagen, Quellenfragen, Gegenpositionen, Zuständigkeit und offene Punkte. Nichts wird automatisch veröffentlicht oder irgendwo angehängt.
            </p>
          </div>

          {preview ? (
            <div className="public-proof-zone mt-5 space-y-3">
              <DossierHandoffPreviewCard preview={preview} />
            </div>
          ) : (
            <div className="public-dialog-surface mt-5 space-y-4 px-4 py-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  Noch keine Themen-Zusammenfassung geöffnet.
                </p>
                <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                  Starte mit einem kurzen Beitrag. eDebatte kann daraus eine erste Struktur vorbereiten: Was ist die Kernfrage, welche Aussagen sind prüfbar, welche Belege fehlen und welche Gegenpositionen sollten sichtbar werden?
                  {props.seedTopic ? ` Themenhinweis: ${props.seedTopic}.` : ""}
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <strong className="block text-[rgb(var(--fg))]">Was entsteht?</strong>
                  Beitrag, Kernaussagen, Quellenfragen, offene Punkte und nächster Prüfschritt.
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <strong className="block text-[rgb(var(--fg))]">Was passiert nicht?</strong>
                  Keine automatische Veröffentlichung, keine automatische Verknüpfung, keine Entscheidung ohne Prüfung.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/create?intent=create_dossier" className="btn-primary min-h-[42px] px-3 py-2 text-sm">
                  Beitrag zusammenfassen lassen
                </Link>
                <Link href="/themen" className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
                  Beispielthemen ansehen
                </Link>
              </div>
            </div>
          )}

          <div className="public-flow-line mt-5 px-0 pt-4 text-sm text-[rgb(var(--muted))]">
            Nächster Schritt: {readableNextStepLabel(props.createAction)} · Veröffentlichung oder Verknüpfung erfolgt erst nach bewusster Bestätigung.
          </div>
        </div>
      </div>
    </div>
  );
}
