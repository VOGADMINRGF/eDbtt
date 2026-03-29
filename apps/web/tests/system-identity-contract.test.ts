import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  internalSystemIdentityAuditFields,
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";

describe("system identity contract", () => {
  afterEach(() => {
    delete process.env.INTERNAL_WORKER_TOKEN;
  });

  it("resolves internal queue/worker identity when source and actor kind are valid", () => {
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      headers: {
        "x-internal-source": "factcheck_queue",
        "x-internal-actor-kind": "queue_worker",
        "x-internal-run-ref": "run_42",
        "x-internal-job-ref": "job_99",
        "x-request-id": "req_1",
      },
    });

    expect(resolveInternalSystemIdentity(req)).toEqual({
      source: "factcheck_queue",
      actorKind: "queue_worker",
      runRef: "run_42",
      jobRef: "job_99",
      requestId: "req_1",
    });
  });

  it("rejects unknown source and actor values", () => {
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: {
        "x-internal-source": "external_service",
        "x-internal-actor-kind": "bot",
      },
    });

    expect(resolveInternalSystemIdentity(req)).toBeNull();
  });

  it("requires both source and actor kind", () => {
    const sourceOnly = new NextRequest("http://localhost/api/finding/upsert", {
      headers: { "x-internal-source": "finding_worker" },
    });
    expect(resolveInternalSystemIdentity(sourceOnly)).toBeNull();

    const actorOnly = new NextRequest("http://localhost/api/finding/upsert", {
      headers: { "x-internal-actor-kind": "queue_scheduler" },
    });
    expect(resolveInternalSystemIdentity(actorOnly)).toBeNull();
  });

  it("emits nullable audit fields for missing identity", () => {
    expect(internalSystemIdentityAuditFields(null)).toEqual({
      systemIdentitySource: null,
      systemIdentityActorKind: null,
      systemIdentityRunRef: null,
      systemIdentityJobRef: null,
      systemIdentityRequestId: null,
    });
  });

  it("accepts trusted internal identity only with matching token", () => {
    process.env.INTERNAL_WORKER_TOKEN = "secret_token";
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      headers: {
        authorization: "Bearer secret_token",
        "x-internal-source": "factcheck_worker",
        "x-internal-actor-kind": "queue_worker",
      },
    });
    expect(resolveTrustedInternalSystemIdentity(req)).toMatchObject({
      source: "factcheck_worker",
      actorKind: "queue_worker",
    });
  });

  it("rejects internal identity when token is missing or mismatched", () => {
    process.env.INTERNAL_WORKER_TOKEN = "secret_token";
    const missingToken = new NextRequest("http://localhost/api/factcheck/enqueue", {
      headers: {
        "x-internal-source": "factcheck_worker",
        "x-internal-actor-kind": "queue_worker",
      },
    });
    expect(resolveTrustedInternalSystemIdentity(missingToken)).toBeNull();

    const wrongToken = new NextRequest("http://localhost/api/factcheck/enqueue", {
      headers: {
        authorization: "Bearer wrong_token",
        "x-internal-source": "factcheck_worker",
        "x-internal-actor-kind": "queue_worker",
      },
    });
    expect(resolveTrustedInternalSystemIdentity(wrongToken)).toBeNull();
  });
});
