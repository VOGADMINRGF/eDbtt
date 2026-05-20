"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ReviewQueueItem } from "@features/reviewQueue";

type Props = {
  itemId: string;
  sourceKind: "region_source_result" | "create_handoff";
  sourceId: string;
  contentReleaseWorkbench: NonNullable<ReviewQueueItem["contentReleaseWorkbench"]>;
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
  sourceKind: "region_source_result" | "create_handoff";
  sourceId: string;
  targetType: "dossier" | "anlassraum" | "topic_page";
  action: ActionState["action"];
}) {
  const res = await fetch("/api/admin/review/content-release", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "content_release_action_failed");
  }
}

export default function ContentReleaseWorkbenchActions(props: Props) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(actionState: ActionState) {
    const key = `${actionState.targetType}:${actionState.action}`;
    setPendingKey(key);
    setError(null);
    try {
      await postAction({
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
                {target.canPrepare ? (
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
                {target.canMakeVisible ? (
                  <button
                    type="button"
                    disabled={pendingKey === visibleKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "make_visible" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Sichtbar machen
                  </button>
                ) : null}
                {target.canPreparePublication ? (
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
                {target.canRevokeVisibility ? (
                  <button
                    type="button"
                    disabled={pendingKey === revokeKey}
                    onClick={() => runAction({ targetType: target.targetType, action: "retract_visibility" })}
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Sichtbarkeit zurücknehmen
                  </button>
                ) : null}
                {target.canArchive ? (
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
