import { cookies } from "next/headers";
import type { Metadata } from "next";
import CreateClient from "./CreateClient";
import { getAccountOverview } from "@features/account/service";
import { getDraft } from "@/server/draftStore";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";

export const metadata: Metadata = {
  title: "Erstellen – eDebatte",
  description: "Statements und Beiträge strukturiert erstellen.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export default async function CreatePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const dossierId = pickString(params.dossierId) ?? null;
  const prefill = pickString(params.prefill);
  const draftId = pickString(params.draftId);

  const draft = draftId ? await getDraft(draftId).catch(() => null) : null;
  const initialText = draft?.text ?? (prefill ? decodeURIComponent(prefill) : null);

  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value ?? null;
  const overview = userId ? await getAccountOverview(userId).catch(() => null) : null;
  const entitlements = await getCreateEntitlementsForRequest();

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Create</h1>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <CreateClient
          initialEntitlements={entitlements}
          overview={overview}
          dossierId={dossierId}
          initialText={initialText}
        />
      </div>
    </main>
  );
}
