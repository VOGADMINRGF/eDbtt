"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  MarketingDelegationAgentRole,
  MarketingDelegationStatus,
} from "@/features/marketing/delegations/contracts";

type Props = {
  itemType: "campaign" | "opportunity";
  itemId: string;
  locale: "de" | "en";
  existingRole?: MarketingDelegationAgentRole | null;
  existingStatus?: MarketingDelegationStatus | null;
};

const ROLE_LABELS = {
  de: {
    marketing_operator: "Marketing-Agent",
    research_operator: "Recherche-Agent",
    content_operator: "Content-Agent",
    analytics_operator: "Analyse-Agent",
  },
  en: {
    marketing_operator: "Marketing operator",
    research_operator: "Research operator",
    content_operator: "Content operator",
    analytics_operator: "Analytics operator",
  },
} as const;

const STATUS_LABELS = {
  de: {
    queued: "delegiert",
    in_progress: "in Bearbeitung",
    review_required: "zur Prüfung",
    completed: "abgeschlossen",
    cancelled: "abgebrochen",
  },
  en: {
    queued: "delegated",
    in_progress: "in progress",
    review_required: "ready for review",
    completed: "completed",
    cancelled: "cancelled",
  },
} as const;

export default function MarketingDelegateControl({
  itemType,
  itemId,
  locale,
  existingRole = null,
  existingStatus = null,
}: Props) {
  const router = useRouter();
  const [agentRole, setAgentRole] = useState<MarketingDelegationAgentRole>(
    existingRole ?? "marketing_operator",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = locale === "de"
    ? {
        choose: "Zuständigkeit",
        delegate: "Delegieren",
        delegating: "Wird delegiert …",
        success: "Auftrag wurde in die Marketing-Queue gelegt.",
        error: "Delegation konnte nicht gespeichert werden.",
        current: "Aktuell",
      }
    : {
        choose: "Assign to",
        delegate: "Delegate",
        delegating: "Delegating …",
        success: "The task was added to the marketing queue.",
        error: "The delegation could not be saved.",
        current: "Current",
      };

  async function submit() {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/marketing/delegations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemType, itemId, agentRole }),
        });
        if (!response.ok) throw new Error("delegation_failed");
        setMessage(copy.success);
        router.refresh();
      } catch {
        setMessage(copy.error);
      }
    });
  }

  return (
    <div className="space-y-2" data-testid={`marketing-delegate-${itemType}-${itemId}`}>
      {existingRole && existingStatus && (
        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {copy.current}: {ROLE_LABELS[locale][existingRole]} · {STATUS_LABELS[locale][existingStatus]}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-44 flex-1 text-xs font-semibold text-[rgb(var(--muted))]">
          <span className="mb-1 block">{copy.choose}</span>
          <select
            value={agentRole}
            onChange={(event) => setAgentRole(event.target.value as MarketingDelegationAgentRole)}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm font-medium text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {Object.entries(ROLE_LABELS[locale]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? copy.delegating : copy.delegate}
        </button>
      </div>
      {message && <p className="text-xs text-[rgb(var(--muted))]" role="status">{message}</p>}
    </div>
  );
}
