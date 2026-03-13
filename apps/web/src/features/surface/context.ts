export type SurfaceMode = "live" | "demo" | "preview" | "sandbox";
export type SurfaceAudience =
  | "journalist"
  | "verwaltung"
  | "buerger"
  | "stiftung"
  | "partner"
  | "none";
export type SurfaceViewerRole = "public" | "citizen" | "journalist" | "creator" | "admin";
export type SurfaceDataSource = "live" | "seed" | "preview" | "tenant";

export type SurfaceCapabilities = {
  canSubmit: boolean;
  canModerate: boolean;
  canVote: boolean;
  readOnly: boolean;
};

export type SurfaceContext = {
  mode: SurfaceMode;
  audience: SurfaceAudience;
  viewerRole: SurfaceViewerRole;
  dataSource: SurfaceDataSource;
  capabilities: SurfaceCapabilities;
};

export type SurfaceContextInput = {
  mode?: SurfaceMode;
  audience?: SurfaceAudience;
  viewerRole?: SurfaceViewerRole;
  dataSource?: SurfaceDataSource;
  capabilities?: Partial<SurfaceCapabilities>;
};

const DEFAULT_CAPABILITIES: Record<SurfaceMode, SurfaceCapabilities> = {
  live: { canSubmit: true, canModerate: false, canVote: true, readOnly: false },
  demo: { canSubmit: true, canModerate: true, canVote: true, readOnly: false },
  preview: { canSubmit: true, canModerate: false, canVote: false, readOnly: false },
  sandbox: { canSubmit: true, canModerate: true, canVote: false, readOnly: false },
};

function defaultViewerRole(mode: SurfaceMode, audience: SurfaceAudience): SurfaceViewerRole {
  if (audience === "journalist") return "journalist";
  if (audience === "verwaltung") return "admin";
  if (audience === "buerger") return "citizen";
  if (mode === "demo") return "creator";
  return "public";
}

function defaultDataSource(mode: SurfaceMode): SurfaceDataSource {
  if (mode === "demo") return "seed";
  if (mode === "preview") return "preview";
  return "live";
}

export function resolveSurfaceContext(input: SurfaceContextInput = {}): SurfaceContext {
  const mode = input.mode ?? "live";
  const audience = input.audience ?? "none";
  const viewerRole = input.viewerRole ?? defaultViewerRole(mode, audience);
  const dataSource = input.dataSource ?? defaultDataSource(mode);
  const capabilities: SurfaceCapabilities = {
    ...DEFAULT_CAPABILITIES[mode],
    ...input.capabilities,
  };
  return { mode, audience, viewerRole, dataSource, capabilities };
}

export function readStringParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}
