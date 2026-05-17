import { coreCol } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { z } from "zod";
import {
  OFFICIAL_PUBLICATION_AUTHORITIES,
  resolveExplicitOfficialVisibility,
  REGION_PUBLICATION_VISIBILITY_STATES,
  resolveStudioWorkspaceVisibilityState,
  type ExplicitOfficialPublicationApproval,
  type OfficialPublicationAuthority,
} from "@features/region/publicationRiskLadder";
import {
  MasterPostSchema,
  SocialCarouselOutputSchema,
  SocialDistributionDraftSchema,
  type MasterPost,
  type SocialCarouselOutput,
  type SocialDistributionDraft,
} from "@features/outputEngine";

export const DOSSIER_STUDIO_WORKSPACE_STATUSES = [
  "draft",
  "needs_review",
  "locked",
  "archived",
] as const;
export type DossierStudioWorkspaceStatus =
  (typeof DOSSIER_STUDIO_WORKSPACE_STATUSES)[number];

export const DOSSIER_STUDIO_WORKSPACE_SOURCES = [
  "region_signal_draft",
  "public_participation_signal",
  "manual_admin",
  "manual_editor",
  "imported_demo",
  "fixture",
] as const;
export type DossierStudioWorkspaceSource =
  (typeof DOSSIER_STUDIO_WORKSPACE_SOURCES)[number];

const ExplicitOfficialPublicationApprovalSchema = z
  .object({
    approvedByUserId: z.string().trim().min(1),
    approvedAt: z.string().datetime({ offset: true }),
    authority: z.enum(OFFICIAL_PUBLICATION_AUTHORITIES),
    note: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

const DossierStudioWorkspaceGuardrailsSchema = z
  .object({
    noAutoPublish: z.literal(true),
    noSocialPublishing: z.literal(true),
    noAutoMandate: z.literal(true),
    noAutoVote: z.literal(true),
    reviewRequired: z.literal(true),
    localStorageIsNotProduction: z.literal(true),
  })
  .strict();

export type DossierStudioWorkspaceGuardrails = z.infer<
  typeof DossierStudioWorkspaceGuardrailsSchema
>;

const DossierStudioWorkspaceProvenanceSchema = z
  .object({
    sourceSignalId: z.string().trim().min(1).optional(),
    sourceRegionId: z.string().trim().min(1).optional(),
    sourceDraftId: z.string().trim().min(1).optional(),
    notProductionData: z.boolean().optional(),
    fixture: z.boolean().optional(),
  })
  .strict();

const DossierStudioWorkspaceSchema = z
  .object({
    id: z.string().trim().min(1),
    dossierId: z.string().trim().min(1),
    regionId: z.string().trim().min(1).optional(),
    organizationId: z.string().trim().min(1).optional(),
    unitId: z.string().trim().min(1).optional(),
    source: z.enum(DOSSIER_STUDIO_WORKSPACE_SOURCES),
    status: z.enum(DOSSIER_STUDIO_WORKSPACE_STATUSES),
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
    title: z.string().trim().min(1),
    masterPostDraft: MasterPostSchema.optional(),
    distributionDraft: SocialDistributionDraftSchema.optional(),
    carouselDraft: SocialCarouselOutputSchema.optional(),
    audienceNotes: z.string().trim().min(1).optional(),
    reviewNotes: z.string().trim().min(1).optional(),
    createdBy: z.string().trim().min(1),
    updatedBy: z.string().trim().min(1),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    lockedBy: z.string().trim().min(1).optional(),
    lockedAt: z.string().datetime({ offset: true }).optional(),
    officialApproval: ExplicitOfficialPublicationApprovalSchema.nullable().default(null),
    provenance: DossierStudioWorkspaceProvenanceSchema,
    guardrails: DossierStudioWorkspaceGuardrailsSchema,
  })
  .strict();

export type DossierStudioWorkspace = z.infer<typeof DossierStudioWorkspaceSchema>;

const DossierStudioWorkspacePatchSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    masterPostDraft: MasterPostSchema.optional(),
    distributionDraft: SocialDistributionDraftSchema.optional(),
    carouselDraft: SocialCarouselOutputSchema.optional(),
    audienceNotes: z.string().trim().min(1).nullable().optional(),
    reviewNotes: z.string().trim().min(1).nullable().optional(),
    status: z.enum(DOSSIER_STUDIO_WORKSPACE_STATUSES).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "workspace_patch_empty",
  });

