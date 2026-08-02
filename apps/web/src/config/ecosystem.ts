import { VOG_SUPPORT_URL } from "@/config/links";
import { BRAND } from "@/lib/brand";

export type EcosystemBrandId = "edebatte" | "voiceopengov" | "vote4gov" | "voxy";

export type AvailableEcosystemTarget =
  | Readonly<{
      status: "available";
      kind: "internal";
      href: `/${string}`;
    }>
  | Readonly<{
      status: "available";
      kind: "external";
      href: `https://${string}`;
    }>;

export type UnavailableEcosystemTarget = Readonly<{
  status: "unavailable";
  kind: "none";
  href: null;
}>;

export type EcosystemTarget = AvailableEcosystemTarget | UnavailableEcosystemTarget;

export type EcosystemBrand = Readonly<{
  id: EcosystemBrandId;
  displayName: string;
  canonicalRole: string;
  description: string;
  relationshipToEDebatte: string;
  target: EcosystemTarget;
}>;

function availableInternalTarget(href: string): AvailableEcosystemTarget {
  if (!href.startsWith("/") || href.startsWith("//")) {
    throw new Error(`Invalid internal ecosystem target: ${href}`);
  }

  return { status: "available", kind: "internal", href: href as `/${string}` };
}

function availableExternalTarget(href: string): AvailableEcosystemTarget {
  const url = new URL(href);
  if (url.protocol !== "https:") {
    throw new Error(`Invalid external ecosystem target: ${href}`);
  }

  return { status: "available", kind: "external", href: href as `https://${string}` };
}

const UNAVAILABLE_TARGET: UnavailableEcosystemTarget = {
  status: "unavailable",
  kind: "none",
  href: null,
};

const eDebatteBaseUrl = new URL(BRAND.baseUrl);

export const ECOSYSTEM_BRANDS = [
  {
    id: "edebatte",
    displayName: BRAND.name,
    canonicalRole: "Offene Infrastruktur",
    description:
      "Offene Infrastruktur für nachvollziehbare Erkenntnis, Orientierung und Beteiligung.",
    relationshipToEDebatte:
      "eDebatte bleibt offen für Bürger, Kommunen, Unternehmen, Vereine, Parteien, Wissenschaft, Medien und NGOs.",
    target: availableInternalTarget(eDebatteBaseUrl.pathname),
  },
  {
    id: "voiceopengov",
    displayName: "VoiceOpenGov",
    canonicalRole: "Internationale Mitgliederbewegung",
    description:
      "Internationale Mitgliederbewegung, die offene demokratische Zusammenarbeit organisiert.",
    relationshipToEDebatte: "VoiceOpenGov nutzt eDebatte, besitzt eDebatte aber nicht.",
    target: availableExternalTarget(VOG_SUPPORT_URL),
  },
  {
    id: "vote4gov",
    displayName: "Vote4Gov",
    canonicalRole: "Gesellschaftliche Denkwerkstatt",
    description:
      "Gesellschaftliche Denkwerkstatt für die Weiterentwicklung demokratischer Repräsentation und Beteiligung.",
    relationshipToEDebatte:
      "Vote4Gov ist eigenständig und ersetzt weder eDebatte noch VoiceOpenGov.",
    target: UNAVAILABLE_TARGET,
  },
  {
    id: "voxy",
    displayName: "Voxy",
    canonicalRole: "Transparente Begleitung",
    description:
      "Transparente Begleitung, die Orientierung gibt und nächste Schritte nachvollziehbar macht.",
    relationshipToEDebatte:
      "Voxy begleitet eDebatte und ist weder Eigentümer, Entscheider noch Veröffentlichungsautomatismus.",
    target: UNAVAILABLE_TARGET,
  },
] as const satisfies readonly EcosystemBrand[];

export function getEcosystemBrand(id: EcosystemBrandId): EcosystemBrand {
  const brand = ECOSYSTEM_BRANDS.find((candidate) => candidate.id === id);
  if (!brand) {
    throw new Error(`Unknown ecosystem brand: ${id}`);
  }
  return brand;
}

export function getEcosystemHref(brand: EcosystemBrand): string | null {
  return brand.target.status === "available" ? brand.target.href : null;
}
