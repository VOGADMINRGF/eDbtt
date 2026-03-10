export type DossierEntry = "public" | "demo" | "internal";
export type DossierAccess = "public" | "demo" | "internal";
export type DossierMode = "read" | "work" | "admin";
export type DossierPersona =
  | "citizen"
  | "journalist"
  | "administration"
  | "organization"
  | "research";
export type DossierRole =
  | "citizen"
  | "organization"
  | "administration"
  | "journalist"
  | "research"
  | "admin"
  | "staff";
export type DossierDataState = "loading" | "live" | "demo" | "fallback";

export const MODE_LABELS: Record<DossierMode, string> = {
  read: "Lesen",
  work: "Mitwirken",
  admin: "Verwalten",
};

export const ROLE_LABELS: Record<DossierRole, string> = {
  citizen: "Bürgersicht",
  organization: "Organisation",
  administration: "Verwaltung",
  journalist: "Journalismus",
  research: "Forschung",
  admin: "Administration",
  staff: "Redaktion/Staff",
};

type ResolveContextInput = {
  entry: DossierEntry;
  sessionOk: boolean;
  sessionRoles?: string[] | null;
  actorRole?: string | null;
  fallbackRole?: DossierRole | null;
  personaHint?: DossierPersona | null;
  modeHint?: DossierMode | null;
};

export type DossierContext = {
  entry: DossierEntry;
  access: DossierAccess;
  viewerRole: DossierRole;
  persona: DossierPersona;
  allowedModes: DossierMode[];
  defaultMode: DossierMode;
};

export function resolveViewerRole({
  sessionRoles,
  actorRole,
  fallbackRole,
}: {
  sessionRoles?: string[] | null;
  actorRole?: string | null;
  fallbackRole?: DossierRole | null;
}): DossierRole {
  if (sessionRoles?.includes("staff")) return "staff";
  if (sessionRoles?.includes("administration")) return "administration";
  if (sessionRoles?.includes("journalist")) return "journalist";
  if (sessionRoles?.includes("organization")) return "organization";
  if (sessionRoles?.includes("research")) return "research";
  if (actorRole === "admin") return "admin";
  if (actorRole === "editor") return "journalist";
  return fallbackRole ?? "citizen";
}

export function resolvePersona(viewerRole: DossierRole): DossierPersona {
  if (viewerRole === "journalist") return "journalist";
  if (viewerRole === "administration" || viewerRole === "admin" || viewerRole === "staff") {
    return "administration";
  }
  if (viewerRole === "organization") return "organization";
  if (viewerRole === "research") return "research";
  return "citizen";
}

export function resolveDossierContext({
  entry,
  sessionOk,
  sessionRoles,
  actorRole,
  fallbackRole,
  personaHint,
  modeHint,
}: ResolveContextInput): DossierContext {
  const viewerRole = resolveViewerRole({ sessionRoles, actorRole, fallbackRole });
  const access: DossierAccess = sessionOk ? "internal" : entry;
  const persona = personaHint ?? resolvePersona(viewerRole);

  const isAdmin =
    viewerRole === "admin" || viewerRole === "staff" || viewerRole === "administration";
  const isWorkRole =
    viewerRole === "journalist" ||
    viewerRole === "organization" ||
    viewerRole === "research" ||
    isAdmin;

  const allowedModes: DossierMode[] =
    access === "internal"
      ? isAdmin
        ? ["read", "work", "admin"]
        : ["read", "work"]
      : ["read"];

  let defaultMode: DossierMode = "read";
  if (access === "internal") {
    if (isAdmin) defaultMode = "admin";
    else if (isWorkRole) defaultMode = "work";
  }

  if (modeHint && allowedModes.includes(modeHint)) {
    defaultMode = modeHint;
  }

  return {
    entry,
    access,
    viewerRole,
    persona,
    allowedModes,
    defaultMode,
  };
}
