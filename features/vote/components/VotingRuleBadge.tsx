import React from "react";
type VotingRule = any;

export default function VotingRuleBadge({ votingRule }: { votingRule?: VotingRule }) {
  if (!votingRule) return null;
  let label = "";
  switch (votingRule.type) {
    case "simple-majority": label = "Einfache Mehrheit"; break;
    case "absolute-majority": label = "Absolute Mehrheit"; break;
    case "two-thirds": label = "2/3-Mehrheit"; break;
    case "unanimity": label = "Einstimmigkeit"; break;
    case "weighted": label = "Gewichtete Stimmen"; break;
    case "payroll-weighted": label = "Payroll-Gewichtung"; break;
    default: label = "Sonderregel"; break;
  }
  return (
    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold mr-2" title={votingRule.description}>
      {label}
    </span>
  );
}
