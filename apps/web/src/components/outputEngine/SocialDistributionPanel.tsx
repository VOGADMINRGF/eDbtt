"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publicationVisibilityLabel } from "@features/region/publicationRiskLadder";
import {
  buildCopyText,
  buildDistributionPlan,
  buildDraftRecord,
  buildQrPrintPreview,
  buildSocialDistributionExportPayload,
  validateDistributionExport,
} from "@features/outputEngine/distributionExport";
import {
  socialChannelConnectionLabel,
  socialSchedulerStatusLabel,
  type SocialChannelConnection,
  type SocialSchedulerEntry,
} from "@features/outputEngine/socialConnectorScheduler";
import {
  buildSocialDistributionDraft,
  buildSocialDistributionQueue,
  type SocialDistributionChannel,
  type SocialConnectorStatus,
  type SocialDistributionDraft,
  type SocialDistributionPlan,
  type SocialDistributionTarget,
  type SocialScheduleMode,
} from "@features/outputEngine/socialDistribution";
import type { SocialDistributionQueueReadModel } from "@features/outputEngine/socialDistributionQueueReadModel";
import { socialDistributionStatusLabel } from "@features/outputEngine/socialDistributionStatusContract";
import { recordStudioTelemetryEvent } from "@features/outputEngine/studioTelemetry";
import type { MasterPost } from "@features/outputEngine/masterPost";
import type { SocialCarouselOutput } from "@features/outputEngine/socialCarousel";
import { buildDossierExportShareSemanticsLines } from "@/features/review/dossierExportShareTruth";

type SocialDistributionPanelProps = {
  plan: SocialDistributionPlan;
  dossierId: string;
  reviewRequired: boolean;
  dossierBacklink: string;
  masterPost: MasterPost;
  carouselDraft: SocialCarouselOutput;
  workspaceApiPath?: string;
  initialDistributionDraft?: SocialDistributionDraft | null;
  queueReadModel?: SocialDistributionQueueReadModel | null;
};

type StudioScheduleChoice = "draft" | "suggested" | "scheduled" | "after_review";

type PersistedDistributionSnapshot = {
  postId: string;
  status: string;
  channelConnections: SocialChannelConnection[];
  scheduler: SocialSchedulerEntry[];
};

function keyForPlan(dossierId: string) {
  return `edebatte:studio:distribution-plan:${dossierId}`;
}

function keyForQueue(dossierId: string) {
  return `edebatte:studio:distribution-queue:${dossierId}`;
}

function connectorLabel(status: SocialDistributionTarget["connectorStatus"]): string {
  if (status === "internal_available") return "Intern verfügbar";
  if (status === "not_connected") return "Nicht verbunden";
  if (status === "configured") return "Konfiguration erforderlich";
  if (status === "disabled_by_policy") return "Nur Export";
  if (status === "requires_review") return "Review erforderlich";
  return "Später verfügbar";
}

function distributionStatusLabel(status: SocialDistributionTarget["distributionStatus"]): string {
  return socialDistributionStatusLabel(status);
}

function connectorHint(status: SocialDistributionTarget["connectorStatus"]): string {
  if (status === "internal_available") return "Kanal im Systempfad verfügbar.";
  if (status === "configured") return "Konfiguration vorhanden, Review bleibt verpflichtend.";
  if (status === "disabled_by_policy") return "Nur Export/Kopieren möglich.";
  if (status === "requires_review") return "Review vor weiterer Planung abschließen.";
  if (status === "available_later") return "Geplanter Anschluss in späterem Slice.";
  return "Kanal nicht verbunden.";
}

function formatTypeForChannel(channel: SocialDistributionTarget["channel"]): string {
  if (channel === "website_update") return "Web-Update";
  if (channel === "newsletter_draft") return "Newsletter-Text";
  if (channel === "embed_snippet") return "Einbettung";
  if (channel === "qr_asset") return "Handout / QR";
  if (channel === "linkedin_draft") return "Sachpost";
  if (channel === "x_draft" || channel === "mastodon_draft") return "Kurzpost";
  if (channel === "instagram_asset") return "Caption + Carousel";
  return "Pressenotiz";
}

