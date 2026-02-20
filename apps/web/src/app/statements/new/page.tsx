import AnalyzeWorkspace from "@/components/analyze/AnalyzeWorkspace";
import { getDraft } from "@/server/draftStore";

export default async function StatementNewPage({
  searchParams,
}: {
  searchParams?: { prefill?: string; draftId?: string; dossierId?: string };
}) {
  const prefill = searchParams?.prefill ? decodeURIComponent(searchParams.prefill) : undefined;
  const draftId = searchParams?.draftId ?? null;
  const dossierId = searchParams?.dossierId ?? null;
  const draft = draftId ? await getDraft(draftId).catch(() => null) : null;
  const initialText = draft?.text ?? prefill;
  const afterFinalizeNavigateTo = dossierId ? `/dossier/${dossierId}` : "/swipes";

  return (
    <main className="min-h-screen bg-[rgb(var(--card))]">
      <h1 className="sr-only">Statement einreichen</h1>
      {dossierId ? (
        <div className="mx-auto w-full max-w-5xl px-4 pt-8">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--fg))]">
            Dieses Statement wird dem Dossier zugeordnet:{" "}
            <span className="font-semibold">{dossierId}</span>.
          </div>
        </div>
      ) : null}
      <AnalyzeWorkspace
        mode="statement"
        defaultLevel={1}
        storageKey="vog_statement_draft_v1"
        analyzeEndpoint="/api/contributions/analyze"
        saveEndpoint="/api/contributions/save"
        finalizeEndpoint="/api/contributions/finalize"
        afterFinalizeNavigateTo={afterFinalizeNavigateTo}
        dossierId={dossierId ?? undefined}
        initialText={initialText}
      />
    </main>
  );
}
