import type { AtomicClaim } from "../ai/roles/shared_types";

export type VoteTemplate = {
  frage: string;
  auswirkung: string;
  ebene: "EU"|"Bund"|"Land"|"Kommune"|"Unklar";
  beleg_hint: string;
};

export function composeVote(c: AtomicClaim): VoteTemplate{
  const frage = `Sollte ${c.sachverhalt} (Ebene: ${c.zuständigkeit}) umgesetzt werden?`;
  const auswirkung = `Betroffene: ${(c.betroffene||[]).slice(0,3).join(", ") || "Bürger:innen"}. Messgröße: ${c.messgröße}.`;
  const beleg_hint = `Basierend auf vorgeschlagenen Belegen (prüfen) zur Kennzahl "${c.messgröße}".`;
  return { frage, auswirkung, ebene: c.zuständigkeit, beleg_hint };
}