export type DossierStudioWorkspacePatch = z.infer<
  typeof DossierStudioWorkspacePatchSchema
>;

const DossierStudioWorkspaceAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    workspaceId: z.string().trim().min(1),
    dossierId: z.string().trim().min(1),
    action: z.enum([
      "created",
      "updated",
      "status_changed",
      "locked",
      "unlocked",
      "archived",
      "official_approved",
      "official_revoked",
    ]),
    byUserId: z.string().trim().min(1),
    note: z.string().trim().min(1).optional(),
    authority: z.enum(OFFICIAL_PUBLICATION_AUTHORITIES).optional(),
    at: z.string().datetime({ offset: true }),
  })
  .strict();

export type DossierStudioWorkspaceAuditEvent = z.infer<
  typeof DossierStudioWorkspaceAuditEventSchema
>;

const WORKSPACE_GUARDRAILS: DossierStudioWorkspaceGuardrails = {
  noAutoPublish: true,
  noSocialPublishing: true,
  noAutoMandate: true,
  noAutoVote: true,
  reviewRequired: true,
  localStorageIsNotProduction: true,
};

const WORKSPACES_COLLECTION = "dossier_studio_workspaces";
const AUDIT_COLLECTION = "dossier_studio_workspace_audit_events";

type DossierStudioWorkspaceDoc = {
  _id: string;
  workspace: DossierStudioWorkspace;
  createdAt: Date;
  updatedAt: Date;
};

type DossierStudioWorkspaceAuditEventDoc = {
  _id: string;
  event: DossierStudioWorkspaceAuditEvent;
  createdAt: Date;
};

export type CreateOrGetDossierStudioWorkspaceInput = {
  dossierId: string;
  regionId?: string | null;
  organizationId?: string | null;
  unitId?: string | null;
  source: DossierStudioWorkspaceSource;
  title: string;
  createdBy: string;
  updatedBy: string;
  provenance?: {
    sourceSignalId?: string | null;
    sourceRegionId?: string | null;
    sourceDraftId?: string | null;
    notProductionData?: boolean | null;
    fixture?: boolean | null;
  };
  seed?: {
    masterPostDraft?: MasterPost | null;
    distributionDraft?: SocialDistributionDraft | null;
    carouselDraft?: SocialCarouselOutput | null;
    audienceNotes?: string | null;
    reviewNotes?: string | null;
    status?: DossierStudioWorkspaceStatus | null;
  };
};

export type UpdateDossierStudioWorkspaceInput = {
  dossierId: string;
  updatedBy: string;
  patch: DossierStudioWorkspacePatch;
};

export type ArchiveDossierStudioWorkspaceInput = {
  dossierId: string;
  archivedBy: string;
  note?: string | null;
};

export type LockDossierStudioWorkspaceInput = {
  dossierId: string;
  lockedBy: string;
  note?: string | null;
};

export type UnlockDossierStudioWorkspaceInput = {
  dossierId: string;
  unlockedBy: string;
  note?: string | null;
};

export type ApproveDossierStudioWorkspaceOfficialInput = {
  dossierId: string;
  approvedBy: string;
  authority: OfficialPublicationAuthority;
  note?: string | null;
};

