import {
  getAnlassraumPublicAccessModeLabel,
  getAnlassraumPublicVisibilityLabel,
  type AnlassraumActivationRecord,
} from "@/features/create/anlassraumActivationWorkflow";
import { listPublishedAnlassraumActivationRecords } from "@/features/create/anlassraumActivationWorkflowServer";

export type PublicAnlassraumRuntimeItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  trigger: string;
  updatedAt: string;
  source: "runtime";
};

export type PublicAnlassraumRuntimeDetail = PublicAnlassraumRuntimeItem & {
  publicVisibilityLabel: string;
  publicAccessModeLabel: string;
  contextNotice: string;
  sourceNotice: string;
  releaseNotice: string;
};

export function stripAnlassraumInternalFieldsForPublic(
  record: AnlassraumActivationRecord,
): Omit<PublicAnlassraumRuntimeDetail, "source"> {
  return {
    id: String(record.anlassraumId ?? record.id),
    slug: String(record.anlassraumSlug ?? record.id),
    title: record.title,
    summary: record.description,
    trigger: record.trigger,
    updatedAt: record.updatedAt,
    publicVisibilityLabel: getAnlassraumPublicVisibilityLabel(record.visibility),
    publicAccessModeLabel: getAnlassraumPublicAccessModeLabel(
      record.publicAccessMode,
    ),
    contextNotice:
      "Quellen-, Community-, Graph- und Dossier-Bezüge bleiben Einordnung und Review-Kontext, nicht automatische Wahrheit oder Verifikation.",
    sourceNotice:
      "Die öffentliche Anlassraum-Lesart bleibt read-only und zeigt nur explizit veröffentlichte Runtime-Anlassräume.",
    releaseNotice:
      "Dieser Anlassraum wurde redaktionell freigegeben und bewusst öffentlich sichtbar gemacht.",
  };
}

export function mapAnlassraumToPublicAnlassraum(
  record: AnlassraumActivationRecord,
): PublicAnlassraumRuntimeDetail {
  return {
    ...stripAnlassraumInternalFieldsForPublic(record),
    source: "runtime",
  };
}

export async function listPublishedAnlassraeume(input?: { limit?: number }) {
  const records = await listPublishedAnlassraumActivationRecords(input?.limit ?? 40);
  return records.map((record): PublicAnlassraumRuntimeItem => ({
    id: String(record.anlassraumId ?? record.id),
    slug: String(record.anlassraumSlug ?? record.id),
    title: record.title,
    summary: record.description,
    trigger: record.trigger,
    updatedAt: record.updatedAt,
    source: "runtime",
  }));
}

export async function getPublishedAnlassraumBySlugOrId(slugOrId: string) {
  const records = await listPublishedAnlassraumActivationRecords(200);
  const normalized = String(slugOrId ?? "").trim();
  const record =
    records.find((entry) => entry.anlassraumId === normalized) ??
    records.find((entry) => entry.anlassraumSlug === normalized) ??
    null;

  return record ? mapAnlassraumToPublicAnlassraum(record) : null;
}
