// Stimmenstatistik
export interface VoteStats {
  agree: number;
  neutral: number;
  disagree: number;
}

// Quellenangabe mit Vertrauensniveau etc.
export interface ReportSource {
  name: string;
  url?: string;
  type?: string;            // z. B. "ngo", "gov", "opinion"
  country?: string;
  trustScore?: number;      // 0–100 oder eigene Skala
  tags?: string[];
}

// Chart-Datenstruktur
export interface ReportChart {
  type: string;             // z. B. "bar", "pie"
  data: any;                // ideal: typisieren je nach Typ
  title?: string;
  description?: string;
  source?: string;
  colorscheme?: string;
}

// Stimmen aus Regionen mit optionaler Wirkungseinschätzung
export interface RegionalVoice {
  region: string;
  author: string;
  role: string;
  medium?: string;
  verified?: boolean;
  statement: string;
  impactAssessment?: Record<string, string>; // z. B. {"Jugend": "hoch"}
  submittedAt?: string;
  redaktionFreigabe: boolean;
}

// Ergänzende Zitate / O-Töne
export interface VoiceQuote {
  type: string;             // z. B. "Bürger", "Politik", "NGO"
  name: string;
  region?: string;
  quote: string;
  medium?: string;
  verified?: boolean;
}

// Swipe-Statistik pro Nutzer (anonymisiert)
export interface SwipeEntry {
  userId: string;
  decision: "Ja" | "Nein" | "Neutral";
  date: string;
}

// Finale E100+-fähige Reportstruktur
export interface E100Report {
  // Meta
  id: string;
  version?: number;
  deleted?: boolean;
  archived?: boolean;

  // Inhalt
  statementId?: string;
  statementIds?: string[];
  title: string;
  subtitle?: string;
  summary: string;
  details?: string;
  recommendation?: string;

  // Inhalte & Analyse
  topArguments?: { pro: string[]; contra: string[] };
  trends?: string[];
  facts?: string[];
  methodology?: string;
  optAnalysis?: {
    summary?: string;
    societyShift?: string;
    meta?: string;
  };

  // Stimmen & Beteiligung
  regionalVoices?: RegionalVoice[];
  voices?: VoiceQuote[];
  swipes?: SwipeEntry[];

  // Charts & Visuals
  charts?: ReportChart[];
  chartUrls?: Array<{ type: string; url: string }>;
  images?: string[];              // z. B. Vorschaubilder
  imageUrl?: string;              // Hauptbild (Fallback)
  trailerUrl?: string;

  // Beteiligung / Stats
  votes: VoteStats;
  bookmarks?: number;
  likes?: number;

  // Kontext & Filter
  region?: string;
  regions?: string[];
  regionScope?: string[];
  languages: string[];
  tags: string[];
  focusGroups?: string[];

  // Quellen
  sources?: ReportSource[];
  internationalComparison?: Array<{
    country: string;
    votingAge: number;
    effects: string;
  }>;

  // Redaktion & Verwaltung
  author?: string;
  status?: "draft" | "published" | "archived";
  reportAvailable: boolean;
  redaktionFreigabe: boolean;
  reviewedBy?: string[];
  reviewStatus?: string;
  modLog?: Record<string, any>[];

  // Tracking
  analytics?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}
