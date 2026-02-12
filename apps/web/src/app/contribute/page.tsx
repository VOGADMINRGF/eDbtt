import SmartContribution from "@features/contribution/SmartContribution";
import { getDraft } from "@/server/draftStore";

export default async function ContributePage({
  searchParams,
}: {
  searchParams?: { prefill?: string; draftId?: string };
}) {
  const initialText = searchParams?.prefill ? decodeURIComponent(searchParams.prefill) : undefined;
  const draftId = searchParams?.draftId ?? null;

  if (draftId) {
    const draft = await getDraft(draftId).catch(() => null);
    const draftText = draft?.text ?? initialText;
    return (
      <main className="min-h-screen bg-white">
        <h1 className="sr-only">Beitrag erfassen</h1>
        <SmartContribution initialText={draftText} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <h1 className="sr-only">Beitrag erfassen</h1>
      <SmartContribution initialText={initialText} />
    </main>
  );
}
