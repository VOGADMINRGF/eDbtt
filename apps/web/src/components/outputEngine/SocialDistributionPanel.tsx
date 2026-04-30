"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SocialDistributionPlan, SocialDistributionTarget } from "@features/outputEngine";

type SocialDistributionPanelProps = {
  plan: SocialDistributionPlan;
  dossierId: string;
  reviewRequired: boolean;
  dossierBacklink: string;
};

type StudioScheduleChoice = "draft" | "suggested" | "scheduled" | "after_review";

function keyForPlan(dossierId: string) {
  return `edebatte:studio:distribution-plan:${dossierId}`;
}

function connectorLabel(status: SocialDistributionTarget["connectorStatus"]): string {
  if (status === "internal_available") return "Intern verfügbar";
  if (status === "not_connected") return "Noch nicht verbunden";
  if (status === "configured") return "Konfiguriert";
  if (status === "disabled_by_policy") return "Per Admin deaktiviert";
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
  return "Kanal noch nicht verbunden.";
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
}: SocialDistributionPanelProps) {
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    new Set(plan.selectedChannels),
  );
  const [scheduleChoice, setScheduleChoice] = useState<StudioScheduleChoice>("suggested");
  const [notice, setNotice] = useState<string | null>(null);

  const nextWindow = plan.suggestedPostingWindows[0] ?? "Kein Zeitfenster vorhanden";

  const selectedLabels = useMemo(
    () =>
      plan.targets
        .filter((target) => selectedChannels.has(target.channel))
        .map((target) => target.label),
    [plan.targets, selectedChannels],
  );

  const toggleChannel = (channel: string) => {
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

  const savePlan = () => {
    const payload = {
      savedAt: new Date().toISOString(),
      scheduleChoice,
      selectedChannels: Array.from(selectedChannels),
      nextWindow,
    };
    localStorage.setItem(keyForPlan(dossierId), JSON.stringify(payload));
    setNotice("Plan gespeichert.");
  };

  const requestReview = () => {
    const payload = {
      reviewedAt: new Date().toISOString(),
      action: "post_draft_review",
      selectedChannels: Array.from(selectedChannels),
    };
    localStorage.setItem(`${keyForPlan(dossierId)}:review`, JSON.stringify(payload));
    setNotice("Post-Entwurf für Review markiert.");
  };

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanäle auswählen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Diese Kanäle nehmen wir in den Veröffentlichungsplan auf.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plan.targets.map((target) => {
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
          {plan.targets.map((target) => (
            <article
              key={`connection-${target.channel}`}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
            >
              <p className="text-sm font-semibold">{target.label}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Status: {connectorLabel(target.connectorStatus)}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{connectorHint(target.connectorStatus)}</p>
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
            Plan speichern
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] opacity-70"
          >
            Veröffentlichen (deaktiviert – nur Vorbereitung)
          </button>
        </div>

        {notice ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{notice}</p> : null}
      </section>
    </section>
  );
}
