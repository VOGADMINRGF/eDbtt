import {
  getCreateComposerTexts,
  getCreateSurfaceTexts,
  resolveCreateSurfaceLocale,
  type CreateComposerHeadlineText,
} from "@/features/create/createSurfaceConfig";

export type EntrySurfaceTone = "lively" | "calm";

export type EntryHeroIdentity = {
  badge: string;
  headline: CreateComposerHeadlineText;
  subline: string;
};

export function resolveEntrySurfaceTone(surface: "default" | "create"): EntrySurfaceTone {
  return surface === "default" ? "lively" : "calm";
}

export function resolveSharedEntryHeroIdentity(params: {
  locale: string;
  surface: "default" | "create";
}): EntryHeroIdentity {
  const surfaceLocale = resolveCreateSurfaceLocale(params.locale);
  const composerTexts = getCreateComposerTexts(surfaceLocale);
  const surfaceTexts = getCreateSurfaceTexts(surfaceLocale);

  if (params.surface === "default") {
    const defaultSubline =
      surfaceLocale === "en"
        ? `${surfaceTexts.sublineCanonical} This entry surface is intentionally more dynamic and invitation-first.`
        : `${surfaceTexts.sublineCanonical} Diese Einstiegsfläche ist bewusst lebendiger und einladender gehalten.`;
    return {
      badge: "eDebatte",
      headline: composerTexts.headline,
      subline: defaultSubline,
    };
  }

  return {
    badge: surfaceTexts.badgeCanonical,
    headline: composerTexts.headline,
    subline: surfaceTexts.sublineCanonical,
  };
}
