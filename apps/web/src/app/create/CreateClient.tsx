"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier } from "@core/access/accessTiers";
import type { CreateEntitlements } from "@/lib/server/entitlements/createEntitlements";
import type { CreateMode } from "@/features/create/intents";
import { formatRelevanceScopeLabel } from "@/features/relevanceFraming";
import { useLocale } from "@/context/LocaleContext";
import {
  hasCreateIntakeContext,
  type CreateIntakeContext,
} from "@/features/create/intakeContext";
import {
  resolveCreateOrchestratorIntentContract,
  type CreateEntryIntent,
  type CreateEntryMode,
} from "@/features/create/orchestratorIntentContract";
import {
  CREATE_PRODUCT_MODE_VALUES,
  type CreateProductMode,
} from "@/features/create/createProductModes";
import type { CreateIntent as CreateContextIntent } from "@/features/create/intents";
import {
  mapCreateIntentToProductMode,
  mapProductModeToCreateIntent,
  resolveInitialCreateIntent,
  type CreateIntent,
} from "@/features/create/intentFlows";
import {
  buildFinalizeFallbackPath,
  normalizeInternalRedirectPath,
} from "@/features/create/finalizeRedirect";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
  type CreateSurfaceTexts,
  type CreateContextAnchorDefinition,
  getCreateHelperLinks,
  getCreateSurfaceModeDefinitions,
  getCreateSurfaceTexts,
  resolveCreateSurfaceLocale,
  resolveCreateContextAnchorById,
  resolveCreateModeDefinition,
} from "@/features/create/createSurfaceConfig";
import {
  formatOperatorNumber,
  getOperatorCreateTexts,
  resolveOperatorLocale,
  type OperatorCreateTexts,
} from "@/features/i18n/operatorSystemTexts";
import SharedCreateComposer from "@/features/create/SharedCreateComposer";
import { usePrivacyGate } from "@/components/privacy/PrivacyGateProvider";
import {
  type CreateIntelligentFollowupResult,
} from "@/features/create/intelligentFollowupContract";
import {
  buildCreateFollowupPrimaryCtaHref,
  buildCreateFollowupTargetHref,
} from "@/features/create/followupTargetHref";
import CreateVisualFollowup, {
  CreateStructureOverview,
  deriveCreateStructureOverviewMetrics,
} from "@/features/create/CreateVisualFollowup";
import {
  buildCreateHandoffDraft,
  buildCreateHandoffTargetHref,
  readCreateHandoffDraft,
  saveCreateHandoffDraft,
  type CreateHandoffAction,
} from "@/features/create/createHandoff";
import { resolveCreateHandoffJourneySummary } from "@/features/b2cJourney/statusContract";
import CreateLinkIntakeClarification from "@/features/create/CreateLinkIntakeClarification";
import {
  buildCreateLinkIntakeMeta,
  buildCreateLinkSourceNotice,
  detectCreateLinkIntake,
  type CreateLinkIntentOptionId,
  type CreateLinkIntakeDetection,
} from "@/features/create/linkIntake";
import {
  buildCreateAttachmentMaterialItems,
  resolveMaterialRouting,
} from "@/features/create/materialRouting";
import type { RequestScopeSummary } from "@/lib/server/auth/requestScope";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { getVoxyCopy } from "@/features/voxy/voxyCopy";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialAnlassraumId?: string | null;
  initialMode?: CreateMode;
  initialIntentParam?: string | null;
  initialModeParam?: string | null;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialText?: string | null;
  initialIntakeContext?: CreateIntakeContext | null;
  initialReturnTo?: string | null;
  initialRequestScope?: RequestScopeSummary | null;
};

export const CREATE_PRODUCT_MODES = CREATE_PRODUCT_MODE_VALUES;

const MIN_INTENT_INPUT_LENGTH = 24;

type CreateWorkingState = {
  summary: string;
  recognizedType: string;
  suggestedAssignment: string;
};

export const CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS = {
  understanding: "eDebatte hat deinen Beitrag strukturiert",
  extracted: "So hängt dein Beitrag zusammen",
  connections: "Passende nächste Schritte",
  voteNotice: "Deine Stimme wird nicht automatisch abgegeben.",
} as const;

export function shouldRenderCreateIntelligentFollowup(params: {
  hasStarted: boolean;
  productMode: CreateProductMode;
  followup: CreateIntelligentFollowupResult | null;
}): boolean {
  if (!params.hasStarted) return false;
  if (params.productMode !== "analyze") return false;
  return Boolean(params.followup);
}

export function shouldShowCreateFollowupQuestionCard(params: {
  showPostInputModules: boolean;
  productMode: CreateProductMode;
}): boolean {
  if (!params.showPostInputModules) return false;
  return params.productMode !== "analyze";
}

export function resolveCreatePostStartSectionOrder(params: {
  showIntelligentFollowup: boolean;
  showPostInputModules: boolean;
  showFollowupQuestionCard: boolean;
  pickerEnabled: boolean;
}): string[] {
  const sections: string[] = [];
  if (params.showIntelligentFollowup) sections.push("intelligent-followup");
  if (params.showPostInputModules && !params.showIntelligentFollowup) sections.push("post-start-meta");
  if (params.showFollowupQuestionCard) sections.push("followup-question");
  if (params.showPostInputModules && params.pickerEnabled) sections.push("context-picker");
  if (params.showPostInputModules) sections.push("quotas");
  return sections;
}

export function resolveCreateAnlassraumTargetHref(
  followup: CreateIntelligentFollowupResult | null,
): string {
  if (!followup) return "/runden?view=active&from=create";
  const roomSuggestion =
    followup.suggestions.find((suggestion) => suggestion.kind === "anlassraum") ??
    followup.suggestions.find((suggestion) => suggestion.kind === "new_anlassraum") ??
    null;
  const suggestedHref = roomSuggestion?.href?.trim() ?? "";
  if (suggestedHref && !suggestedHref.startsWith("/create")) {
    return suggestedHref;
  }
  if (followup.meta?.planner?.plannerTopic) {
    return `/runden?view=active&from=create&topic=${encodeURIComponent(followup.meta.planner.plannerTopic)}`;
  }
  return "/runden?view=active&from=create";
}

function isPlannerReadyForStructuredHandoff(
  followup: CreateIntelligentFollowupResult | null,
): boolean {
  const planner = followup?.meta?.planner ?? null;
  if (!planner) return false;
  return planner.qualityStatus === "specific" && planner.plannerDegraded === false;
}

type CreateProductModeConfig = ReturnType<typeof resolveCreateModeDefinition> & {
  preferredUseCase: UseCaseId;
  preferredCreateMode?: CreateMode;
};

const CREATE_PRODUCT_MODE_INTERNAL_CONFIG: Record<
  CreateProductMode,
  Pick<CreateProductModeConfig, "preferredUseCase" | "preferredCreateMode">
> = {
  analyze: {
    preferredUseCase: "civic",
    preferredCreateMode: "source",
  },
  media: {
    preferredUseCase: "journalism",
    preferredCreateMode: "source",
  },
  guided: {
    preferredUseCase: "agenda",
    preferredCreateMode: "ai",
  },
};

type CreateContextPickerItem = {
  anlassraumId: string;
  title: string;
  summary: string;
  topicKey: string | null;
  anlassraumType: string | null;
  anlassraumStatus: string | null;
  sourceMode: string | null;
  outputStatus: string;
  updatedAt: string | null;
};

type ContextLoadState = "idle" | "loading" | "ready" | "error";

type GateState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "allowed"; entitlements: CreateEntitlements }
  | { status: "blocked"; entitlements: CreateEntitlements };

type CreatePrimaryIntakeSnapshot = {
  intakeText: string;
  hasStarted: boolean;
  updatedAt: string;
};

type CreateFollowupSurface = "none" | "lightweight" | "analysis";
export type { CreateFollowupSurface };

type CreateReviewRequestState = "idle" | "saving" | "saved" | "error";

type CreateLinkClarificationState = {
  detection: CreateLinkIntakeDetection;
  selectedIntentId: CreateLinkIntentOptionId | null;
  additionalContext: string;
};

export type CreateLightweightFollowupSnapshot = {
  originalText: string;
  understandingLine: string;
};

export function buildCreateLightweightFollowupSnapshot(params: {
  intakeText: string;
  modeLabel: string;
  contextAnchorLabel?: string | null;
  surfaceTexts: Pick<CreateSurfaceTexts, "followupUnderstandingLine">;
}): CreateLightweightFollowupSnapshot {
  const originalText = params.intakeText.trim();
  const understandingLabel = String(params.contextAnchorLabel ?? "").trim() || params.modeLabel;
  return {
    originalText,
    understandingLine: params.surfaceTexts.followupUnderstandingLine(understandingLabel),
  };
}

