"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ReviewQueueItem } from "@features/reviewQueue";
import type { ContentReleasePersistenceState } from "@features/contentReleaseWorkbench";
import { DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES } from "@/features/review/dossierExportShareTruth";

type Props = {
  itemId: string;
  sourceKind: "region_source_result" | "create_handoff";
  sourceId: string;
  contentReleasePersistence: ContentReleasePersistenceState;
  contentReleaseWorkbench: NonNullable<ReviewQueueItem["contentReleaseWorkbench"]>;
  endpoint?: string;
  scopeCopy?: string | null;
  allowPrepare?: boolean;
  allowMakeVisible?: boolean;
  allowPreparePublication?: boolean;
  allowRevokeVisibility?: boolean;
  allowArchive?: boolean;
};

type ActionState = {
  targetType: "dossier" | "anlassraum" | "topic_page";
  action:
    | "prepare_target"
    | "make_visible"
    | "prepare_publication"
    | "retract_visibility"
    | "archive_target";
};

async function postAction(input: {
  endpoint: string;
  sourceKind: "region_source_result" | "create_handoff";
  sourceId: string;
  targetType: "dossier" | "anlassraum" | "topic_page";
  action: ActionState["action"];
}) {
  const res = await fetch(input.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.message ?? body?.error ?? "content_release_action_failed");
  }
}

export default function ContentReleaseWorkbenchActions(props: Props) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actionEndpoint = props.endpoint ?? "/api/admin/review/content-release";

  async function runAction(actionState: ActionState) {
    const key = `${actionState.targetType}:${actionState.action}`;
    setPendingKey(key);
    setError(null);
    try {
      await postAction({
        endpoint: actionEndpoint,
        sourceKind: props.sourceKind,
        sourceId: props.sourceId,
        targetType: actionState.targetType,
        action: actionState.action,
      });
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "content_release_action_failed");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        Review-to-Publish Workspace
      </p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{props.contentReleaseWorkbench.intro}</p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        eDebatte bereitet Inhalte veröffentlichbar vor. Du entscheidest, was sichtbar wird.
        Sichtbar heißt nicht automatisch amtlich.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[2]}
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[3]}
      </p>
      <p className="mt-2 rounded-xl border border-violet-300/45 bg-violet-500/[0.06] px-3 py-2 text-xs leading-5 text-[rgb(var(--fg))]" data-ai-transparency-publish-guard="">
        Vor öffentlicher Sichtbarkeit müssen KI-Status, menschliche Prüfung,
        redaktionelle Freigabe, sichtbares Label und Provenienz vollständig
        dokumentiert sein. Fehlende oder unbekannte Angaben blockieren fail-closed.
      </p>
      {props.scopeCopy ? (
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">{props.scopeCopy}</p>
      ) : null}
      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
          Persistierte Sichtbarkeit
        </p>
        <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
          {props.contentReleasePersistence.label}
        </p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          {props.contentReleasePersistence.summary}
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {props.contentReleaseWorkbench.targets.map((target) => {
          const prepareKey = `${target.targetType}:prepare_target`;
          const visibleKey = `${target.targetType}:make_visible`;
          const publicationKey = `${target.targetType}:prepare_publication`;
          const revokeKey = `${target.targetType}:retract_visibility`;
          const archiveKey = `${target.targetType}:archive_target`;
          return (
            <article key={`${props.itemId}:${target.targetType}`} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">{target.targetLabel}</span>
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">{target.statusLabel}</span>
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">{target.visibilityLabel}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">{target.suggestedTitle}</h3>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">{target.statusHint}</p>
              {target.auditEvents.length > 0 ? (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Audit-Events: {target.auditEvents.length}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {target.canPrepare && props.allowPrepare !== false ? (
                  <button
                    type="button"
                    disabled={pendingKey === prepareKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "prepare_target" })}
                    className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {target.targetType === "dossier"
                      ? "Als Dossier-Entwurf übernehmen"
                      : target.targetType === "anlassraum"
                        ? "Als Anlassraum vorbereiten"
                        : "Als öffentliche Themenseite vorbereiten"}
                  </button>
                ) : null}
                {target.prepared && target.previewHref ? (
                  <Link
                    href={target.previewHref}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    Vorschau ansehen
                  </Link>
                ) : null}
                {target.canMakeVisible && props.allowMakeVisible !== false ? (
                  <button
                    type="button"
                    disabled={pendingKey === visibleKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "make_visible" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Sichtbar machen
                  </button>
                ) : null}
                {target.canPreparePublication && props.allowPreparePublication !== false ? (
                  <button
                    type="button"
                    disabled={pendingKey === publicationKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "prepare_publication" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Veröffentlichen vorbereiten
                  </button>
                ) : null}
                {target.publicLink ? (
                  <Link
                    href={target.publicLink.href}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    Öffentliche URL anzeigen
                  </Link>
                ) : null}
                {target.publicLink ? (
                  <Link
                    href={target.publicLink.shareHref}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    Share-Link öffnen
                  </Link>
                ) : null}
                {target.canCreateQrLink && target.qrHref ? (
                  <Link
                    href={target.qrHref}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    QR-Link erstellen
                  </Link>
                ) : null}
                {target.canRevokeVisibility && props.allowRevokeVisibility !== false ? (
                  <button
                    type="button"
                    disabled={pendingKey === revokeKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "retract_visibility" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Sichtbarkeit zurücknehmen
                  </button>
                ) : null}
                {target.canArchive && props.allowArchive !== false ? (
                  <button
                    type="button"
                    disabled={pendingKey === archiveKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "archive_target" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
                  >
                    Archivieren
                  </button>
                ) : null}
              </div>
              {target.publicLink ? (
                <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                  Öffentliche URL / Share-Link: <span className="font-mono">{target.publicLink.href}</span>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
