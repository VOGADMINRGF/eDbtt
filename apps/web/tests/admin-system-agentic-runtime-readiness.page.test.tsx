import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminSystemHubPage from "@/app/admin/system/page";

describe("admin system agentic runtime readiness page", () => {
  it("renders read-only bootstrap readiness without claiming an active runtime", async () => {
    const html = renderToStaticMarkup(await AdminSystemHubPage());

    expect(html).toContain("Registry Bootstrap Readiness");
    expect(html).toContain("Controlled Agentic Runtime");
    expect(html).toContain("ohne Runtime-Aktivierung, Parallel-Agenten oder externe Provider");
    expect(html).toContain("B2C Personal Voxy");
    expect(html).toContain("B2B Team- und Topic-Workbench");
    expect(html).toContain("B2G Jurisdiktions- und Debattenstand-Cockpit");
    expect(html).toContain("Daily Civic Impulses bleiben optional, maximal 3 pro Tag.");
    expect(html).toContain("Screenshot-Intake trennt visible_observation -&gt; user_interpretation -&gt; possible_hypothesis -&gt; source_backed_fact");
    expect(html).toContain("Keine weiteren codex_ready Controlled-Agentic-Folgepfade.");
    expect(html).not.toContain("V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01</li>");
    expect(html).not.toContain("V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01</li>");
    expect(html).not.toContain("V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01</li>");
    expect(html).not.toContain("V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01</li>");
    expect(html).toContain("Public Debattenstand bleibt frei lesbar");
    expect(html).toContain("benannter Kontakt optional");
    expect(html).toContain("Voxy Experience Shell");
    expect(html).toContain("Page, Mobile und Agentic Integration bleiben lesbar und sicher");
    expect(html).toContain("Page Shell");
    expect(html).toContain("Mobile / PWA");
    expect(html).toContain("Agentic Fassade");
    expect(html).toContain("B2C Personal Voxy bleibt consent-gated");
    expect(html).toContain("Agentic Civic E2E Pilot");
    expect(html).toContain("Review-first End-to-End Status");
    expect(html).toContain("Pilot-Task");
    expect(html).toContain(">done<");
    expect(html).toContain("Bürger / Beitrag / Beobachtung");
    expect(html).toContain("Verified Publisher Preflight");
    expect(html).toContain("Verified Publisher Preflight bleibt bewusster Publish-Pfad ohne Agent-Auto-Publish.");
    expect(html).toContain("First Login / Jurisdiktion / Response Boundaries");
    expect(html).toContain("Alle dokumentierten B2G- und Municipal-Handoff-Gates sind fuer den naechsten E2E-Pfad frei.");
    expect(html).toContain("Municipal Handoff Boundary");
    expect(html).not.toContain("Provider aktiviert");
    expect(html).not.toContain("Parallel-Agenten aktiv");
    expect(html).not.toContain("Runtime aktiviert");
  });
});
