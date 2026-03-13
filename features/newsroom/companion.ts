type CompanionParams = {
  dossierId: string;
  anchorId?: string | null;
  medium?: string | null;
  format?: string | null;
  publishedAt?: string | null;
  cta?: string | null;
};

function clean(value?: string | null) {
  const next = value?.trim();
  return next ? next : undefined;
}

function withQuery(path: string, pairs: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  pairs.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildOpenDossierPath(args: CompanionParams) {
  const dossierId = encodeURIComponent(args.dossierId);
  return withQuery(`/dossier/${dossierId}`, [["anchor", clean(args.anchorId)]]);
}

export function buildNewsroomCompanionPath(args: CompanionParams) {
  const dossierId = encodeURIComponent(args.dossierId);
  return withQuery(`/newsroom/companion/${dossierId}`, [
    ["anchor", clean(args.anchorId)],
    ["medium", clean(args.medium)],
    ["format", clean(args.format)],
    ["publishedAt", clean(args.publishedAt)],
    ["cta", clean(args.cta)],
  ]);
}

export function buildDossierEmbedPath(args: CompanionParams) {
  const dossierId = encodeURIComponent(args.dossierId);
  return withQuery(`/embed/dossier/${dossierId}`, [
    ["anchor", clean(args.anchorId)],
    ["medium", clean(args.medium)],
    ["format", clean(args.format)],
    ["publishedAt", clean(args.publishedAt)],
    ["cta", clean(args.cta)],
  ]);
}
