"use client";

import StatementCard from "./StatementCard"; // Deine CI-kompatible Card
import { Statement } from "../types/Statement"; // Typ ggf. anpassen

export default function StatementListDisplay({ statements }: { statements: Statement[] }) {
  if (!statements?.length) {
    return <p className="text-gray-400 text-center py-8">Keine Statements vorhanden.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {statements.map((st) => (
        <div key={st.id} className="space-y-2">
          <StatementCard statement={st} />
          {st.votes && <VoteBar votes={st.votes} />}
        </div>
      ))}
    </div>
  );
}

// Optional ausgelagerte Progressbar-Komponente
function VoteBar({ votes }: { votes: { agree: number; neutral: number; disagree: number } }) {
  const total = votes.agree + votes.neutral + votes.disagree;
  if (total === 0) return null;

  const agreePercent = (votes.agree / total) * 100;
  const neutralPercent = (votes.neutral / total) * 100;
  const disagreePercent = (votes.disagree / total) * 100;

  return (
    <div className="w-full flex items-center gap-2">
      <div className="flex-1 h-2 rounded bg-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-green-400" style={{ width: `${agreePercent}%` }} />
        <div className="absolute top-0 left-0 h-full bg-yellow-400" style={{ left: `${agreePercent}%`, width: `${neutralPercent}%` }} />
        <div className="absolute top-0 right-0 h-full bg-red-400" style={{ width: `${disagreePercent}%` }} />
      </div>
    </div>
  );
}
