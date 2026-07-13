import { PRICING_PATH_CONTRACT } from "../pricing/domain/content.de";

export type RouteInventoryLifecycle =
  | "canonical"
  | "legacy_fallback"
  | "redirect_alias"
  | "public_alias"
  | "admin_operator";

export type RouteInventoryAudience = "public" | "auth" | "admin";

export type RouteInventoryEntry = {
  id:
    | "home"
    | "start"
    | "create"
    | "register"
    | "login"
    | "pricing"
    | "pricing_institutionen"
    | "order"
    | "vormerken"
    | "mitglied_werden"
    | "beitritt"
    | "mitglied_antrag"
    | "beteiligung"
    | "dossier"
    | "dossier_studio"
    | "factcheck"
    | "runden"
    | "anlassraum"
    | "admin"
    | "admin_review"
    | "admin_editorial_queue"
    | "admin_feeds"
    | "admin_pricing_orders";
  path: string;
  canonicalPath: string;
  audience: RouteInventoryAudience;
  lifecycle: RouteInventoryLifecycle;
  note: string;
};

export const ROUTE_ALIAS_CANONICAL_PATHS = {
  [PRICING_PATH_CONTRACT.legacyFallbackPath]: PRICING_PATH_CONTRACT.primaryOrderPath,
  "/mitglied-werden": "/pricing",
  "/beitritt": "/pricing",
  "/anlassraum": "/runden",
} as const satisfies Record<string, string>;

export const PRODUCT_SURFACE_ROUTE_IDS = {
  "/pricing": "pricing",
  "/pricing/institutionen": "pricing_institutionen",
  [PRICING_PATH_CONTRACT.primaryOrderPath]: "order",
  [PRICING_PATH_CONTRACT.legacyFallbackPath]: "vormerken",
} as const;

export type ProductSurfaceRouteId =
  (typeof PRODUCT_SURFACE_ROUTE_IDS)[keyof typeof PRODUCT_SURFACE_ROUTE_IDS];

const EXACT_ROUTE_INVENTORY: readonly RouteInventoryEntry[] = [
  {
    id: "home",
    path: "/",
    canonicalPath: "/",
    audience: "public",
    lifecycle: "canonical",
    note: "Öffentliche Landing mit produktivem Einstieg.",
  },
  {
    id: "start",
    path: "/start",
    canonicalPath: "/start",
    audience: "public",
    lifecycle: "canonical",
    note: "Öffentlicher Startpfad für Einstieg und direkte Beteiligung.",
  },
  {
    id: "create",
    path: "/create",
    canonicalPath: "/create",
    audience: "public",
    lifecycle: "canonical",
    note: "Kanonischer Intake für Anliegen, Beiträge und Review-first Handoffs.",
  },
  {
    id: "register",
    path: "/register",
    canonicalPath: "/register",
    audience: "auth",
    lifecycle: "canonical",
    note: "Direkter Account-Start.",
  },
  {
    id: "login",
    path: "/login",
    canonicalPath: "/login",
    audience: "auth",
    lifecycle: "canonical",
    note: "Direkter Login-Pfad.",
  },
  {
    id: "pricing",
    path: "/pricing",
    canonicalPath: "/pricing",
    audience: "public",
    lifecycle: "canonical",
    note: "Kanonische Preisübersicht.",
  },
  {
    id: "pricing_institutionen",
    path: "/pricing/institutionen",
    canonicalPath: "/pricing/institutionen",
    audience: "public",
    lifecycle: "canonical",
    note: "Kanonische institutionelle Preis- und Auswahlfläche.",
  },
  {
    id: "order",
    path: PRICING_PATH_CONTRACT.primaryOrderPath,
    canonicalPath: PRICING_PATH_CONTRACT.primaryOrderPath,
    audience: "public",
    lifecycle: "canonical",
    note: "Kanonischer direkter Paket- und Startpfad.",
  },
  {
    id: "vormerken",
    path: PRICING_PATH_CONTRACT.legacyFallbackPath,
    canonicalPath: PRICING_PATH_CONTRACT.primaryOrderPath,
    audience: "public",
    lifecycle: "legacy_fallback",
    note: "Erreichbarer Legacy-/Fallback-/Info-Pfad, nicht Primärfunnel.",
  },
  {
    id: "mitglied_werden",
    path: "/mitglied-werden",
    canonicalPath: "/pricing",
    audience: "public",
    lifecycle: "redirect_alias",
    note: "Legacy-Alias zum kanonischen Pricing-Pfad.",
  },
  {
    id: "beitritt",
    path: "/beitritt",
    canonicalPath: "/pricing",
    audience: "public",
    lifecycle: "redirect_alias",
    note: "Legacy-Alias zum kanonischen Pricing-Pfad.",
  },
  {
    id: "mitglied_antrag",
    path: "/mitglied-antrag",
    canonicalPath: "/mitglied-antrag",
    audience: "public",
    lifecycle: "canonical",
    note: "Aktiver Mitgliedschaftsantrag, getrennt vom Paketpfad.",
  },
  {
    id: "beteiligung",
    path: "/beteiligung",
    canonicalPath: "/beteiligung",
    audience: "public",
    lifecycle: "canonical",
    note: "Öffentliche read-only Beteiligungsflächen.",
  },
  {
    id: "dossier",
    path: "/dossier",
    canonicalPath: "/dossier",
    audience: "public",
    lifecycle: "canonical",
    note: "Öffentliche Dossier-Übersicht.",
  },
  {
    id: "dossier_studio",
    path: "/dossier/[id]/studio",
    canonicalPath: "/dossier/[id]/studio",
    audience: "public",
    lifecycle: "canonical",
    note: "Studio-Arbeitsfläche mit Review-first Guardrails.",
  },
  {
    id: "factcheck",
    path: "/factcheck",
    canonicalPath: "/factcheck",
    audience: "public",
    lifecycle: "canonical",
    note: "Öffentlicher Faktencheck-Einstieg.",
  },
  {
    id: "runden",
    path: "/runden",
    canonicalPath: "/runden",
    audience: "public",
    lifecycle: "canonical",
    note: "Kanonische Anlassraum-Übersicht.",
  },
  {
    id: "anlassraum",
    path: "/anlassraum",
    canonicalPath: "/runden",
    audience: "public",
    lifecycle: "public_alias",
    note: "Öffentlicher Alias zur kanonischen /runden-Fläche.",
  },
  {
    id: "admin",
    path: "/admin",
    canonicalPath: "/admin",
    audience: "admin",
    lifecycle: "admin_operator",
    note: "Operator-Konsole, kein Public Funnel.",
  },
  {
    id: "admin_review",
    path: "/admin/review",
    canonicalPath: "/admin/review",
    audience: "admin",
    lifecycle: "admin_operator",
    note: "Zentrale Review- und Operator-Fläche.",
  },
  {
    id: "admin_editorial_queue",
    path: "/admin/editorial/queue",
    canonicalPath: "/admin/editorial/queue",
    audience: "admin",
    lifecycle: "admin_operator",
    note: "Redaktionelle Review-Queue.",
  },
  {
    id: "admin_feeds",
    path: "/admin/feeds",
    canonicalPath: "/admin/feeds",
    audience: "admin",
    lifecycle: "admin_operator",
    note: "Feed- und Intake-Steuerung für Operatoren.",
  },
  {
    id: "admin_pricing_orders",
    path: "/admin/pricing/orders",
    canonicalPath: "/admin/pricing/orders",
    audience: "admin",
    lifecycle: "admin_operator",
    note: "Operator-Fläche für Pricing- und Order-Vorgänge.",
  },
] as const;

