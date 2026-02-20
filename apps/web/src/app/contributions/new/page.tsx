// apps/web/src/app/contributions/new/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContributionNewClient } from "./ContributionNewClient";
import { getAccountOverview } from "@features/account/service";

export const metadata = {
  title: "Beitrag analysieren – eDebatte",
  description: "Beitrag analysieren und strukturiert aufbereiten.",
};

export const dynamic = "force-dynamic";

export default async function ContributionNewPage({
  searchParams,
}: {
  searchParams?: { dossierId?: string };
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent("/contributions/new")}`);
  }

  const overview = await getAccountOverview(userId);
  if (!overview) {
    redirect(`/login?next=${encodeURIComponent("/contributions/new")}`);
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Beitrag analysieren</h1>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <ContributionNewClient initialOverview={overview} dossierId={searchParams?.dossierId ?? null} />
      </div>
    </main>
  );
}
