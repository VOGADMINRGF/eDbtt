import { BRAND } from "@/lib/brand";
import { readStringParam } from "@/features/surface";

export type DistributionEntry = "qr" | "direct";
export type DistributionSource =
  | "article"
  | "print"
  | "tv_show"
  | "talkshow"
  | "radio"
  | "video"
  | "podcast"
  | "author_column"
  | "letter_to_editor"
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
  "print",
  "tv_show",
  "talkshow",
  "radio",
  "video",
  "podcast",
  "author_column",
  "letter_to_editor",
  "session",
  "event",
  "livestream",
]);

function sourceFraming(source?: DistributionSource) {
  if (source === "article") return "Begleitraum zu einem Artikel";
  if (source === "print") return "Begleitraum zu einer Printausgabe";
  if (source === "tv_show") return "Begleitraum zu einer TV-Sendung";
  if (source === "talkshow") return "Begleitraum zu einer Talkshow";
  if (source === "radio") return "Begleitraum zu einer Radiosendung";
  if (source === "video") return "Begleitraum zu einem Video";
  if (source === "podcast") return "Begleitraum zu einer Podcast-Episode";
  if (source === "author_column") return "Begleitraum zu einem Autor:innenbeitrag";
  if (source === "letter_to_editor") return "Begleitraum zu einem Leserbrief";
  if (source === "session") return "Begleitraum zu einer Session";
  if (source === "event") return "Begleitraum zu einer Veranstaltung";
  if (source === "livestream") return "Begleitraum zu einem Livestream";
  return "Offener Einstieg ohne spezifischen Anlass";
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

export function companionTypeToDistributionSource(type: string): DistributionSource | undefined {
  if (
    type === "article" ||
    type === "print" ||
    type === "tv_show" ||
    type === "talkshow" ||
    type === "radio" ||
    type === "video" ||
    type === "podcast" ||
    type === "author_column" ||
    type === "letter_to_editor" ||
    type === "event" ||
    type === "livestream"
  ) {
    return type;
  }
  return undefined;
}

export function distributionSourceLabel(source?: DistributionSource) {
  if (!source) return "ohne Anlassquelle";
  if (source === "article") return "Artikel";
  if (source === "print") return "Print";
  if (source === "tv_show") return "TV-Sendung";
  if (source === "talkshow") return "Talkshow";
  if (source === "radio") return "Radiosendung";
  if (source === "video") return "Video";
  if (source === "podcast") return "Podcast";
  if (source === "author_column") return "Autor:innenbeitrag";
  if (source === "letter_to_editor") return "Leserbrief";
  if (source === "session") return "Session";
  if (source === "event") return "Veranstaltung";
  return "Livestream";
}
