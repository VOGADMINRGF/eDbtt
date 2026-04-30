import type { MinimalDossierInput } from "./generator";

export const demoDossierForOutputEngine: MinimalDossierInput = {
  id: "dossier_demo_mobility_berlin",
  title: "Mobilitätswende in Berliner Bezirken",
  summary:
    "Das Dossier vergleicht Umsetzungsoptionen für den Ausbau von Busspuren, mehr Radverkehrssicherheit und eine gestufte Lieferlogistik bei offenen Kosten- und Verteilungsfragen.",
  claims: [
    {
      id: "claim_1",
      text: "Eigene Busspuren auf zentralen Korridoren können durchschnittliche Verzögerungen im Berufsverkehr senken.",
      status: "supported",
    },
    {
      id: "claim_2",
      text: "Geschützte Radverkehrsabschnitte reduzieren schwere Unfälle an konfliktträchtigen Kreuzungen.",
      status: "supported",
    },
    {
      id: "claim_3",
      text: "Eine Neuordnung von Lieferzonen kann Stau verlagern, wenn Kontrollen uneinheitlich bleiben.",
      status: "unclear",
    },
  ],
  sources: [
    {
      id: "source_1",
      title: "Berlin Mobility Report 2025",
      url: "https://example.org/reports/berlin-mobility-2025",
    },
    {
      id: "source_2",
      title: "Road Safety Study Urban Intersections",
      url: "https://example.org/studies/urban-road-safety",
    },
  ],
  openQuestions: [
    "Wie soll quartierbezogener Lieferverkehr während Bauphasen gestuft geregelt werden?",
    "Welche Verteilungsindikatoren sollen den Rollout je Bezirk steuern?",
  ],
  options: [
    "Option A: zuerst Busspuren priorisieren",
    "Option B: zuerst Radverkehrssicherheit priorisieren",
    "Option C: gestufter Misch-Rollout nach Bezirk",
  ],
  status: "in_review",
  updatedAt: "2026-04-28T08:00:00.000Z",
};
