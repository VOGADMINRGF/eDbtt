// apps/web/src/app/contributions/new/page.tsx
import { redirect } from "next/navigation";

export const metadata = {
  title: "Beitrag erstellen – eDebatte",
  description: "Beitrag erstellen und strukturiert aufbereiten.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export default async function ContributionNewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = new URLSearchParams();
  q.set("intent", "contribution");
  const dossierId = pickString(params.dossierId);
  if (dossierId) q.set("dossierId", dossierId);
  redirect(`/create?${q.toString()}`);

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Beitrag erstellen</h1>
    </main>
  );
}
