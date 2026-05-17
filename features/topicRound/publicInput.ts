import { z } from "zod";

export const PUBLIC_ANLASSRAUM_INPUT_KINDS = [
  "frage",
  "quelle",
  "perspektive",
  "option",
  "hinweis",
] as const;

export type PublicAnlassraumInputKind =
  (typeof PUBLIC_ANLASSRAUM_INPUT_KINDS)[number];

export const PublicAnlassraumInputPayloadSchema = z
  .object({
    anlassraumId: z.string().trim().regex(/^[a-f0-9]{24}$/i),
    kind: z.enum(PUBLIC_ANLASSRAUM_INPUT_KINDS),
    text: z.string().trim().min(8).max(2400),
    sourceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  })
  .strict();

export type PublicAnlassraumInputPayload = z.infer<
  typeof PublicAnlassraumInputPayloadSchema
>;

export type PublicAnlassraumInputRoomContext = {
  anlassraumId: string;
  title: string;
  summary: string | null;
  isPublic: boolean;
  regionKey?: string | null;
};

export const PUBLIC_ANLASSRAUM_INPUT_EMPTY_STATE_COPY =
  "Noch kein öffentlicher Anlass für direkte Eingaben aktiv. Wähle zuerst einen sichtbaren Anlassraum.";

export function publicAnlassraumInputKindLabel(
  value: PublicAnlassraumInputKind,
): string {
  switch (value) {
    case "frage":
      return "Frage";
    case "quelle":
      return "Quelle";
    case "perspektive":
      return "Perspektive";
    case "option":
      return "Option";
    case "hinweis":
      return "Hinweis";
  }
}

export function publicAnlassraumInputPlaceholder(
  value: PublicAnlassraumInputKind,
): string {
  switch (value) {
    case "frage":
      return "Welche Frage soll im Anlassraum öffentlich gesammelt werden?";
    case "quelle":
      return "Welche Quelle oder welches Dokument ist für diesen Anlass relevant?";
    case "perspektive":
      return "Welche lokale Perspektive oder Gegenposition sollte sichtbar werden?";
    case "option":
      return "Welche Option sollte für diesen Anlass geprüft werden?";
    case "hinweis":
      return "Welcher kurze Hinweis sollte review- und risikogesteuert eingehen?";
  }
}
