export const REFERENZARCHITEKTUR_V2_0 = {
  version: "v2.0",
  docDate: "15. Februar 2026",
  title: "Digitale Entscheidungsarchitektur",
  subtitle: "Ein Strukturmodell für legitime Mehrheitsbildung im 21. Jahrhundert",
  disclaimer: "Arbeitsfassung (ohne institutionellen Anspruch)",
  downloads: {
    docx: { href: "/docs/DecisionArchitecture_v2_0.docx", label: "Vollfassung (DOCX)" },
  },
  toc: [
    { id: "ausgangslage", label: "Ausgangslage und Problemraum" },
    { id: "begriffe-rahmen", label: "Begriffe und theoretischer Rahmen" },
    { id: "fuenf-bausteine", label: "Strukturmodell: fünf Bausteine" },
    { id: "prozess-vom-beitrag-zum-mandat", label: "Prozessmodell: vom Beitrag zum Mandat" },
    { id: "governance", label: "Governance-Modell" },
    { id: "audit-versionierung-nachweis", label: "Auditierbarkeit, Versionierung, Nachweisführung" },
    { id: "kosten-nutzen", label: "Kosten- und Nutzenlogik" },
    { id: "pilot-12-wochen", label: "Pilotkonzept (12 Wochen)" },
    { id: "methodik-evaluation", label: "Methodik und Evaluationsdesign" },
    { id: "risiken-schutz", label: "Risiken, Grenzen, Schutzmechanismen" },
    { id: "publikation-referenz", label: "Publikations- und Referenzstrategie" },
    { id: "downloads", label: "Downloads" },
    { id: "feedback", label: "Feedback / Kontakt" },
  ],
  faqShort: [
    {
      q: "Wofür ist diese Referenzarchitektur gedacht?",
      a: "Sie adressiert ein strukturelles Problem moderner Entscheidungsprozesse: institutionelle Überlastung durch unstrukturierte Beiträge. Die Referenz beschreibt Informationsarchitektur, Legitimationslogik und Governance-Modell so, dass Ergebnisse nachvollziehbar werden.",
    },
    {
      q: "Warum keine politische Vereinheitlichung?",
      a: "Die EU-Rahmung zielt auf Koordination und Interoperabilität, nicht auf politische Vereinheitlichung. Verfahren bleiben lokal anschlussfähig, die Logik der Nachweisführung ist kompatibel.",
    },
    {
      q: "Ist das schon ein offizielles Regelwerk?",
      a: "Nein. Es ist eine Arbeitsfassung ohne institutionellen Anspruch. Details und der Zitiervorschlag stehen in der Vollfassung (DOCX).",
    },
    {
      q: "Welche Rolle spielen Quellen und Prüfpfade?",
      a: "Quellenpflicht, Prüfpfade A/B/C, Ombud und RACI sorgen für Rechenschaft/Accountability. Damit bleibt die Legitimationslogik transparent.",
    },
    {
      q: "Wie wird der Erfolg im Pilot gemessen?",
      a: "Über klare Evaluationskriterien im 12-Wochen-Pilot, inkl. Dossier-Reifegrad, Entscheidungsreife und Nachvollziehbarkeit. Details in der Vollfassung (DOCX).",
    },
  ],
  sections: {
    "ausgangslage": {
      title: "Ausgangslage und Problemraum",
      body: [
        "Öffentliche Debatten stehen unter strukturellem Druck. Unstrukturierte Texte erzeugen institutionelle Überlastung und verhindern, dass Quellen, Optionen und Verantwortlichkeiten dauerhaft nachvollziehbar bleiben.",
        "Die Referenzarchitektur beschreibt eine Informationsarchitektur, die Beiträge in überprüfbare Bausteine überführt. Details in der Vollfassung (DOCX).",
      ],
    },
    "begriffe-rahmen": {
      title: "Begriffe und theoretischer Rahmen",
      body: [
        "Kernbegriffe sind Input/Output/Throughput, Rechenschaft/Accountability und die Legitimationslogik eines Verfahrens. Abgrenzung: Es geht um Struktur, nicht um inhaltliche Vorgaben.",
        "Forschungsfragen F1, F2, F3 und die Abgrenzung werden in der Vollfassung ausgeführt. Details in der Vollfassung (DOCX).",
      ],
    },
    "fuenf-bausteine": {
      title: "Strukturmodell: fünf Bausteine",
      body: [
        "Die fünf Bausteine sind: Behauptungen, Quellen, Prüffragen, Handlungsoptionen und Auswirkungen. Daraus ergibt sich eine klare Informationsarchitektur für Dossiers.",
        "Normative Mindestanforderungen sichern Quellenpflicht, Optionspluralität und Zuständigkeitsbindung. Details in der Vollfassung (DOCX).",
      ],
    },
    "prozess-vom-beitrag-zum-mandat": {
      title: "Prozessmodell: vom Beitrag zum Mandat",
      body: [
        "Beiträge durchlaufen eine Statuslogik (unbestätigt, teilbestätigt, bestätigt, widerlegt) und werden auf Dossier-Reifegrad geprüft, bis sie entscheidungsreif sind.",
        "Das Prozessmodell verbindet Quellenprüfung, offene Prüffragen und Mandatslogik. Details in der Vollfassung (DOCX).",
      ],
    },
    "governance": {
      title: "Governance-Modell",
      body: [
        "Das Governance-Modell definiert Prüfpfade A/B/C, Ombud, RACI-Rollen und klare Zuständigkeiten. Ziel ist Nachvollziehbarkeit ohne politische Vereinheitlichung.",
        "EU-Rahmung bedeutet Koordination und Interoperabilität über kompatible Standards, nicht inhaltliche Gleichschaltung. Details in der Vollfassung (DOCX).",
      ],
    },
    "audit-versionierung-nachweis": {
      title: "Auditierbarkeit, Versionierung, Nachweisführung",
      body: [
        "Auditierbarkeit und Versionierung sichern Nachweisführung/Provenienz. Technisch orientiert sich das Modell an W3C PROV und klaren Änderungsprotokollen.",
        "Ziel ist eine überprüfbare Herkunftskette für Dossiers und Entscheidungen. Details in der Vollfassung (DOCX).",
      ],
    },
    "kosten-nutzen": {
      title: "Kosten- und Nutzenlogik",
      body: [
        "Die Kosten- und Nutzenlogik misst Aufwand gegen Strukturgewinn: weniger Reibung, höhere Wiederverwendbarkeit, bessere Legitimation.",
        "Bewertungen bleiben kontextabhängig, das Modell liefert Vergleichsmaßstäbe. Details in der Vollfassung (DOCX).",
      ],
    },
    "pilot-12-wochen": {
      title: "Pilotkonzept (12 Wochen)",
      body: [
        "Das Pilotkonzept umfasst 12 Wochen und 5–10 Themen mit klarer Umsetzungsreichweite. Ergebnis ist ein belastbarer Referenz-Datensatz.",
        "Der Pilot dient dem Nachweis von Prozessqualität und Entscheidungsreife. Details in der Vollfassung (DOCX).",
      ],
    },
    "methodik-evaluation": {
      title: "Methodik und Evaluationsdesign",
      body: [
        "Methodik: Gestaltungsforschung/Design Science mit Feld-Evaluation. Ergänzend dient der DFG-Kodex als Referenzrahmen für wissenschaftliche Praxis.",
        "Evaluationskriterien verbinden Governance-Qualität und Nachvollziehbarkeit. Details in der Vollfassung (DOCX).",
      ],
    },
    "risiken-schutz": {
      title: "Risiken, Grenzen, Schutzmechanismen",
      body: [
        "Risiken betreffen Überlastung, Qualitätsgefälle, Manipulation. Schutzmechanismen sind Prüfpfade, Ombud und Transparenzregeln.",
        "Das Modell priorisiert Integrität und Dokumentation. Details in der Vollfassung (DOCX).",
      ],
    },
    "publikation-referenz": {
      title: "Publikations- und Referenzstrategie",
      body: [
        "Die Publikations- und Referenzstrategie sieht Versionierung, Zitiervorschlag und Lizenzklarheit vor. Das Referenzdokument bleibt die DOCX-Vollfassung.",
        "Die Landingpage stellt nur Auszüge bereit und verweist auf die Vollfassung. Details in der Vollfassung (DOCX).",
      ],
    },
    "downloads": {
      title: "Downloads",
      body: [
        "Alle Downloads sind versioniert (v2.0). Der Volltext steht ausschließlich als DOCX bereit.",
      ],
    },
    "feedback": {
      title: "Feedback / Kontakt",
      body: [
        "Hinweise, Korrekturen und Fragen willkommen. Bitte die Vollfassung referenzieren und konkrete Abschnitts-IDs nennen.",
      ],
    },
  },
} as const;