export type DossierStudioWorkspaceRepo = {
  createOrGetDossierStudioWorkspace(
    input: CreateOrGetDossierStudioWorkspaceInput,
  ): Promise<DossierStudioWorkspace>;
  getDossierStudioWorkspace(dossierId: string): Promise<DossierStudioWorkspace | null>;
  updateDossierStudioWorkspace(
    input: UpdateDossierStudioWorkspaceInput,
  ): Promise<DossierStudioWorkspace>;
  archiveDossierStudioWorkspace(
    input: ArchiveDossierStudioWorkspaceInput,
  ): Promise<DossierStudioWorkspace | null>;
  lockDossierStudioWorkspace(
    input: LockDossierStudioWorkspaceInput,
  ): Promise<DossierStudioWorkspace | null>;
  unlockDossierStudioWorkspace(
    input: UnlockDossierStudioWorkspaceInput,
  ): Promise<DossierStudioWorkspace | null>;
  approveDossierStudioWorkspaceOfficial(
    input: ApproveDossierStudioWorkspaceOfficialInput,
  ): Promise<DossierStudioWorkspace | null>;
  revokeDossierStudioWorkspaceOfficial(
    dossierId: string,
    reviewedBy: string,
    note?: string | null,
  ): Promise<DossierStudioWorkspace | null>;
  listDossierStudioWorkspacesForDossier(
    dossierId: string,
  ): Promise<DossierStudioWorkspace[]>;
  listDossierStudioWorkspaceAuditEvents(
    dossierId: string,
  ): Promise<DossierStudioWorkspaceAuditEvent[]>;
  appendDossierStudioWorkspaceAuditEvent(
    event: DossierStudioWorkspaceAuditEvent,
  ): Promise<void>;
};

let repoSingleton: DossierStudioWorkspaceRepo | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function workspaceIdForDossier(dossierId: string) {
  return `studio-workspace-${stableHash(String(dossierId || "").trim()).slice(0, 18)}`;
}

function auditIdFor(input: string) {
  return `studio-audit-${stableHash(input).slice(0, 18)}`;
}

function sanitizeOptionalString(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}

function normalizeProvenance(
  value: CreateOrGetDossierStudioWorkspaceInput["provenance"] | undefined,
) {
  return DossierStudioWorkspaceProvenanceSchema.parse({
    sourceSignalId: sanitizeOptionalString(value?.sourceSignalId),
    sourceRegionId: sanitizeOptionalString(value?.sourceRegionId),
    sourceDraftId: sanitizeOptionalString(value?.sourceDraftId),
    notProductionData: value?.notProductionData ?? undefined,
    fixture: value?.fixture ?? undefined,
  });
}

function resolveWorkspacePublicationVisibility(input: {
  status: DossierStudioWorkspaceStatus;
  officialApproval?: ExplicitOfficialPublicationApproval | null;
}) {
  return resolveExplicitOfficialVisibility({
    fallbackVisibilityState: resolveStudioWorkspaceVisibilityState({
      status: input.status,
    }),
    officialApproval: input.officialApproval ?? null,
  });
}

function buildOfficialApproval(
  authority: OfficialPublicationAuthority,
  approvedBy: string,
  note?: string | null,
): ExplicitOfficialPublicationApproval {
  return {
    approvedByUserId: approvedBy,
    approvedAt: isoNow(),
    authority,
    note: note ?? null,
  };
}

function buildWorkspace(
  input: CreateOrGetDossierStudioWorkspaceInput,
): DossierStudioWorkspace {
  const now = isoNow();
  const status = input.seed?.status ?? "draft";
  return DossierStudioWorkspaceSchema.parse({
    id: workspaceIdForDossier(input.dossierId),
    dossierId: input.dossierId,
    regionId: sanitizeOptionalString(input.regionId),
    organizationId: sanitizeOptionalString(input.organizationId),
    unitId: sanitizeOptionalString(input.unitId),
    source: input.source,
    status,
    visibilityState: resolveWorkspacePublicationVisibility({
      status,
      officialApproval: null,
    }),
    title: input.title,
    masterPostDraft: input.seed?.masterPostDraft ?? undefined,
    distributionDraft: input.seed?.distributionDraft ?? undefined,
    carouselDraft: input.seed?.carouselDraft ?? undefined,
    audienceNotes: sanitizeOptionalString(input.seed?.audienceNotes),
    reviewNotes: sanitizeOptionalString(input.seed?.reviewNotes),
    createdBy: input.createdBy,
    updatedBy: input.updatedBy,
    createdAt: now,
    updatedAt: now,
    officialApproval: null,
    provenance: normalizeProvenance(input.provenance),
    guardrails: WORKSPACE_GUARDRAILS,
  });
}

