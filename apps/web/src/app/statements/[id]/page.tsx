// apps/web/src/app/statements/[id]/page.tsx
import type { Metadata } from "next";
import { ObjectId } from "@core/db/triMongo";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
export const dynamic = "force-dynamic";

import StatementDetailClient from "@features/statement/components/StatementDetailClient";
import ResponsibilityNavigator from "@features/statement/components/ResponsibilityNavigator";
import {
  ConsequencesPreviewCard,
  ResponsibilityPreviewCard,
} from "@features/statement/components/StatementImpactPreview";
import { getActors, type ResponsibilityPath } from "@core/responsibility";
import type { ConsequenceRecord, ResponsibilityRecord } from "@features/analyze/schemas";

type Stats = {
  votesTotal: number;
  votesAgree: number;
  votesNeutral: number;
  votesDisagree: number;
};

type StatementDoc = {
  _id?: any;
  id?: string;
  title?: string;
  text?: string;
  content?: string;
  category?: string;
  language?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  stats?: Stats;
  analysis?: any;
  responsibilityPaths?: ResponsibilityPath[];
};

async function loadStatement(id: string): Promise<StatementDoc | null> {
  const tri: any = await import("@core/db/triMongo");
  const stmts = tri.coreCol
    ? await tri.coreCol("statements")
    : (await tri.getDb()).collection("statements");

  const selector = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

  const doc = await stmts.findOne(selector);
  return doc ?? null;
}

function toDescription(input?: string) {
  if (!input) return BRAND.tagline_de;
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return BRAND.tagline_de;
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await loadStatement(id);
  const title = doc?.title?.trim() || "Statement";
  const description = toDescription(doc?.text ?? doc?.content);
  const statementId = doc?.id ?? (doc?._id ? String(doc._id) : id);
  const url = `${BRAND.baseUrl}/statements/${statementId}`;

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

export default async function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await loadStatement(id);
  if (!doc) return notFound();

  const statementId: string = doc.id ?? String(doc._id);
  const content: string | undefined = doc.text ?? doc.content ?? undefined;

  const stats: Stats = doc.stats ?? {
    votesTotal: 0,
    votesAgree: 0,
    votesNeutral: 0,
    votesDisagree: 0,
  };

  const consequences: ConsequenceRecord[] =
    (doc.analysis?.consequences?.consequences as ConsequenceRecord[] | undefined) ?? [];
  const responsibilities: ResponsibilityRecord[] =
    (doc.analysis?.consequences?.responsibilities as ResponsibilityRecord[] | undefined) ?? [];

  const responsibilityPaths: ResponsibilityPath[] =
    (doc.analysis?.responsibilityPaths as ResponsibilityPath[] | undefined) ??
    (doc.responsibilityPaths as ResponsibilityPath[] | undefined) ??
    [];

  const actors = await getActors();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        {doc.category && (
          <p className="text-sm text-neutral-500">{doc.category}</p>
        )}
      </header>

      {content && <p className="text-lg leading-relaxed">{content}</p>}

      <StatementDetailClient statementId={statementId} initialStats={stats} />

      <ConsequencesPreviewCard
        consequences={consequences}
        responsibilities={responsibilities}
      />

      <ResponsibilityPreviewCard
        responsibilities={responsibilities}
        paths={responsibilityPaths as any}
        showPathOverlay
      />

      <ResponsibilityNavigator
        paths={responsibilityPaths as any}
        actors={actors}
        statementTitle={doc.title}
      />

      {doc.analysis?.summary && (
        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Analyse</h2>
          <pre className="text-sm whitespace-pre-wrap">
            {doc.analysis.summary}
          </pre>
        </section>
      )}
    </div>
  );
}
