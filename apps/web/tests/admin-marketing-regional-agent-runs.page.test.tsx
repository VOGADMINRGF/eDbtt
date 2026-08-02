import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RegionalAgentRunsPage from "@/app/admin/marketing/agent/runs/page";
import RegionalAgentRunDetailPage from "@/app/admin/marketing/agent/runs/[runId]/page";
import { RegionalAgentRunsEmptyState } from "@/features/marketing/registry/regionalRuns/RegionalAgentRunsEmptyState";

describe("admin regional agent run surfaces", () => {
  it("renders the German responsive list with ready, blocked and failed states", async () => {
    const html = renderToStaticMarkup(
      await RegionalAgentRunsPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Regionale Agent Runs");
    expect(html).toContain("read_only");
    expect(html).toContain("no_external_search");
    expect(html).toContain("Berlin · Bezirk Mitte");
    expect(html).toContain("Berlin · Bezirk Neukölln");
    expect(html).toContain('data-run-status="blocked"');
    expect(html).toContain('data-run-status="failed"');
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("xl:grid-cols-2");
  });

  it("renders the English list and keeps the language-aware detail link", async () => {
    const html = renderToStaticMarkup(
      await RegionalAgentRunsPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Regional agent runs");
    expect(html).toContain("Read only: no external search");
    expect(html).toContain("Suggestions");
    expect(html).toContain("?lang=en");
  });

  it("renders an honest empty state without suggesting a fallback", () => {
    const html = renderToStaticMarkup(
      <RegionalAgentRunsEmptyState
        title="Keine Regional Runs vorhanden"
        body="Keine validierten manuellen Source Packs oder Repo-Fixtures vorhanden."
      />,
    );

    expect(html).toContain("Keine Regional Runs vorhanden");
    expect(html).toContain('data-testid="regional-agent-runs-empty-state"');
    expect(html).not.toContain("Run ansehen");
  });

  it("renders provenance, four language roles, suggestions and user-safe trace in detail", async () => {
    const html = renderToStaticMarkup(
      await RegionalAgentRunDetailPage({
        params: Promise.resolve({ runId: "regional-run-berlin-neukoelln-multilingual-fixture" }),
        searchParams: Promise.resolve({ lang: "de" }),
      }),
    );

    expect(html).toContain("Vier getrennte Sprachrollen");
    expect(html).toContain("Originalsprachen");
    expect(html).toContain("Lesesprache");
    expect(html).toContain("Bedienungssprache");
    expect(html).toContain("Ausgabesprachen");
    expect(html).toContain("Herausgeber");
    expect(html).toContain("Abgerufen");
    expect(html).toContain("Provenienz");
    expect(html).toContain("Nur Vorschläge");
    expect(html).toContain("suggestion_only");
    expect(html).toContain("User-sichere Spur");
    expect(html).toContain("language-coverage-gap");
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });

  it("renders the English detail and a safe missing-run error state", async () => {
    const english = renderToStaticMarkup(
      await RegionalAgentRunDetailPage({
        params: Promise.resolve({ runId: "regional-run-berlin-mitte-2026-07-fixture" }),
        searchParams: Promise.resolve({ lang: "en" }),
      }),
    );
    expect(english).toContain("Run configuration");
    expect(english).toContain("Four separate language roles");
    expect(english).toContain("User-safe trace");

    const missing = renderToStaticMarkup(
      await RegionalAgentRunDetailPage({
        params: Promise.resolve({ runId: "missing-run" }),
        searchParams: Promise.resolve({ lang: "en" }),
      }),
    );
    expect(missing).toContain("Regional run not found");
    expect(missing).toContain("No fallback or external search was executed");
    expect(missing).toContain('data-testid="regional-agent-run-error-state"');
  });
});
