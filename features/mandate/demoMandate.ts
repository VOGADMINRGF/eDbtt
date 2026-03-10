export type DemoMandateTimelineItem = {
  label: string;
  date: string;
  status: "done" | "in_progress" | "planned";
  note?: string;
};

export type DemoMandateResponsibility = {
  area: string;
  owner: string;
  partners?: string[];
  status: "done" | "in_progress" | "planned";
  deliverables: string[];
};

export type DemoMandateImpactMetric = {
  label: string;
  value: string;
  trend: string;
};

export type DemoMandateRisk = {
  title: string;
  owner: string;
  mitigation: string;
};

export type DemoMandate = {
  id: string;
  title: string;
  region: string;
  status: "aktiv" | "in Planung" | "abgeschlossen";
  summary: string;
  lastUpdated: string;
  timeline: DemoMandateTimelineItem[];
  responsibilities: DemoMandateResponsibility[];
  impact: DemoMandateImpactMetric[];
  risks: DemoMandateRisk[];
};

export const demoMandate: DemoMandate = {
  id: "demo-mandate-001",
  title: "Energieeffizienz-Programm Beispielstadt",
  region: "Beispielstadt - Kommune",
  status: "aktiv",
  summary:
    "Mandat zur Reduktion des Energieverbrauchs kommunaler Gebäude um 15 % bis 2027. Umsetzung mit Schulungen, Gebäudesanierung und Monitoring.",
  lastUpdated: "2025-07-21",
  timeline: [
    {
      label: "Mandat beschlossen",
      date: "2025-05-30",
      status: "done",
      note: "Ratsbeschluss mit Budgetfreigabe.",
    },
    {
      label: "Projektstart & Kickoff",
      date: "2025-06-10",
      status: "done",
      note: "Projektteam + Auftragnehmer ausgewählt.",
    },
    {
      label: "Gebäude-Audit",
      date: "2025-07-15",
      status: "in_progress",
      note: "12 Gebäude geprüft, 8 stehen noch aus.",
    },
    {
      label: "Sanierungsphase",
      date: "2025-10-01",
      status: "planned",
      note: "Priorisierung nach Energiebedarf.",
    },
    {
      label: "Erste Wirkungsprüfung",
      date: "2026-03-15",
      status: "planned",
    },
  ],
  responsibilities: [
    {
      area: "Projektleitung",
      owner: "Klimaschutzbüro",
      partners: ["Stadtwerke", "Facility Management"],
      status: "in_progress",
      deliverables: ["Projektplan & Budgettracking", "Monatliches Reporting"],
    },
    {
      area: "Gebäudesanierung",
      owner: "Bauamt",
      partners: ["Externe Fachplanung"],
      status: "planned",
      deliverables: ["Sanierungskonzept", "Ausschreibungen"],
    },
    {
      area: "Monitoring & Wirkung",
      owner: "Datenstelle",
      partners: ["Energieagentur"],
      status: "in_progress",
      deliverables: ["Messpunkte", "Quartalsberichte", "CO2-Bilanz"],
    },
  ],
  impact: [
    { label: "Energieverbrauch", value: "-7 %", trend: "seit Projektstart" },
    { label: "CO2-Einsparung", value: "420 t", trend: "Prognose 2025" },
    { label: "Budgetabfluss", value: "38 %", trend: "von 1,2 Mio EUR" },
  ],
  risks: [
    {
      title: "Lieferengpässe bei Dämmmaterial",
      owner: "Bauamt",
      mitigation: "Alternativlieferanten geprüft, Puffer eingeplant.",
    },
    {
      title: "Verzögerte Datenzulieferung",
      owner: "Datenstelle",
      mitigation: "Automatisierte Zählerablesung priorisiert.",
    },
  ],
};
