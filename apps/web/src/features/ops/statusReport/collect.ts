import {
  computeTotalsFromSections,
  deriveOverallStatusFromTotals,
  type StatusReportCheck,
  type StatusReportCheckStatus,
  type StatusReportSection,
  type StatusReportSlot,
  type StatusReportSummary,
} from "./contracts";
import type { StatusReportConfig } from "./config";
import { getThemenradarTelemetryReportShape, listThemenradarItems } from "@features/themenradar/store";

const AI_SAMPLE_TEXT =
  "In unserer Stadt soll ein autofreier Sonntag pro Monat getestet werden. Unterstützer erwarten bessere Luft, Kritiker sorgen sich um Erreichbarkeit und Umsatz.";

function nowIso() {
  return new Date().toISOString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout_${timeoutMs}ms`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "unknown_error");
}

function createCheck(
  key: string,
  label: string,
  status: StatusReportCheckStatus,
  detail: string,
  extras?: { latencyMs?: number; error?: string },
): StatusReportCheck {
  return {
    key,
    label,
    status,
    detail,
    latencyMs: extras?.latencyMs,
    error: extras?.error,
  };
}

async function checkPageRoute(
  config: StatusReportConfig,
  path: string,
  label: string,
  timeoutMs = 6000,
): Promise<StatusReportCheck> {
  const started = Date.now();
  const url = buildUrl(config.baseUrl, path);

  try {
    const response = await withTimeout(
      fetch(url, {
        method: "GET",
        cache: "no-store",
      }),
      timeoutMs,
    );

    const latencyMs = Date.now() - started;
    if (response.status >= 500) {
      return createCheck(
        `page_${path}`,
        label,
        "red",
        `Route antwortet mit HTTP ${response.status}`,
        { latencyMs },
      );
    }

    return createCheck(
      `page_${path}`,
      label,
      "green",
      `Route erreichbar (HTTP ${response.status})`,
      { latencyMs },
    );
  } catch (error) {
    return createCheck(`page_${path}`, label, "red", "Route nicht erreichbar", {
      latencyMs: Date.now() - started,
      error: toErrorMessage(error),
    });
  }
}

async function checkJsonRoute(
  config: StatusReportConfig,
  path: string,
  label: string,
  timeoutMs = 6000,
): Promise<{ check: StatusReportCheck; data?: any }> {
  const started = Date.now();
  const url = buildUrl(config.baseUrl, path);

  try {
    const response = await withTimeout(
      fetch(url, {
        method: "GET",
        cache: "no-store",
      }),
      timeoutMs,
    );

    const latencyMs = Date.now() - started;
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        check: createCheck(
          `json_${path}`,
          label,
          "red",
          `Route meldet HTTP ${response.status}`,
          {
            latencyMs,
            error: payload?.error ?? null,
          },
        ),
        data: payload,
      };
    }

    return {
      check: createCheck(
        `json_${path}`,
        label,
        "green",
        `Route liefert JSON (HTTP ${response.status})`,
        { latencyMs },
      ),
      data: payload,
    };
  } catch (error) {
    return {
      check: createCheck(`json_${path}`, label, "red", "Route nicht erreichbar", {
        latencyMs: Date.now() - started,
        error: toErrorMessage(error),
      }),
      data: null,
    };
  }
}

async function postJsonRoute(
  config: StatusReportConfig,
  path: string,
  body: Record<string, unknown>,
  timeoutMs = 15000,
): Promise<{ status: number; data: any; latencyMs: number }> {
  const started = Date.now();
  const response = await withTimeout(
    fetch(buildUrl(config.baseUrl, path), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    timeoutMs,
  );
  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    data,
    latencyMs: Date.now() - started,
  };
}

function validateAnalyzeSuccessPayload(payload: any): { ok: boolean; detail: string } {
  if (!payload || payload.ok !== true) {
    return { ok: false, detail: `Antwort ohne ok=true (errorCode=${payload?.errorCode ?? "unknown"})` };
  }

  if (!payload.result || typeof payload.result !== "object") {
    return { ok: false, detail: "Antwort ohne result-Objekt" };
  }

  if (!Array.isArray(payload.result.claims)) {
    return { ok: false, detail: "Antwort ohne result.claims" };
  }

  if (!Array.isArray(payload.result.questions)) {
    return { ok: false, detail: "Antwort ohne result.questions" };
  }

  if (!Array.isArray(payload.result.knots)) {
    return { ok: false, detail: "Antwort ohne result.knots" };
  }

  if (payload.fallback === true) {
    return { ok: true, detail: "degraded_fallback" };
  }

  return { ok: true, detail: "ok" };
}

export async function runAiRouteSmokes(config: StatusReportConfig): Promise<StatusReportCheck[]> {
  if (!config.includeAiSmokes) {
    return [
      createCheck(
        "ai_smokes_disabled",
        "AI-Routen-Smoketests",
        "grey",
        "AI-Smokes per ENV deaktiviert",
      ),
    ];
  }

  const checks: StatusReportCheck[] = [];

  try {
    const ping = await postJsonRoute(config, "/api/contributions/analyze", { test: "ping", locale: "de" }, 10_000);
    const pingOk = ping.status === 200 && ping.data?.ok === true && ping.data?.result?.ping === "pong";
    checks.push(
      createCheck(
        "ai_contributions_ping",
        "/api/contributions/analyze (ping)",
        pingOk ? "green" : "red",
        pingOk
          ? "Ping erfolgreich"
          : `Ping fehlgeschlagen (HTTP ${ping.status}, error=${ping.data?.errorCode ?? "unknown"})`,
        { latencyMs: ping.latencyMs },
      ),
    );
  } catch (error) {
    checks.push(
      createCheck("ai_contributions_ping", "/api/contributions/analyze (ping)", "red", "Ping-Request fehlgeschlagen", {
        error: toErrorMessage(error),
      }),
    );
  }

  try {
    const pingCreate = await postJsonRoute(config, "/api/create/analyze", { test: "ping", locale: "de" }, 10_000);
    const pingOk =
      pingCreate.status === 200 &&
      pingCreate.data?.ok === true &&
      pingCreate.data?.result?.ping === "pong";

    checks.push(
      createCheck(
        "ai_create_ping",
        "/api/create/analyze (ping)",
        pingOk ? "green" : "red",
        pingOk
          ? "Ping erfolgreich"
          : `Ping fehlgeschlagen (HTTP ${pingCreate.status}, error=${pingCreate.data?.errorCode ?? "unknown"})`,
        { latencyMs: pingCreate.latencyMs },
      ),
    );
  } catch (error) {
    checks.push(
      createCheck("ai_create_ping", "/api/create/analyze (ping)", "red", "Ping-Request fehlgeschlagen", {
        error: toErrorMessage(error),
      }),
    );
  }

  try {
    const full = await postJsonRoute(
      config,
      "/api/contributions/analyze",
      {
        text: AI_SAMPLE_TEXT,
        locale: "de",
        maxClaims: 1,
      },
      30_000,
    );

    const validated = validateAnalyzeSuccessPayload(full.data);
    if (full.status !== 200 || !validated.ok) {
      checks.push(
        createCheck(
          "ai_contributions_full",
          "/api/contributions/analyze (standard)",
          "red",
          validated.ok
            ? `Standardlauf fehlgeschlagen (HTTP ${full.status})`
            : `Schema-/Envelope-Drift: ${validated.detail}`,
          {
            latencyMs: full.latencyMs,
            error: full.data?.errorCode ?? full.data?.message ?? null,
          },
        ),
      );
    } else if (validated.detail === "degraded_fallback") {
      checks.push(
        createCheck(
          "ai_contributions_full",
          "/api/contributions/analyze (standard)",
          "yellow",
          "Standardlauf nur im degraded/fallback-Zustand erfolgreich",
          { latencyMs: full.latencyMs },
        ),
      );
    } else {
      checks.push(
        createCheck(
          "ai_contributions_full",
          "/api/contributions/analyze (standard)",
          "green",
          "Standardlauf erfolgreich",
          { latencyMs: full.latencyMs },
        ),
      );
    }
  } catch (error) {
    checks.push(
      createCheck(
        "ai_contributions_full",
        "/api/contributions/analyze (standard)",
        "red",
        "Standardlauf fehlgeschlagen",
        {
          error: toErrorMessage(error),
        },
      ),
    );
  }

  return checks;
}

export async function collectStatusReportSummary(params: {
  config: StatusReportConfig;
  slot: StatusReportSlot;
}): Promise<StatusReportSummary> {
  const { config, slot } = params;

  const platformHealth = await checkJsonRoute(
    config,
    "/api/health/system",
    "Plattform-Systemmatrix",
    8_000,
  );

  const platformChecks: StatusReportCheck[] = [
    platformHealth.check,
    await checkPageRoute(config, "/", "Startseite", 6_000),
    await checkPageRoute(config, "/admin/themenradar", "Admin / Themenradar", 6_000),
  ];

  if (platformHealth.data && platformHealth.data.ok === false) {
    platformChecks[0] = createCheck(
      platformChecks[0].key,
      platformChecks[0].label,
      "red",
      "Systemmatrix meldet degradierte oder fehlerhafte Services",
      {
        latencyMs: platformChecks[0].latencyMs,
      },
    );
  }

  const aiChecks = await runAiRouteSmokes(config);

  const themenradarChecks: StatusReportCheck[] = [];
  try {
    const [items, telemetry] = await Promise.all([
      listThemenradarItems({ status: "all", sourceType: "all", limit: 10 }),
      getThemenradarTelemetryReportShape({
        status: "all",
        sourceType: "all",
        limit: 200,
      }),
    ]);

    themenradarChecks.push(
      createCheck(
        "themenradar_store",
        "Themenradar Persistenz",
        "green",
        `Store erreichbar (Items=${items.length}, Leads=${telemetry.totals.leads})`,
      ),
    );
    themenradarChecks.push(
      createCheck(
        "themenradar_report",
        "Themenradar Reportshape",
        "green",
        `Reportshape erzeugt (Campaigns=${telemetry.byCampaign.length})`,
      ),
    );
  } catch (error) {
    themenradarChecks.push(
      createCheck(
        "themenradar_store",
        "Themenradar Persistenz",
        "red",
        "Themenradar-Store/Report nicht verfügbar",
        { error: toErrorMessage(error) },
      ),
    );
  }

  const orderPricingChecks = await Promise.all([
    checkPageRoute(config, "/pricing", "Pricing-Hauptseite", 6_000),
    checkPageRoute(config, "/order", "Order-Hauptpfad", 6_000),
    checkPageRoute(config, "/pricing/institutionen", "Pricing Institutionen", 6_000),
  ]);

  const sections: StatusReportSection[] = [
    {
      key: "platform",
      label: "Plattform-Kernstatus",
      checks: platformChecks,
    },
    {
      key: "ai",
      label: "AI-Routen-Smokechecks",
      checks: aiChecks,
    },
    {
      key: "themenradar",
      label: "Themenradar / Admin",
      checks: themenradarChecks,
    },
    {
      key: "order_pricing",
      label: "Order / Pricing",
      checks: orderPricingChecks,
    },
  ];

  const totals = computeTotalsFromSections(sections);
  const overallStatus = deriveOverallStatusFromTotals(totals);

  const problemChecks = sections
    .flatMap((section) => section.checks)
    .filter((check) => check.status === "red" || check.status === "yellow");

  const summaryPoints: string[] = [];
  summaryPoints.push(
    `Checks: ${totals.green} grün, ${totals.yellow} gelb, ${totals.red} rot, ${totals.grey} grau.`,
  );

  if (problemChecks.length === 0) {
    summaryPoints.push("Kein kritischer Fehler erkannt.");
  } else {
    for (const item of problemChecks.slice(0, 4)) {
      summaryPoints.push(`${item.label}: ${item.detail}`);
    }
  }

  return {
    generatedAt: nowIso(),
    timezone: config.timezone,
    slot,
    overallStatus,
    summaryPoints: summaryPoints.slice(0, 5),
    sections,
    totals,
  };
}
