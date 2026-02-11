import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

function toDescription(id?: string) {
  if (!id) return BRAND.tagline_de;
  return `Report ${id} – ${BRAND.tagline_de}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = id ? `Report ${id}` : "Report";
  const description = toDescription(id);
  const url = `${BRAND.baseUrl}/report/${id ?? ""}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function TODOPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Report {id}</h1>
      <p className="mt-3 text-sm text-slate-600">
        Dieser Report wird gerade vorbereitet. Bald stehen hier die aggregierten Daten und Auswertungen.
      </p>
    </main>
  );
}
