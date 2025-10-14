// features/statement/data/statements_demo.ts

/** Basiszählung für Zustimmungen/Neutral/Ablehnungen */
export type VoteTriple = { agree: number; neutral: number; disagree: number };
export type CountryVotes = Record<string, VoteTriple>;

export type EventualityImpact = { type: string; description: string };
export type Eventuality = {
  option: string;
  votes: VoteTriple;
  impact?: EventualityImpact[];
};

export type ImpactSummary = Partial<{
  gesellschaftlich: string;
  sozial: string;
  kulturell: string;
  wirtschaftlich: string;
  menschenrechtlich: string;
}>;

export type VoiceType = "media" | "science" | "ngo";
export type VoiceEntry = {
  type: VoiceType;
  name: string;
  quote: string;
  url?: string;
  country?: string;
  trustScore?: number;
};

export type EditorialSummary = {
  pro?: string[];
  contra?: string[];
  neutral?: string[];
};

export type RelevanceFor = Partial<{
  citizen: string;
  youth: string;
  business: string;
  ngo: string;
  policymaker: string;
}>;

export type RegionalVoice = {
  region: string;
  author: string;
  authorId?: string;
  role?: string;
  medium?: string;
  verified?: boolean;
  statement: string;
  impactAssessment?: Partial<{
    gesellschaftlich: string;
    wirtschaftlich: string;
    sozial: string;
  }>;
  submittedAt?: string;
  redaktionFreigabe?: boolean;
};

export type LocalJournalismAuthor = {
  id: string;
  name: string;
  role?: string;
  medium?: string;
  bio?: string;
  verified?: boolean;
};

export type LocalJournalismComment = {
  authorId: string;
  text: string;
  date: string;
};

export type LocalJournalism = {
  authors?: LocalJournalismAuthor[];
  contribution?: string;
  commentary?: LocalJournalismComment[];
  status?: "pending_review" | "approved" | "rejected";
  redaktionFreigabe?: boolean;
};

export type FactEntry = {
  text: string;
  source?: { name: string; url?: string; trust?: number };
};

export type Alternative = { text: string; impact?: string };

export type DemoStatement = {
  id: string;
  title: string;
  shortText?: string;
  category?: string;
  tags?: string[];
  date?: string;

  countries?: string[];
  regionScope?: string[];

  /** Stimmen je Land/Region (DE/FR/EU/…) */
  countryVotes?: CountryVotes;

  /** Summen über alle Länder */
  votesTotal?: VoteTriple;

  /** Eigene Stimme des Nutzers (Demo) */
  userVote?: "agree" | "neutral" | "disagree";

  /** Entscheidungsäste */
  eventualities?: Eventuality[];

  /** Kurzfazit nach Dimensionen */
  impactSummary?: ImpactSummary;

  /** Stimmen/Quellen */
  voices?: VoiceEntry[];

  /** Redaktionelle Zusammenfassung */
  editorialSummary?: EditorialSummary;

  /** Zielgruppen-Relevanz */
  relevanceFor?: RelevanceFor;

  /** Zusatzmodule (optional) */
  regionalVoices?: RegionalVoice[];
  localJournalism?: LocalJournalism;
  reviewedBy?: string[];
  reviewStatus?: "pending" | "approved" | "rejected";
  redaktionFreigabe?: boolean;

  /** Zusatzfelder aus V1-Demos */
  facts?: FactEntry[];
  alternatives?: Alternative[];

  // Optionale Visualisierungen
  impactBar?: Array<{ label: string; value: number; color: string }>;
  countryList?: Array<{ code: string; label: string; values: [number, number, number] }>;

  /** Persönliche Wirkung/Notiz */
  myImpact?: string;
};

