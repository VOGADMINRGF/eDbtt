import type { SignalToAnlassraumPath } from "@features/feeds/signalDecisioning";
import type { FeedReviewState, VoteDraftStatus } from "@features/feeds/types";
import { humanizeOperatorToken, type OperatorLocale } from "./operatorSystemTexts.core";

const OPERATOR_INTL_LOCALE: Record<OperatorLocale, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
};

const OPERATOR_EMPTY = "—";

export function formatDecisionPathLabel(path: SignalToAnlassraumPath, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<SignalToAnlassraumPath, string>> = {
    de: {
      ignore: "Ignorieren",
      attach_to_existing_anlassraum: "Mit Anlassraum verknüpfen",
      create_anlassraum_candidate: "Anlassraum-Kandidat anlegen",
      manual_fast_path_via_create: "Manuell via /create",
    },
    en: {
      ignore: "Ignore",
      attach_to_existing_anlassraum: "Link to Anlassraum",
      create_anlassraum_candidate: "Create Anlassraum candidate",
      manual_fast_path_via_create: "Manual via /create",
    },
    es: {
      ignore: "Ignorar",
      attach_to_existing_anlassraum: "Vincular con Anlassraum",
      create_anlassraum_candidate: "Crear candidato de Anlassraum",
      manual_fast_path_via_create: "Manual mediante /create",
    },
    fr: {
      ignore: "Ignorer",
      attach_to_existing_anlassraum: "Lier à un Anlassraum",
      create_anlassraum_candidate: "Créer un candidat Anlassraum",
      manual_fast_path_via_create: "Manuel via /create",
    },
    zh: {
      ignore: "忽略",
      attach_to_existing_anlassraum: "关联到 Anlassraum",
      create_anlassraum_candidate: "创建 Anlassraum 候选",
      manual_fast_path_via_create: "通过 /create 手动处理",
    },
  };
  const map = mapByLocale[locale];
  return map[path];
}

export function formatFeedReviewStateLabel(state: FeedReviewState | "all", locale: OperatorLocale): string {
  const allLabel: Record<OperatorLocale, string> = {
    de: "Alle Warteschlangen-Zustände",
    en: "All queue states",
    es: "Todos los estados de cola",
    fr: "Tous les états de file",
    zh: "所有队列状态",
  };
  if (state === "all") return allLabel[locale];
  const mapByLocale: Record<OperatorLocale, Record<FeedReviewState, string>> = {
    de: {
      queued: "In Warteschlange",
      ignored: "Ignoriert",
      attached: "Verknüpft",
      candidate_created: "Kandidat angelegt",
      weak_signal: "Schwaches Signal",
    },
    en: {
      queued: "Queued",
      ignored: "Ignored",
      attached: "Linked",
      candidate_created: "Candidate created",
      weak_signal: "Weak signal",
    },
    es: {
      queued: "En cola",
      ignored: "Ignorado",
      attached: "Vinculado",
      candidate_created: "Candidato creado",
      weak_signal: "Señal débil",
    },
    fr: {
      queued: "En file",
      ignored: "Ignoré",
      attached: "Lié",
      candidate_created: "Candidat créé",
      weak_signal: "Signal faible",
    },
    zh: {
      queued: "队列中",
      ignored: "已忽略",
      attached: "已关联",
      candidate_created: "已创建候选",
      weak_signal: "弱信号",
    },
  };
  const map = mapByLocale[locale];
  return map[state];
}

export function formatVoteDraftStatusLabel(status: VoteDraftStatus | "all", locale: OperatorLocale): string {
  const allLabel: Record<OperatorLocale, string> = {
    de: "Alle",
    en: "All",
    es: "Todos",
    fr: "Tous",
    zh: "全部",
  };
  if (status === "all") return allLabel[locale];
  const mapByLocale: Record<OperatorLocale, Record<VoteDraftStatus, string>> = {
    de: {
      draft: "Entwurf",
      review: "Prüfung",
      published: "Veröffentlicht",
      discarded: "Verworfen",
    },
    en: {
      draft: "Draft",
      review: "Review",
      published: "Published",
      discarded: "Discarded",
    },
    es: {
      draft: "Borrador",
      review: "Revisión",
      published: "Publicado",
      discarded: "Descartado",
    },
    fr: {
      draft: "Brouillon",
      review: "Révision",
      published: "Publié",
      discarded: "Écarté",
    },
    zh: {
      draft: "草稿",
      review: "审核中",
      published: "已发布",
      discarded: "已丢弃",
    },
  };
  const map = mapByLocale[locale];
  return map[status];
}

export function formatPriorityBucketLabel(bucket: "high" | "medium" | "low", locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<"high" | "medium" | "low", string>> = {
    de: {
      high: "Priorität hoch",
      medium: "Priorität mittel",
      low: "Priorität niedrig",
    },
    en: {
      high: "High priority",
      medium: "Medium priority",
      low: "Low priority",
    },
    es: {
      high: "Prioridad alta",
      medium: "Prioridad media",
      low: "Prioridad baja",
    },
    fr: {
      high: "Priorité élevée",
      medium: "Priorité moyenne",
      low: "Priorité faible",
    },
    zh: {
      high: "高优先级",
      medium: "中优先级",
      low: "低优先级",
    },
  };
  const map = mapByLocale[locale];
  return map[bucket];
}

