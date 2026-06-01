export const VOXY_MANIFEST_PATH = "/brand/voxy/manifest.json";

export const VOXY_VARIANTS = [
  "neutral",
  "thinking",
  "check",
  "hint",
  "welcome",
  "presenting",
  "open",
  "confident",
  "wave",
  "miniAvatar",
  "podcastStage",
  "createGuide",
  "createGuideLight",
  "createGuideDark",
] as const;

export type VoxyVariant = (typeof VOXY_VARIANTS)[number];

export type VoxyUsageContext =
  | "default_guide"
  | "review_optional_ai"
  | "completion_state"
  | "important_hint"
  | "first_visit"
  | "next_step"
  | "inline_compact"
  | "hero_stage";

type VoxyAssetDefinition = {
  alt: string;
  aspectRatio: string;
  png: string;
  webp: string;
  usage: VoxyUsageContext;
  usageHint: string;
};

export const VOXY_OVERLAYS = {
  vogPin: {
    path: "/brand/voxy/overlays/vog-pin.svg",
    note: "VOG-Pin bleibt aus Betrachterperspektive rechts sichtbar und darf nicht gespiegelt werden.",
  },
  edebatteGradient: {
    path: "/brand/voxy/overlays/edebatte-gradient.svg",
    note: "Falls eDebatte als Asset gesetzt wird, dieses SVG fuer saubere Typografie statt eingebrannter Rastertexte nutzen.",
  },
  voxyWordmark: {
    path: "/brand/voxy/overlays/voxy-wordmark.svg",
    note: "Nur als begleitende Kennzeichnung nutzen, nicht als dominantes Dekoelement.",
  },
} as const;

export const VOXY_ASSET_MAP: Record<VoxyVariant, VoxyAssetDefinition> = {
  neutral: {
    alt: "Voxy als ruhiger Guide",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-neutral.png",
    webp: "/brand/voxy/voxy-neutral.webp",
    usage: "default_guide",
    usageHint: "Standard-Hinweis fuer neutrale Orientierung und Einstieg ohne Druck.",
  },
  thinking: {
    alt: "Voxy beim Prüfen und Abwägen",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-thinking.png",
    webp: "/brand/voxy/voxy-thinking.webp",
    usage: "review_optional_ai",
    usageHint: "Bei optionaler KI, offenen Fragen, Prüfung oder ungeklärten Punkten einsetzen.",
  },
  check: {
    alt: "Voxy mit bestätigendem Hinweis",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-check.png",
    webp: "/brand/voxy/voxy-check.webp",
    usage: "completion_state",
    usageHint: "Für gespeicherte, bestätigte oder review-bereite Zustände nutzen.",
  },
  hint: {
    alt: "Voxy mit wichtigem Hinweis",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-hint.png",
    webp: "/brand/voxy/voxy-hint.webp",
    usage: "important_hint",
    usageHint: "Vor Sichtbarkeits- oder Folgenentscheidungen als ruhigen Guardrail einsetzen.",
  },
  welcome: {
    alt: "Voxy zur Begrüßung",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-welcome.png",
    webp: "/brand/voxy/voxy-welcome.webp",
    usage: "first_visit",
    usageHint: "Für den ersten Kontakt und seriöse Onboarding-Schritte geeignet.",
  },
  presenting: {
    alt: "Voxy erklärt den nächsten Schritt",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-presenting.png",
    webp: "/brand/voxy/voxy-presenting.webp",
    usage: "next_step",
    usageHint: "Für das Erklären von Optionen oder nächsten Schritten nutzen.",
  },
  open: {
    alt: "Voxy öffnet den Raum für Beteiligung",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-open.png",
    webp: "/brand/voxy/voxy-open.webp",
    usage: "next_step",
    usageHint: "Für offene Beteiligung, Anschluss-Hinweise und Raum-Metaphern nutzen.",
  },
  confident: {
    alt: "Voxy begleitet ruhig und verlässlich",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-confident.png",
    webp: "/brand/voxy/voxy-confident.webp",
    usage: "hero_stage",
    usageHint: "Für ruhige Hero- oder Vertrauensflächen ohne laute Gestik nutzen.",
  },
  wave: {
    alt: "Voxy gibt einen leichten Begrüßungshinweis",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-wave.png",
    webp: "/brand/voxy/voxy-wave.webp",
    usage: "first_visit",
    usageHint: "Nur für leichte Einstiegs- oder Begrüßungshinweise einsetzen.",
  },
  miniAvatar: {
    alt: "Voxy als kompakter Avatar",
    aspectRatio: "1 / 1",
    png: "/brand/voxy/voxy-mini-avatar.png",
    webp: "/brand/voxy/voxy-mini-avatar.webp",
    usage: "inline_compact",
    usageHint: "Für kleine Inline-Hinweise, kompakte Module und mobile Kontexte nutzen.",
  },
  podcastStage: {
    alt: "Voxy in einer ruhigen Hero-Komposition",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-confident.png",
    webp: "/brand/voxy/voxy-confident.webp",
    usage: "hero_stage",
    usageHint:
      "Legacy-Alias für frühere Stage-Verwendungen. Rendert bewusst auf dieselbe ruhige Hero-Figur wie `confident`.",
  },
  createGuide: {
    alt: "Voxy hilft beim Sortieren",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-create-guide.png",
    webp: "/brand/voxy/voxy-create-guide.png",
    usage: "default_guide",
    usageHint: "Für die öffentliche /create-Begleitung mit freigestellter Figur ohne Bildfläche nutzen.",
  },
  createGuideLight: {
    alt: "Voxy hilft beim Sortieren",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-create-guide-light.png",
    webp: "/brand/voxy/voxy-create-guide-light.png",
    usage: "default_guide",
    usageHint: "Light-Variante für /create mit hellem Kopf und klar blauem Anzug.",
  },
  createGuideDark: {
    alt: "Voxy hilft beim Sortieren",
    aspectRatio: "4 / 5",
    png: "/brand/voxy/voxy-create-guide-dark.png",
    webp: "/brand/voxy/voxy-create-guide-dark.png",
    usage: "default_guide",
    usageHint: "Dark-Variante für /create mit hellem Kopf und dunklerem Anzug.",
  },
};

