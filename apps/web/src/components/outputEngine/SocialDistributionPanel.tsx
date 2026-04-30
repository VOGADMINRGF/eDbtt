"use client";

import { useMemo, useState } from "react";
import type {
  SocialDistributionChannel,
  SocialDistributionPlan,
  SocialDistributionTarget,
} from "@features/outputEngine";

type SocialDistributionPanelProps = {
  plan: SocialDistributionPlan;
  dossierId: string;
  reviewRequired: boolean;
};

type PublishMode =
  | "draft_only"
  | "review_request"
  | "schedule"
  | "prepare_release"
  | "internal_prepare"
  | "internal_publish"
  | "export_copy";

type StudioChannelId =
  | "website_dossier"
  | "instagram"
  | "tiktok_reels_shorts"
  | "linkedin"
  | "facebook"
  | "x_mastodon_bluesky"
  | "newsletter"
  | "qr_print";

type StudioChannelConfig = {
  id: StudioChannelId;
  label: string;
  formatType: string;
  targetChannels: readonly SocialDistributionChannel[];
  nextAction: string;
};

type ChannelVersionCard = {
  id: string;
  channel: StudioChannelId;
  title: string;
  postType: string;
  excerpt: string;
  detail: string;
};

const STUDIO_CHANNELS: readonly StudioChannelConfig[] = [
  {
    id: "website_dossier",
    label: "Website / Dossier-Post",
    formatType: "Dossier-Post",
    targetChannels: ["website_embed"],
    nextAction: "Review fortsetzen und intern vorbereiten",
  },
  {
    id: "instagram",
    label: "Instagram",
    formatType: "Caption + Carousel",
    targetChannels: ["instagram"],
    nextAction: "Export/Kopieren für Publishing-Team",
  },
  {
    id: "tiktok_reels_shorts",
    label: "TikTok / Reels / YouTube Shorts",
    formatType: "Hook + Szenenplan + Voiceover",
    targetChannels: ["tiktok", "youtube_shorts"],
    nextAction: "Script exportieren und manuell ausspielen",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    formatType: "Professioneller Sachpost",
    targetChannels: ["linkedin"],
    nextAction: "Beitragstext kopieren und manuell veröffentlichen",
  },
  {
    id: "facebook",
    label: "Facebook",
    formatType: "Lokaler Community-Post",
    targetChannels: ["facebook"],
    nextAction: "Export/Kopieren für Community-Team",
  },
  {
    id: "x_mastodon_bluesky",
    label: "X / Mastodon / Bluesky",
    formatType: "Kurzpost",
    targetChannels: ["x_twitter", "mastodon", "bluesky"],
    nextAction: "Kurzversion übernehmen und manuell posten",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    formatType: "Briefing / Teaser",
    targetChannels: ["whatsapp_channel", "telegram"],
    nextAction: "Konfiguration prüfen oder Text exportieren",
  },
  {
    id: "qr_print",
    label: "QR / Print",
    formatType: "Handout / Poster",
    targetChannels: [],
    nextAction: "Intern erzeugen und für Vor-Ort-Nutzung bereitstellen",
  },
] as const;

const MODE_LABELS: Record<PublishMode, string> = {
  draft_only: "Nur Entwurf speichern",
  review_request: "Review anfordern",
  schedule: "Zeitpunkt planen",
  prepare_release: "Veröffentlichung vorbereiten",
  internal_prepare: "Jetzt intern vorbereiten",
  internal_publish: "Jetzt intern veröffentlichen",
  export_copy: "Extern exportieren/kopieren",
};

function keyForPlan(dossierId: string) {
  return `edebatte:studio:distribution-plan:${dossierId}`;
}