export const demoStatements: DemoStatement[] = [
  {
    id: "statement-001",
    title: "Soll Deutschland die Integration von Geflüchteten durch verpflichtende Sprachkurse fördern?",
    shortText: "Integration Geflüchteter durch Sprachkurse",
    category: "Integration",
    tags: ["Integration", "Sprachkurse", "Migration"],
    countryVotes: {
      DE: { agree: 5000, neutral: 900, disagree: 600 },
      FR: { agree: 1800, neutral: 400, disagree: 200 },
      EU: { agree: 1200, neutral: 200, disagree: 100 }
    },
    votesTotal: { agree: 8000, neutral: 1500, disagree: 900 },
    userVote: "agree",
    eventualities: [
      {
        option: "Pflichtkurse für alle",
        votes: { agree: 4500, neutral: 900, disagree: 1100 },
        impact: [
          { type: "gesellschaftlich", description: "Fördert Zusammenhalt, kann aber Widerstand hervorrufen." },
          { type: "wirtschaftlich", description: "Bessere Jobchancen, potenziell geringere Sozialausgaben." }
        ]
      },
      {
        option: "Freiwillige Kurse, mehr Anreize",
        votes: { agree: 2900, neutral: 200, disagree: 400 },
        impact: [{ type: "sozial", description: "Weniger Zwang, aber geringere Teilnahme." }]
      },
      {
        option: "Individuelle Lösungen",
        votes: { agree: 800, neutral: 100, disagree: 300 },
        impact: [{ type: "sozial", description: "Höhere Risiken von Ausgrenzung." }]
      }
    ],
    impactSummary: {
      gesellschaftlich: "Verpflichtende Kurse erhöhen Zusammenhalt, bringen aber Debatten über Zwang.",
      sozial: "Mehr Teilhabe, aber auch Frustration bei Überforderung.",
      kulturell: "Sprache als Schlüssel zur Identität – Vielfalt und Integration im Spannungsfeld."
    },
    voices: [
      {
        type: "media",
        name: "Süddeutsche Zeitung",
        quote: "Deutsch als Brücke zur Gesellschaft.",
        url: "https://sueddeutsche.de/migration",
        country: "DE",
        trustScore: 0.82
      },
      {
        type: "science",
        name: "DIW",
        quote: "Langfristige Integration sichert Wachstum.",
        url: "https://diw.de/integration",
        country: "DE",
        trustScore: 0.92
      }
    ],
    editorialSummary: {
      pro: ["Pflichtkurse verhindern Ausgrenzung und Parallelgesellschaften.", "Sprache öffnet Türen zu Teilhabe und Arbeitsmarkt."],
      contra: ["Zwang kann Widerstand erzeugen.", "Nicht alle Geflüchteten haben gleiche Voraussetzungen."],
      neutral: ["Integration ist ein Prozess – beide Seiten müssen sich öffnen."]
    },
    relevanceFor: {
      citizen: "Mitbestimmung bei zentralen gesellschaftlichen Weichenstellungen.",
      youth: "Chancengleichheit und Teilhabe für alle.",
      business: "Fachkräfte sichern, Integration fördern.",
      ngo: "Soziale Begleitung und politische Teilhabe für Minderheiten."
    },
    regionalVoices: [
      {
        region: "Bayern",
        author: "Max Mustermann",
        authorId: "user-4711",
        role: "local_journalist",
        medium: "Münchner Merkur",
        verified: true,
        statement: "Gerade im ländlichen Raum zeigen Sprachpatenschaften enorme Wirkung.",
        impactAssessment: {
          gesellschaftlich: "Erhöhte Teilhabe",
          wirtschaftlich: "Stärkere Einbindung in den Arbeitsmarkt"
        },
        submittedAt: "2025-07-28T15:32:00Z",
        redaktionFreigabe: false
      }
    ],
    localJournalism: {
      authors: [
        {
          id: "user-4711",
          name: "Max Mustermann",
          role: "local_journalist",
          medium: "Münchner Merkur",
          bio: "Seit 2012 Politikredakteur, Fokus auf Jugendbeteiligung.",
          verified: true
        }
      ],
      contribution: "Empirische Erkenntnisse aus Oberbayern.",
      commentary: [
        {
          authorId: "user-4711",
          text: "Wahlalter 16 könnte gerade auf dem Land zur neuen Jugendbewegung führen.",
          date: "2025-07-28T15:40:00Z"
        }
      ],
      status: "pending_review",
      redaktionFreigabe: false
    },
    reviewedBy: ["editor-in-chief"],
    reviewStatus: "pending",
    redaktionFreigabe: false,
    myImpact: "Zustimmung 👍",
    date: "2025-07-25",
    facts: [
      {
        text: "Deutschland: 53 % befürworten kontrollierte Zuwanderung.",
        source: { name: "Statistisches Bundesamt", url: "https://destatis.de", trust: 0.9 }
      },
      {
        text: "Frankreich: 48 % für strengere Grenzkontrollen.",
        source: { name: "INSEE", url: "https://www.insee.fr", trust: 0.8 }
      }
    ],
    alternatives: [
      { text: "Individuelle Förderprogramme", impact: "Flexible Lösung, geringere Teilnahme" },
      { text: "Mehr Integration an Schulen", impact: "Langfristig wirksam, organisatorisch aufwendig" }
    ]
  },
  {
    id: "statement-002",
    title: "Soll die EU ihre Außengrenzen weiter ausbauen und besser schützen?",
    shortText: "EU-Grenzschutz verstärken",
    category: "Grenzschutz",
    tags: ["EU", "Grenzen", "Sicherheit"],
    countryVotes: {
      DE: { agree: 2100, neutral: 1400, disagree: 800 },
      FR: { agree: 1400, neutral: 900, disagree: 900 },
      EU: { agree: 1000, neutral: 700, disagree: 300 }
    },
    votesTotal: { agree: 4500, neutral: 3000, disagree: 2000 },
    userVote: "neutral",
    eventualities: [
      {
        option: "Grenzausbau mit High-Tech",
        votes: { agree: 2000, neutral: 700, disagree: 800 },
        impact: [
          {
            type: "sicherheit",
            description: "Effektivere Kontrolle, aber höhere Kosten und Debatten über Menschenrechte."
          }
        ]
      },
      {
        option: "Fokus auf Integration an Grenzen",
        votes: { agree: 1800, neutral: 1300, disagree: 700 },
        impact: [
          {
            type: "gesellschaftlich",
            description: "Mehr Perspektiven für Geflüchtete, gesellschaftliche Debatte bleibt kontrovers."
          }
        ]
      }
    ],
    impactSummary: {
      gesellschaftlich: "Strikter Grenzschutz polarisiert die Gesellschaft.",
      wirtschaftlich: "Erhöhte Kosten, kurzfristige Stabilität.",
      menschenrechtlich: "Risiko von Menschenrechtsverletzungen steigt."
    },
    voices: [
      {
        type: "media",
        name: "Tagesschau",
        quote: "EU setzt zunehmend auf digitale Grenzsicherung.",
        url: "https://tagesschau.de/eu-grenzen",
        country: "EU",
        trustScore: 0.85
      },
      {
        type: "ngo",
        name: "Amnesty International",
        quote: "Grenzschutz darf nicht auf Kosten von Menschenrechten gehen.",
        url: "https://amnesty.de/grenzschutz",
        country: "EU",
        trustScore: 0.9
      }
    ],
    editorialSummary: {
      pro: ["Grenzsicherheit schützt vor irregulärer Migration.", "Digitale Kontrollen ermöglichen bessere Steuerung."],
      contra: ["Gefahr der Abschottung und Menschenrechtsverletzungen.", "Hohe Kosten und technische Komplexität."],
      neutral: ["Balance zwischen Schutz und Offenheit bleibt eine Herausforderung."]
    },
    relevanceFor: {
      policymaker: "Wirkt unmittelbar auf Schutz, Migration und Rechte.",
      citizen: "Zentrale Debatte für die Zukunft der EU.",
      ngo: "Wächterfunktion für Grundrechte.",
      business: "Stabilität des Wirtschaftsraums EU ist betroffen."
    },
    myImpact: "Neutral 🤔",
    date: "2025-07-25",
    facts: [
      {
        text: "EU: 31 Staaten mit gemeinsamen Außengrenzen.",
        source: { name: "Eurostat", url: "https://ec.europa.eu", trust: 0.87 }
      },
      {
        text: "Schutz der EU-Grenzen ist eine Kernkompetenz.",
        source: { name: "EU-Kommission", url: "https://europa.eu", trust: 0.85 }
      }
    ],
    alternatives: [
      { text: "Mehr Fokus auf Integration statt Grenzausbau", impact: "Offenere Gesellschaft, aber Sicherheitsrisiken" },
      { text: "EU-weite Abstimmung der Grenzpolitik", impact: "Harmonisierung, aber komplexer Konsensprozess" }
    ]
  }
];

export default demoStatements;