export const VOXY_PUBLIC_ROUTE_ASSETS = {
  startLight: "confident",
  startDark: "confident",
  createLight: "presenting",
  createDark: "thinking",
  dossierLight: "hint",
  dossierDark: "thinking",
  rundenLight: "open",
  rundenDark: "confident",
  swipesLight: "miniAvatar",
  swipesDark: "miniAvatar",
  miniLight: "miniAvatar",
  miniDark: "miniAvatar",
} as const satisfies Record<string, VoxyVariant>;

export type VoxyPublicRouteAssetSlot = keyof typeof VOXY_PUBLIC_ROUTE_ASSETS;

export function resolveVoxyPublicRouteVariant(slot: VoxyPublicRouteAssetSlot): VoxyVariant {
  return VOXY_PUBLIC_ROUTE_ASSETS[slot];
}

export type ResolvedVoxyAsset = VoxyAssetDefinition & {
  candidates: string[];
  requestedVariant: string | null;
  variant: VoxyVariant;
};

export function isVoxyVariant(value: string): value is VoxyVariant {
  return (VOXY_VARIANTS as readonly string[]).includes(value);
}

export function resolveVoxyVariant(value?: string | null): VoxyVariant {
  const normalized = String(value ?? "").trim();
  return isVoxyVariant(normalized) ? normalized : "neutral";
}

export function getVoxyAssetCandidates(value?: string | null): string[] {
  const variant = resolveVoxyVariant(value);
  const asset = VOXY_ASSET_MAP[variant];
  const neutral = VOXY_ASSET_MAP.neutral;
  return [...new Set([asset.webp, asset.png, neutral.webp, neutral.png])];
}

export function resolveVoxyAsset(value?: string | null): ResolvedVoxyAsset {
  const variant = resolveVoxyVariant(value);
  const asset = VOXY_ASSET_MAP[variant];

  return {
    ...asset,
    candidates: getVoxyAssetCandidates(value),
    requestedVariant: value ?? null,
    variant,
  };
}
