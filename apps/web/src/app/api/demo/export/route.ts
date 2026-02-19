import { NextResponse } from "next/server";
import demoDossier from "@features/dossier/data/demoDossier";

export const runtime = "nodejs";

function toCSV() {
  const note = demoDossier.analyze.notes?.find((n) => n.id === "note-presentation-options");
  let options: any[] = [];
  try {
    options = JSON.parse(note?.text ?? "{}")?.options ?? [];
  } catch {
    options = [];
  }

  const inputsNote = demoDossier.analyze.notes?.find((n) => n.id === "note-inputs");
  let majority: { id: string; pct: number }[] = [];
  try {
    majority = JSON.parse(inputsNote?.text ?? "{}")?.vote?.majorityDemo ?? [];
  } catch {
    majority = [];
  }
  const majorityMap = new Map(majority.map((m) => [m.id, m.pct]));

  const rows = [
    ["option_id", "option_label", "type", "mehrheit_pct", "evidence_level", "touches_statements"].join(","),
    ...options.map((o) =>
      [
        o.id,
        `"${String(o.label ?? "").replaceAll("\"", "\"\"")}"`,
        o.type ?? "",
        String(majorityMap.get(o.id) ?? ""),
        o.evidenceLevel ?? "",
        `"${(o.touchesStatements ?? []).join(" | ")}"`,
      ].join(","),
    ),
  ];

  return rows.join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  if (format === "csv") {
    const csv = toCSV();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"dossier-demo-export.csv\"`,
      },
    });
  }

  return NextResponse.json(
    { ok: true, dossier: demoDossier },
    { status: 200, headers: { "content-disposition": `attachment; filename=\"dossier-demo.json\"` } },
  );
}
