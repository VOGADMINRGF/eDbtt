// features/statement/components/StatementList.tsx
"use client";
import { useEffect, useState, ChangeEvent } from "react";
import StatementForm from "./StatementForm";
import { utils, writeFile, read } from "xlsx";

type StatementRow = {
  category: string; region: string; statement: string;
  alternative?: string; analysis?: { topics?: { name: string }[] };
};

export default function StatementList() {
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<StatementRow> | null>(null);

  useEffect(() => {
    fetch("/api/statements")
      .then(res => res.json())
      .then((data: StatementRow[]) => setStatements(data))
      .finally(() => setLoading(false));
  }, []);

  function exportStatementsToXLSX() {
    const data = statements.map(s => ({
      Kategorie: s.category,
      Region: s.region,
      Statement: s.statement,
      Alternative: s.alternative ?? "",
      ...(s.analysis && { GPT_Themen: s.analysis.topics?.map(t => t.name).join(", ") })
    }));
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, "Statements");
    writeFile(wb, "statements_export.xlsx");
  }

  function downloadTemplate() {
    const data = [
      { Kategorie: "Umwelt & Klima", Region: "National", Statement: "Hier ein Beispielstatement", Alternative: "" },
    ];
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "statement_template.xlsx");
  }

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buf = evt.target?.result;
      if (!buf) return;
      const wb = read(buf, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = utils.sheet_to_json<{ Kategorie: string; Region: string; Statement: string; Alternative?: string }>(ws);
      Promise.all(
        data.map(row =>
          fetch("/api/statements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: row.Kategorie,
              region: row.Region,
              statement: row.Statement,
              alternative: row.Alternative,
            }),
          })
        )
      ).then(() => {
        fetch("/api/statements").then(res => res.json()).then((d: StatementRow[]) => setStatements(d));
      });
    };
    reader.readAsBinaryString(file);
  }


  if (loading) return <div>Lädt ...</div>;

  return (
    <div className="mt-8 max-w-5xl mx-auto">
      <div className="flex gap-4 mb-8">
        <button onClick={downloadTemplate} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
          Muster-Datei (xlsx)
        </button>
        <label className="px-4 py-2 rounded-xl bg-green-100 text-green-800 hover:bg-green-200 font-semibold cursor-pointer">
          Import (xlsx)
          <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={exportStatementsToXLSX} className="px-4 py-2 rounded-xl bg-indigo-200 text-indigo-900 hover:bg-indigo-300 font-semibold">
          Export (xlsx)
        </button>
        <button onClick={() => setEditing({})} className="ml-auto px-4 py-2 rounded-xl bg-[#A259EB] text-white hover:bg-[#842cc7] font-semibold">
          + Neues Statement
        </button>
      </div>
      {editing && (
        <StatementForm
          statement={editing}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditing(null)}
        />
      )}
      {/* Deine Statement-List-View */}
      <div className="space-y-2 mt-8">
        {statements.map((stmt, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded flex justify-between items-center">
            <div>
              <strong>{stmt.category} ({stmt.region})</strong><br />
              {stmt.statement}
              {stmt.alternative && <div className="text-xs text-gray-500 mt-1">Alternative: {stmt.alternative}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