export function formatQueueSortLabel(sort: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      newest: "Neueste zuerst",
      oldest: "Älteste zuerst",
      review_recent: "Zuletzt geprüft",
      review_stale: "Lange nicht geprüft",
      priority_high: "Warteschlangen-Priorität",
    },
    en: {
      newest: "Newest first",
      oldest: "Oldest first",
      review_recent: "Recently reviewed",
      review_stale: "Least recently reviewed",
      priority_high: "Queue priority",
    },
    es: {
      newest: "Más recientes primero",
      oldest: "Más antiguos primero",
      review_recent: "Revisado recientemente",
      review_stale: "Hace tiempo sin revisar",
      priority_high: "Prioridad de cola",
    },
    fr: {
      newest: "Les plus récents d'abord",
      oldest: "Les plus anciens d'abord",
      review_recent: "Récemment révisé",
      review_stale: "Révision la plus ancienne",
      priority_high: "Priorité de file",
    },
    zh: {
      newest: "最新优先",
      oldest: "最早优先",
      review_recent: "最近审核",
      review_stale: "最久未审核",
      priority_high: "队列优先级",
    },
  };
  const map = mapByLocale[locale];
  return map[sort] ?? humanizeOperatorToken(sort);
}

export function formatLinkFilterLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      all: "Alle Verknüpfungszustände",
      linked: "Mit Anlassraum verknüpft",
      unlinked: "Ohne Anlassraum",
    },
    en: {
      all: "All link states",
      linked: "Linked to Anlassraum",
      unlinked: "Without Anlassraum",
    },
    es: {
      all: "Todos los estados de vínculo",
      linked: "Vinculado con Anlassraum",
      unlinked: "Sin Anlassraum",
    },
    fr: {
      all: "Tous les états de lien",
      linked: "Lié à un Anlassraum",
      unlinked: "Sans Anlassraum",
    },
    zh: {
      all: "所有关联状态",
      linked: "已关联 Anlassraum",
      unlinked: "未关联 Anlassraum",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatWeakSignalFilterLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      all: "Alle Signalmarkierungen",
      flagged: "Schwaches Signal",
      clear: "Kein schwaches Signal",
    },
    en: {
      all: "All signal flags",
      flagged: "Weak signal",
      clear: "No weak signal",
    },
    es: {
      all: "Todas las marcas de señal",
      flagged: "Señal débil",
      clear: "Sin señal débil",
    },
    fr: {
      all: "Tous les marqueurs de signal",
      flagged: "Signal faible",
      clear: "Aucun signal faible",
    },
    zh: {
      all: "所有信号标记",
      flagged: "弱信号",
      clear: "无弱信号",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatBulkActionLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      ignore: "1) Ignorieren (Signal verwerfen)",
      attach_to_anlassraum: "2) Mit bestehendem Anlassraum verknüpfen",
      create_anlassraum_candidate: "3) Anlassraum-Kandidat anlegen",
      mark_as_weak_signal: "Als schwaches Signal markieren",
    },
    en: {
      ignore: "1) Ignore (discard signal)",
      attach_to_anlassraum: "2) Link to existing Anlassraum",
      create_anlassraum_candidate: "3) Create Anlassraum candidate",
      mark_as_weak_signal: "Mark as weak signal",
    },
    es: {
      ignore: "1) Ignorar (descartar señal)",
      attach_to_anlassraum: "2) Vincular con Anlassraum existente",
      create_anlassraum_candidate: "3) Crear candidato de Anlassraum",
      mark_as_weak_signal: "Marcar como señal débil",
    },
    fr: {
      ignore: "1) Ignorer (écarter le signal)",
      attach_to_anlassraum: "2) Lier à un Anlassraum existant",
      create_anlassraum_candidate: "3) Créer un candidat Anlassraum",
      mark_as_weak_signal: "Marquer comme signal faible",
    },
    zh: {
      ignore: "1) 忽略（丢弃信号）",
      attach_to_anlassraum: "2) 关联到现有 Anlassraum",
      create_anlassraum_candidate: "3) 创建 Anlassraum 候选",
      mark_as_weak_signal: "标记为弱信号",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatOutputActionLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      queue: "In Warteschlange setzen",
      send_to_review: "Zur Prüfung senden",
      approve_prep: "Vorbereitet freigeben",
      reject_prep: "Vorbereitung ablehnen",
      mark_ready: "Als bereit markieren",
      publish: "Manuell publizieren",
      discard: "Verwerfen",
      reset_draft: "Auf Draft zurücksetzen",
    },
    en: {
      queue: "Move to queue",
      send_to_review: "Send to review",
      approve_prep: "Approve prep",
      reject_prep: "Reject prep",
      mark_ready: "Mark as ready",
      publish: "Manual publish",
      discard: "Discard",
      reset_draft: "Reset to draft",
    },
    es: {
      queue: "Mover a cola",
      send_to_review: "Enviar a revisión",
      approve_prep: "Aprobar preparación",
      reject_prep: "Rechazar preparación",
      mark_ready: "Marcar como listo",
      publish: "Publicación manual",
      discard: "Descartar",
      reset_draft: "Restablecer a borrador",
    },
    fr: {
      queue: "Placer en file",
      send_to_review: "Envoyer en révision",
      approve_prep: "Approuver la préparation",
      reject_prep: "Rejeter la préparation",
      mark_ready: "Marquer comme prêt",
      publish: "Publication manuelle",
      discard: "Écarter",
      reset_draft: "Réinitialiser en brouillon",
    },
    zh: {
      queue: "移入队列",
      send_to_review: "发送审核",
      approve_prep: "批准准备",
      reject_prep: "拒绝准备",
      mark_ready: "标记为就绪",
      publish: "手动发布",
      discard: "丢弃",
      reset_draft: "重置为草稿",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatOutputSeedStatusLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      draft: "Entwurf",
      queued: "In Warteschlange",
      review: "In Prüfung",
      ready: "Bereit",
      published: "Veröffentlicht",
      discarded: "Verworfen",
    },
    en: {
      draft: "Draft",
      queued: "Queued",
      review: "In review",
      ready: "Ready",
      published: "Published",
      discarded: "Discarded",
    },
    es: {
      draft: "Borrador",
      queued: "En cola",
      review: "En revisión",
      ready: "Listo",
      published: "Publicado",
      discarded: "Descartado",
    },
    fr: {
      draft: "Brouillon",
      queued: "En file",
      review: "En révision",
      ready: "Prêt",
      published: "Publié",
      discarded: "Écarté",
    },
    zh: {
      draft: "草稿",
      queued: "队列中",
      review: "审核中",
      ready: "就绪",
      published: "已发布",
      discarded: "已丢弃",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatOutputSeedReviewStateLabel(value: string, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, Record<string, string>> = {
    de: {
      queued: "In Warteschlange",
      in_review: "In Prüfung",
      approved: "Freigegeben",
      rejected: "Abgelehnt",
      blocked: "Blockiert",
      none: "Kein Prüfstatus",
    },
    en: {
      queued: "Queued",
      in_review: "In review",
      approved: "Approved",
      rejected: "Rejected",
      blocked: "Blocked",
      none: "None",
    },
    es: {
      queued: "En cola",
      in_review: "En revisión",
      approved: "Aprobado",
      rejected: "Rechazado",
      blocked: "Bloqueado",
      none: "Sin estado de revisión",
    },
    fr: {
      queued: "En file",
      in_review: "En révision",
      approved: "Approuvé",
      rejected: "Rejeté",
      blocked: "Bloqué",
      none: "Aucun état de révision",
    },
    zh: {
      queued: "队列中",
      in_review: "审核中",
      approved: "已批准",
      rejected: "已拒绝",
      blocked: "已阻塞",
      none: "无审核状态",
    },
  };
  const map = mapByLocale[locale];
  return map[value] ?? humanizeOperatorToken(value);
}

export function formatBooleanLabel(value: boolean, locale: OperatorLocale): string {
  const mapByLocale: Record<OperatorLocale, { trueValue: string; falseValue: string }> = {
    de: { trueValue: "ja", falseValue: "nein" },
    en: { trueValue: "yes", falseValue: "no" },
    es: { trueValue: "sí", falseValue: "no" },
    fr: { trueValue: "oui", falseValue: "non" },
    zh: { trueValue: "是", falseValue: "否" },
  };
  return value ? mapByLocale[locale].trueValue : mapByLocale[locale].falseValue;
}

export function formatOpenLabel(locale: OperatorLocale): string {
  const map: Record<OperatorLocale, string> = {
    de: "offen",
    en: "open",
    es: "abierto",
    fr: "ouvert",
    zh: "开放",
  };
  return map[locale];
}

export function formatOperatorNumber(
  value: number | null | undefined,
  locale: OperatorLocale,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return OPERATOR_EMPTY;
  try {
    return new Intl.NumberFormat(OPERATOR_INTL_LOCALE[locale], options).format(value);
  } catch {
    return String(value);
  }
}

export function formatOperatorDateTime(
  value: string | number | Date | null | undefined,
  locale: OperatorLocale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" },
): string {
  if (value === null || value === undefined || value === "") return OPERATOR_EMPTY;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(OPERATOR_INTL_LOCALE[locale], options).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatOperatorHours(value: number | null | undefined, locale: OperatorLocale): string {
  const formatted = formatOperatorNumber(value, locale, { maximumFractionDigits: 1 });
  if (formatted === OPERATOR_EMPTY) return OPERATOR_EMPTY;
  return `${formatted}h`;
}

export function formatOperatorTokenLabel(value: string | null | undefined, fallback = OPERATOR_EMPTY): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) return fallback;
  return humanizeOperatorToken(normalized);
}
