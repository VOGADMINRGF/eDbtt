export const VOXY_SMART_PRESENCE_MAX_ACTIONS = 3;

export type VoxySmartPresenceSurface =
  | "dossier"
  | "anlassraum"
  | "round"
  | "participation";

export type VoxySmartPresenceObjectType =
  | "dossier"
  | "claim"
  | "source"
  | "question"
  | "participation";

export type VoxySmartPresenceHelpTopic =
  | "unclear_claim"
  | "contradicting_source"
  | "unreviewed_source"
  | "open_question"
  | "review_status"
  | "surface_help";

export type VoxySmartPresenceAction = {
  id: string;
  label: string;
  kind: "navigate";
  target: {
    view: string;
    objectType: VoxySmartPresenceObjectType;
    objectId: string;
  };
};

export type VoxySmartPresenceContext = {
  surface: VoxySmartPresenceSurface;
  objectType: VoxySmartPresenceObjectType;
  objectId: string;
  objectLabel: string;
  helpTopic: VoxySmartPresenceHelpTopic;
  status: string;
  allowedActions: readonly VoxySmartPresenceAction[];
  languageContext: {
    contentLanguage: string;
    interfaceLanguage: string;
    direction: "ltr" | "rtl";
  };
  permissionContext: {
    canRead: boolean;
    canNavigate: boolean;
    canMutate: false;
  };
};

export type VoxyProactiveReason =
  | "real_blocker"
  | "contradiction"
  | "unreviewed_answer"
  | "phase_change"
  | "explicit_help";

const PROACTIVE_REASONS = new Set<VoxyProactiveReason>([
  "real_blocker",
  "contradiction",
  "unreviewed_answer",
  "phase_change",
  "explicit_help",
]);

export function buildVoxySmartPresenceContext(
  input: VoxySmartPresenceContext,
): VoxySmartPresenceContext | null {
  const objectId = input.objectId.trim();
  const objectLabel = input.objectLabel.trim();
  const status = input.status.trim();
  const actions = input.allowedActions.filter(
    (action) =>
      action.kind === "navigate" &&
      action.id.trim() &&
      action.label.trim() &&
      action.target.objectId.trim() &&
      action.target.view.trim(),
  );

  if (
    !objectId ||
    !objectLabel ||
    !status ||
    !input.languageContext.contentLanguage.trim() ||
    !input.languageContext.interfaceLanguage.trim() ||
    !input.permissionContext.canRead ||
    input.permissionContext.canMutate ||
    actions.length !== input.allowedActions.length ||
    actions.length > VOXY_SMART_PRESENCE_MAX_ACTIONS
  ) {
    return null;
  }

  return {
    ...input,
    objectId,
    objectLabel,
    status,
    allowedActions: actions,
  };
}

export function selectVoxyProactiveContext(
  candidates: ReadonlyArray<{
    id: string;
    reason: VoxyProactiveReason;
    context: VoxySmartPresenceContext;
  }>,
  dismissedIds: ReadonlySet<string>,
) {
  return (
    candidates.find(
      (candidate) =>
        PROACTIVE_REASONS.has(candidate.reason) &&
        !dismissedIds.has(candidate.id) &&
        buildVoxySmartPresenceContext(candidate.context) !== null,
    ) ?? null
  );
}

export const VOXY_SMART_PRESENCE_LAYOUT_GUARD = {
  shellClassName:
    "max-w-full motion-reduce:transition-none [overflow-wrap:anywhere]",
  mobileSafeAreaClassName: "pb-[env(safe-area-inset-bottom,0px)]",
  forbidsFullScreenOverlay: true,
  forbidsMutation: true,
} as const;