function CreateSubmittedContributionBubble(props: { text: string }) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--muted))] ring-4 ring-[rgb(var(--card))]" />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Du</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%)] px-4 py-3 shadow-sm shadow-slate-950/5">
          <p className="whitespace-pre-wrap text-sm text-[rgb(var(--fg))] md:text-base">
            {props.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateAssistantStatusBubble(props: {
  eyebrow: string;
  title: string;
  body: string;
  notice?: string | null;
}) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--grad-from))] ring-4 ring-[rgb(var(--card))]" />
      <div className="max-w-5xl flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">eDebatte</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-[rgb(var(--grad-from))]/25 bg-[linear-gradient(180deg,color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--grad-from))_10%),color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%))] px-4 py-4 shadow-[0_18px_42px_rgba(2,6,23,0.06)] md:px-5 md:py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{props.eyebrow}</p>
          <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))] md:text-lg">{props.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--fg))] md:text-base">{props.body}</p>
          {props.notice ? (
            <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
              {props.notice}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CreateInlineAnalysisScene(props: {
  productMode: CreateProductMode;
  notice?: string | null;
  children: React.ReactNode;
}) {
  const heading =
    props.productMode === "media"
      ? { lead: "Beitrag", tail: "prüfen" }
      : props.productMode === "guided"
        ? { lead: "Entwurf", tail: "ausarbeiten" }
        : { lead: "Statement", tail: "analysieren" };
  const stepper = [
    {
      id: "input",
      label: "Eingabe",
      lead: "aufgenommen",
      state: "done",
    },
    {
      id: "classification",
      label: "Einordnung",
      lead: "geordnet",
      state: "done",
    },
    {
      id: "analysis",
      label: "Analyse",
      lead: props.productMode === "media" ? "offen" : "aktiv",
      state: "active",
    },
    {
      id: "factcheck",
      label: "Prüfen",
      lead: "optional",
      state: "upcoming",
    },
    {
      id: "handoff",
      label: "Weiterführen",
      lead: "danach",
      state: "upcoming",
    },
  ] as const;

  return (
    <section className="space-y-4 rounded-[2rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] p-4 shadow-[0_24px_56px_rgba(2,6,23,0.12)] md:p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Analyse-Szene</p>
            <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))] sm:text-2xl">
              <span className="bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 bg-clip-text text-transparent">
                {heading.lead}
              </span>{" "}
              {heading.tail}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">
              Prüfmodus jetzt im selben Arbeitsraum geöffnet. Analyse, Quellenbindung und optionaler Faktencheck bleiben ein durchgehender nächster Schritt statt ein separater Abzweig.
            </p>
          </div>
          <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-3 py-1 text-[11px] font-semibold text-cyan-900 dark:text-cyan-100">
            Kein Auto-Start nach außen
          </span>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-3">
            {stepper.map((stage, index) => {
              const isDone = stage.state === "done";
              const isActive = stage.state === "active";
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className={`flex min-w-[9rem] items-center gap-3 rounded-full border px-3 py-2 ${
                      isActive
                        ? "border-cyan-300/50 bg-cyan-500/[0.09]"
                        : isDone
                          ? "border-emerald-300/35 bg-emerald-500/[0.08]"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        isActive
                          ? "border-cyan-300/60 text-cyan-900 dark:text-cyan-100"
                          : isDone
                            ? "border-emerald-300/60 text-emerald-800 dark:text-emerald-100"
                            : "border-slate-300/70 text-slate-500 dark:border-slate-400/35 dark:text-slate-300"
                      }`}
                    >
                      {isDone ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{stage.label}</p>
                      <p className="text-[11px] text-[rgb(var(--muted))]">{stage.lead}</p>
                    </div>
                  </div>
                  {index < stepper.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="h-px w-8 shrink-0 bg-gradient-to-r from-cyan-400/35 to-emerald-300/20"
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {props.notice ? (
        <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-relaxed text-cyan-900 dark:text-cyan-100">
          {props.notice}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1.5">
        {props.children}
      </div>
    </section>
  );
}

const CREATE_PRIMARY_INTAKE_STORAGE_KEY_PREFIX = "vog_create_primary_intake_v1";

export function buildCreatePrimaryIntakeStorageKey(userId?: string | null): string {
  const normalizedUserId = String(userId ?? "").trim() || "anon";
  return `${CREATE_PRIMARY_INTAKE_STORAGE_KEY_PREFIX}:${normalizedUserId}`;
}

export function parseCreatePrimaryIntakeSnapshot(raw: string | null): CreatePrimaryIntakeSnapshot | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CreatePrimaryIntakeSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    const intakeText = typeof parsed.intakeText === "string" ? parsed.intakeText : "";
    const hasStarted = parsed.hasStarted === true;
    if (!hasPrimaryIntakeText(intakeText) && !hasStarted) return null;
    return {
      intakeText,
      hasStarted,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function deriveUseCaseAccessForProductMode(
  productMode: CreateProductMode,
  text: OperatorCreateTexts,
  modeConfig: { description: string },
): UseCaseAccess {
  const preferredUseCase = resolveCreateProductModeConfig(productMode).preferredUseCase;
  const modeNote = modeConfig.description;

  return {
    allowed: [preferredUseCase],
    note: modeNote,
    lockLabels: {
      civic: text.lockLabelCivic,
      journalism: text.lockLabelJournalism,
      agenda: text.lockLabelAgenda,
    },
    ctaHref: "/pricing",
    ctaLabel: text.upgradeLabel,
  };
}

function deriveGate(entitlements: CreateEntitlements): GateState {
  if (!entitlements.isAuthenticated) return { status: "anon" };
  if (!entitlements.canSubmitStatement && !entitlements.canSubmitContribution) {
    return { status: "blocked", entitlements };
  }
  return { status: "allowed", entitlements };
}

function normalizeAnlassraumId(value?: string | null): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[a-f0-9]{24}$/.test(normalized)) return null;
  return normalized;
}

function membershipStatusLabel(value: RequestScopeSummary["membershipStatus"] | string | null | undefined): string {
  switch (value) {
    case "verified":
    case "organization_verified":
    case "unit_verified":
      return "Organisations-verifiziert";
    case "limited":
      return "Zugriff eingeschränkt";
    case "pending":
    case "evidence_required":
    case "operator_review_required":
      return "In Prüfung";
    case "suspended":
      return "Zugang pausiert";
    case "revoked":
      return "Widerrufen";
    default:
      return "Noch kein bestätigter Scope";
  }
}

function buildCreateScopeNotice(scope: RequestScopeSummary | null): {
  title: string;
  body: string;
  tone: "neutral" | "operator" | "limited";
} | null {
  if (!scope) return null;
  if (scope.isOperatorMode) {
    return {
      title: "Betreiber-Modus sichtbar",
      body:
        "Du arbeitest hier im globalen Betreiberkontext. /create bleibt trotzdem review-first: keine automatische Veröffentlichung und kein automatisches public_official.",
      tone: "operator",
    };
  }
  if (scope.organizationId) {
    const organizationLabel = scope.organizationLabel ?? "deiner Organisation";
    const regionPart =
      scope.regionIds.length > 0
        ? ` ${scope.regionIds.length} Regionen sind im bestätigten Scope vorhanden.`
        : " Ein Regionsscope ist noch nicht bestätigt.";
    return {
      title: `${organizationLabel} · ${membershipStatusLabel(scope.membershipStatus)}`,
      body:
        "Wenn du hier speicherst oder weiterführst, bleibt der Arbeitsstand im Scope deiner Organisation reviewfähig." +
        regionPart,
      tone: "neutral",
    };
  }
  return {
    title: membershipStatusLabel(scope.membershipStatus),
    body:
      "Du kannst den Arbeitsstand vorbereiten, aber noch ohne bestätigten Organisationsscope. Nichts wird automatisch veröffentlicht oder amtlich freigegeben.",
    tone: "limited",
  };
}

export function hasPrimaryIntakeText(value?: string | null): boolean {
  return Boolean(String(value ?? "").trim());
}

export function shouldShowCreatePostInputModules(params: {
  hasStarted: boolean;
  intakeText: string;
  hasMaterialContext?: boolean;
}): boolean {
  if (!params.hasStarted) return false;
  return hasPrimaryIntakeText(params.intakeText) || params.hasMaterialContext === true;
}

export function getCreateContextAnchorsForMode(params: {
  anchors: readonly CreateContextAnchorDefinition[];
  mode: CreateProductMode;
  maxItems?: number;
}): readonly CreateContextAnchorDefinition[] {
  const maxItems = Math.max(1, params.maxItems ?? 3);
  const modeAnchors = params.anchors.filter((anchor) => anchor.mode === params.mode);
  if (modeAnchors.length > 0) {
    return modeAnchors.slice(0, maxItems);
  }
  return params.anchors.slice(0, maxItems);
}

export function buildGuidedWorkspaceText(params: {
  intakeText: string;
  guidedBridgeAnswer: string;
  guidedWorkspacePrefix?: string;
}): string {
  const intake = params.intakeText.trim();
  const guidedAnswer = params.guidedBridgeAnswer.trim();
  const prefix = params.guidedWorkspacePrefix?.trim() || "Geführter Fokus";
  if (!guidedAnswer) return intake;
  if (!intake) return guidedAnswer;
  return `${intake}\n\n${prefix}:\n${guidedAnswer}`;
}

export function shouldRenderCreateAnalyzeWorkspace(params: {
  followupActivated: boolean;
  hasStarted: boolean;
  intakeText: string;
  hasMaterialContext?: boolean;
  productMode: CreateProductMode;
  guidedBridgeConfirmed: boolean;
}): boolean {
  if (!params.followupActivated) return false;
  const postInputReady = shouldShowCreatePostInputModules({
    hasStarted: params.hasStarted,
    intakeText: params.intakeText,
    hasMaterialContext: params.hasMaterialContext,
  });
  if (!postInputReady) return false;
  if (params.productMode !== "guided") return true;
  return params.guidedBridgeConfirmed;
}

export function resolveFollowupSurfaceOnStart(productMode: CreateProductMode): CreateFollowupSurface {
  if (productMode === "media") return "analysis";
  if (productMode === "analyze") return "lightweight";
  return "none";
}

export function resolveInitialCreateProductMode(params: {
  initialIntentParam?: string | null;
  initialModeParam?: string | null;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialMode?: CreateMode;
}): CreateProductMode {
  return mapCreateIntentToProductMode(
    resolveInitialCreateIntent({
      rawIntentParam: params.initialIntentParam,
      rawModeParam: params.initialModeParam,
      initialEntryIntent: params.initialEntryIntent,
      initialEntryMode: params.initialEntryMode,
      initialMode: params.initialMode,
    }),
  );
}

function summarizeWorkingText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trim()}...`;
}

function detectRecognizedType(intent: CreateIntent, value: string): string {
  const text = value.toLowerCase();
  if (intent === "contribute") {
    if (/https?:\/\/|www\./i.test(text) || /quelle|link|dokument|bericht/i.test(text)) return "Quelle";
    if (/frage|warum|wie|wo|wer|wann|\?/i.test(text)) return "Frage";
    if (/vorschlag|option|lösung|loesung/i.test(text)) return "Vorschlag";
    if (/erfahrung|erlebt|beobachtung|wahrnehmung/i.test(text)) return "Erfahrung";
    return "Hinweis";
  }
  if (intent === "check") {
    if (/https?:\/\/|www\./i.test(text)) return "Quelle";
    if (/entscheidung|beschluss|abstimmung/i.test(text)) return "Entscheidung";
    if (/forderung|these|behauptung|aussage/i.test(text)) return "Behauptung";
    return "Aussage";
  }
  if (/fragenkatalog|fragebogen|leitfrage/i.test(text)) return "Fragenkatalog";
  if (/beteiligungsrunde|workshop|beteiligung/i.test(text)) return "Beteiligungsansatz";
  if (/antrag|vorschlag|vorlage/i.test(text)) return "Vorschlag";
  return "Dossier-Entwurf";
}

export function resolveCreateProductModeConfig(
  mode: CreateProductMode,
  locale: string = "de",
): CreateProductModeConfig {
  const surfaceConfig = resolveCreateModeDefinition(mode, resolveCreateSurfaceLocale(locale));
  const internalConfig = CREATE_PRODUCT_MODE_INTERNAL_CONFIG[mode];
  return {
    ...surfaceConfig,
    ...internalConfig,
  };
}

function renderRundenContextLabel(context?: CreateIntakeContext | null): string | null {
  if (!context) return null;
  const primaryLabel =
    String(context.signalTitle ?? "").trim() ||
    String(context.sourceLabel ?? "").trim() ||
    String(context.clusterHint ?? "").trim();
  if (!primaryLabel) return null;
  return primaryLabel;
}

function isRundenSourceContext(context?: CreateIntakeContext | null): boolean {
  const source = String(context?.source ?? "").trim().toLowerCase();
  const reason = String(context?.reason ?? "").trim().toLowerCase();
  return source === "runden" || reason.startsWith("round_");
}

function buildRundenReturnHref(anlassraumId?: string | null): string {
  const params = new URLSearchParams();
  params.set("view", "active");
  const normalizedAnlassraumId = normalizeAnlassraumId(anlassraumId);
  if (normalizedAnlassraumId) {
    params.set("anlassraumId", normalizedAnlassraumId);
  }
  return `/runden?${params.toString()}`;
}

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialAnlassraumId,
  initialMode,
  initialIntentParam,
  initialModeParam,
  initialEntryIntent,
  initialEntryMode,
  initialText,
  initialIntakeContext,
  initialReturnTo,
  initialRequestScope,
}: CreateClientProps) {
  const privacyGate = usePrivacyGate();
  const router = useRouter();
  const { locale } = useLocale();
  const surfaceLocale = resolveCreateSurfaceLocale(locale);
  const surfaceTexts = React.useMemo(() => getCreateSurfaceTexts(surfaceLocale), [surfaceLocale]);
  const surfaceComposerTexts = React.useMemo(
    () => getCreateComposerTexts(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceModeDefinitions = React.useMemo(
    () => getCreateSurfaceModeDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const allSurfaceContextAnchors = React.useMemo(
    () => getCreateContextAnchorDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceHelperLinks = React.useMemo(() => getCreateHelperLinks(surfaceLocale), [surfaceLocale]);
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorCreateTexts(operatorLocale);
  const scopeNotice = React.useMemo(
    () => buildCreateScopeNotice(initialRequestScope ?? null),
    [initialRequestScope],
  );

  const [entitlements, setEntitlements] = React.useState<CreateEntitlements>(initialEntitlements);
  const [gate, setGate] = React.useState<GateState>(() => deriveGate(initialEntitlements));
  const [productMode, setProductMode] = React.useState<CreateProductMode>(() =>
    resolveInitialCreateProductMode({
      initialIntentParam,
      initialModeParam,
      initialEntryIntent,
      initialEntryMode,
      initialMode,
    }),
  );

  const [contextItems, setContextItems] = React.useState<CreateContextPickerItem[]>([]);
  const [contextLoadState, setContextLoadState] = React.useState<ContextLoadState>("idle");
  const [contextLoadError, setContextLoadError] = React.useState<string | null>(null);
  const [selectedAnlassraumId, setSelectedAnlassraumId] = React.useState<string | null>(() =>
    normalizeAnlassraumId(initialAnlassraumId),
  );
  const [selectionInfo, setSelectionInfo] = React.useState<string | null>(() => {
    if (!initialAnlassraumId) return null;
    if (normalizeAnlassraumId(initialAnlassraumId)) return null;
    return text.selectionInfoInvalidContext;
  });
  const intakeStorageKey = React.useMemo(
    () => buildCreatePrimaryIntakeStorageKey(overview.userId),
    [overview.userId],
  );
  const intakeRestoreInfoText =
    surfaceLocale === "en"
      ? "Your draft was restored from local browser storage."
      : "Dein Entwurf wurde aus der lokalen Browser-Sicherung wiederhergestellt.";
  const contextLoadedRef = React.useRef(false);
  const intakeHydratedRef = React.useRef(false);
  const [intakeText, setIntakeText] = React.useState(initialText ?? "");
  const [composerAttachments, setComposerAttachments] = React.useState<File[]>([]);
  const [activeContextAnchorId, setActiveContextAnchorId] = React.useState<CreateContextIntent | null>(null);
  const [hasStarted, setHasStarted] = React.useState<boolean>(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [linkClarificationState, setLinkClarificationState] =
    React.useState<CreateLinkClarificationState | null>(null);
  const [followupSurface, setFollowupSurface] = React.useState<CreateFollowupSurface>("none");
  const [followupSnapshot, setFollowupSnapshot] =
    React.useState<CreateLightweightFollowupSnapshot | null>(null);
  const [intelligentFollowup, setIntelligentFollowup] =
    React.useState<CreateIntelligentFollowupResult | null>(null);
  const [analysisAutoRunToken, setAnalysisAutoRunToken] = React.useState<number>(0);
  const [intakeError, setIntakeError] = React.useState<string | null>(null);
  const [intakeRestoreInfo, setIntakeRestoreInfo] = React.useState<string | null>(null);
  const [guidedBridgeAnswer] = React.useState("");
  const [guidedBridgeConfirmed, setGuidedBridgeConfirmed] = React.useState(false);
  const [workingState, setWorkingState] = React.useState<CreateWorkingState | null>(null);
  const [followupAnswers, setFollowupAnswers] = React.useState<Record<CreateIntent, string>>({
    contribute: "",
    check: "",
    draft: "",
  });
  const [followupAnswerSaved, setFollowupAnswerSaved] = React.useState<Record<CreateIntent, boolean>>({
    contribute: false,
    check: false,
    draft: false,
  });
  const [understandingConfirmed, setUnderstandingConfirmed] = React.useState<boolean>(false);
  const [savedDraftId, setSavedDraftId] = React.useState<string | null>(null);
  const [reviewRequestState, setReviewRequestState] = React.useState<CreateReviewRequestState>("idle");
  const [reviewRequestMessage, setReviewRequestMessage] = React.useState<string | null>(null);
  const [factcheckMessage, setFactcheckMessage] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [chatContinuationText, setChatContinuationText] = React.useState("");
  const [showFollowupCorrectionComposer, setShowFollowupCorrectionComposer] = React.useState(false);
  const intelligentFollowupResultRef = React.useRef<HTMLDivElement | null>(null);
  const analysisSceneRef = React.useRef<HTMLDivElement | null>(null);
  const [analysisSceneMode, setAnalysisSceneMode] = React.useState<CreateProductMode | null>(null);

  React.useEffect(() => {
    if (intakeHydratedRef.current) return;
    intakeHydratedRef.current = true;
    try {
      const snapshot = parseCreatePrimaryIntakeSnapshot(window.localStorage.getItem(intakeStorageKey));
      if (!snapshot) return;

      const hasServerPrefill = hasPrimaryIntakeText(initialText);
      if (hasServerPrefill) return;

      if (hasPrimaryIntakeText(snapshot.intakeText)) {
        setIntakeText(snapshot.intakeText);
        setIntakeRestoreInfo(intakeRestoreInfoText);
      }
      // Do not auto-open follow-up surfaces from local restore.
      // We restore text only; activation stays explicit via CTA.
    } catch {
      // ignore local restore issues
    }
  }, [initialText, intakeRestoreInfoText, intakeStorageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasPrimaryIntakeText(initialText)) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("resume") !== "create_handoff") return;
    const handoffId = params.get("handoffId");
    if (!handoffId) return;

    let cancelled = false;
    async function hydratePersistedHandoff() {
      const localDraft = readCreateHandoffDraft(handoffId);
      if (localDraft) {
        if (cancelled) return;
        setIntakeText(localDraft.sourceText);
        setActionNotice("Arbeitsstand aus Handoff geladen. Du kannst jetzt überarbeiten und neu einordnen.");
        setIntakeRestoreInfo("Handoff-Arbeitsstand zur Weiterbearbeitung geladen.");
        return;
      }

      try {
        const response = await fetch(`/api/create/handoffs/${encodeURIComponent(handoffId)}`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok || !body?.draft) return;
        const draft = body.draft;
        saveCreateHandoffDraft(draft);
        if (cancelled) return;
        setIntakeText(String(draft.sourceText ?? ""));
        setActionNotice("Persistenter Handoff-Arbeitsstand geladen. Du kannst jetzt weiterbearbeiten.");
        setIntakeRestoreInfo("Persistenter Handoff-Arbeitsstand zur Weiterbearbeitung geladen.");
      } catch {
        // ignore persisted resume errors here; local flow still works when available
      }
    }

    void hydratePersistedHandoff();
    return () => {
      cancelled = true;
    };
  }, [initialText]);

  React.useEffect(() => {
    try {
      if (!hasPrimaryIntakeText(intakeText) && !hasStarted) {
        window.localStorage.removeItem(intakeStorageKey);
        return;
      }

      const snapshot: CreatePrimaryIntakeSnapshot = {
        intakeText,
        hasStarted,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(intakeStorageKey, JSON.stringify(snapshot));
    } catch {
      // ignore local draft persistence errors
    }
  }, [hasStarted, intakeStorageKey, intakeText]);

  React.useEffect(() => {
    let ignore = false;
    async function refresh() {
      try {
        const res = await fetch("/api/create/entitlements", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.entitlements) return;
        if (ignore) return;
        const next = body.entitlements as CreateEntitlements;
        setEntitlements(next);
        setGate(deriveGate(next));
      } catch {
        // ignore
      }
    }
    refresh();
    return () => {
      ignore = true;
    };
  }, []);

  const productModeConfig = React.useMemo(
    () => resolveCreateProductModeConfig(productMode, surfaceLocale),
    [productMode, surfaceLocale],
  );
  const activeIntent = React.useMemo(() => mapProductModeToCreateIntent(productMode), [productMode]);
  const surfaceContextAnchors = React.useMemo(
    () =>
      getCreateContextAnchorsForMode({
        anchors: allSurfaceContextAnchors,
        mode: productMode,
        maxItems: 3,
      }),
    [allSurfaceContextAnchors, productMode],
  );
  const activeContextAnchor = React.useMemo(
    () => resolveCreateContextAnchorById(activeContextAnchorId, surfaceLocale),
    [activeContextAnchorId, surfaceLocale],
  );
  const intakeHelperText = activeContextAnchor?.helperText ?? productModeConfig.helperText;
  const intakePlaceholder = activeContextAnchor?.placeholder ?? productModeConfig.placeholder;
  const activeFollowupAnswer = followupAnswers[activeIntent];
  const activeFollowupSaved = followupAnswerSaved[activeIntent];
  const currentLinkDetection = React.useMemo(() => detectCreateLinkIntake(intakeText), [intakeText]);
  const composerAttachmentMaterialItems = React.useMemo(
    () => buildCreateAttachmentMaterialItems(composerAttachments),
    [composerAttachments],
  );
  const currentMaterialRouting = React.useMemo(
    () =>
      resolveMaterialRouting({
        text: intakeText,
        materialItems: composerAttachmentMaterialItems,
      }),
    [composerAttachmentMaterialItems, intakeText],
  );
  const hasMaterialContext = currentMaterialRouting.materialItems.length > 0;

  const createOrchestration = React.useMemo(
    () =>
      resolveCreateOrchestratorIntentContract({
        rawEntryIntent: productModeConfig.entryIntent,
        rawEntryMode: productModeConfig.entryMode,
        canSubmitContribution: entitlements.canSubmitContribution,
        canSubmitStatement: entitlements.canSubmitStatement,
        dossierId,
        selectedAnlassraumId,
      }),
    [
      dossierId,
      entitlements.canSubmitContribution,
      entitlements.canSubmitStatement,
      productModeConfig.entryIntent,
      productModeConfig.entryMode,
      selectedAnlassraumId,
    ],
  );

  const canonicalIntent: "statement" | "contribution" = createOrchestration.workspaceMode;
  const canonicalCreateMode: CreateMode =
    productModeConfig.preferredCreateMode ??
    (productMode === "guided" && createOrchestration.workspaceMode === "contribution"
      ? "ai"
      : createOrchestration.createMode);
  const pickerEnabled = canonicalIntent === "contribution";

  const loadContextItems = React.useCallback(async () => {
    setContextLoadState("loading");
    setContextLoadError(null);
    try {
      const selected = selectedAnlassraumId ? `&selectedAnlassraumId=${encodeURIComponent(selectedAnlassraumId)}` : "";
      const res = await fetch(`/api/create/context?limit=40${selected}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "create_context_source_unavailable");
      }
      const nextItems = Array.isArray(body.items) ? (body.items as CreateContextPickerItem[]) : [];
      setContextItems(nextItems);
      setContextLoadState("ready");
      contextLoadedRef.current = true;

      if (selectedAnlassraumId) {
        const found = nextItems.some((item) => item.anlassraumId === selectedAnlassraumId);
        if (!found) {
          setSelectedAnlassraumId(null);
          setSelectionInfo(text.selectionInfoUnavailableContext);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "create_context_source_unavailable";
      setContextLoadState("error");
      setContextLoadError(message);
    }
  }, [selectedAnlassraumId, text.selectionInfoUnavailableContext]);

  React.useEffect(() => {
    if (!hasStarted) return;
    if (!pickerEnabled) return;
    if (contextLoadedRef.current) return;
    void loadContextItems();
  }, [hasStarted, pickerEnabled, loadContextItems]);

  React.useEffect(() => {
    if (!pickerEnabled && selectedAnlassraumId) {
      setSelectedAnlassraumId(null);
    }
  }, [pickerEnabled, selectedAnlassraumId]);

  React.useEffect(() => {
    if (!hasStarted) return;
    if (!intelligentFollowup) return;
    intelligentFollowupResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasStarted, intelligentFollowup]);

  const startCreateFlow = React.useCallback(async (rawText: string) => {
    if (isStarting) return;
    const normalizedText = rawText.trim();
    const linkDetection = detectCreateLinkIntake(normalizedText);
    const materialRouting = resolveMaterialRouting({
      text: normalizedText,
      materialItems: composerAttachmentMaterialItems,
    });
    const hasStartMaterialContext = materialRouting.materialItems.length > 0;
    if (!normalizedText && !hasStartMaterialContext) {
      setIntakeError(surfaceTexts.intakeMissingError);
      return;
    }
    if (normalizedText.length > 0 && normalizedText.length < MIN_INTENT_INPUT_LENGTH && !linkDetection.hasLink) {
      setIntakeError(productModeConfig.minimumInputHint);
      return;
    }
    try {
      const activeSelectedContext = selectedAnlassraumId
        ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
        : null;
      setIntakeRestoreInfo(null);
      setIntakeError(null);
      setReviewRequestState("idle");
      setReviewRequestMessage(null);
      setFactcheckMessage(null);
      setShowFollowupCorrectionComposer(false);

      if (linkDetection.hasLink && linkDetection.mostlyLinkOnly) {
        setLinkClarificationState((current) => ({
          detection: linkDetection,
          selectedIntentId: current?.selectedIntentId ?? null,
          additionalContext: current?.additionalContext ?? "",
        }));
        setFollowupSnapshot(null);
        setWorkingState(null);
        setIntelligentFollowup(null);
        setUnderstandingConfirmed(false);
        setActionNotice(null);
        setHasStarted(true);
        setFollowupSurface("none");
        setGuidedBridgeConfirmed(productMode !== "guided");
        return;
      }

      const snapshot = buildCreateLightweightFollowupSnapshot({
        intakeText: rawText,
        modeLabel: productModeConfig.label,
        contextAnchorLabel: activeContextAnchor?.label,
        surfaceTexts,
      });
      setIsStarting(true);
      setLinkClarificationState((current) =>
        current && linkDetection.hasLink
          ? {
              ...current,
              detection: linkDetection,
            }
          : linkDetection.hasLink
            ? null
            : null,
      );

      let nextIntelligentFollowup: CreateIntelligentFollowupResult | null = null;
      if (productMode === "analyze") {
        const response = await fetch("/api/create/intelligent-followup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: normalizedText,
            locale: surfaceLocale,
            anlassraumId: selectedAnlassraumId,
            dossierId: dossierId ?? null,
            intent: activeIntent,
            sourceUrls: materialRouting.sourceUrls,
            materialItems: materialRouting.materialItems,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.ok || !body?.result) {
          throw new Error("create_intelligent_followup_failed");
        }
        nextIntelligentFollowup = body.result as CreateIntelligentFollowupResult;
      }

      const recognizedType = detectRecognizedType(activeIntent, normalizedText);
      const suggestedAssignment = activeSelectedContext
        ? activeSelectedContext.title
        : initialIntakeContext?.sourceLabel
          ? initialIntakeContext.sourceLabel
          : productMode === "guided"
            ? "Neuer gemeinsamer Arbeitsstand"
            : productMode === "media"
              ? "Prüfweg noch offen"
              : "Thema oder nächster Schritt noch offen";

      setFollowupSnapshot(snapshot);
      setWorkingState(
        productMode === "analyze"
          ? null
          : {
              summary: summarizeWorkingText(normalizedText),
              recognizedType,
              suggestedAssignment,
            },
      );
      setIntelligentFollowup(nextIntelligentFollowup);
      setUnderstandingConfirmed(false);
      setActionNotice(
        linkDetection.hasLink
          ? buildCreateLinkSourceNotice({
              locale: surfaceLocale,
              selectedIntentId: linkClarificationState?.selectedIntentId,
            })
          : null,
      );
      setHasStarted(true);
      setGuidedBridgeConfirmed(productMode !== "guided");

      const nextFollowupSurface =
        productMode === "analyze" ? "none" : resolveFollowupSurfaceOnStart(productMode);
      setFollowupSurface(nextFollowupSurface);
      setAnalysisSceneMode(nextFollowupSurface === "analysis" ? productMode : null);
      if (nextFollowupSurface === "analysis") {
        setAnalysisAutoRunToken((current) => current + 1);
      }
      setIsStarting(false);
    } catch {
      setIsStarting(false);
      if (productMode === "analyze") {
        setIntakeError("Die Systemprüfung ist gerade nicht verfügbar. Dein Text bleibt erhalten.");
      } else {
        setIntakeError(surfaceTexts.startFailedError);
      }
    }
  }, [
    activeContextAnchor?.label,
    activeIntent,
    composerAttachmentMaterialItems,
    dossierId,
    initialIntakeContext?.sourceLabel,
    isStarting,
    productMode,
    productModeConfig.label,
    productModeConfig.minimumInputHint,
    contextItems,
    selectedAnlassraumId,
    surfaceLocale,
    surfaceTexts,
    linkClarificationState?.selectedIntentId,
  ]);

  const handleStart = React.useCallback(async () => {
    if (!privacyGate.ensureActiveProcessingAllowed("create-start")) return;
    await startCreateFlow(intakeText);
  }, [intakeText, privacyGate, startCreateFlow]);

  const handleSaveFollowupAnswer = React.useCallback(() => {
    const normalized = activeFollowupAnswer.trim();
    if (!normalized) {
      setActionNotice(productModeConfig.firstQuestionPlaceholder);
      return;
    }
    setFollowupAnswerSaved((current) => ({
      ...current,
      [activeIntent]: true,
    }));
    setActionNotice(surfaceTexts.followupQuestionSavedLabel);
  }, [activeFollowupAnswer, activeIntent, productModeConfig.firstQuestionPlaceholder, surfaceTexts.followupQuestionSavedLabel]);

  const triggerActionNotice = React.useCallback(
    (message?: string) => {
      setActionNotice(message ?? surfaceTexts.actionNotAvailableLabel);
    },
    [surfaceTexts.actionNotAvailableLabel],
  );

  const handleContinueConversation = React.useCallback(async () => {
    if (!privacyGate.ensureActiveProcessingAllowed("create-continue")) return;
    const normalizedContinuation = chatContinuationText.trim();
    if (!normalizedContinuation) {
      setActionNotice("Schreib kurz, was ich anpassen oder ergänzen soll.");
      return;
    }

    const baseText = intakeText.trim();
    const combinedText = baseText ? `${baseText}\n\n${normalizedContinuation}` : normalizedContinuation;
    setChatContinuationText("");
    setIntakeText(combinedText);
    setUnderstandingConfirmed(false);
    setShowFollowupCorrectionComposer(false);
    await startCreateFlow(combinedText);
  }, [chatContinuationText, intakeText, privacyGate, startCreateFlow]);

  const handleSkipPlaceClarification = React.useCallback(async () => {
    const normalizedContinuation = "Ort später ergänzen.";
    const baseText = intakeText.trim();
    const combinedText = baseText ? `${baseText}\n\n${normalizedContinuation}` : normalizedContinuation;
    setChatContinuationText("");
    setIntakeText(combinedText);
    setUnderstandingConfirmed(false);
    setShowFollowupCorrectionComposer(false);
    await startCreateFlow(combinedText);
  }, [intakeText, startCreateFlow]);

  const handleIntentAction = React.useCallback(
    (actionIndex: number) => {
      if (activeIntent === "contribute") {
        if (actionIndex === 0) {
          triggerActionNotice("Hinweis vorgemerkt. Du kannst jetzt den nächsten Schritt wählen oder einfach weiterschreiben.");
          return;
        }
        if (actionIndex === 1) {
          setProductMode("media");
          setFollowupSurface("analysis");
          setAnalysisSceneMode("media");
          setAnalysisAutoRunToken((current) => current + 1);
          triggerActionNotice("Prüfweg wird geöffnet.");
          return;
        }
        if (actionIndex === 2) {
          setProductMode("media");
          setActiveContextAnchorId("source");
          triggerActionNotice("Quellenhinweis ergänzen aktiviert. Ergänze jetzt die Referenz im Textfeld.");
          return;
        }
        triggerActionNotice("Beteiligung vorbereiten: als nächstes in Swipes weiterführen.");
        return;
      }

      if (activeIntent === "check") {
        if (actionIndex === 0) {
          setFollowupSurface("analysis");
          setAnalysisSceneMode("media");
          setAnalysisAutoRunToken((current) => current + 1);
          triggerActionNotice("Dossier-Weiterführung wird als Prüfstand vorbereitet.");
          return;
        }
        if (actionIndex === 1) {
          setActiveContextAnchorId("source");
          triggerActionNotice("Quellenhinweis ergänzen aktiviert. Ergänze jetzt die Referenzen im Textfeld.");
          return;
        }
        if (actionIndex === 2) {
          setProductMode("analyze");
          setActiveContextAnchorId("objection");
          triggerActionNotice("Gegenposition ergänzen aktiviert.");
          return;
        }
        setFollowupSurface("analysis");
        setAnalysisSceneMode("media");
        setAnalysisAutoRunToken((current) => current + 1);
        triggerActionNotice("Prüfbericht wird vorbereitet.");
        return;
      }

      if (actionIndex === 0) {
        triggerActionNotice("Beitrag oder Themenstruktur kann im nächsten Schritt übernommen werden.");
        return;
      }
      if (actionIndex === 1) {
        setActiveContextAnchorId("question");
        triggerActionNotice("Fragenkatalog vorbereitet.");
        return;
      }
      if (actionIndex === 2) {
        triggerActionNotice("Beteiligungsrunde vorbereiten: als nächstes in /runden weiterführen.");
        return;
      }
      triggerActionNotice("Der nächste Arbeitsschritt ist markiert.");
    },
    [activeIntent, triggerActionNotice],
  );

  const maxClaimsCap =
    canonicalIntent === "statement"
      ? Math.min(entitlements.maxVisibleAiProposals, 3)
      : Math.min(entitlements.maxVisibleAiProposals, 8);

  const maxFinalizeClaims =
    canonicalIntent === "statement"
      ? 1
      : Math.min(entitlements.maxFinalizeClaimsPerInput, 4);

  const selectedContext = selectedAnlassraumId
    ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
    : null;
  const effectiveSelectedAnlassraumId = canonicalIntent === "statement" ? null : selectedAnlassraumId;
  const normalizedReturnTo = normalizeInternalRedirectPath(initialReturnTo);
  const fromRundenFlow =
    isRundenSourceContext(initialIntakeContext) || Boolean(normalizedReturnTo?.startsWith("/runden"));
  const fromManualAnlassraumContinueCreate =
    initialIntakeContext?.reason === "manual_anlassraum_continue_create" ||
    Boolean(normalizedReturnTo?.startsWith("/runden/new"));
  const contextualReturnHref =
    normalizedReturnTo ??
    (fromRundenFlow
      ? buildRundenReturnHref(effectiveSelectedAnlassraumId ?? initialAnlassraumId)
      : null);
  const afterFinalizeNavigateTo = buildFinalizeFallbackPath({
    dossierId,
    preferredSurface: fromRundenFlow ? "runden" : "swipes",
    anlassraumId: effectiveSelectedAnlassraumId ?? initialAnlassraumId ?? null,
    fallbackReturnTo: contextualReturnHref,
  });
  const useCaseAccess = deriveUseCaseAccessForProductMode(productMode, text, productModeConfig);
  const workspaceVerificationLevel =
    overview.verificationLevel && overview.verificationLevel !== "none"
      ? overview.verificationLevel
      : undefined;

  const tierCfg = getAccessTierConfigForUser(overview);
  const tierLabel = getUserAccessTier(overview);
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;

  const hasLegacyModeParam = Boolean(initialMode);
  const showIntakeContext = hasCreateIntakeContext(initialIntakeContext);
  const readableRundenContextLabel = renderRundenContextLabel(initialIntakeContext);
  const showPostInputModules = shouldShowCreatePostInputModules({
    hasStarted,
    intakeText,
    hasMaterialContext,
  });
  const showLinkClarification =
    Boolean(linkClarificationState?.detection.hasLink) &&
    Boolean(linkClarificationState?.detection.mostlyLinkOnly);
  const showIntelligentFollowup = shouldRenderCreateIntelligentFollowup({
    hasStarted,
    productMode,
    followup: intelligentFollowup,
  });
  const showFollowupQuestionCard = shouldShowCreateFollowupQuestionCard({
    showPostInputModules,
    productMode,
  });
  const analyzeFollowupActivated = followupSurface === "analysis";
  const showAnalyzeWorkspace = shouldRenderCreateAnalyzeWorkspace({
    followupActivated: analyzeFollowupActivated,
    hasStarted,
    intakeText,
    hasMaterialContext,
    productMode,
    guidedBridgeConfirmed,
  });
  React.useEffect(() => {
    if (!showAnalyzeWorkspace) return;
    const node = analysisSceneRef.current;
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      node.focus({ preventScroll: true });
    });
  }, [analysisAutoRunToken, showAnalyzeWorkspace]);
  const workspaceInitialText =
    productMode === "guided"
      ? buildGuidedWorkspaceText({
          intakeText,
          guidedBridgeAnswer: guidedBridgeConfirmed ? guidedBridgeAnswer : "",
          guidedWorkspacePrefix: surfaceTexts.guidedWorkspacePrefix,
        })
      : intakeText;
  const normalizedIntakeText = intakeText.trim();
  const startDisabled =
    (!normalizedIntakeText && !hasMaterialContext) ||
    ((normalizedIntakeText.length > 0 &&
      !currentLinkDetection.hasLink &&
      normalizedIntakeText.length < MIN_INTENT_INPUT_LENGTH) ||
      isStarting);
  const showTooShortHint =
    normalizedIntakeText.length > 0 &&
    normalizedIntakeText.length < MIN_INTENT_INPUT_LENGTH &&
    !currentLinkDetection.hasLink;
  const startBusyStatusLabel =
    productMode === "analyze" ? "Wir ordnen deinen Beitrag ein …" : surfaceTexts.startBusyStatus;
  const showStartChatPreview =
    Boolean(followupSnapshot) && hasStarted && !showIntelligentFollowup && !showLinkClarification;
  const startChatAssistantTitle = isStarting
    ? "Ich ordne das kurz ein"
    : productMode === "guided"
      ? surfaceTexts.followupGuidedTitle
      : productMode === "media"
        ? productModeConfig.postStartTitle
        : surfaceTexts.followupContributeTitle;
  const startChatAssistantBody = isStarting
    ? surfaceTexts.startBusyLead
    : productMode === "guided"
      ? surfaceTexts.followupGuidedLead
      : productMode === "media"
        ? productModeConfig.postStartLead
        : followupSnapshot?.understandingLine ?? surfaceTexts.followupContributeLead;
  const structureOverviewMetrics = React.useMemo(
    () =>
      deriveCreateStructureOverviewMetrics({
        result: intelligentFollowup,
        isConfirmed: understandingConfirmed,
      }),
    [intelligentFollowup, understandingConfirmed],
  );

  const persistFollowupWorkstate = React.useCallback(async (manualReviewRequested: boolean) => {
    if (!showIntelligentFollowup) {
      setReviewRequestState("error");
      setReviewRequestMessage("Dieser Schritt ist in diesem Arbeitsstand noch nicht verfügbar.");
      setActionNotice("Dieser Schritt ist in diesem Arbeitsstand noch nicht verfügbar.");
      return;
    }

    const normalizedText = intakeText.trim();
    if (!normalizedText) {
      setReviewRequestState("error");
      setReviewRequestMessage("Bitte beschreibe zuerst deinen Beitrag.");
      setActionNotice("Bitte beschreibe zuerst deinen Beitrag.");
      return;
    }

    const linkIntakeMeta = buildCreateLinkIntakeMeta({
      detection: linkClarificationState?.detection ?? currentLinkDetection,
      selectedIntentId: linkClarificationState?.selectedIntentId,
      additionalContext: linkClarificationState?.additionalContext,
    });

    setReviewRequestState("saving");
    setReviewRequestMessage("Prüfstatus wird gespeichert …");
    try {
      const response = await fetch("/api/create/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftId: savedDraftId ?? undefined,
          text: normalizedText,
          locale: surfaceLocale,
          source: "create_followup",
          createMode: canonicalCreateMode,
          anlassraumId: effectiveSelectedAnlassraumId ?? undefined,
          useCase: productModeConfig.preferredUseCase,
          manualReviewRequested,
          sourceUrls: currentMaterialRouting.sourceUrls,
          materialItems: currentMaterialRouting.materialItems,
          analysis: intelligentFollowup
            ? {
                intelligentFollowup,
                understandingConfirmed,
                linkIntake: linkIntakeMeta ?? undefined,
              }
            : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || typeof body?.draftId !== "string") {
        throw new Error(body?.error || "save_failed");
      }
      const requestScope = body?.requestScope as RequestScopeSummary | null | undefined;
      const scopedSavedMessage = requestScope?.isOperatorMode
        ? "Arbeitsstand gespeichert. Eingereicht, reviewbar und weiterhin ohne automatische Veröffentlichung. Betreiber-Modus bleibt sichtbar."
        : requestScope?.organizationId
          ? "Arbeitsstand gespeichert. Eingereicht und reviewbar im Scope deiner Organisation."
          : null;
      const successMessage =
        manualReviewRequested
          ? "Arbeitsstand eingereicht und in Prüfung. Keine automatische Veröffentlichung."
          : scopedSavedMessage ??
            "Arbeitsstand gespeichert. Eingereicht, aber noch nicht veröffentlicht. Du kannst ihn weiter schärfen oder in Dossier, Anlassraum oder Swipes weiterführen.";
      setSavedDraftId(body.draftId);
      setReviewRequestState("saved");
      setReviewRequestMessage(successMessage);
      setActionNotice(successMessage);
    } catch {
      setReviewRequestState("error");
      setReviewRequestMessage("Prüfstatus konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setActionNotice("Prüfstatus konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  }, [
    canonicalCreateMode,
    effectiveSelectedAnlassraumId,
    intakeText,
    intelligentFollowup,
    productModeConfig.preferredUseCase,
    savedDraftId,
    showIntelligentFollowup,
    surfaceLocale,
    understandingConfirmed,
    currentLinkDetection,
    currentMaterialRouting.materialItems,
    currentMaterialRouting.sourceUrls,
    linkClarificationState,
  ]);

  const navigateWithCreateHandoff = React.useCallback(
    async (selectedAction: CreateHandoffAction, baseHref: string) => {
      if (!privacyGate.ensureActiveProcessingAllowed(`create-handoff:${selectedAction}`)) return;
      if (!intelligentFollowup?.meta?.planner || !intelligentFollowup?.meta?.graphMatch) {
        setActionNotice("Dieser Schritt braucht zuerst einen bestätigbaren Arbeitsstand.");
        return;
      }
      if (
        ["append_to_dossier", "create_dossier", "request_factcheck", "prepare_vote", "prepare_anlassraum"].includes(selectedAction) &&
        !isPlannerReadyForStructuredHandoff(intelligentFollowup)
      ) {
        setActionNotice("Bitte bestätige das Thema zuerst genauer oder sende einen Bericht an die Redaktion.");
        return;
      }
      const draft = buildCreateHandoffDraft({
        result: intelligentFollowup,
        selectedAction,
        sourceUrls: currentMaterialRouting.sourceUrls,
        materialItems: currentMaterialRouting.materialItems,
      });
      const journeySummary = resolveCreateHandoffJourneySummary(draft);
      saveCreateHandoffDraft(draft);
      setActionNotice(
        `Handoff wird vorbereitet: ${journeySummary.destinationLabel}. Eingereicht, reviewbar und ohne automatische Veröffentlichung.`,
      );
      let successMessage = `Handoff vorbereitet. ${journeySummary.nextStepTitle}.`;
      try {
        const response = await fetch("/api/create/handoffs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            draft,
            dossierId: dossierId ?? null,
            anlassraumId: effectiveSelectedAnlassraumId ?? null,
          }),
        });
        const body = await response.json().catch(() => null) as
          | {
              ok?: boolean;
              error?: string;
              requestScope?: RequestScopeSummary | null;
              accessDecision?: {
                title?: string;
                body?: string;
              } | null;
            }
          | null;
        if (!response.ok || !body?.ok) {
          if (body?.accessDecision?.title || body?.accessDecision?.body) {
            const title = body.accessDecision.title?.trim() ?? "Freischaltung nötig";
            const detail =
              body.accessDecision.body?.trim() ??
              "Der Arbeitsstand kann weiter vorbereitet werden, aber noch nicht produktiv in den Organisationspfad übergeben werden.";
            setActionNotice(`${title}. ${detail}`);
            return;
          }
          throw new Error(body?.error ?? "create_handoff_persist_failed");
        }
        const requestScope = body?.requestScope as RequestScopeSummary | null | undefined;
        if (requestScope?.isOperatorMode) {
          successMessage =
            `Handoff vorbereitet. ${journeySummary.nextStepTitle}. Betreiber-Modus bleibt sichtbar.`;
        } else if (requestScope?.organizationId) {
          successMessage =
            `Handoff vorbereitet. ${journeySummary.destinationLabel} bleibt im Scope deiner Organisation.`;
        }
      } catch {
        setActionNotice("Handoff konnte nicht persistent in die Review-Queue geschrieben werden. Bitte erneut versuchen.");
        return;
      }
      setShowFollowupCorrectionComposer(false);
      setActionNotice(successMessage);
      const targetHref = buildCreateHandoffTargetHref({
        baseHref,
        handoffId: draft.id,
        action: selectedAction,
      });
      router.push(targetHref as Parameters<typeof router.push>[0]);
    },
    [
      currentMaterialRouting.materialItems,
      currentMaterialRouting.sourceUrls,
      dossierId,
      effectiveSelectedAnlassraumId,
      intelligentFollowup,
      privacyGate,
      router,
    ],
  );

  const handleRetryPlanner = React.useCallback(async () => {
    const sourceText = (intelligentFollowup?.sourceText ?? followupSnapshot?.originalText ?? normalizedIntakeText).trim();
    if (!sourceText) {
      setActionNotice("Bitte beschreibe zuerst deinen Beitrag.");
      return;
    }
    if (!privacyGate.ensureActiveProcessingAllowed("create-retry-planner")) return;

    setActionNotice("KI-Einordnung wird erneut versucht …");
    try {
      const response = await fetch("/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          locale: surfaceLocale,
          anlassraumId: selectedAnlassraumId,
          dossierId: dossierId ?? null,
          intent: activeIntent,
          sourceUrls: currentMaterialRouting.sourceUrls,
          materialItems: currentMaterialRouting.materialItems,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || !body?.result) {
        throw new Error("create_intelligent_followup_failed");
      }
      const nextFollowup = body.result as CreateIntelligentFollowupResult;
      setIntelligentFollowup(nextFollowup);
      setUnderstandingConfirmed(false);
      setShowFollowupCorrectionComposer(false);
      setActionNotice(
        isPlannerReadyForStructuredHandoff(nextFollowup)
          ? "Einordnung aktualisiert. Bitte bestätige, welchen Teil wir zuerst vorbereiten sollen."
          : "Die Einordnung bleibt noch offen. Du kannst das Thema jetzt gezielt bestätigen oder an die Redaktion geben.",
      );
    } catch {
      setActionNotice("Die genauere KI-Einordnung konnte gerade nicht geladen werden.");
    }
  }, [
    activeIntent,
    currentMaterialRouting.materialItems,
    currentMaterialRouting.sourceUrls,
    dossierId,
    followupSnapshot?.originalText,
    intelligentFollowup?.sourceText,
    normalizedIntakeText,
    privacyGate,
    selectedAnlassraumId,
    surfaceLocale,
  ]);

  const handleRequestEditorialReview = React.useCallback(() => {
    void navigateWithCreateHandoff("request_review", "/community/contributions");
  }, [navigateWithCreateHandoff]);

  const handlePrepareSubmission = React.useCallback(() => {
    void navigateWithCreateHandoff("submit_draft", "/community/contributions");
  }, [navigateWithCreateHandoff]);

  const handlePrepareAnlassraum = React.useCallback(() => {
    if (!intelligentFollowup) {
      setActionNotice("Bitte beschreibe zuerst deinen Beitrag.");
      return;
    }
    const baseHref = resolveCreateAnlassraumTargetHref(intelligentFollowup);
    void navigateWithCreateHandoff("prepare_anlassraum", baseHref);
  }, [intelligentFollowup, navigateWithCreateHandoff]);

  const handleOpenDossierAppend = React.useCallback(() => {
    if (!intelligentFollowup) {
      setActionNotice("Bitte beschreibe zuerst deinen Beitrag.");
      return;
    }
    const baseHref = buildCreateFollowupPrimaryCtaHref({
      ctaHref: "/dossier",
      topics: intelligentFollowup.understanding.topics,
      statements: intelligentFollowup.understanding.statements,
      suggestions: intelligentFollowup.suggestions,
    });
    void navigateWithCreateHandoff("append_to_dossier", baseHref);
  }, [intelligentFollowup, navigateWithCreateHandoff]);

  const handleOpenDossierCreate = React.useCallback(() => {
    void navigateWithCreateHandoff("create_dossier", "/dossier");
  }, [navigateWithCreateHandoff]);

  const handlePrepareVote = React.useCallback(() => {
    if (!intelligentFollowup) {
      setActionNotice("Bitte beschreibe zuerst deinen Beitrag.");
      return;
    }
    const voteSuggestion = intelligentFollowup.suggestions.find((suggestion) => suggestion.kind === "vote");
    const baseHref = voteSuggestion
      ? buildCreateFollowupTargetHref({
          kind: "vote",
          ctaHref: "/swipes",
          topics: intelligentFollowup.understanding.topics,
          statements: intelligentFollowup.understanding.statements,
          suggestionTitle: voteSuggestion.title,
          suggestionHref: voteSuggestion.href ?? null,
        })
      : "/swipes?from=create";
    void navigateWithCreateHandoff("prepare_vote", baseHref);
  }, [intelligentFollowup, navigateWithCreateHandoff]);

  const handleStartFactcheckService = React.useCallback(() => {
    setFactcheckMessage(
      "Prüfmodus geöffnet. Faktencheck / Deep Search startet erst nach deiner weiteren Bestätigung.",
    );
    void navigateWithCreateHandoff("request_factcheck", "/factcheck");
  }, [navigateWithCreateHandoff]);

  const handleSaveOnly = React.useCallback(async () => {
    if (!privacyGate.ensureActiveProcessingAllowed("create-save")) return;
    await persistFollowupWorkstate(false);
  }, [persistFollowupWorkstate, privacyGate]);

  if (gate.status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.loadingAccess}
      </main>
    );
  }
  if (gate.status === "anon") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.loginRequired}
      </main>
    );
  }
  if (gate.status === "blocked") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.submissionBlocked}
      </main>
    );
  }

  return (
    <section className="vog-page-stage min-h-screen">
    <div className="vog-main-shell min-h-screen max-w-[84rem] space-y-5 md:space-y-8">
      <section
        className="create-dialog-workspace vog-surface-elevated overflow-hidden p-3 sm:p-4 md:p-6 lg:p-8"
        data-create-stage-shell="true"
      >
      {fromManualAnlassraumContinueCreate ? (
        <div className="mb-4 md:mb-5">
          <VoxyGuide appearance="panel" title="Voxy begleitet den Übergang" variant="neutral">
            {getVoxyCopy("createContinue")}
          </VoxyGuide>
        </div>
      ) : null}
      <SharedCreateComposer
        badge={surfaceTexts.badgeCanonical}
        subline={surfaceTexts.sublineCanonical}
        texts={surfaceComposerTexts}
        topMeta={
          intakeRestoreInfo || scopeNotice ? (
            <div className="space-y-2">
              {intakeRestoreInfo ? (
                <p className="max-w-2xl text-xs text-[rgb(var(--muted))]">{intakeRestoreInfo}</p>
              ) : null}
              {scopeNotice ? (
                <div
                  className={`rounded-2xl border px-3 py-2 text-xs ${
                    scopeNotice.tone === "operator"
                      ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                      : scopeNotice.tone === "limited"
                        ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                  }`}
                >
                  <p className="font-semibold">{scopeNotice.title}</p>
                  <p className="mt-1">{scopeNotice.body}</p>
                </div>
              ) : null}
            </div>
          ) : undefined
        }
        modeOrder={CREATE_PRODUCT_MODES}
        modeDefinitions={surfaceModeDefinitions}
        activeMode={productMode}
        onModeChange={(modeOption) => {
          setProductMode(modeOption);
          setActiveContextAnchorId(null);
          setIntelligentFollowup(null);
          setUnderstandingConfirmed(false);
          setLinkClarificationState(null);
          setChatContinuationText("");
          setAnalysisSceneMode(null);
          if (!hasStarted) return;
          setFollowupSurface("none");
          setGuidedBridgeConfirmed(modeOption !== "guided");
        }}
        helperText={intakeHelperText}
        inputId="create-primary-intake"
        inputLabel={productModeConfig.inputLabel}
        inputValue={intakeText}
        inputPlaceholder={intakePlaceholder}
        onInputChange={(value) => {
          setIntakeText(value);
          if (intakeRestoreInfo) setIntakeRestoreInfo(null);
          if (intakeError) setIntakeError(null);
          if (actionNotice) setActionNotice(null);
          setLinkClarificationState((current) => {
            if (!current) return null;
            const nextDetection = detectCreateLinkIntake(value);
            if (!nextDetection.hasLink) return null;
            return {
              ...current,
              detection: nextDetection,
            };
          });
        }}
        onAttachmentsChange={setComposerAttachments}
        onStart={handleStart}
        startLabel={productModeConfig.ctaLabel}
        startDisabled={startDisabled}
        startBusy={isStarting}
        startBusyLabel={startBusyStatusLabel}
        secondaryAction={{
          href: contextualReturnHref ?? "/account",
          label: contextualReturnHref ? surfaceTexts.returnToContextLabel : "",
        }}
        contextAnchors={surfaceContextAnchors}
        activeContextAnchorId={activeContextAnchorId}
        onContextAnchorSelect={(anchorId) => {
          const anchor = resolveCreateContextAnchorById(anchorId, surfaceLocale);
          setActiveContextAnchorId(anchorId);
          setIntelligentFollowup(null);
          setUnderstandingConfirmed(false);
          setLinkClarificationState(null);
          setChatContinuationText("");
          if (!anchor) return;
          setProductMode(anchor.mode);
          if (!hasStarted) return;
          setFollowupSurface("none");
          setGuidedBridgeConfirmed(anchor.mode !== "guided");
        }}
        activeContextAnchorLead={activeContextAnchor?.lead}
        helperLinks={surfaceHelperLinks}
        error={intakeError}
        contextBanner={
          fromRundenFlow ? (
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--fg))]">
              <p className="font-semibold">{surfaceTexts.rundenContextTitle}</p>
              <p className="mt-1">
                {readableRundenContextLabel
                  ? surfaceTexts.rundenContextWithLabel(readableRundenContextLabel)
                  : surfaceTexts.rundenContextFallback}{" "}
                {surfaceTexts.rundenContextReturnHint}
              </p>
            </div>
          ) : null
        }
        minRows={8}
        collapseModeSelector
        embeddedWorkspace
        experienceVariant="create_minimal"
        minimalHeading={
          surfaceLocale === "en" ? "What would you like to contribute?" : "Was möchtest du einbringen?"
        }
        minimalLead={
          surfaceLocale === "en"
            ? "Start with your topic, question, or proposal in your own words."
            : "Schreib dein Anliegen, deine Frage oder deinen Vorschlag zuerst in deinen eigenen Worten."
        }
      />

      {!hasStarted ? (
        <section className="mt-4 rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {surfaceLocale === "en" ? "Optional next steps" : "Weitere Wege"}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <button
              type="button"
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-left text-sm font-medium text-[rgb(var(--fg))] transition hover:border-cyan-300/55 hover:bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)]"
              onClick={() => {
                setProductMode("guided");
                setActiveContextAnchorId(null);
                setActionNotice(surfaceLocale === "en" ? "AI stays optional." : getVoxyCopy("ai"));
              }}
            >
              {surfaceLocale === "en" ? "AI structures my text" : "KI strukturiert meinen Text"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-left text-sm font-medium text-[rgb(var(--fg))] transition hover:border-cyan-300/55 hover:bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)]"
              onClick={() => {
                setProductMode("media");
                setActiveContextAnchorId("source");
                setActionNotice(null);
              }}
            >
              {surfaceLocale === "en" ? "Review source or file" : "Quelle/Datei prüfen"}
            </button>
            <Link
              href="/runden"
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-left text-sm font-medium text-[rgb(var(--fg))] transition hover:border-cyan-300/55 hover:bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)]"
            >
              {surfaceLocale === "en" ? "Add to an existing round" : "Zu bestehendem Anlass hinzufügen"}
            </Link>
          </div>
        </section>
      ) : null}

      {showTooShortHint ? (
        <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
          {productModeConfig.minimumInputHint}
        </p>
      ) : null}

      <CreateStructureOverview
        locale={surfaceLocale === "en" ? "en" : "de"}
        prioritiesCount={structureOverviewMetrics.prioritiesCount}
        clustersCount={structureOverviewMetrics.clustersCount}
        questionsCount={structureOverviewMetrics.questionsCount}
        nextStepsCount={structureOverviewMetrics.nextStepsCount}
      />

      {showPostInputModules && !showLinkClarification && !showAnalyzeWorkspace ? (
        <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="vog-chip">{text.tierLabel}: {tierLabel}</span>
          <span className="vog-chip">{text.creditsLabel}: {formatOperatorNumber(credits, operatorLocale)}</span>
          <Link href="/account" className="vog-chip">
            {text.quotasTitle}
          </Link>
          <span className="sr-only">
            {monthlyLimit === null
              ? `${text.monthlyLimitLabel}: ${text.monthlyLimitUnlimited}`
              : `${text.monthlyLimitLabel}: ${formatOperatorNumber(monthlyLimit, operatorLocale)}`}
          </span>
          <span className="sr-only">{text.maxClaimsLabel}: {formatOperatorNumber(maxFinalizeClaims, operatorLocale)}</span>
        </div>
      ) : null}

      {showStartChatPreview && followupSnapshot ? (
        <div className="create-start-chat-preview create-chat-workspace hidden rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 md:block md:px-5">
          <div className="create-chat-spine space-y-5">
            <CreateSubmittedContributionBubble text={followupSnapshot.originalText} />
            <CreateAssistantStatusBubble
              eyebrow={isStarting ? startBusyStatusLabel : surfaceTexts.followupUnderstandingLabel}
              title={startChatAssistantTitle}
              body={startChatAssistantBody}
              notice={isStarting ? null : actionNotice}
            />
          </div>
        </div>
      ) : null}

      {showLinkClarification && linkClarificationState ? (
        <div className="create-chat-workspace rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 md:px-5">
          <div className="create-chat-spine space-y-5">
            <CreateSubmittedContributionBubble
              text={followupSnapshot?.originalText ?? normalizedIntakeText}
            />
            <CreateLinkIntakeClarification
              locale={surfaceLocale}
              detection={linkClarificationState.detection}
              selectedIntentId={linkClarificationState.selectedIntentId}
              additionalContext={linkClarificationState.additionalContext}
              onSelectIntent={(intentId) => {
                setLinkClarificationState((current) =>
                  current
                    ? {
                        ...current,
                        selectedIntentId: intentId,
                      }
                    : current,
                );
              }}
              onAdditionalContextChange={(value) => {
                setLinkClarificationState((current) =>
                  current
                    ? {
                        ...current,
                        additionalContext: value,
                      }
                    : current,
                );
              }}
            />
          </div>
        </div>
      ) : null}

      {showIntelligentFollowup && intelligentFollowup ? (
        <div
          ref={intelligentFollowupResultRef}
          className="scroll-mt-24 pt-4 md:pt-5"
        >
          <CreateVisualFollowup
            result={intelligentFollowup}
            actionNotice={actionNotice}
            isConfirmed={understandingConfirmed}
            reviewRequestState={reviewRequestState}
            reviewRequestMessage={reviewRequestMessage}
            factcheckMessage={factcheckMessage}
            showCorrectionComposer={showFollowupCorrectionComposer}
            onConfirm={() => {
              setUnderstandingConfirmed(true);
              setShowFollowupCorrectionComposer(false);
              setActionNotice("Verstanden. Du kannst jetzt tiefer ins Thema gehen. Nichts wird automatisch veröffentlicht.");
            }}
            onEdit={() => {
              setUnderstandingConfirmed(false);
              setShowFollowupCorrectionComposer(true);
              setActionNotice("Einordnung zur Korrektur geöffnet. Passe den Text an und starte erneut.");
            }}
            onPrepareSubmission={handlePrepareSubmission}
            onPrepareAnlassraum={handlePrepareAnlassraum}
            onOpenDossierAppend={handleOpenDossierAppend}
            onOpenDossierCreate={handleOpenDossierCreate}
            onPrepareVote={handlePrepareVote}
            onRequestEditorialReview={handleRequestEditorialReview}
            onStartOptionalService={handleStartFactcheckService}
            onRetryPlanner={handleRetryPlanner}
            onSaveOnly={handleSaveOnly}
            onSkipPlaceClarification={handleSkipPlaceClarification}
            continuationValue={chatContinuationText}
            onContinuationChange={setChatContinuationText}
            onContinueConversation={handleContinueConversation}
            continueConversationDisabled={isStarting || !chatContinuationText.trim()}
          />
        </div>
      ) : null}

      {showAnalyzeWorkspace ? (
        <div
          ref={analysisSceneRef}
          tabIndex={-1}
          className="scroll-mt-24 pt-4 outline-none md:pt-5"
        >
          <CreateInlineAnalysisScene
            productMode={analysisSceneMode ?? productMode}
            notice={factcheckMessage ?? actionNotice}
          >
            <AnalyzeWorkspace
              key={`${productMode}-${canonicalCreateMode}-${canonicalIntent}-${dossierId ?? "no-dossier"}`}
              mode={canonicalIntent}
              createMode={canonicalCreateMode}
              defaultLevel={2}
              storageKey={
                canonicalIntent === "statement"
                  ? `vog_create_freistart_statement_${productMode}_v1`
                  : `vog_create_freistart_contribution_${productMode}_v1`
              }
              analyzeEndpoint="/api/create/analyze"
              saveEndpoint="/api/create/save"
              finalizeEndpoint="/api/create/finalize"
              afterFinalizeNavigateTo={afterFinalizeNavigateTo}
              dossierId={dossierId ?? undefined}
              selectedAnlassraumId={effectiveSelectedAnlassraumId ?? undefined}
              verificationLevel={workspaceVerificationLevel}
              verificationStatus="ok"
              authorName={overview.displayName ?? overview.profile?.headline ?? ""}
              useCaseAccess={useCaseAccess}
              initialText={workspaceInitialText}
              embeddedSingleIntake
              syncTextFromParent
              autoRunToken={analysisAutoRunToken}
              maxClaimsCap={maxClaimsCap}
              maxFinalizeClaims={maxFinalizeClaims}
              analysisEntryVariant="single_button"
              analysisModeHint={analysisSceneMode ?? productMode}
              analysisIntentHint={activeIntent}
              sourceUrls={currentMaterialRouting.sourceUrls}
              materialItems={currentMaterialRouting.materialItems}
            />
          </CreateInlineAnalysisScene>
        </div>
      ) : null}
      </section>

      {showPostInputModules && !showIntelligentFollowup && !showLinkClarification && !showAnalyzeWorkspace ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{productModeConfig.postStartTitle}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{productModeConfig.postStartLead}</p>
          {showIntakeContext && initialIntakeContext?.sourceLabel ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.followupContextPrefix}: {initialIntakeContext.sourceLabel}
              {initialIntakeContext.scope
                ? ` · ${formatRelevanceScopeLabel(initialIntakeContext.scope, initialIntakeContext.scope)}`
                : ""}
            </p>
          ) : null}
          {hasLegacyModeParam ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {text.legacyModePrefix} {text.legacyModeSuffix}
            </p>
          ) : null}
        </section>
      ) : null}

      {showFollowupQuestionCard && !showLinkClarification && !showAnalyzeWorkspace ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">eDebatte</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{surfaceTexts.followupQuestionLabel}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{productModeConfig.firstQuestion}</p>
          <label className="sr-only" htmlFor="create-followup-answer">
            {surfaceTexts.followupQuestionLabel}
          </label>
          <textarea
            id="create-followup-answer"
            rows={5}
            value={activeFollowupAnswer}
            onChange={(event) => {
              const value = event.target.value;
              setFollowupAnswers((current) => ({
                ...current,
                [activeIntent]: value,
              }));
              setFollowupAnswerSaved((current) => ({
                ...current,
                [activeIntent]: false,
              }));
              if (actionNotice) setActionNotice(null);
            }}
            className="mt-3 w-full resize-y rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder={productModeConfig.firstQuestionPlaceholder}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={handleSaveFollowupAnswer}>
              {surfaceTexts.followupQuestionSaveLabel}
            </button>
            <span className="text-xs text-[rgb(var(--muted))]">
              {productModeConfig.inputLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">Schreib einfach weiter, wenn du die Antwort lieber frei im Chat ergänzen möchtest.</p>
          {activeFollowupSaved ? (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{surfaceTexts.followupQuestionSavedLabel}</p>
          ) : null}
        </section>
      ) : null}

      {showPostInputModules && pickerEnabled && !showLinkClarification && !showAnalyzeWorkspace ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{text.contextPickerTitle}</p>
            <p className="text-sm text-[rgb(var(--muted))]">
              {text.contextPickerLead}
            </p>
          </div>

          {contextLoadState === "loading" ? (
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">{text.loadingContextList}</p>
          ) : null}

          {contextLoadState === "error" ? (
            <div className="mt-3 rounded-xl border border-rose-300/50 bg-rose-50/80 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              <p>{text.contextUnavailable}.</p>
              {contextLoadError ? <p className="mt-2 text-xs">Bitte versuche es gleich noch einmal.</p> : null}
              <button type="button" onClick={() => void loadContextItems()} className="btn-secondary mt-2 text-xs">
                {text.reload}
              </button>
            </div>
          ) : null}

          {contextLoadState === "ready" && contextItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
              {text.contextEmpty}
            </p>
          ) : null}

          {contextLoadState === "ready" && contextItems.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {contextItems.map((item) => {
                const isSelected = selectedAnlassraumId === item.anlassraumId;
                return (
                  <li key={item.anlassraumId}>
                    <button
                      type="button"
                      className={`w-full rounded-xl border px-3 py-2 text-left ${
                        isSelected
                          ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))]"
                          : "border-[rgb(var(--border))] bg-transparent hover:border-[rgb(var(--grad-from))]/40"
                      }`}
                      onClick={() => {
                        setSelectionInfo(null);
                        setSelectedAnlassraumId(item.anlassraumId);
                      }}
                    >
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">{item.summary}</p>
                      <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                        {item.topicKey ? `${text.topicLabel}: ${item.topicKey} · ` : ""}
                        {item.anlassraumStatus ? `${text.statusLabel}: ${item.anlassraumStatus}` : `${text.statusLabel}: ${text.statusOpen}`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {selectedContext ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
              <span className="vog-chip">{text.selectedLabel}: {selectedContext.title}</span>
              <button
                type="button"
                className="vog-chip border border-[rgb(var(--border))] bg-transparent"
                onClick={() => setSelectedAnlassraumId(null)}
              >
                {text.clearSelection}
              </button>
            </div>
          ) : null}

          {selectionInfo ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{selectionInfo}</p>
          ) : null}
        </section>
      ) : null}

      {showPostInputModules && workingState && !showIntelligentFollowup && !showLinkClarification && !showAnalyzeWorkspace ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">eDebatte</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
            {productMode === "guided" ? surfaceTexts.followupGuidedTitle : productModeConfig.postStartTitle}
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {productMode === "guided" ? surfaceTexts.followupGuidedLead : productModeConfig.postStartLead}
          </p>

          <div className="mt-3 grid gap-3">
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Kurzfassung</p>
              <p className="mt-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
                {workingState.summary}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-xs font-semibold text-[rgb(var(--muted))]">{productModeConfig.recognizedTypeLabel}</p>
                <p className="mt-1 text-sm text-[rgb(var(--fg))]">{workingState.recognizedType}</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-xs font-semibold text-[rgb(var(--muted))]">Passendes Thema oder nächster Schritt</p>
                <p className="mt-1 text-sm text-[rgb(var(--fg))]">{workingState.suggestedAssignment}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Offene Klärungsfragen</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
                {productModeConfig.openPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{surfaceTexts.followupNextStepLabel}</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{surfaceTexts.followupNextStepLead}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {productModeConfig.nextActions.map((actionLabel, actionIndex) => (
                <button
                  key={actionLabel}
                  type="button"
                  className="btn-secondary justify-start text-left text-xs"
                  onClick={() => handleIntentAction(actionIndex)}
                >
                  {actionLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dossier/demo" className="btn-secondary text-xs">
              Thema öffnen
            </Link>
            <Link href="/swipes" className="btn-secondary text-xs">
              Beteiligung öffnen
            </Link>
          </div>

          {followupSnapshot ? (
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.followupUnderstandingLabel}: {followupSnapshot.understandingLine}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">{surfaceTexts.followupNotPublishedLabel}</p>
          {actionNotice ? (
            <p className="mt-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              {actionNotice}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
    </section>
  );
}
