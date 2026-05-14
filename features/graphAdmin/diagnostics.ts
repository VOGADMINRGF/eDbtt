import { getGraphDriver } from "@core/graph/driver";
import { evidenceItemsCol, evidenceLinksCol } from "@core/evidence/db";

export type GraphHealthReason =
  | "missing_env"
  | "db_unreachable"
  | "adapter_not_configured"
  | "graph_service_disabled"
  | "auth_failed"
  | "schema_missing"
  | "read_failed"
  | "unknown";

export type GraphHealthStatus = "ok" | "degraded" | "unavailable";
export type GraphHealthSource = "real_graph" | "mock" | "seed" | "disabled";
export type GraphWriteMode = "enabled" | "disabled" | "readonly";

export type GraphHealthMetrics = {
  nodes: number | null;
  edges: number | null;
  orphans: number | null;
  duplicates: number | null;
  brokenPaths: number | null;
  unlinkedEvidence: number | null;
};

export type GraphHealthSnapshot = {
  status: GraphHealthStatus;
  reason: GraphHealthReason | null;
  source: GraphHealthSource;
  isMock: boolean;
  read: {
    ok: boolean;
    error: string | null;
  };
  write: {
    ok: boolean;
    mode: GraphWriteMode;
    error: string | null;
  };
  metrics: GraphHealthMetrics;
  meta: {
    generatedAt: string | null;
    windowDays: number | null;
    lastSync: string | null;
    adapter: string | null;
  };
  nextActions: string[];
  dependentFlows: string[];
};

const UNAVAILABLE_DEPENDENT_FLOWS = [
  "Feed Mapping eingeschränkt",
  "Dedupe eingeschränkt",
  "Topic Matching eingeschränkt",
  "Graph Review eingeschränkt",
] as const;

function hasGraphEnv() {
  return Boolean(process.env.NEO4J_URL && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD);
}

function classifyGraphReason(errorMessage: string | null | undefined): GraphHealthReason {
  const message = String(errorMessage ?? "").toLowerCase();
  if (!message) return "unknown";
  if (/auth|unauthorized|forbidden|security\.unauthorized/i.test(message)) return "auth_failed";
  if (
    /econnrefused|serviceunavailable|failed to connect|connection.*refused|enotfound|getaddrinfo|socket closed|connect/i.test(
      message,
    )
  ) {
    return "db_unreachable";
  }
  if (/label|unknown.*label|schema|constraint|index/i.test(message)) return "schema_missing";
  if (/disabled/i.test(message)) return "graph_service_disabled";
  return "read_failed";
}

export function nextActionsForGraphReason(reason: GraphHealthReason | null): string[] {
  if (reason === "missing_env") {
    return ["NEO4J_URL prüfen", "NEO4J_USER prüfen", "NEO4J_PASSWORD prüfen", "Server neu starten"];
  }
  if (reason === "db_unreachable") {
    return ["Graph-Datenbank starten", "Netzwerk/Host prüfen", "Bolt-URL und Port prüfen", "Serverlogs prüfen"];
  }
  if (reason === "auth_failed") {
    return ["Graph-Zugangsdaten prüfen", "Benutzerrechte im Graph prüfen", "Serverlogs prüfen"];
  }
  if (reason === "schema_missing") {
    return ["Graph-Seed/Schema laden", "Labels und Constraints prüfen", "Diagnose erneut ausführen"];
  }
  if (reason === "adapter_not_configured") {
    return ["Graph-Adapter initialisieren", "Driver-Import und ENV prüfen"];
  }
  if (reason === "graph_service_disabled") {
    return ["Graph-Service aktivieren", "Deployment-Konfiguration prüfen"];
  }
  if (reason === "read_failed") {
    return ["Admin API /api/admin/graph/health prüfen", "Query-/Schema-Kompatibilität prüfen", "Serverlogs prüfen"];
  }
  return ["Serverlogs prüfen", "Diagnose erneut ausführen"];
}

async function countUnlinkedEvidence() {
  const items = await evidenceItemsCol();
  const result = await items
    .aggregate([
      {
        $lookup: {
          from: "evidence_links",
          localField: "_id",
          foreignField: "toEvidenceId",
          as: "links",
        },
      },
      { $match: { links: { $size: 0 } } },
      { $count: "count" },
    ])
    .toArray();

  return result[0]?.count ?? 0;
}