function applyPatch(
  workspace: DossierStudioWorkspace,
  patch: DossierStudioWorkspacePatch,
  updatedBy: string,
): DossierStudioWorkspace {
  const parsedPatch = DossierStudioWorkspacePatchSchema.parse(patch);
  const nextStatus = parsedPatch.status ?? workspace.status;
  const next = DossierStudioWorkspaceSchema.parse({
    ...workspace,
    title: parsedPatch.title ?? workspace.title,
    masterPostDraft: parsedPatch.masterPostDraft ?? workspace.masterPostDraft,
    distributionDraft:
      parsedPatch.distributionDraft ?? workspace.distributionDraft,
    carouselDraft: parsedPatch.carouselDraft ?? workspace.carouselDraft,
    audienceNotes:
      parsedPatch.audienceNotes === null
        ? undefined
        : parsedPatch.audienceNotes ?? workspace.audienceNotes,
    reviewNotes:
      parsedPatch.reviewNotes === null
        ? undefined
        : parsedPatch.reviewNotes ?? workspace.reviewNotes,
    status: nextStatus,
    visibilityState: resolveWorkspacePublicationVisibility({
      status: nextStatus,
      officialApproval: workspace.officialApproval ?? null,
    }),
    updatedBy,
    updatedAt: isoNow(),
    guardrails: WORKSPACE_GUARDRAILS,
  });
  return next;
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const [workspaces, audit] = await Promise.all([
    coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION),
    coreCol<DossierStudioWorkspaceAuditEventDoc>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    workspaces.createIndex({ "workspace.dossierId": 1 }, { unique: true }),
    workspaces.createIndex({ "workspace.regionId": 1 }),
    workspaces.createIndex({ "workspace.organizationId": 1 }),
    workspaces.createIndex({ "workspace.status": 1 }),
    workspaces.createIndex({ "workspace.source": 1 }),
    workspaces.createIndex({ "workspace.updatedAt": -1 }),
    audit.createIndex({ "event.workspaceId": 1, createdAt: -1 }),
    audit.createIndex({ "event.dossierId": 1, createdAt: -1 }),
  ]);
  indexesReady = true;
}

async function appendAuditEventMongo(event: DossierStudioWorkspaceAuditEvent) {
  await ensureMongoIndexes();
  const col = await coreCol<DossierStudioWorkspaceAuditEventDoc>(AUDIT_COLLECTION);
  await col.insertOne({
    _id: event.id,
    event: clone(event),
    createdAt: new Date(event.at),
  });
}

