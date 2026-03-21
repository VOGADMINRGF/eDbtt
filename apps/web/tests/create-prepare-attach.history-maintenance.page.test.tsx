import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CreateHistoryMaintenanceDiagnosticsPanel } from "@/features/create/historyMaintenanceDiagnosticsUi";

describe("create prepare-attach history maintenance page ui", () => {
  it("renders summary, reason buckets, samples and read-only dry-run hint", () => {
    const html = renderToStaticMarkup(
      <CreateHistoryMaintenanceDiagnosticsPanel
        report={{
          mode: "dry_run",
          totalScanned: 12,
          canonical: 7,
          normalizable: 3,
          unsafe: 2,
          applied: 0,
          applySkipped: 0,
          samples: [
            {
              rowId: "65f000000000000000000111",
              draftId: "65f000000000000000000211",
              status: "normalizable",
              inferredEventType: "review",
              reasons: ["event_type_inferred", "actor_inferred"],
            },
          ],
          reasonBuckets: {
            event_type_inferred: 3,
            actor_inferred: 2,
          },
        }}
        loading={false}
        error={null}
        previewLimit="8"
        scanLimit="100"
        onPreviewLimitChange={vi.fn()}
        onScanLimitChange={vi.fn()}
        onReload={vi.fn()}
      />,
    );

    expect(html).toContain("Create History Maintenance");
    expect(html).toContain("Read-only / dry-run only");
    expect(html).toContain("Kein Backfill-Apply aus diesem Screen");
    expect(html).toContain("Apply bleibt weiterhin nur per Script");
    expect(html).toContain("scripts/create.history-backfill.ts --apply --json");
    expect(html).toContain("Summary");
    expect(html).toContain("Total scanned");
    expect(html).toContain("Canonical");
    expect(html).toContain("Normalizable");
    expect(html).toContain("Unsafe");
    expect(html).toContain("Reason buckets");
    expect(html).toContain("event_type_inferred");
    expect(html).toContain("actor_inferred");
    expect(html).toContain("Samples");
    expect(html).toContain("65f000000000000000000111");
    expect(html).toContain("65f000000000000000000211");
    expect(html).toContain("normalizable");
    expect(html).toContain("review");
    expect(html).toContain("Neu laden");
    expect(html).toContain("Sample-Status");
    expect(html).toContain("Reason-Sortierung");
    expect(html).toContain("Queue");
    expect(html).toContain("History JSON");
    expect(html).toContain("/admin/create/attach-drafts?reviewState=all&amp;q=65f000000000000000000211");
    expect(html).toContain("/api/admin/create/attach-drafts/65f000000000000000000211/history?type=all&amp;limit=20");
  });

  it("renders stable empty states for reason buckets and samples", () => {
    const html = renderToStaticMarkup(
      <CreateHistoryMaintenanceDiagnosticsPanel
        report={{
          mode: "dry_run",
          totalScanned: 0,
          canonical: 0,
          normalizable: 0,
          unsafe: 0,
          applied: 0,
          applySkipped: 0,
          samples: [],
          reasonBuckets: {},
        }}
        loading={false}
        error={null}
        previewLimit="8"
        scanLimit=""
        onPreviewLimitChange={vi.fn()}
        onScanLimitChange={vi.fn()}
        onReload={vi.fn()}
      />,
    );

    expect(html).toContain("Keine reason buckets gefunden");
    expect(html).toContain("Keine Sample-Events im aktuellen Report");
  });
});