async function lastEvidenceLinkAt() {
  const links = await evidenceLinksCol();
  const latest = await links.find({}).sort({ createdAt: -1 }).limit(1).toArray();
  const entry = latest[0] as { createdAt?: Date | string } | undefined;
  return entry?.createdAt ? new Date(entry.createdAt).toISOString() : null;
}

export async function collectGraphHealthSnapshot(windowDays: number): Promise<GraphHealthSnapshot> {
  const generatedAt = new Date().toISOString();
  if (!hasGraphEnv()) {
    return {
      status: "unavailable",
      reason: "missing_env",
      source: "disabled",
      isMock: false,
      read: { ok: false, error: "Graph-Umgebungsvariablen fehlen." },
      write: { ok: false, mode: "disabled", error: "Graph-Verbindung ist nicht konfiguriert." },
      metrics: {
        nodes: null,
        edges: null,
        orphans: null,
        duplicates: null,
        brokenPaths: null,
        unlinkedEvidence: null,
      },
      meta: {
        generatedAt,
        windowDays,
        lastSync: null,
        adapter: "neo4j-driver",
      },
      nextActions: nextActionsForGraphReason("missing_env"),
      dependentFlows: [...UNAVAILABLE_DEPENDENT_FLOWS],
    };
  }

  const driver = getGraphDriver();
  if (!driver) {
    return {
      status: "unavailable",
      reason: "adapter_not_configured",
      source: "disabled",
      isMock: false,
      read: { ok: false, error: "Graph-Driver konnte nicht initialisiert werden." },
      write: { ok: false, mode: "disabled", error: "Graph-Driver fehlt." },
      metrics: {
        nodes: null,
        edges: null,
        orphans: null,
        duplicates: null,
        brokenPaths: null,
        unlinkedEvidence: null,
      },
      meta: {
        generatedAt,
        windowDays,
        lastSync: null,
        adapter: "neo4j-driver",
      },
      nextActions: nextActionsForGraphReason("adapter_not_configured"),
      dependentFlows: [...UNAVAILABLE_DEPENDENT_FLOWS],
    };
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      CALL { MATCH (n) RETURN count(n) AS nodes }
      CALL { MATCH ()-[r]->() RETURN count(r) AS edges }
      CALL { MATCH (n) WHERE size((n)--()) = 0 RETURN count(n) AS orphans }
      CALL {
        MATCH (s:Statement)
        WITH s.text AS text, count(*) AS c
        WHERE text IS NOT NULL AND c > 1
        RETURN coalesce(sum(c), 0) AS duplicates
      }
      CALL {
        MATCH (p:ResponsibilityPath)
        WHERE NOT (p)-[:HAS_STEP]->()
        RETURN count(p) AS brokenPaths
      }
      RETURN nodes, edges, orphans, duplicates, brokenPaths
      `,
    );

    const record = result.records[0];
    const unlinkedEvidence = await countUnlinkedEvidence();

    return {
      status: "ok",
      reason: null,
      source: "real_graph",
      isMock: false,
      read: { ok: true, error: null },
      write: { ok: true, mode: "enabled", error: null },
      metrics: {
        nodes: Number(record?.get("nodes") ?? 0),
        edges: Number(record?.get("edges") ?? 0),
        orphans: Number(record?.get("orphans") ?? 0),
        duplicates: Number(record?.get("duplicates") ?? 0),
        brokenPaths: Number(record?.get("brokenPaths") ?? 0),
        unlinkedEvidence,
      },
      meta: {
        generatedAt,
        windowDays,
        lastSync: await lastEvidenceLinkAt(),
        adapter: "neo4j-driver",
      },
      nextActions: [],
      dependentFlows: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_graph_error";
    const reason = classifyGraphReason(message);
    return {
      status: "unavailable",
      reason,
      source: "real_graph",
      isMock: false,
      read: { ok: false, error: message },
      write: { ok: false, mode: "disabled", error: "Schreibpfad ist blockiert, solange der Lesepfad fehlschlägt." },
      metrics: {
        nodes: null,
        edges: null,
        orphans: null,
        duplicates: null,
        brokenPaths: null,
        unlinkedEvidence: null,
      },
      meta: {
        generatedAt,
        windowDays,
        lastSync: null,
        adapter: "neo4j-driver",
      },
      nextActions: nextActionsForGraphReason(reason),
      dependentFlows: [...UNAVAILABLE_DEPENDENT_FLOWS],
    };
  } finally {
    await session.close();
  }
}
