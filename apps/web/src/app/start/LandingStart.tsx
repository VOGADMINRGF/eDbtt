import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import HomeGoToMarketLanding from "@/features/home/HomeGoToMarketLanding";
import type { StartExperienceModel } from "@/features/start/startExperience";

type LandingStartProps = {
  blocks?: BucketBlock[];
  experience?: StartExperienceModel;
};

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Mitmachen oder etwas starten",
  title: "Was möchtest du tun?",
  description:
    "Wenn du über einen Link oder QR-Code kommst, landest du direkt bei der passenden Frage. Ohne konkreten Kontext kannst du laufende Themen entdecken, etwas beitragen oder selbst eine Frage starten.",
  helperText: "Abstimmen, ergänzen, eine Quelle beitragen oder eine eigene Frage öffnen.",
  trustText:
    "Nichts wird automatisch veröffentlicht. Du siehst, worum es geht, was noch offen ist und was du als Nächstes tun kannst.",
  showExtendedOrientation: false,
  workspaceHref: null,
  workspaceLabel: null,
  quickActionCenter: {
    eyebrow: "Neu hier?",
    title: "Mitmachen oder selbst etwas starten.",
    description:
      "Entdecke laufende Fragen, ergänze etwas, wo noch etwas fehlt, oder öffne eine eigene Frage für andere.",
    primaryActions: [],
    secondaryActions: [],
  },
};

export default function LandingStart({
  blocks,
  experience = DEFAULT_START_EXPERIENCE,
}: LandingStartProps) {
  void blocks;
  return <HomeGoToMarketLanding experience={experience} />;
}
