import { BRAND } from "@/lib/brand";
import { readStringParam } from "@/features/surface";

export type DistributionEntry = "qr" | "direct";
export type DistributionSource =
  | "article"
  | "video"
  | "podcast"
  | "session"
  | "event"
  | "livestream";

export type DistributionContext = {
  entry: DistributionEntry;
  source?: DistributionSource;
  persona?: string;
  framing: string;
};

const ALLOWED_SOURCES = new Set<DistributionSource>([
  "article",
  "video",
  "podcast",
  "session",
  "event",
  "livestream",
]);

function sourceFraming(source?: DistributionSource) {
  if (source === "article") return "Dieser Debattenraum begleitet einen Artikel.";
  if (source === "video") return "Dieser Debattenraum begleitet ein Video.";
  if (source === "podcast") return "Dieser Debattenraum begleitet eine Podcast-Episode.";
  if (source === "session") return "Dieser Debattenraum begleitet eine Session.";
  if (source === "event") return "Dieser Debattenraum begleitet ein Event.";
  if (source === "livestream") return "Dieser Debattenraum begleitet einen Livestream.";
  return "Dieser Debattenraum ist als offener Follow-up Einstieg erreichbar.";
}

export function parseDistributionContext(
  params?: Record<string, string | string[] | undefined>,
  fallbackSource?: DistributionSource,
): DistributionContext {
  const rawEntry = readStringParam(params?.entry);
  const rawSource = readStringParam(params?.source);
  const rawPersona = readStringParam(params?.persona);

  const entry: DistributionEntry = rawEntry === "qr" ? "qr" : "direct";
  const source = rawSource && ALLOWED_SOURCES.has(rawSource as DistributionSource)
    ? (rawSource as DistributionSource)
    : fallbackSource;

  const framing = sourceFraming(source);
  return {
    entry,
    source,
    persona: rawPersona,
    framing,
  };
}

export function withDistributionQuery(path: string, context: DistributionContext) {
  const params = new URLSearchParams();
  params.set("entry", context.entry);
  if (context.source) params.set("source", context.source);
  if (context.persona) params.set("persona", context.persona);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function absoluteUrl(path: string) {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${BRAND.baseUrl}${trimmed}`;
}

export function roundTypeToDistributionSource(type: string): DistributionSource | undefined {
  if (type === "article") return "article";
  if (type === "video") return "video";
  if (type === "podcast") return "podcast";
  if (type === "session") return "session";
  if (type === "event") return "event";
  if (type === "livestream") return "livestream";
  return undefined;
}
