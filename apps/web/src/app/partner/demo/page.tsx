import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerUser } from "@/lib/auth/requireServerUser";
import { isDemoUser } from "@/lib/demo/demoAccess";

const MOCK_RUNS = [
  {
    receiptHash: "rr_demo_001",
    title: {
      de: "Beispiel: hohe Beweislast, wenige Voices",
      en: "Example: high burden of proof, few voices",
    },
    flags: ["power_dominant", "missing_voices"],
  },
  {
    receiptHash: "rr_demo_002",
    title: {
      de: "Beispiel: Euphemismus/Agency Hinweise",
      en: "Example: euphemism/agency hints",
    },
    flags: ["euphemism", "agency_passive"],
  },
  {
    receiptHash: "rr_demo_003",
    title: {
      de: "Beispiel: Kontext-Gaps (Zeit/Ort/Akteure)",
      en: "Example: context gaps (time/location/actors)",
    },
    flags: ["context_gaps"],
  },
];

export default async function PartnerDemoPage() {
  const user = await requireServerUser().catch(() => null);
  if (!isDemoUser(user)) notFound();

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Partner Demo (private)</div>
        <h1 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">Correctiv / RSF - Review Demo</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Ziel: auditable Review Flow (RunReceipt + EvidenceGraph + EditorialAudit) - Demo ist nur für Dummy-Accounts sichtbar.
        </p>

        <div className="mt-4 space-y-2">
          {MOCK_RUNS.map((run) => (
            <div key={run.receiptHash} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[rgb(var(--fg))]">{run.title.de}</div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">{run.title.en}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {run.flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href={`/verify/${run.receiptHash}`} className="text-sm font-semibold text-[rgb(var(--fg))] underline">
                  Verify
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-[11px] text-[rgb(var(--muted))]">
          Next: echte Review-Queue aus "flagged runs" plus Partner-Feedback-Events (confirm/reject, attach_context_pack).
        </div>
      </div>
    </div>
  );
}
