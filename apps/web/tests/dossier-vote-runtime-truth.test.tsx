import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import VotePanel from "@/components/dossier/VotePanel";
import {
  buildCanonicalDossierEmbedSnippet,
  buildCanonicalDossierHref,
  persistDossierVoteSelection,
  resolveDossierVoteRuntime,
} from "@/components/dossier/runtimeTruth";

describe("dossier vote runtime truth", () => {
  it("builds canonical dossier links and embeds without forcing the demo dossier", () => {
    expect(buildCanonicalDossierHref("demo-innencity-2026", { anchor: "streams" })).toBe(
      "/dossier/demo-innencity-2026#streams",
    );
    expect(buildCanonicalDossierHref(null, { allowIndexFallback: true })).toBe("/dossier");
    expect(buildCanonicalDossierEmbedSnippet("dossier-42")).toContain('src="/dossier/dossier-42"');
    expect(buildCanonicalDossierEmbedSnippet("")).toBeNull();
  });

  it("keeps explicit demo dossiers on the demo vote route and real dossiers on the runtime route", () => {
    expect(resolveDossierVoteRuntime("demo-innencity-2026")).toMatchObject({
      mode: "demo",
      endpoint: "/api/demo/vote",
      usesLocalPersistence: true,
    });
    expect(resolveDossierVoteRuntime("dossier-42")).toMatchObject({
      mode: "runtime",
      endpoint: "/api/dossier/dossier-42/vote",
      usesLocalPersistence: false,
    });
  });

  it("persists demo votes only after an explicit demo save succeeds", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe("/api/demo/vote");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        dossierId: "demo-innencity-2026",
        optionId: "opt-a",
        runtimeContext: "demo",
      });
      return new Response(
        JSON.stringify({
          ok: true,
          updatedAt: "2026-07-20T10:00:00.000Z",
          majorityDemo: [{ id: "opt-a", pct: 51 }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const storage = { setItem: vi.fn() };

    const result = await persistDossierVoteSelection({
      dossierId: "demo-innencity-2026",
      optionId: "opt-a",
      runtime: resolveDossierVoteRuntime("demo-innencity-2026"),
      fetchImpl,
      storage,
      storageKey: "vote",
      timeKey: "voteAt",
    });

    expect(result).toMatchObject({
      ok: true,
      savedAt: "2026-07-20T10:00:00.000Z",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenNthCalledWith(1, "vote", "opt-a");
    expect(storage.setItem).toHaveBeenNthCalledWith(2, "voteAt", "2026-07-20T10:00:00.000Z");
  });

  it("does not fake a successful local vote for a real dossier when the runtime fails", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "vote_runtime_unavailable",
          message: "Die Abstimmungsruntime für dieses Dossier ist aktuell nicht verfügbar.",
        }),
        { status: 503, headers: { "content-type": "application/json" } },
      );
    });
    const storage = { setItem: vi.fn() };

    const result = await persistDossierVoteSelection({
      dossierId: "dossier-42",
      optionId: "opt-b",
      runtime: resolveDossierVoteRuntime("dossier-42"),
      fetchImpl,
      storage,
      storageKey: "vote",
      timeKey: "voteAt",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: "Die Abstimmungsruntime für dieses Dossier ist aktuell nicht verfügbar.",
    });
  });

  it("shows retry feedback instead of a success-only state after a failed vote", () => {
    const html = renderToStaticMarkup(
      <VotePanel
        options={[{ id: "opt-a", label: "Option A" }]}
        selectedOptionId="opt-a"
        savedOptionId={null}
        onSelect={() => {}}
        onSave={() => {}}
        saveNotice={false}
        saveError="Die Abstimmung konnte nicht gespeichert werden."
      />,
    );

    expect(html).toContain("Erneut versuchen");
    expect(html).toContain("Die Abstimmung konnte nicht gespeichert werden.");
    expect(html).not.toContain("✔ Stimme gespeichert");
  });
});
