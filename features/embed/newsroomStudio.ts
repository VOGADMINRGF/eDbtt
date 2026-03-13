import {
  buildDossierEmbedPath,
  buildNewsroomCompanionPath,
  buildOpenDossierPath,
} from "@features/newsroom";

export const NEWSROOM_CTA_PRESETS = [
  "quellenlage_beteiligung",
  "offenes_dossier",
  "factcheck_einwaende_optionen",
  "oeffentlich_pruefen_und_ergaenzen",
] as const;

export type NewsroomCtaPreset = (typeof NEWSROOM_CTA_PRESETS)[number];

export const NEWSROOM_CTA_LABELS: Record<NewsroomCtaPreset, string> = {
  quellenlage_beteiligung: "Quellenlage & Beteiligung zum Beitrag",
  offenes_dossier: "Zum offenen Dossier",
  factcheck_einwaende_optionen: "Faktencheck, Einwände und Optionen",
  oeffentlich_pruefen_und_ergaenzen: "Thema öffentlich prüfen und ergänzen",
};

export const NEWSROOM_FORMAT_OPTIONS = [
  "article",
  "print",
  "video",
  "podcast",
  "talkshow",
] as const;

export type NewsroomFormat = (typeof NEWSROOM_FORMAT_OPTIONS)[number];

export function pickNewsroomCtaPreset(input?: string): NewsroomCtaPreset {
  if (!input) return "offenes_dossier";
  return NEWSROOM_CTA_PRESETS.includes(input as NewsroomCtaPreset)
    ? (input as NewsroomCtaPreset)
    : "offenes_dossier";
}

export function resolveNewsroomCtaLabel(input?: string) {
  return NEWSROOM_CTA_LABELS[pickNewsroomCtaPreset(input)];
}

function withQuery(path: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildNewsroomShortPath(args: {
  dossierId: string;
  anchorId?: string;
  medium?: string;
  format?: string;
  publishedAt?: string;
  cta?: string;
}) {
  return withQuery(`/n/${encodeURIComponent(args.dossierId)}`, [
    ["anchor", args.anchorId?.trim() || undefined],
    ["medium", args.medium?.trim() || undefined],
    ["format", args.format?.trim() || undefined],
    ["publishedAt", args.publishedAt?.trim() || undefined],
    ["cta", args.cta?.trim() || undefined],
  ]);
}

export function buildNewsroomEmbedBundle(args: {
  dossierId: string;
  anchorId?: string;
  medium?: string;
  format?: string;
  publishedAt?: string;
  cta?: string;
}) {
  const ctaPreset = pickNewsroomCtaPreset(args.cta);
  const ctaLabel = NEWSROOM_CTA_LABELS[ctaPreset];
  const dossierPath = buildOpenDossierPath({
    dossierId: args.dossierId,
    anchorId: args.anchorId,
  });
  const companionPath = buildNewsroomCompanionPath({
    dossierId: args.dossierId,
    anchorId: args.anchorId,
    medium: args.medium,
    format: args.format,
    publishedAt: args.publishedAt,
    cta: ctaPreset,
  });
  const embedPath = buildDossierEmbedPath({
    dossierId: args.dossierId,
    anchorId: args.anchorId,
    medium: args.medium,
    format: args.format,
    publishedAt: args.publishedAt,
    cta: ctaPreset,
  });
  const shortPath = buildNewsroomShortPath({
    dossierId: args.dossierId,
    anchorId: args.anchorId,
    medium: args.medium,
    format: args.format,
    publishedAt: args.publishedAt,
    cta: ctaPreset,
  });

  return {
    ctaPreset,
    ctaLabel,
    editorialLead: `${ctaLabel} — Anlassgeber ist sichtbar, Deutungshoheit bleibt offen und evidenzbasiert überprüfbar.`,
    dossierPath,
    companionPath,
    embedPath,
    shortPath,
  };
}
