import { z } from "zod";

export const STREAM_PUBLIC_INPUT_KINDS = [
  "question",
  "source_hint",
  "perspective",
  "option",
  "concern",
  "correction",
  "support",
] as const;

export type StreamPublicInputKind =
  (typeof STREAM_PUBLIC_INPUT_KINDS)[number];

export const StreamPublicInputPayloadSchema = z
  .object({
    streamId: z.string().trim().regex(/^[a-f0-9]{24}$/i),
    kind: z.enum(STREAM_PUBLIC_INPUT_KINDS),
    text: z.string().trim().min(8).max(2400),
    sourceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  })
  .strict();

export type StreamPublicInputPayload = z.infer<
  typeof StreamPublicInputPayloadSchema
>;

export type StreamPublicInputContext = {
  streamId: string;
  slug: string | null;
  title: string;
  summary: string | null;
  topicKey: string | null;
  regionCode: string | null;
  anlassraumId: string | null;
  anlassraumTitle: string | null;
  dossierId: string | null;
};

export const STREAM_PUBLIC_INPUT_EMPTY_STATE_COPY =
  "Dieser Event ist aktuell nicht für öffentliche Beteiligung geöffnet.";

export function streamPublicInputKindLabel(value: StreamPublicInputKind): string {
  switch (value) {
    case "question":
      return "Frage";
    case "source_hint":
      return "Quelle";
    case "perspective":
      return "Perspektive";
    case "option":
      return "Option";
    case "concern":
      return "Bedenken";
    case "correction":
      return "Korrektur";
    case "support":
      return "Unterstützung";
  }
}

export function streamPublicInputPlaceholder(value: StreamPublicInputKind): string {
  switch (value) {
    case "question":
      return "Welche Frage sollte im Event oder in der Nachbereitung beantwortet werden?";
    case "source_hint":
      return "Welche Quelle, welches Dokument oder welcher Link hilft beim Prüfen?";
    case "perspective":
      return "Welche Perspektive oder Gegenposition sollte sichtbar bleiben?";
    case "option":
      return "Welche Option oder welcher nächste Schritt sollte geprüft werden?";
    case "concern":
      return "Welches Risiko oder welche Sorge sollte in die Nachbereitung einfließen?";
    case "correction":
      return "Was sollte korrigiert oder nachgeschärft werden?";
    case "support":
      return "Welcher Punkt findet bei dir Unterstützung und warum?";
  }
}