function normalizeRoutePathname(pathname: unknown): string | null {
  if (typeof pathname !== "string") return null;
  const trimmed = pathname.trim();
  if (!trimmed.startsWith("/")) return null;
  const [rawPathname] = trimmed.split("?");
  const withoutHash = rawPathname?.split("#")[0] ?? "";
  if (!withoutHash) return null;
  if (withoutHash.length > 1 && withoutHash.endsWith("/")) {
    return withoutHash.slice(0, -1);
  }
  return withoutHash;
}

export function resolveCanonicalRoutePath(pathname: unknown): string | null {
  const normalized = normalizeRoutePathname(pathname);
  if (!normalized) return null;
  return ROUTE_ALIAS_CANONICAL_PATHS[normalized] ?? normalized;
}

export function resolveRouteInventoryEntry(pathname: unknown): RouteInventoryEntry | null {
  const normalized = normalizeRoutePathname(pathname);
  if (!normalized) return null;

  const exact = EXACT_ROUTE_INVENTORY.find((entry) => entry.path === normalized);
  if (exact) return exact;

  if (normalized.startsWith("/dossier/") && normalized.endsWith("/studio")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "dossier_studio") ?? null;
  }
  if (normalized.startsWith("/dossier/")) {
    return {
      id: "dossier",
      path: "/dossier/[id]",
      canonicalPath: "/dossier/[id]",
      audience: "public",
      lifecycle: "canonical",
      note: "Öffentliche Dossier-Detailfläche.",
    };
  }
  if (normalized.startsWith("/beteiligung/")) {
    return {
      id: "beteiligung",
      path: "/beteiligung/[slug]",
      canonicalPath: "/beteiligung/[slug]",
      audience: "public",
      lifecycle: "canonical",
      note: "Öffentliche read-only Beteiligungsdetailfläche.",
    };
  }
  if (normalized.startsWith("/factcheck/")) {
    return {
      id: "factcheck",
      path: "/factcheck/[id]",
      canonicalPath: "/factcheck/[id]",
      audience: "public",
      lifecycle: "canonical",
      note: "Öffentliche Faktencheck-Detailfläche.",
    };
  }
  if (normalized.startsWith("/admin/review")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "admin_review") ?? null;
  }
  if (normalized.startsWith("/admin/editorial/queue")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "admin_editorial_queue") ?? null;
  }
  if (normalized.startsWith("/admin/feeds")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "admin_feeds") ?? null;
  }
  if (normalized.startsWith("/admin/pricing/orders")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "admin_pricing_orders") ?? null;
  }
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    return EXACT_ROUTE_INVENTORY.find((entry) => entry.id === "admin") ?? null;
  }

  return null;
}

export function isLegacyRoutePath(pathname: unknown): boolean {
  const entry = resolveRouteInventoryEntry(pathname);
  return entry?.lifecycle === "legacy_fallback" || entry?.lifecycle === "redirect_alias";
}
