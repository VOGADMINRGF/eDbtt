export type DemoStatusKey =
  | "demo"
  | "simulation"
  | "open"
  | "in_review"
  | "confirmed"
  | "delegated"
  | "community_submitted"
  | "verified";

export type DemoStatusItem = {
  key: DemoStatusKey;
  label: string;
  description: string;
};

export const DEMO_STATUS_GLOSSARY: DemoStatusItem[] = [
  { key: "demo", label: "Demo", description: "Ansicht nutzt Demo-Daten." },
  { key: "simulation", label: "Simulation", description: "Ablauf ist vorbereitet, nicht produktiv geschaltet." },
  { key: "open", label: "offen", description: "Punkt ist erfasst, noch nicht geklaert." },
  { key: "in_review", label: "in Pruefung", description: "Redaktion/Team prueft den Punkt." },
  { key: "confirmed", label: "bestaetigt", description: "Inhaltlich bestaetigt oder uebernommen." },
  { key: "delegated", label: "delegiert", description: "Zustaendigkeit wurde zugeordnet." },
  {
    key: "community_submitted",
    label: "community eingereicht",
    description: "Einreichung aus der Beteiligungsschicht.",
  },
  { key: "verified", label: "verifiziert", description: "Quelle/Claim ist dokumentiert und geprueft." },
];