function shortText(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function connectionAuthModeLabel(authMode: SocialChannelConnection["authMode"]): string {
  switch (authMode) {
    case "internal":
      return "Interner Systempfad";
    case "oauth_optional":
      return "Optionaler OAuth-Connector";
    case "token_optional":
      return "Optionaler Token-Connector";
    case "disabled":
      return "Deaktiviert";
    case "manual_export":
    default:
      return "Manueller Export";
  }
}

function schedulerActionHint(status: SocialSchedulerEntry["status"]): string {
  switch (status) {
    case "approved":
      return "Freigegeben, aber noch nicht terminiert.";
    case "scheduled":
      return "Termin gesetzt, aber noch nicht gepostet.";
    case "posting":
      return "Posting läuft kontrolliert und bleibt auditierbar.";
    case "posted":
      return "Posting wurde protokolliert, kein Multi-Channel-Autopublish.";
    case "failed":
      return "Fehler protokolliert, manueller Export bleibt möglich.";
    case "cancelled":
      return "Planung wurde bewusst gestoppt.";
    case "draft":
    default:
      return "Noch kein freigegebener Scheduler-Schritt.";
  }
}

function snapshotFromQueueReadModel(
  queueReadModel: SocialDistributionQueueReadModel | null | undefined,
  dossierId: string,
): PersistedDistributionSnapshot | null {
  const source = queueReadModel?.items.find(
    (item) => item.dossierId === dossierId && item.derived === false,
  );
  if (!source) return null;
  const postId = source.id.split(":")[0]?.trim();
  if (!postId) return null;
  return {
    postId,
    status: source.status,
    channelConnections: source.channelConnections,
    scheduler: source.scheduler,
  };
}

function snapshotFromPayload(payload: unknown): PersistedDistributionSnapshot | null {
  const post = payload as
    | {
        post?: {
          id?: unknown;
          status?: unknown;
          channelConnections?: unknown;
          scheduler?: unknown;
        };
      }
    | null;
  if (!post?.post || typeof post.post.id !== "string" || typeof post.post.status !== "string") {
    return null;
  }
  if (!Array.isArray(post.post.channelConnections) || !Array.isArray(post.post.scheduler)) {
    return null;
  }
  return {
    postId: post.post.id,
    status: post.post.status,
    channelConnections: post.post.channelConnections as SocialChannelConnection[],
    scheduler: post.post.scheduler as SocialSchedulerEntry[],
  };
}

export default function SocialDistributionPanel({
  plan,
  dossierId,
  reviewRequired,
  dossierBacklink,
  masterPost,
  carouselDraft,
  workspaceApiPath,
  initialDistributionDraft,
  queueReadModel,
}: SocialDistributionPanelProps) {
  const exportShareSemantics = buildDossierExportShareSemanticsLines("publish_ready");
  const initialPersistedSnapshot = snapshotFromQueueReadModel(queueReadModel, dossierId);
  const [selectedChannels, setSelectedChannels] = useState<Set<SocialDistributionChannel>>(
    new Set(initialDistributionDraft?.selectedChannels ?? plan.selectedChannels),
  );
  const [connectorOverrides, setConnectorOverrides] = useState<
    Partial<Record<SocialDistributionChannel, SocialConnectorStatus>>
  >({});
  const [scheduleChoice, setScheduleChoice] = useState<StudioScheduleChoice>(() => {
    switch (initialDistributionDraft?.scheduleMode) {
      case "manual":
        return "draft";
      case "scheduled_at":
        return "scheduled";
      case "immediate_after_review":
        return "after_review";
      default:
        return "suggested";
    }
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [queueCancelled, setQueueCancelled] = useState<Set<string>>(new Set());
  const [persistedSnapshot, setPersistedSnapshot] = useState<PersistedDistributionSnapshot | null>(
    initialPersistedSnapshot,
  );

  const nextWindow = plan.suggestedPostingWindows[0] ?? "Kein Zeitfenster vorhanden";
  const persistedPostId = persistedSnapshot?.postId ?? null;

  const targetsWithOverrides = useMemo(
    () =>
      plan.targets.map((target) => ({
        ...target,
        connectorStatus: connectorOverrides[target.channel] ?? target.connectorStatus,
      })),
    [plan.targets, connectorOverrides],
  );

  const selectedLabels = useMemo(
    () =>
      targetsWithOverrides
        .filter((target) => selectedChannels.has(target.channel))
        .map((target) => target.label),
    [targetsWithOverrides, selectedChannels],
  );

  const selectedList = useMemo(
    () => Array.from(selectedChannels.values()),
    [selectedChannels],
  );

  const queueItems = useMemo(
    () =>
      buildSocialDistributionQueue(
        {
          ...plan,
          targets: targetsWithOverrides,
        },
        selectedList,
      ),
    [plan, selectedList, targetsWithOverrides],
  );
  const qrPrintPreview = useMemo(() => buildQrPrintPreview(masterPost), [masterPost]);
  const schedulerEntries = persistedSnapshot?.scheduler ?? [];
  const connectionByChannel = useMemo(
    () => new Map((persistedSnapshot?.channelConnections ?? []).map((entry) => [entry.channel, entry])),
    [persistedSnapshot],
  );

  useEffect(() => {
    recordStudioTelemetryEvent({
      name: "master_post_generated",
      dossierId,
    });
  }, [dossierId]);

  useEffect(() => {
    if (!persistedSnapshot && initialPersistedSnapshot) {
      setPersistedSnapshot(initialPersistedSnapshot);
    }
  }, [initialPersistedSnapshot, persistedSnapshot]);

  const toggleChannel = (channel: SocialDistributionChannel) => {
    setSelectedChannels((current) => {
      const next = new Set(current);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  };

  const scheduleModeFromChoice = (choice: StudioScheduleChoice): SocialScheduleMode => {
    if (choice === "draft") return "manual";
    if (choice === "scheduled") return "scheduled_at";
    if (choice === "after_review") return "immediate_after_review";
    return "suggested_window";
  };

  const currentPlanForPersistence = () => ({
    ...plan,
    targets: targetsWithOverrides,
    selectedChannels: selectedList,
    selectedCount: selectedList.length,
    scheduleMode: scheduleModeFromChoice(scheduleChoice),
  });

  const persistWorkspace = async (distributionDraft: SocialDistributionDraft, reviewNote?: string) => {
    if (!workspaceApiPath) return;
    try {
      const res = await fetch(workspaceApiPath, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          distributionDraft,
          carouselDraft,
          reviewNotes: reviewNote ?? null,
          status: distributionDraft.reviewRequired ? "needs_review" : "draft",
        }),
      });
      if (!res.ok) {
        setNotice(
          "Serverseitiges Speichern fehlgeschlagen. Der Browser-Entwurf bleibt lokal und ist nicht produktiv.",
        );
        return;
      }
      setNotice("Arbeitsstand serverseitig gespeichert, reviewpflichtig, nicht veröffentlicht.");
    } catch {
      setNotice(
        "Serverseitiges Speichern fehlgeschlagen. Der Browser-Entwurf bleibt lokal und ist nicht produktiv.",
      );
    }
  };

  const persistProductionDraft = async (
    reviewNote?: string,
    initialStatus:
      | "draft_created"
      | "asset_generated"
      | "needs_review"
      | "review_requested"
      | "queued"
      | "scheduled_ready" = "draft_created",
  ) => {
    if (!workspaceApiPath || selectedList.length === 0) return;
    try {
      const res = await fetch(workspaceApiPath, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          socialDistributionAction: "create_draft",
          plan: currentPlanForPersistence(),
          selectedChannels: selectedList,
          initialStatus,
          note: reviewNote ?? null,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(
          payload?.message ??
            "Produktiver Verteilentwurf konnte nicht gespeichert werden. Review- oder Freischaltungsstatus prüfen.",
        );
        return;
      }
      const snapshot = snapshotFromPayload(payload);
      if (snapshot) setPersistedSnapshot(snapshot);
      setNotice("Handoff gespeichert. Review erforderlich, kein Auto-Publish und keine ungeprüfte Verteilung.");
    } catch {
      setNotice("Produktiver Verteilentwurf konnte nicht gespeichert werden. Bitte später erneut versuchen.");
    }
  };

  const updateProductionStatus = async (
    action:
      | "request_review"
      | "approve"
      | "queue"
      | "schedule_ready"
      | "mark_exported"
      | "mark_copied"
      | "block"
      | "archive",
    note: string,
  ) => {
    if (!workspaceApiPath || !persistedPostId) {
      setNotice("Produktiver Queue-Eintrag fehlt noch. Erst einen Verteilentwurf anlegen.");
      return;
    }
    try {
      const res = await fetch(workspaceApiPath, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          socialDistributionAction: action,
          postId: persistedPostId,
          note,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(
          payload?.message ??
            "Queue-Status konnte nicht aktualisiert werden. Review- und Scope-Hinweise prüfen.",
        );
        return;
      }
      const snapshot = snapshotFromPayload(payload);
      if (snapshot) setPersistedSnapshot(snapshot);
      const status = typeof payload?.post?.status === "string" ? payload.post.status : null;
      setNotice(
        status
          ? `Queue-Status aktualisiert: ${socialDistributionStatusLabel(status)}.`
          : "Queue-Status aktualisiert.",
      );
    } catch {
      setNotice("Queue-Status konnte nicht aktualisiert werden.");
    }
  };

  const updateSchedulerStatus = async (
    action:
      | "schedule_channel"
      | "mark_posting"
      | "mark_posted"
      | "mark_failed"
      | "cancel_channel",
    channel: SocialDistributionChannel,
    note: string,
  ) => {
    if (!workspaceApiPath || !persistedPostId) {
      setNotice("Produktiver Queue-Eintrag fehlt noch. Erst einen Verteilentwurf anlegen.");
      return;
    }
    try {
      const res = await fetch(workspaceApiPath, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          socialSchedulerAction: action,
          postId: persistedPostId,
          channel,
          scheduledAt: action === "schedule_channel" ? new Date().toISOString() : null,
          note,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(
          payload?.message ??
            "Scheduler-Status konnte nicht aktualisiert werden. Review-, Approval- oder Connector-Status prüfen.",
        );
        return;
      }
      const snapshot = snapshotFromPayload(payload);
      if (snapshot) setPersistedSnapshot(snapshot);
      setNotice("Scheduler-Status aktualisiert. Posting bleibt review-first und auditierbar.");
    } catch {
      setNotice("Scheduler-Status konnte nicht aktualisiert werden.");
    }
  };

  const savePlan = () => {
    const draft = buildDistributionPlan({
      plan: {
        ...plan,
        targets: targetsWithOverrides,
      },
      selectedChannels: selectedList,
      scheduleMode: scheduleModeFromChoice(scheduleChoice),
      reviewRequired,
    });
    localStorage.setItem(keyForPlan(dossierId), JSON.stringify(draft));
    localStorage.setItem(keyForQueue(dossierId), JSON.stringify(queueItems));
    recordStudioTelemetryEvent({
      name: "plan_adopted",
      dossierId,
      meta: {
        selectedCount: selectedList.length,
      },
    });
    setNotice("Verteilplan lokal im Browser als Entwurf gespeichert. Keine produktive Behördenpersistenz.");
    void persistWorkspace(draft, "Verteilplan als Entwurf gespeichert.");
    void persistProductionDraft("Review-first Verteilentwurf angelegt.", "asset_generated");
  };

  const requestReview = () => {
    const draft = buildDistributionPlan({
      plan: {
        ...plan,
        targets: targetsWithOverrides,
      },
      selectedChannels: selectedList,
      scheduleMode: scheduleModeFromChoice(scheduleChoice),
      reviewRequired: true,
    });
    localStorage.setItem(`${keyForPlan(dossierId)}:review`, JSON.stringify(draft));
    recordStudioTelemetryEvent({
      name: "review_prepared",
      dossierId,
      meta: {
        selectedCount: selectedList.length,
      },
    });
    setNotice("Post-Entwurf lokal für Review markiert. Keine produktive Behördenpersistenz.");
    void persistWorkspace(draft, "Review für Verteilplan angefordert.");
    void persistProductionDraft(
      "Review für kanalweisen Verteilentwurf angefordert.",
      "review_requested",
    );
  };

  const preparePublication = () => {
    const validation = validateDistributionExport(masterPost);
    const draft = buildSocialDistributionDraft({
      plan: {
        ...plan,
        targets: targetsWithOverrides,
      },
      selectedChannels: selectedList,
      scheduleMode: scheduleModeFromChoice(scheduleChoice),
      reviewRequired: reviewRequired || validation.reviewRequired,
      status: "review_requested",
    });
    localStorage.setItem(`${keyForPlan(dossierId)}:prepared`, JSON.stringify(draft));
    const preview = buildQrPrintPreview(masterPost);
    localStorage.setItem(`${keyForPlan(dossierId)}:qr-print-preview`, JSON.stringify(preview));
    setNotice(
      validation.errors.length > 0
        ? "Veröffentlichung nur lokal als Review-Entwurf vorbereitet (Pflichtfelder im QR/Print-Kontext fehlen)."
        : "Veröffentlichung lokal intern vorbereitet. Keine produktive Behördenpersistenz.",
    );
    void persistWorkspace(draft, "Veröffentlichung nur intern vorbereitet, nicht veröffentlicht.");
    void persistProductionDraft("Verteilung vorbereitet, aber nicht veröffentlicht.", "queued");
  };

  const saveDraft = () => {
    const draft = buildDraftRecord({
      plan: {
        ...plan,
        targets: targetsWithOverrides,
      },
      selectedChannels: selectedList,
      reviewRequired,
    });
    localStorage.setItem(`${keyForPlan(dossierId)}:draft`, JSON.stringify(draft));
    recordStudioTelemetryEvent({
      name: "draft_saved",
      dossierId,
      meta: {
        selectedCount: selectedList.length,
      },
    });
    setNotice("Entwurf lokal gespeichert. Keine produktive Behördenpersistenz.");
    void persistWorkspace(draft, "Verteilungsentwurf gespeichert.");
  };

  const copyPost = async () => {
    const text = buildCopyText(masterPost);
    try {
      await navigator.clipboard.writeText(text);
      recordStudioTelemetryEvent({ name: "copied", dossierId });
      setNotice("Text kopiert.");
    } catch {
      setNotice("Kopieren nicht möglich.");
    }
  };

  const copyExportPayload = async () => {
    const draft = buildDistributionPlan({
      plan: {
        ...plan,
        targets: targetsWithOverrides,
      },
      selectedChannels: selectedList,
      scheduleMode: scheduleModeFromChoice(scheduleChoice),
      reviewRequired: true,
    });
    const payload = buildSocialDistributionExportPayload({
      post: masterPost,
      draft,
    });
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setNotice("JSON-Export kopiert. Keine externe Veröffentlichung ausgelöst.");
      void updateProductionStatus("mark_exported", "Strukturierter Export vorbereitet.");
    } catch {
      setNotice("JSON-Export konnte nicht kopiert werden.");
    }
  };

  const setConnectorState = (channel: SocialDistributionChannel, status: SocialConnectorStatus) => {
    setConnectorOverrides((current) => ({
      ...current,
      [channel]: status,
    }));
    if (status === "not_connected" || status === "disabled_by_policy") {
      recordStudioTelemetryEvent({
        name: "connector_missing",
        dossierId,
        channel,
      });
    }
  };

  const toggleQueueCancel = (id: string) => {
    setQueueCancelled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanäle auswählen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Diese Kanäle nehmen wir in den Veröffentlichungsplan auf.
        </p>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Browser-Arbeitsstände werden nur lokal gespeichert. Das ist keine produktive Behördenpersistenz.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {targetsWithOverrides.map((target) => {
            const selected = selectedChannels.has(target.channel);
            return (
              <article
                key={target.channel}
                className={`rounded-2xl border p-3 ${
                  selected
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{target.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{formatTypeForChannel(target.channel)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel(target.channel)}
                    className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {selected ? "ausgewählt" : "auswählen"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">Verbindung: {connectorLabel(target.connectorStatus)}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Status: {distributionStatusLabel(target.distributionStatus)}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">Nächste Aktion: {target.nextAction}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyPost}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Text kopieren
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Entwurf erstellen
          </button>
          <button
            type="button"
            onClick={requestReview}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Review markieren
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Kanäle verbinden (später)
          </button>
          <Link href={dossierBacklink} className="btn-secondary">
            Zurück zum Dossier
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanalverbindungen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Verbindungsstatus pro Kanal ohne externes API-Posting und ohne Live-Publish.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {targetsWithOverrides.map((target) => (
            <article
              key={`connection-${target.channel}`}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
            >
              <p className="text-sm font-semibold">{target.label}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Status: {connectorLabel(target.connectorStatus)}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{connectorHint(target.connectorStatus)}</p>
              <label className="mt-2 block text-xs text-[rgb(var(--muted))]">
                Admin-Konfiguration
                <select
                  className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
                  value={target.connectorStatus}
                  onChange={(event) =>
                    setConnectorState(target.channel, event.target.value as SocialConnectorStatus)
                  }
                >
                  <option value="internal_available">Intern verfügbar</option>
                  <option value="not_connected">Nicht verbunden</option>
                  <option value="configured">Konfiguration erforderlich</option>
                  <option value="disabled_by_policy">Nur Export</option>
                  <option value="requires_review">Review erforderlich</option>
                  <option value="available_later">Später verfügbar</option>
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Connector- und Scheduler-Status</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Echte Kanal-Connectoren werden nur genutzt, wenn sie freigeschaltet und konfiguriert sind.
          Andernfalls bleibt manueller Export der Fallback.
        </p>
        {!persistedSnapshot ? (
          <article className="mt-4 rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))]">
            Noch kein persistierter Queue-Eintrag vorhanden. Lege zuerst einen Verteilentwurf an, dann werden
            Connector-Status, Approval und Scheduling kanalweise sichtbar.
          </article>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {targetsWithOverrides.map((target) => {
              const connection = connectionByChannel.get(target.channel) ?? null;
              const scheduler = schedulerEntries.find((entry) => entry.channel === target.channel) ?? null;
              const schedulingBlocked =
                !scheduler ||
                connection?.connectionStatus === "disabled_by_policy" ||
                connection?.connectionStatus === "missing_secret" ||
                persistedSnapshot.status === "review_requested" ||
                persistedSnapshot.status === "needs_review" ||
                persistedSnapshot.status === "blocked";

              return (
                <article
                  key={`scheduler-${target.channel}`}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                >
                  <p className="text-sm font-semibold">{target.label}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Connector:{" "}
                    {connection ? socialChannelConnectionLabel(connection.connectionStatus) : "Noch nicht geprüft"}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Auth-Modus: {connection ? connectionAuthModeLabel(connection.authMode) : "Manueller Export"}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Scopes: {connection?.scopes.join(", ") || "Nur lokaler Export"}
                  </p>
                  {connection?.disabledReason ? (
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{connection.disabledReason}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Scheduler: {scheduler ? socialSchedulerStatusLabel(scheduler.status) : "Noch kein Kanalstatus"}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {scheduler ? schedulerActionHint(scheduler.status) : "Review und Approval fehlen noch."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={schedulingBlocked}
                      onClick={() =>
                        void updateSchedulerStatus(
                          "schedule_channel",
                          target.channel,
                          "Kanal kontrolliert terminiert, kein Auto-Publish.",
                        )
                      }
                      className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Termin setzen
                    </button>
                    <button
                      type="button"
                      disabled={!scheduler || scheduler.status !== "scheduled"}
                      onClick={() =>
                        void updateSchedulerStatus(
                          "mark_posting",
                          target.channel,
                          "Posting manuell gestartet, weiterhin auditierbar.",
                        )
                      }
                      className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Posting starten
                    </button>
                    <button
                      type="button"
                      disabled={!scheduler || (scheduler.status !== "scheduled" && scheduler.status !== "posting")}
                      onClick={() =>
                        void updateSchedulerStatus(
                          "mark_posted",
                          target.channel,
                          "Posting bestätigt. Kein Multi-Channel-Autopublish ausgelöst.",
                        )
                      }
                      className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Als gepostet markieren
                    </button>
                    <button
                      type="button"
                      disabled={!scheduler}
                      onClick={() =>
                        void updateSchedulerStatus(
                          "cancel_channel",
                          target.channel,
                          "Scheduler-Eintrag bewusst gestoppt.",
                        )
                      }
                      className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Abbrechen
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Veröffentlichungsmodus</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Veröffentlichung wird nur vorbereitet. Externe Live-Veröffentlichung bleibt deaktiviert.
        </p>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {([
            ["draft", "Nur Entwurf speichern"],
            ["suggested", "Nächstes empfohlenes Zeitfenster"],
            ["scheduled", "Datum/Uhrzeit planen"],
            ["after_review", "Sofort nach Review vorbereiten"],
          ] as const).map(([id, label]) => (
            <label
              key={`mode-${id}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            >
              <input
                type="radio"
                name="distribution_mode"
                checked={scheduleChoice === id}
                onChange={() => setScheduleChoice(id)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Verteilung planen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Beste Zeitfenster, Hashtag-Vorschlag und Beispieltext.</p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Sichtbarkeit: {publicationVisibilityLabel(plan.visibilityState)}.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Bestes Zeitfenster</p>
            <p className="mt-1 text-sm font-medium">{nextWindow}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Hashtag-Vorschlag</p>
            <p className="mt-1 text-sm font-medium">{plan.suggestedHashtags.join(" ")}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Kanalreihenfolge</p>
            <p className="mt-1 text-sm font-medium">{selectedLabels.join(" → ") || "Keine Kanäle ausgewählt"}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Review-Status</p>
            <p className="mt-1 text-sm font-medium">{reviewRequired ? "Review erforderlich" : "bereit"}</p>
          </article>
        </div>

        <article className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Beispieltext</p>
          <p className="mt-1 text-sm">{shortText(plan.suggestedPostText, 280)}</p>
        </article>

        <div className="mt-4 space-y-1 text-xs text-[rgb(var(--muted))]">
          {plan.policyHints.map((hint) => (
            <p key={hint}>{hint}</p>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={savePlan}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Entwurf erstellen
          </button>
          <button
            type="button"
            onClick={requestReview}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Review markieren
          </button>
          <button
            type="button"
            onClick={preparePublication}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Verteilung vorbereiten
          </button>
          <button
            type="button"
            onClick={copyExportPayload}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            JSON-Export kopieren
          </button>
        </div>

        {notice ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{notice}</p> : null}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Empfohlener Verteilplan</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Kanalweise Entwürfe für ausgewählte Ausspielungen. Kein externer Live-Publish.
        </p>
        <ul className="mt-4 space-y-2">
          {queueItems.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-3 ${
                queueCancelled.has(item.id)
                  ? "border-rose-300 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/10"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
              }`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Zeitfenster: {item.recommendedWindow}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Status: {distributionStatusLabel(item.status)}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Aktion: {item.actionLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNotice(`Queue-Eintrag ${item.label} zur Bearbeitung geöffnet.`)}
                  className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => toggleQueueCancel(item.id)}
                  className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  {queueCancelled.has(item.id) ? "Storno zurücknehmen" : "Stornieren"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Queue & nächste Schritte</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Review, Queue, Export und Planung bleiben intern steuerbar. Externe Connectoren werden nur bei
          Freigabe genutzt, Auto-Publish bleibt aus.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Review offen: {queueReadModel?.summary.reviewOpen ?? 0}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            In Queue: {queueReadModel?.summary.queued ?? 0}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Planung bereit: {queueReadModel?.summary.scheduledReady ?? 0}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Exportiert/Kopiert: {queueReadModel?.summary.exported ?? 0}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void updateProductionStatus("approve", "Review abgeschlossen, kanalweise Freigabe liegt vor.")
            }
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          >
            Freigeben
          </button>
          <button
            type="button"
            onClick={() => void updateProductionStatus("queue", "In interne Verteilungsqueue übernommen.")}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          >
            In Queue setzen
          </button>
          <button
            type="button"
            onClick={() =>
              void updateProductionStatus(
                "schedule_ready",
                "Bereit zur Planung, aber ohne externen Versand.",
              )
            }
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          >
            Als Planung bereit markieren
          </button>
          <button
            type="button"
            onClick={() =>
              void updateProductionStatus("mark_copied", "Text manuell übernommen, kein Connector genutzt.")
            }
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          >
            Als kopiert markieren
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Admin: Kanal-Konfiguration & Review-Routing</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Connector-Status, Review-Checkpoints und Export-/Planungsstatus bleiben intern steuerbar und reversibel.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
          <li>Kein Auto-Publish und kein unkontrolliertes Multi-Channel-Scheduling.</li>
          <li>Freigabe, Queue, Export und Planung bleiben bewusste Einzelaktionen.</li>
          <li>Review-Checkpoints werden vor Export oder interner Vorbereitung gespeichert.</li>
          <li>{exportShareSemantics[1]}</li>
          <li>{exportShareSemantics[2]}</li>
          <li>{exportShareSemantics[3]}</li>
          <li>{exportShareSemantics[4]}</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">QR-/Print-Vorschau</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Print-Output mit sichtbarem Quellen- und Review-Status.
        </p>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">CTA</p>
            <p className="mt-1 font-medium">{qrPrintPreview.cta}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Dossier-Backlink</p>
            <p className="mt-1 font-medium">{qrPrintPreview.dossierBacklink}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">QR Target</p>
            <p className="mt-1 font-medium">{qrPrintPreview.qrTarget}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Review / Quellen</p>
            <p className="mt-1 font-medium">
              {qrPrintPreview.reviewStatus} · {qrPrintPreview.sourceStatus}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanal-Versionen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Alle Versionen werden aus dem Master-Post abgeleitet und bleiben review-first.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {plan.channelVersions.map((version) => (
            <article key={version.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-base font-semibold">{version.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{version.postType}</p>
              <p className="mt-2 text-sm">{shortText(version.excerpt, 190)}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{version.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