function shortText(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function mapTargetStatuses(plan: SocialDistributionPlan) {
  const map = new Map<SocialDistributionChannel, SocialDistributionTarget>();
  for (const target of plan.targets) {
    map.set(target.channel, target);
  }
  return map;
}

function resolveConnectionState(args: {
  channelId: StudioChannelId;
  targets: (SocialDistributionTarget | undefined)[];
}): "intern verfügbar" | "Kanal nicht verbunden" | "Konfiguration erforderlich" | "Nur Export/Kopieren möglich" {
  if (args.channelId === "qr_print") return "intern verfügbar";
  if (args.channelId === "website_dossier") {
    return args.targets.some((target) => target?.connectorStatus === "configured")
      ? "intern verfügbar"
      : "Konfiguration erforderlich";
  }
  if (args.channelId === "newsletter") return "Konfiguration erforderlich";
  if (args.targets.some((target) => target?.connectorStatus === "configured")) return "intern verfügbar";
  if (args.targets.some((target) => target?.connectorStatus === "available_later")) return "Konfiguration erforderlich";
  if (args.targets.some((target) => target?.connectorStatus === "disabled_by_policy")) return "Nur Export/Kopieren möglich";
  return "Kanal nicht verbunden";
}

function resolvePublishStatus(args: {
  selected: boolean;
  planned: boolean;
  mode: PublishMode;
  reviewRequired: boolean;
  connectionState: "intern verfügbar" | "Kanal nicht verbunden" | "Konfiguration erforderlich" | "Nur Export/Kopieren möglich";
  internalPublishEnabled: boolean;
}): "Entwurf" | "Review nötig" | "bereit zur Planung" | "geplant" | "intern veröffentlicht" | "exportiert" {
  if (!args.selected) return "Entwurf";
  if (args.mode === "internal_publish" && args.internalPublishEnabled && args.connectionState === "intern verfügbar") {
    return "intern veröffentlicht";
  }
  if (args.mode === "export_copy" && args.connectionState !== "intern verfügbar") return "exportiert";
  if (args.planned) return "geplant";
  if (args.reviewRequired || args.mode === "review_request") return "Review nötig";
  return "bereit zur Planung";
}

export default function SocialDistributionPanel({
  plan,
  dossierId,
  reviewRequired,
}: SocialDistributionPanelProps) {
  const [selectedChannels, setSelectedChannels] = useState<StudioChannelId[]>([
    "website_dossier",
    "instagram",
    "linkedin",
    "qr_print",
  ]);
  const [mode, setMode] = useState<PublishMode>("draft_only");
  const [planned, setPlanned] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const targetsByChannel = useMemo(() => mapTargetStatuses(plan), [plan]);
  const nextSlot = plan.suggestedPostingWindows[0] ?? "Kein Zeitfenster vorhanden";
  const internalPublishEnabled = false;

  const selectedLabels = selectedChannels
    .map((channelId) => STUDIO_CHANNELS.find((channel) => channel.id === channelId)?.label)
    .filter((entry): entry is string => Boolean(entry));

  const onToggleChannel = (channelId: StudioChannelId) => {
    setSelectedChannels((previous) =>
      previous.includes(channelId)
        ? previous.filter((entry) => entry !== channelId)
        : [...previous, channelId],
    );
  };

  const onSavePlanDraft = (message: string) => {
    const payload = {
      savedAt: new Date().toISOString(),
      mode,
      selectedChannels,
      nextSlot,
      status: "draft",
    };
    localStorage.setItem(keyForPlan(dossierId), JSON.stringify(payload));
    setPlanned(true);
    setNotice(message);
  };

  const versions: ChannelVersionCard[] = [
    {
      id: "version_instagram",
      channel: "instagram",
      title: "Instagram",
      postType: "Caption + Carousel Outline",
      excerpt: shortText(plan.suggestedPostText, 170),
      detail: `Carousel: Leitfrage · Anlass · Belegt · Offen · Optionen · Beteiligung. ${plan.suggestedHashtags.join(" ")}`,
    },
    {
      id: "version_tiktok",
      channel: "tiktok_reels_shorts",
      title: "TikTok / Reels / YouTube Shorts",
      postType: "Hook + Szenenplan + Voiceover + Caption",
      excerpt: shortText(plan.participationQuestion, 150),
      detail: "Kurzvideo-Skript mit Hook, Evidenzrahmen, offenen Fragen und Abschluss-CTA.",
    },
    {
      id: "version_linkedin",
      channel: "linkedin",
      title: "LinkedIn",
      postType: "Professioneller Sachpost",
      excerpt: shortText(plan.suggestedPostText, 210),
      detail: "Fokus auf Datenlage, Optionen/Eventualitäten und dokumentierte Beteiligungsfrage.",
    },
    {
      id: "version_facebook",
      channel: "facebook",
      title: "Facebook",
      postType: "Lokaler Community-Post",
      excerpt: shortText(plan.participationQuestion, 170),
      detail: "Für regionale Debatten und Community-Rückläufe mit klarer Beteiligungsfrage.",
    },
    {
      id: "version_micro",
      channel: "x_mastodon_bluesky",
      title: "X / Mastodon / Bluesky",
      postType: "Kurzpost",
      excerpt: shortText(plan.participationQuestion, 130),
      detail: "Kurzversion mit Dossier-Link, Frage und Review-Hinweis.",
    },
    {
      id: "version_newsletter",
      channel: "newsletter",
      title: "Newsletter",
      postType: "Briefing",
      excerpt: shortText(plan.suggestedPostText, 190),
      detail: "Kurzbriefing für Redaktions- oder Projektverteiler.",
    },
    {
      id: "version_print",
      channel: "qr_print",
      title: "QR / Print",
      postType: "Poster-/Handout-Text",
      excerpt: "Kurzfassung mit Beteiligungsfrage, QR-Ziel und Quellenhinweis.",
      detail: "Für Workshops, Vor-Ort-Dialoge und physische Beteiligungsformate.",
    },
  ];

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanäle auswählen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Diese Kanäle nehmen wir in den Veröffentlichungsplan auf.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {STUDIO_CHANNELS.map((channel) => {
            const selected = selectedChannels.includes(channel.id);
            const targets = channel.targetChannels.map((targetChannel) => targetsByChannel.get(targetChannel));
            const connectionState = resolveConnectionState({
              channelId: channel.id,
              targets,
            });
            const publishStatus = resolvePublishStatus({
              selected,
              planned,
              mode,
              reviewRequired,
              connectionState,
              internalPublishEnabled,
            });

            return (
              <article
                key={channel.id}
                className={`rounded-2xl border p-3 ${
                  selected
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{channel.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Format: {channel.formatType}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleChannel(channel.id)}
                    className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {selected ? "ausgewählt" : "auswählen"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">Verbindung: {connectionState}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">Veröffentlichungsstatus: {publishStatus}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">Nächste Aktion: {channel.nextAction}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanalverbindungen</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {STUDIO_CHANNELS.map((channel) => {
            const targets = channel.targetChannels.map((targetChannel) => targetsByChannel.get(targetChannel));
            const connectionState = resolveConnectionState({
              channelId: channel.id,
              targets,
            });
            const externalOnly = connectionState !== "intern verfügbar";
            return (
              <div key={`conn_${channel.id}`} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
                <p className="font-medium">{channel.label}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{connectionState}</p>
                {externalOnly ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Nur Export/Kopieren möglich</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Kein Fake-OAuth und kein Fake-Connected-State: externe Kanäle bleiben ohne Adapter auf Export/Kopieren.
        </p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Veröffentlichungsmodus</h3>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          {([
            { id: "draft_only", disabled: false },
            { id: "review_request", disabled: false },
            { id: "schedule", disabled: false },
            { id: "prepare_release", disabled: false },
            { id: "internal_prepare", disabled: false },
            { id: "internal_publish", disabled: !internalPublishEnabled },
            { id: "export_copy", disabled: false },
          ] as const).map((entry) => (
            <label
              key={entry.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            >
              <input
                type="radio"
                name="publish_mode"
                value={entry.id}
                checked={mode === entry.id}
                onChange={() => setMode(entry.id)}
                disabled={entry.disabled}
              />
              <span>
                {MODE_LABELS[entry.id]}
                {entry.id === "internal_publish" && entry.disabled ? " (derzeit nicht verfügbar)" : ""}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Noch nicht live veröffentlicht. Extern nur Export/Kopieren, solange keine sicheren Kanaladapter aktiv sind.
        </p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Verteilplan</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Empfohlener Verteilplan</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Nächstes Zeitfenster</p>
            <p className="mt-1 text-sm font-medium">{nextSlot}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Kanalreihenfolge</p>
            <p className="mt-1 text-sm font-medium">{selectedLabels.join(" → ") || "Keine Kanäle ausgewählt"}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Review</p>
            <p className="mt-1 text-sm font-medium">{reviewRequired ? "Review erforderlich" : "Bereit"}</p>
          </article>
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Modus</p>
            <p className="mt-1 text-sm font-medium">{MODE_LABELS[mode]}</p>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSavePlanDraft("Verteilplan als Entwurf gespeichert.")}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold"
          >
            Verteilplan als Entwurf speichern
          </button>
          <button
            type="button"
            onClick={() => onSavePlanDraft("Plan übernommen und lokal gespeichert.")}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Plan übernehmen
          </button>
        </div>
        {notice ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{notice}</p> : null}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Kanal-Versionen</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Alle Versionen werden aus dem Master-Post abgeleitet.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {versions.map((version) => {
            const channel = STUDIO_CHANNELS.find((entry) => entry.id === version.channel);
            const targets = channel?.targetChannels.map((targetChannel) => targetsByChannel.get(targetChannel)) ?? [];
            const connectionState = resolveConnectionState({
              channelId: version.channel,
              targets,
            });
            return (
              <article key={version.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <p className="text-base font-semibold">{version.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{version.postType}</p>
                <p className="mt-2 text-sm">{version.excerpt}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{version.detail}</p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {connectionState === "intern verfügbar" ? "intern verfügbar" : "Nur Export/Kopieren möglich"}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-200">Noch nicht live veröffentlicht</p>
        <p className="mt-1 text-amber-700 dark:text-amber-100">
          Dossier bleibt Quelle. Review erforderlich. Externe Kanäle nur Export/Kopieren.
        </p>
      </section>
    </section>
  );
}

