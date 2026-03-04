import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export default async function StatementNewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = new URLSearchParams();
  q.set("intent", "statement");
  const dossierId = pickString(params.dossierId);
  const prefill = pickString(params.prefill);
  const draftId = pickString(params.draftId);
  if (dossierId) q.set("dossierId", dossierId);
  if (prefill) q.set("prefill", prefill);
  if (draftId) q.set("draftId", draftId);
  redirect(`/create?${q.toString()}`);

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Statement einreichen</h1>
    </main>
  );
}
