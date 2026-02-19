import { NextResponse } from "next/server";
import demoDossier from "@features/dossier/data/demoDossier";

type RouteParams = { params: { id: string } };

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => escapeCsv(cell ?? "")).join(",")).join("\n");
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params;
  if (id !== demoDossier.meta.id && id !== "demo") {
    return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const { meta, analyze, sourceSet } = demoDossier;

  if (format === "csv") {
    const rows: string[][] = [["type", "id", "title", "details"]];

    for (const claim of analyze.claims) {
      rows.push([
        "claim",
        claim.id,
        claim.title ?? "Kernaussage",
        `${claim.text ?? ""} | Typ: ${(claim as { statementType?: string }).statementType ?? "-"}`,
      ]);
    }

    for (const source of sourceSet) {
      rows.push([
        "source",
        source.canonicalUrl ?? "source",
        source.title ?? "Quelle",
        `Publisher: ${source.publisher ?? "-"} | Typ: ${source.sourceType ?? "-"} | Ort: ${source.location ?? "-"}`,
      ]);
    }

    for (const finding of analyze.findings ?? []) {
      rows.push([
        "finding",
        finding.id,
        finding.claimId,
        `Quelle: ${finding.sourceId} | Befund: ${finding.finding} | ${finding.rationale ?? ""}`,
      ]);
    }

    for (const question of analyze.questions) {
      rows.push(["question", question.id, "Offene Frage", question.text ?? ""]);
    }

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename=\"dossier-${meta.id}.csv\"`,
      },
    });
  }

  return NextResponse.json({
    meta,
    analyze: {
      sourceText: analyze.sourceText,
      language: analyze.language,
      claims: analyze.claims,
      findings: analyze.findings ?? [],
      questions: analyze.questions,
      evidenceGraph: analyze.evidenceGraph,
      report: analyze.report,
    },
    sourceSet,
  });
}