function createMongoDossierStudioWorkspaceRepo(): DossierStudioWorkspaceRepo {
  return {
    async createOrGetDossierStudioWorkspace(input) {
      await ensureMongoIndexes();
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      const existing = await col.findOne({
        "workspace.dossierId": input.dossierId,
      });
      if (existing?.workspace) return clone(existing.workspace);
      const workspace = buildWorkspace(input);
      await col.insertOne({
        _id: workspace.id,
        workspace: clone(workspace),
        createdAt: new Date(workspace.createdAt),
        updatedAt: new Date(workspace.updatedAt),
      });
      await appendAuditEventMongo({
        id: auditIdFor(`${workspace.id}:created:${workspace.createdAt}`),
        workspaceId: workspace.id,
        dossierId: workspace.dossierId,
        action: "created",
        byUserId: input.createdBy,
        at: workspace.createdAt,
      });
      return workspace;
    },

    async getDossierStudioWorkspace(dossierId) {
      await ensureMongoIndexes();
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      const existing = await col.findOne({ "workspace.dossierId": dossierId });
      return existing?.workspace ? clone(existing.workspace) : null;
    },

    async updateDossierStudioWorkspace(input) {
      await ensureMongoIndexes();
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      const existing = await col.findOne({ "workspace.dossierId": input.dossierId });
      if (!existing?.workspace) {
        throw new Error("studio_workspace_not_found");
      }
      if (
        existing.workspace.status === "locked" &&
        existing.workspace.lockedBy &&
        existing.workspace.lockedBy !== input.updatedBy
      ) {
        throw new Error("studio_workspace_locked");
      }
      const next = applyPatch(existing.workspace, input.patch, input.updatedBy);
      await col.updateOne(
        { "workspace.dossierId": input.dossierId },
        {
          $set: {
            workspace: clone(next),
            updatedAt: new Date(next.updatedAt),
          },
        },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:updated:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action:
          input.patch.status && input.patch.status !== existing.workspace.status
            ? "status_changed"
            : "updated",
        byUserId: input.updatedBy,
        at: next.updatedAt,
      });
      return next;
    },

    async archiveDossierStudioWorkspace(input) {
      const existing = await this.getDossierStudioWorkspace(input.dossierId);
      if (!existing) return null;
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: "archived",
        visibilityState: resolveWorkspacePublicationVisibility({
          status: "archived",
          officialApproval: existing.officialApproval ?? null,
        }),
        updatedBy: input.archivedBy,
        updatedAt: isoNow(),
      });
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      await col.updateOne(
        { "workspace.dossierId": input.dossierId },
        { $set: { workspace: clone(next), updatedAt: new Date(next.updatedAt) } },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:archived:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "archived",
        byUserId: input.archivedBy,
        note: sanitizeOptionalString(input.note),
        at: next.updatedAt,
      });
      return next;
    },

    async lockDossierStudioWorkspace(input) {
      const existing = await this.getDossierStudioWorkspace(input.dossierId);
      if (!existing) return null;
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: "locked",
        visibilityState: resolveWorkspacePublicationVisibility({
          status: "locked",
          officialApproval: existing.officialApproval ?? null,
        }),
        lockedBy: input.lockedBy,
        lockedAt: isoNow(),
        updatedBy: input.lockedBy,
        updatedAt: isoNow(),
      });
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      await col.updateOne(
        { "workspace.dossierId": input.dossierId },
        { $set: { workspace: clone(next), updatedAt: new Date(next.updatedAt) } },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:locked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "locked",
        byUserId: input.lockedBy,
        note: sanitizeOptionalString(input.note),
        at: next.updatedAt,
      });
      return next;
    },

    async unlockDossierStudioWorkspace(input) {
      const existing = await this.getDossierStudioWorkspace(input.dossierId);
      if (!existing) return null;
      const nextStatus = existing.status === "archived" ? "archived" : "draft";
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: nextStatus,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: nextStatus,
          officialApproval: existing.officialApproval ?? null,
        }),
        lockedBy: undefined,
        lockedAt: undefined,
        updatedBy: input.unlockedBy,
        updatedAt: isoNow(),
      });
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      await col.updateOne(
        { "workspace.dossierId": input.dossierId },
        { $set: { workspace: clone(next), updatedAt: new Date(next.updatedAt) } },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:unlocked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "unlocked",
        byUserId: input.unlockedBy,
        note: sanitizeOptionalString(input.note),
        at: next.updatedAt,
      });
      return next;
    },

    async approveDossierStudioWorkspaceOfficial(input) {
      const existing = await this.getDossierStudioWorkspace(input.dossierId);
      if (!existing) return null;
      if (existing.status === "draft" || existing.status === "archived") {
        return null;
      }
      const officialApproval = buildOfficialApproval(
        input.authority,
        input.approvedBy,
        input.note,
      );
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: existing.status,
          officialApproval,
        }),
        officialApproval,
        updatedBy: input.approvedBy,
        updatedAt: officialApproval.approvedAt,
      });
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      await col.updateOne(
        { "workspace.dossierId": input.dossierId },
        { $set: { workspace: clone(next), updatedAt: new Date(next.updatedAt) } },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:official-approved:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "official_approved",
        byUserId: input.approvedBy,
        note: sanitizeOptionalString(input.note) ?? undefined,
        authority: input.authority,
        at: next.updatedAt,
      });
      return next;
    },

    async revokeDossierStudioWorkspaceOfficial(dossierId, reviewedBy, note) {
      const existing = await this.getDossierStudioWorkspace(dossierId);
      if (!existing) return null;
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: existing.status,
          officialApproval: null,
        }),
        officialApproval: null,
        updatedBy: reviewedBy,
        updatedAt: isoNow(),
      });
      const col = await coreCol<DossierStudioWorkspaceDoc>(WORKSPACES_COLLECTION);
      await col.updateOne(
        { "workspace.dossierId": dossierId },
        { $set: { workspace: clone(next), updatedAt: new Date(next.updatedAt) } },
      );
      await appendAuditEventMongo({
        id: auditIdFor(`${next.id}:official-revoked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "official_revoked",
        byUserId: reviewedBy,
        note: sanitizeOptionalString(note) ?? undefined,
        authority: existing.officialApproval?.authority,
        at: next.updatedAt,
      });
      return next;
    },

    async listDossierStudioWorkspacesForDossier(dossierId) {
      const workspace = await this.getDossierStudioWorkspace(dossierId);
      return workspace ? [workspace] : [];
    },

    async listDossierStudioWorkspaceAuditEvents(dossierId) {
      await ensureMongoIndexes();
      const col = await coreCol<DossierStudioWorkspaceAuditEventDoc>(AUDIT_COLLECTION);
      const docs = await col
        .find({ "event.dossierId": dossierId })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((doc) => clone(doc.event));
    },

    async appendDossierStudioWorkspaceAuditEvent(event) {
      await appendAuditEventMongo(DossierStudioWorkspaceAuditEventSchema.parse(event));
    },
  };
}

export function createInMemoryDossierStudioWorkspaceRepo(seed?: {
  workspaces?: DossierStudioWorkspace[];
  auditEvents?: DossierStudioWorkspaceAuditEvent[];
}): DossierStudioWorkspaceRepo {
  const workspaces = new Map<string, DossierStudioWorkspace>();
  const auditEvents = new Map<string, DossierStudioWorkspaceAuditEvent>();

  for (const workspace of seed?.workspaces ?? []) {
    const parsed = DossierStudioWorkspaceSchema.parse(workspace);
    workspaces.set(parsed.dossierId, clone(parsed));
  }
  for (const event of seed?.auditEvents ?? []) {
    const parsed = DossierStudioWorkspaceAuditEventSchema.parse(event);
    auditEvents.set(parsed.id, clone(parsed));
  }

  return {
    async createOrGetDossierStudioWorkspace(input) {
      const existing = workspaces.get(input.dossierId);
      if (existing) return clone(existing);
      const workspace = buildWorkspace(input);
      workspaces.set(workspace.dossierId, clone(workspace));
      auditEvents.set(
        auditIdFor(`${workspace.id}:created:${workspace.createdAt}`),
        {
          id: auditIdFor(`${workspace.id}:created:${workspace.createdAt}`),
          workspaceId: workspace.id,
          dossierId: workspace.dossierId,
          action: "created",
          byUserId: input.createdBy,
          at: workspace.createdAt,
        },
      );
      return clone(workspace);
    },

    async getDossierStudioWorkspace(dossierId) {
      const workspace = workspaces.get(dossierId);
      return workspace ? clone(workspace) : null;
    },

    async updateDossierStudioWorkspace(input) {
      const existing = workspaces.get(input.dossierId);
      if (!existing) throw new Error("studio_workspace_not_found");
      if (
        existing.status === "locked" &&
        existing.lockedBy &&
        existing.lockedBy !== input.updatedBy
      ) {
        throw new Error("studio_workspace_locked");
      }
      const next = applyPatch(existing, input.patch, input.updatedBy);
      workspaces.set(input.dossierId, clone(next));
      const action =
        input.patch.status && input.patch.status !== existing.status
          ? "status_changed"
          : "updated";
      auditEvents.set(auditIdFor(`${next.id}:${action}:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:${action}:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action,
        byUserId: input.updatedBy,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async archiveDossierStudioWorkspace(input) {
      const existing = workspaces.get(input.dossierId);
      if (!existing) return null;
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: "archived",
        visibilityState: resolveWorkspacePublicationVisibility({
          status: "archived",
          officialApproval: existing.officialApproval ?? null,
        }),
        updatedBy: input.archivedBy,
        updatedAt: isoNow(),
      });
      workspaces.set(input.dossierId, clone(next));
      auditEvents.set(auditIdFor(`${next.id}:archived:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:archived:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "archived",
        byUserId: input.archivedBy,
        note: sanitizeOptionalString(input.note) ?? undefined,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async lockDossierStudioWorkspace(input) {
      const existing = workspaces.get(input.dossierId);
      if (!existing) return null;
      const now = isoNow();
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: "locked",
        visibilityState: resolveWorkspacePublicationVisibility({
          status: "locked",
          officialApproval: existing.officialApproval ?? null,
        }),
        lockedBy: input.lockedBy,
        lockedAt: now,
        updatedBy: input.lockedBy,
        updatedAt: now,
      });
      workspaces.set(input.dossierId, clone(next));
      auditEvents.set(auditIdFor(`${next.id}:locked:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:locked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "locked",
        byUserId: input.lockedBy,
        note: sanitizeOptionalString(input.note) ?? undefined,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async unlockDossierStudioWorkspace(input) {
      const existing = workspaces.get(input.dossierId);
      if (!existing) return null;
      const nextStatus = existing.status === "archived" ? "archived" : "draft";
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        status: nextStatus,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: nextStatus,
          officialApproval: existing.officialApproval ?? null,
        }),
        lockedBy: undefined,
        lockedAt: undefined,
        updatedBy: input.unlockedBy,
        updatedAt: isoNow(),
      });
      workspaces.set(input.dossierId, clone(next));
      auditEvents.set(auditIdFor(`${next.id}:unlocked:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:unlocked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "unlocked",
        byUserId: input.unlockedBy,
        note: sanitizeOptionalString(input.note) ?? undefined,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async approveDossierStudioWorkspaceOfficial(input) {
      const existing = workspaces.get(input.dossierId);
      if (!existing) return null;
      if (existing.status === "draft" || existing.status === "archived") {
        return null;
      }
      const officialApproval = buildOfficialApproval(
        input.authority,
        input.approvedBy,
        input.note,
      );
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: existing.status,
          officialApproval,
        }),
        officialApproval,
        updatedBy: input.approvedBy,
        updatedAt: officialApproval.approvedAt,
      });
      workspaces.set(input.dossierId, clone(next));
      auditEvents.set(auditIdFor(`${next.id}:official-approved:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:official-approved:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "official_approved",
        byUserId: input.approvedBy,
        note: sanitizeOptionalString(input.note) ?? undefined,
        authority: input.authority,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async revokeDossierStudioWorkspaceOfficial(dossierId, reviewedBy, note) {
      const existing = workspaces.get(dossierId);
      if (!existing) return null;
      const next = DossierStudioWorkspaceSchema.parse({
        ...existing,
        visibilityState: resolveWorkspacePublicationVisibility({
          status: existing.status,
          officialApproval: null,
        }),
        officialApproval: null,
        updatedBy: reviewedBy,
        updatedAt: isoNow(),
      });
      workspaces.set(dossierId, clone(next));
      auditEvents.set(auditIdFor(`${next.id}:official-revoked:${next.updatedAt}`), {
        id: auditIdFor(`${next.id}:official-revoked:${next.updatedAt}`),
        workspaceId: next.id,
        dossierId: next.dossierId,
        action: "official_revoked",
        byUserId: reviewedBy,
        note: sanitizeOptionalString(note) ?? undefined,
        authority: existing.officialApproval?.authority,
        at: next.updatedAt,
      });
      return clone(next);
    },

    async listDossierStudioWorkspacesForDossier(dossierId) {
      const workspace = workspaces.get(dossierId);
      return workspace ? [clone(workspace)] : [];
    },

    async listDossierStudioWorkspaceAuditEvents(dossierId) {
      return Array.from(auditEvents.values())
        .filter((event) => event.dossierId === dossierId)
        .map((event) => clone(event))
        .sort((left, right) => String(right.at).localeCompare(String(left.at)));
    },

    async appendDossierStudioWorkspaceAuditEvent(event) {
      const parsed = DossierStudioWorkspaceAuditEventSchema.parse(event);
      auditEvents.set(parsed.id, clone(parsed));
    },
  };
}

export function getDossierStudioWorkspaceRepo(): DossierStudioWorkspaceRepo {
  if (process.env.VITEST) {
    if (!repoSingleton) {
      repoSingleton = createInMemoryDossierStudioWorkspaceRepo();
    }
    return repoSingleton;
  }
  if (!repoSingleton) {
    repoSingleton = createMongoDossierStudioWorkspaceRepo();
  }
  return repoSingleton;
}

export function setDossierStudioWorkspaceRepoForTests(
  repo: DossierStudioWorkspaceRepo | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}
