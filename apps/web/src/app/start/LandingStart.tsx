import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import HomeSplitVoxyLanding from "@/features/home/HomeSplitVoxyLanding";
import type { StartExperienceModel } from "@/features/start/startExperience";

type LandingStartProps = {
  blocks?: BucketBlock[];
  experience?: StartExperienceModel;
};

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Aktuelle Themen · Quellen · Beteiligung",
  title: "Verstehen, was sich verändert. Mitreden, wo es zählt.",
  description:
    "eDebatte bündelt aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten zu nachvollziehbaren Themenständen – von deiner Region bis zur Welt.",
  helperText: "Entwicklungen entdecken, mitwirken oder einen eigenen Beitrag prüfen lassen.",
  trustText:
    "Nichts wird automatisch veröffentlicht. Quellen, Prüfstatus und Beteiligung bleiben nachvollziehbar.",
  showExtendedOrientation: false,
  workspaceHref: null,
  workspaceLabel: null,
  quickActionCenter: {
    eyebrow: "Neu hier?",
    title: "Entdecke, was sich verändert und wo du mitwirken kannst.",
    description:
      "Die Startseite führt direkt zu aktuellen Entwicklungen, Dossiers, Beteiligung und deinem eigenen Beitrag.",
    primaryActions: [],
    secondaryActions: [],
  },
};

export default function LandingStart({
  blocks,
  experience = DEFAULT_START_EXPERIENCE,
}: LandingStartProps) {
  return <HomeSplitVoxyLanding blocks={blocks} experience={experience} />;
}
