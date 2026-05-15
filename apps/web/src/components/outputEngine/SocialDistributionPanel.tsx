"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildCopyText,
  buildDistributionPlan,
  buildDraftRecord,
  buildSocialDistributionDraft,
  buildQrPrintPreview,
  buildSocialDistributionQueue,
  recordStudioTelemetryEvent,
  type SocialDistributionChannel,
  type SocialConnectorStatus,
  type SocialDistributionPlan,
  type SocialDistributionDraft,
  type SocialDistributionTarget,
  type SocialScheduleMode,
  type MasterPost,
  type SocialCarouselOutput,
  validateDistributionExport,
} from "@features/outputEngine";

type SocialDistributionPanelProps = {
  plan: SocialDistributionPlan;
  dossierId: string;
  reviewRequired: boolean;
  dossierBacklink: string;
  masterPost: MasterPost;
  carouselDraft: SocialCarouselOutput;
  workspaceApiPath?: string;
  initialDistributionDraft?: SocialDistributionDraft | null;
};

type StudioScheduleChoice = "draft" | "suggested" | "scheduled" | "after_review";

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
  if (status === "draft") return "Entwurf";
  if (status === "review_required") return "Review nötig";
  if (status === "ready_for_schedule") return "Bereit zur Planung";
  if (status === "scheduled") return "Geplant";
  if (status === "prepared") return "Intern vorbereitet";
  return "Exportiert";
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
  if (channel === "website_embed") return "Dossier-Post";
  if (channel === "instagram") return "Caption + Carousel";
  if (channel === "facebook") return "Community-Post";
  if (channel === "linkedin") return "Sachpost";
  if (channel === "tiktok" || channel === "youtube_shorts") return "Kurzvideo-Skript";
  if (channel === "x_twitter" || channel === "mastodon" || channel === "bluesky") return "Kurzpost";
  if (channel === "newsletter") return "Newsletter-Block";
  if (channel === "qr_print") return "Handout / Poster";
  return "Kanaltext";
}

function shortText(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
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
}: SocialDistributionPanelProps) {
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

  const nextWindow = plan.suggestedPostingWindows[0] ?? "Kein Zeitfenster vorhanden";

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

  useEffect(() => {
    recordStudioTelemetryEvent({
      name: "master_post_generated",
      dossierId,
    });
  }, [dossierId]);

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
      status: "prepared_internal",
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
            Entwurf speichern
          </button>
          <button
            type="button"
            onClick={requestReview}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Post-Entwurf prüfen
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Kanäle verbinden
          </button>
          <Link href={dossierBacklink} className="btn-secondary">
            Zurück zum Dossier
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanalverbindungen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Verbindungsstatus pro Kanal ohne Fake-OAuth und ohne Live-Publish.
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
            Verteilplan als Entwurf speichern
          </button>
          <button
            type="button"
            onClick={savePlan}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Verteilplan übernehmen
          </button>
          <button
            type="button"
            onClick={preparePublication}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Veröffentlichung vorbereiten
          </button>
        </div>

        {notice ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{notice}</p> : null}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Empfohlener Verteilplan</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Ein Batch-Plan für ausgewählte Kanäle. Kein externer Live-Publish.
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
        <h3 className="text-lg font-semibold">Admin: Kanal-Konfiguration & Review-Routing</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Connector-Status, Queue und Review-Checkpoints bleiben intern steuerbar und reversibel.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
          <li>Realtime-Switch bleibt deaktiviert, bis Admin-Freigabe vorliegt.</li>
          <li>Queue-Einträge sind bearbeitbar oder stornierbar.</li>
          <li>Review-Checkpoints werden vor Export oder interner Vorbereitung gespeichert.</li>
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
          Alle Versionen werden aus dem Master-Post abgeleitet.
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
