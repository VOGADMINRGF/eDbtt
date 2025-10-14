// features/report/data/demoStatements.ts

export type VoteTriple = { agree: number; neutral: number; disagree: number };
export type UserVote = "agree" | "neutral" | "disagree";
export type CountryCode = "DE" | "FR" | "ES" | "EU"; // erweitere bei Bedarf

export type DemoStatement = {
  id: string;
  title: string;
  category?: string;

  countries?: CountryCode[];
  regionScope?: string[];
  countryVotes?: Record<CountryCode, VoteTriple>;
  votes?: VoteTriple;
  userVote?: UserVote;
  date?: string; // ISO YYYY-MM-DD
  facts?: string[];
  alternatives?: { text: string }[];

  // V1-kompatibel
  shortText?: string;
  tags?: string[];
  impactBar?: Array<{ label: string; value: number; color: string }>;
  countryList?: Array<{ code: CountryCode; label: string; values: [number, number, number] }>;
  myImpact?: string;
};

const demoStatements: DemoStatement[] = [
  {
    id: "statement-001",
    title: "Soll Deutschland die Integration von Geflüchteten durch verpflichtende Sprachkurse fördern?",
    category: "Integration",
    countries: ["DE", "FR", "EU"],
    regionScope: ["Deutschland", "Frankreich", "EU"],
    countryVotes: {
      DE: { agree: 5000, neutral: 900, disagree: 600 },
      FR: { agree: 1800, neutral: 400, disagree: 200 },
      EU: { agree: 1200, neutral: 200, disagree: 100 },
    },
    votes: { agree: 8000, neutral: 1500, disagree: 900 },
    userVote: "agree",
    date: "2025-07-25",
    facts: [
      "Deutschland: 53 % befürworten kontrollierte Zuwanderung.",
      "Frankreich: 48 % für strengere Grenzkontrollen.",
    ],
    alternatives: [{ text: "Individuelle Förderprogramme" }, { text: "Mehr Integration an Schulen" }],
    shortText: "Integration Geflüchteter durch Sprachkurse",
    tags: ["Integration", "Sprachkurse", "Migration"],
    impactBar: [
      { label: "Zustimmung", value: 75.2, color: "#0cb13b" },
      { label: "Neutral", value: 10.6, color: "#e5b300" },
      { label: "Ablehnung", value: 14.2, color: "#ea3c3c" },
    ],
    countryList: [
      { code: "DE", label: "Deutschland", values: [5000, 900, 600] },
      { code: "FR", label: "Frankreich", values: [1800, 400, 200] },
      { code: "EU", label: "EU", values: [1200, 200, 100] },
    ],
    myImpact: "Zustimmung 👍",
  },
  {
    id: "statement-002",
    title: "Soll die EU ihre Außengrenzen weiter ausbauen und besser schützen?",
    category: "Grenzschutz",
    regionScope: ["Deutschland", "EU", "Spanien"],
    countries: ["DE", "EU", "ES"], // ES statt SP
    countryVotes: {
      DE: { agree: 2100, neutral: 1400, disagree: 800 },
      EU: { agree: 1000, neutral: 700, disagree: 300 },
      ES: { agree: 1400, neutral: 900, disagree: 900 },
    },
    votes: { agree: 4500, neutral: 3000, disagree: 2000 },
    userVote: "neutral",
    date: "2025-07-25",
    facts: [
      "EU: 31 Staaten mit gemeinsamen Außengrenzen.",
      "Schutz der EU-Grenzen ist eine Kernkompetenz.",
    ],
    alternatives: [{ text: "Mehr Fokus auf Integration statt Grenzausbau" }, { text: "EU-weite Abstimmung der Grenzpolitik" }],
    shortText: "EU-Grenzschutz verstärken",
    tags: ["EU", "Grenzen", "Sicherheit"],
    impactBar: [
      { label: "Zustimmung", value: 50.5, color: "#0cb13b" },
      { label: "Neutral", value: 18.3, color: "#e5b300" },
      { label: "Ablehnung", value: 31.2, color: "#ea3c3c" },
    ],
    countryList: [
      { code: "DE", label: "Deutschland", values: [2100, 1400, 800] },
      { code: "EU", label: "EU", values: [1000, 700, 300] },
      { code: "ES", label: "Spanien", values: [1400, 900, 900] },
    ],
    myImpact: "Neutral 🤔",
  },
];

export default demoStatements;
