"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type WorkflowState = "draft" | "in_review" | "approved" | "published" | "archived";

export type InstitutionalSnapshot = {
  snapshotId: string;
  dossierId: string;
  createdAt: string;
  contentHash: string;
  previousHash?: string;
  signature: string;
  publicKey: string;
  publicKeyId: string;
};

export type InstitutionalAuditEvent = {
  eventId: string;
  dossierId: string;
  actorRole: string;
  action: string;
  diff?: unknown;
  timestamp: string;
  previousHash?: string;
  eventHash: string;
};

export type InstitutionalWorkflow = {
  dossierId: string;
  state: WorkflowState;
  updatedAt: string;
  updatedByRole: string;
  updatedByUserId?: string;
};

export type InstitutionalExport = {
  ok?: boolean;
  exportedAt?: string;
  dossier?: unknown;
  snapshot?: InstitutionalSnapshot | null;
  auditTrail?: InstitutionalAuditEvent[];
  workflow?: InstitutionalWorkflow | null;
  delegations?: Array<{
    delegationId: string;
    dossierId: string;
    questionId: string;
    status: string;
    delegatedTo?: string;
    level?: string;
    requestedAt?: string;
    updatedAt?: string;
    note?: string;
  }>;
};

type VerifyState = { state: "unverified" | "verifying" | "verified" | "invalid" | "error" };

function shortHash(value?: string | null, n = 10) {
  if (!value) return "–";
  return value.length <= n ? value : `${value.slice(0, n)}…`;
}

export function useInstitutionalDossier(dossierId: string) {
  const [data, setData] = useState<InstitutionalExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [verify, setVerify] = useState<VerifyState>({ state: "unverified" });

  const load = useCallback(async () => {
    if (!dossierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dossier/${encodeURIComponent(dossierId)}/export?format=json`, {
        cache: "no-store",
      });
      const json = (await res.json()) as InstitutionalExport;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  const verifySignature = useCallback(async () => {
    const snap = data?.snapshot;
    if (!snap) return;
    try {
      setVerify({ state: "verifying" });
      const res = await fetch("/api/dossier/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contentHash: snap.contentHash,
          signature: snap.signature,
          publicKey: snap.publicKey,
        }),
      });
      const json = (await res.json()) as { valid?: boolean };
      setVerify({ state: json.valid ? "verified" : "invalid" });
    } catch {
      setVerify({ state: "error" });
    }
  }, [data?.snapshot]);

  const transition = useCallback(
    async (nextState: WorkflowState, note?: string) => {
      if (!dossierId) return;
      try {
        await fetch("/api/dossier/transition", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dossierId, nextState, note }),
        });
        await load();
      } catch {
        // Demo-only: swallow errors silently.
      }
    },
    [dossierId, load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setVerify({ state: "unverified" });
  }, [data?.snapshot?.snapshotId]);

  const snapshotMeta = useMemo(() => {
    const snap = data?.snapshot;
    return {
      snapshotId: snap?.snapshotId ?? "–",
      hashShort: shortHash(snap?.contentHash, 12),
      keyIdShort: shortHash(snap?.publicKeyId, 12),
      createdAt: snap?.createdAt ?? null,
    };
  }, [data?.snapshot]);

  return {
    data,
    loading,
    load,
    verify,
    verifySignature,
    snapshotMeta,
    transition,
  };
}

export default useInstitutionalDossier;
