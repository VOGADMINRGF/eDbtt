export type DemoPersona = "journalist" | "administration" | "citizen";

export type DemoPersonaConfig = {
  id: DemoPersona;
  label: string;
  lead: string;
  priorities: string[];
  defaultModule: "dossier" | "votes" | "mandat" | "factcheck";
};

export const DEMO_PERSONAS: DemoPersonaConfig[] = [
  {
    id: "journalist",
    label: "Journalismus",
    lead: "Fokus auf offene Punkte, Quellenlage, Updates und Exportfaehigkeit.",
    priorities: ["offen", "in Pruefung", "Einspruch", "Quellenlage", "Updates"],
    defaultModule: "votes",
  },
  {
    id: "administration",
    label: "Verwaltung",
    lead: "Fokus auf Zustaendigkeit, Delegation, Umsetzungsstatus, Risiken und Wirkung.",
    priorities: ["delegiert", "Zustaendigkeit", "Umsetzungsgrad", "Wirkung", "Risiken"],
    defaultModule: "mandat",
  },
  {
    id: "citizen",
    label: "Buerger & Creator",
    lead: "Fokus auf Verstehen, Mitwirken und transparente Statusrueckmeldung.",
    priorities: ["community eingereicht", "in Pruefung", "bestaetigt", "Transparenz"],
    defaultModule: "dossier",
  },
];

export function parseDemoPersona(value?: string | null): DemoPersona {
  if (value === "journalist" || value === "administration" || value === "citizen") return value;
  return "citizen";
}

export function getDemoPersonaConfig(persona: DemoPersona): DemoPersonaConfig {
  return DEMO_PERSONAS.find((item) => item.id === persona) ?? DEMO_PERSONAS[2];
}

export function withPersona(href: string, persona: DemoPersona) {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}persona=${encodeURIComponent(persona)}`;
}
