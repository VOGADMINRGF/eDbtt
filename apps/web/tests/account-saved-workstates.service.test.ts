import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createInMemoryCreateSavedWorkstateRepo,
  setCreateSavedWorkstateRepoForTests,
} from "@/features/create/createSavedWorkstateRepo";
import { loadAccountSavedWorkstates } from "@features/account/loadAccountSavedWorkstates";

describe("account saved workstates service", () => {
  beforeEach(() => {
    setCreateSavedWorkstateRepoForTests(
      createInMemoryCreateSavedWorkstateRepo({
        records: [
          {
            schemaVersion: "create_saved_workstate.v1",
            id: "private-topic",
            ownerUserId: "user-1",
            organizationId: null,
            visibility: "private",
            type: "topic_candidate",
            status: "saved",
            sourceUrl: null,
            sourceAnalysisId: "analysis-1",
            parentTopicId: "topic-1",
            title: "ÖPNV und Mobilität",
            content: "Persönlicher Themenstand.",
            metadata: {},
            resumeHref: "/create",
            createdAt: "2026-07-18T08:00:00.000Z",
            updatedAt: "2026-07-18T09:00:00.000Z",
          },
          {
            schemaVersion: "create_saved_workstate.v1",
            id: "admin-note",
            ownerUserId: "user-1",
            organizationId: "org-1",
            visibility: "admin_internal",
            type: "internal_note",
            status: "saved",
            sourceUrl: null,
            sourceAnalysisId: "analysis-2",
            parentTopicId: "topic-2",
            title: "Interne Notiz",
            content: "Nur für Admin sichtbar.",
            metadata: {},
            resumeHref: "/create",
            createdAt: "2026-07-18T08:15:00.000Z",
            updatedAt: "2026-07-18T09:15:00.000Z",
          },
          {
            schemaVersion: "create_saved_workstate.v1",
            id: "other-user",
            ownerUserId: "user-2",
            organizationId: null,
            visibility: "private",
            type: "question_candidate",
            status: "saved",
            sourceUrl: null,
            sourceAnalysisId: "analysis-3",
            parentTopicId: "topic-3",
            title: "Fremde Frage",
            content: "Darf nicht auftauchen.",
            metadata: {},
            resumeHref: "/create",
            createdAt: "2026-07-18T08:30:00.000Z",
            updatedAt: "2026-07-18T09:30:00.000Z",
          },
        ],
      }),
    );
  });

  it("returns only the current user's visible records for regular viewers", async () => {
    const records = await loadAccountSavedWorkstates("user-1", []);

    expect(records.map((record) => record.id)).toEqual(["private-topic"]);
  });

  it("includes admin-internal records for admin viewers and keeps newest-first order", async () => {
    const records = await loadAccountSavedWorkstates("user-1", ["admin"]);

    expect(records.map((record) => record.id)).toEqual(["admin-note", "private-topic"]);
  });
});
