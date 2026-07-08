import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import HomeSplitVoxyLanding from "@/features/home/HomeSplitVoxyLanding";
import type { StartExperienceModel } from "@/features/start/startExperience";

type LandingStartProps = {
  blocks?: BucketBlock[];
  experience?: StartExperienceModel;
};

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Klarer Einstieg",
  title: "Was bewegt dich?",
  description:
    "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.",
  helperText: "Beitrag einbringen, mitmachen oder vorhandene Themen öffnen.",
  trustText:
    "Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.",
  showExtendedOrientation: false,
  workspaceHref: null,
  workspaceLabel: null,
  quickActionCenter: {
    eyebrow: "Neu hier?",
    title: "Starte mit einem Beitrag oder mach direkt mit.",
    description:
      "Die Startseite führt direkt in die produktiven Einstiege für Beitrag und Beteiligung.",
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
