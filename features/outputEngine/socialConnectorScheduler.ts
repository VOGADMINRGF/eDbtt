import { z } from "zod";
import {
  SOCIAL_DISTRIBUTION_CHANNELS,
  type SocialDistributionChannel,
} from "./socialDistribution";
import type { SocialDistributionPost } from "./socialDistributionRuntime";

export const SOCIAL_CHANNEL_CONNECTION_STATUSES = [
  "internal_ready",
  "connector_ready",
  "not_connected",
  "disabled_by_policy",
  "missing_secret",
] as const;

export const SOCIAL_CHANNEL_AUTH_MODES = [
  "internal",
  "manual_export",
  "oauth_optional",
  "token_optional",
  "disabled",
] as const;

export const SOCIAL_SCHEDULER_STATUSES = [
  "draft",
  "approved",
  "scheduled",
  "posting",
  "posted",
  "failed",
  "cancelled",
] as const;

export type SocialChannelConnectionStatus =
  (typeof SOCIAL_CHANNEL_CONNECTION_STATUSES)[number];
export type SocialChannelAuthMode = (typeof SOCIAL_CHANNEL_AUTH_MODES)[number];
export type SocialSchedulerStatus = (typeof SOCIAL_SCHEDULER_STATUSES)[number];

export const SocialChannelConnectionSchema = z
  .object({
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    connectionStatus: z.enum(SOCIAL_CHANNEL_CONNECTION_STATUSES),
    authMode: z.enum(SOCIAL_CHANNEL_AUTH_MODES),
    lastCheckedAt: z.string().datetime({ offset: true }).nullable(),
    scopes: z.array(z.string().trim().min(1)),
    organizationId: z.string().trim().min(1),
    createdBy: z.string().trim().min(1),
    disabledReason: z.string().trim().min(1).nullable(),
  })
  .strict();

export type SocialChannelConnection = z.infer<typeof SocialChannelConnectionSchema>;

export const SocialSchedulerEntrySchema = z
  .object({
    queueItemId: z.string().trim().min(1),
    scheduledAt: z.string().datetime({ offset: true }).nullable(),
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    status: z.enum(SOCIAL_SCHEDULER_STATUSES),
    approvalRequired: z.boolean(),
    approvalBy: z.string().trim().min(1).nullable(),
    error: z.string().trim().min(1).nullable(),
    retryCount: z.number().int().min(0),
  })
  .strict();

export type SocialSchedulerEntry = z.infer<typeof SocialSchedulerEntrySchema>;

type BuildChannelConnectionsInput = {
  channels: SocialDistributionChannel[];
  organizationId: string;
  createdBy: string;
  checkedAt?: string | null;
};

type TransitionSchedulerEntryInput = {
  entry: SocialSchedulerEntry;
  nextStatus: SocialSchedulerStatus;
  post: Pick<SocialDistributionPost, "status" | "approval" | "channels" | "organizationId">;
  connection: SocialChannelConnection | null;
  scheduledAt?: string | null;
  error?: string | null;
};

