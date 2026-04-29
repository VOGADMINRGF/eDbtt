import type { MinimalDossierInput } from "./generator";

export const demoDossierForOutputEngine: MinimalDossierInput = {
  id: "dossier_demo_mobility_berlin",
  title: "Mobility Transition in Berlin Districts",
  summary:
    "The dossier compares implementation options for bus lane expansion, cycling safety upgrades and phased delivery logistics with open cost and equity questions.",
  claims: [
    {
      id: "claim_1",
      text: "Dedicated bus lanes on key corridors can reduce average peak-time delays.",
      status: "supported",
    },
    {
      id: "claim_2",
      text: "Protected cycling segments reduce severe accidents at conflict intersections.",
      status: "supported",
    },
    {
      id: "claim_3",
      text: "Delivery-zone redesign may shift congestion if enforcement stays inconsistent.",
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
    "How should neighborhood-level delivery access be phased during construction?",
    "Which equity metrics should gate district rollouts?",
  ],
  options: [
    "Option A: prioritize bus lanes first",
    "Option B: prioritize cycling safety first",
    "Option C: phased mixed rollout by district",
  ],
  status: "in_review",
  updatedAt: "2026-04-28T08:00:00.000Z",
};