function envFlag(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function envHas(name: string) {
  const raw = process.env[name];
  return typeof raw === "string" && raw.trim().length > 0;
}

function nowIso() {
  return new Date().toISOString();
}

const INTERNAL_CHANNELS = new Set<SocialDistributionChannel>([
  "website_update",
  "newsletter_draft",
  "embed_snippet",
  "qr_asset",
  "press_note",
]);

const CONNECTOR_ENV_MAP: Record<
  Exclude<SocialDistributionChannel, "website_update" | "newsletter_draft" | "embed_snippet" | "qr_asset" | "press_note">,
  { enabledEnv: string; authMode: SocialChannelAuthMode; secretEnv: string[]; scopes: string[] }
> = {
  linkedin_draft: {
    enabledEnv: "SOCIAL_CONNECTOR_LINKEDIN_ENABLED",
    authMode: "oauth_optional",
    secretEnv: ["SOCIAL_CONNECTOR_LINKEDIN_ACCESS_TOKEN", "SOCIAL_CONNECTOR_LINKEDIN_CLIENT_ID"],
    scopes: ["post:linkedin", "schedule:linkedin"],
  },
  x_draft: {
    enabledEnv: "SOCIAL_CONNECTOR_X_ENABLED",
    authMode: "token_optional",
    secretEnv: ["SOCIAL_CONNECTOR_X_ACCESS_TOKEN"],
    scopes: ["post:x", "schedule:x"],
  },
  mastodon_draft: {
    enabledEnv: "SOCIAL_CONNECTOR_MASTODON_ENABLED",
    authMode: "token_optional",
    secretEnv: ["SOCIAL_CONNECTOR_MASTODON_ACCESS_TOKEN"],
    scopes: ["post:mastodon", "schedule:mastodon"],
  },
  instagram_asset: {
    enabledEnv: "SOCIAL_CONNECTOR_INSTAGRAM_ENABLED",
    authMode: "oauth_optional",
    secretEnv: ["SOCIAL_CONNECTOR_INSTAGRAM_ACCESS_TOKEN", "SOCIAL_CONNECTOR_INSTAGRAM_CLIENT_ID"],
    scopes: ["post:instagram", "schedule:instagram"],
  },
};

function buildConnectionForChannel(input: {
  channel: SocialDistributionChannel;
  organizationId: string;
  createdBy: string;
  checkedAt: string;
}): SocialChannelConnection {
  if (INTERNAL_CHANNELS.has(input.channel)) {
    return SocialChannelConnectionSchema.parse({
      channel: input.channel,
      connectionStatus: "internal_ready",
      authMode: "internal",
      lastCheckedAt: input.checkedAt,
      scopes: ["review_queue", "manual_export", "internal_schedule"],
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      disabledReason: null,
    });
  }

  const config = CONNECTOR_ENV_MAP[input.channel as keyof typeof CONNECTOR_ENV_MAP];
  const globallyEnabled = envFlag("SOCIAL_CONNECTORS_ENABLED", false);
  if (!globallyEnabled || !envFlag(config.enabledEnv, false)) {
    return SocialChannelConnectionSchema.parse({
      channel: input.channel,
      connectionStatus: "disabled_by_policy",
      authMode: "manual_export",
      lastCheckedAt: input.checkedAt,
      scopes: config.scopes,
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      disabledReason: "Connector ist nicht freigeschaltet. Export bleibt verfügbar.",
    });
  }

  const hasSecret = config.secretEnv.some((name) => envHas(name));
  if (!hasSecret) {
    return SocialChannelConnectionSchema.parse({
      channel: input.channel,
      connectionStatus: "missing_secret",
      authMode: config.authMode,
      lastCheckedAt: input.checkedAt,
      scopes: config.scopes,
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      disabledReason: "Connector ist freigeschaltet, aber Secrets oder Tokens fehlen.",
    });
  }

  return SocialChannelConnectionSchema.parse({
    channel: input.channel,
    connectionStatus: "connector_ready",
    authMode: config.authMode,
    lastCheckedAt: input.checkedAt,
    scopes: config.scopes,
    organizationId: input.organizationId,
    createdBy: input.createdBy,
    disabledReason: null,
  });
}

export function buildSocialChannelConnections(
  input: BuildChannelConnectionsInput,
): SocialChannelConnection[] {
  const checkedAt = input.checkedAt ?? nowIso();
  return input.channels.map((channel) =>
    buildConnectionForChannel({
      channel,
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      checkedAt,
    }),
  );
}

function schedulerBaseStatus(postStatus: SocialDistributionPost["status"]): SocialSchedulerStatus {
  switch (postStatus) {
    case "approved":
      return "approved";
    case "queued":
    case "scheduled_ready":
      return "scheduled";
    case "blocked":
      return "cancelled";
    case "error":
      return "failed";
    default:
      return "draft";
  }
}

export function buildSocialSchedulerEntries(input: {
  post: Pick<
    SocialDistributionPost,
    "id" | "channels" | "status" | "approval" | "organizationId" | "createdByUserId"
  >;
  connections: SocialChannelConnection[];
  existing?: SocialSchedulerEntry[];
}): SocialSchedulerEntry[] {
  const existingMap = new Map((input.existing ?? []).map((entry) => [entry.channel, entry]));
  return input.post.channels.map((channel) => {
    const prior = existingMap.get(channel);
    const baseStatus = schedulerBaseStatus(input.post.status);
    const next =
      prior && ["posting", "posted", "failed", "cancelled"].includes(prior.status)
        ? {
            ...prior,
            approvalBy: input.post.approval.approvedByUserId ?? prior.approvalBy,
          }
        : {
            queueItemId: `${input.post.id}:${channel}`,
            scheduledAt: prior?.scheduledAt ?? null,
            channel,
            status:
              input.post.approval.approvedByUserId && baseStatus === "draft" ? "approved" : baseStatus,
            approvalRequired: true,
            approvalBy: input.post.approval.approvedByUserId ?? null,
            error: prior?.error ?? null,
            retryCount: prior?.retryCount ?? 0,
          };
    return SocialSchedulerEntrySchema.parse(next);
  });
}

export function transitionSocialSchedulerEntry(
  input: TransitionSchedulerEntryInput,
):
  | { ok: true; entry: SocialSchedulerEntry }
  | { ok: false; error: string } {
  const approvalGiven = Boolean(input.post.approval.approvedByUserId);
  const postBlocked =
    input.post.status === "needs_review" ||
    input.post.status === "review_requested" ||
    input.post.status === "blocked" ||
    input.post.status === "error";

  if (["approved", "scheduled", "posting", "posted"].includes(input.nextStatus) && !approvalGiven) {
    return { ok: false, error: "approval_required_for_scheduler" };
  }

  if (postBlocked && ["scheduled", "posting", "posted"].includes(input.nextStatus)) {
    return { ok: false, error: "review_state_blocks_scheduler" };
  }

  const liveCapable =
    input.connection?.connectionStatus === "internal_ready" ||
    input.connection?.connectionStatus === "connector_ready";

  if (["scheduled", "posting", "posted"].includes(input.nextStatus) && !liveCapable) {
    return { ok: false, error: "channel_connector_not_ready" };
  }

  if (input.nextStatus === "posted" && input.entry.status !== "posting" && input.entry.status !== "scheduled") {
    return { ok: false, error: "scheduler_posting_transition_invalid" };
  }

  const retryCount =
    input.nextStatus === "failed" ? input.entry.retryCount + 1 : input.entry.retryCount;

  return {
    ok: true,
    entry: SocialSchedulerEntrySchema.parse({
      ...input.entry,
      status: input.nextStatus,
      scheduledAt:
        input.nextStatus === "scheduled" || input.nextStatus === "posting" || input.nextStatus === "posted"
          ? input.scheduledAt ?? input.entry.scheduledAt ?? nowIso()
          : input.nextStatus === "cancelled"
            ? input.entry.scheduledAt
            : input.entry.scheduledAt,
      approvalBy: input.post.approval.approvedByUserId ?? input.entry.approvalBy,
      error: input.nextStatus === "failed" ? input.error ?? "scheduler_failed" : null,
      retryCount,
    }),
  };
}

export function socialChannelConnectionLabel(status: SocialChannelConnectionStatus): string {
  switch (status) {
    case "internal_ready":
      return "Intern bereit";
    case "connector_ready":
      return "Connector bereit";
    case "missing_secret":
      return "Secrets fehlen";
    case "disabled_by_policy":
      return "Per Policy deaktiviert";
    case "not_connected":
    default:
      return "Nicht verbunden";
  }
}

export function socialSchedulerStatusLabel(status: SocialSchedulerStatus): string {
  switch (status) {
    case "approved":
      return "Freigegeben";
    case "scheduled":
      return "Geplant";
    case "posting":
      return "Wird gepostet";
    case "posted":
      return "Gepostet";
    case "failed":
      return "Fehlgeschlagen";
    case "cancelled":
      return "Abgebrochen";
    case "draft":
    default:
      return "Entwurf";
  }
}
