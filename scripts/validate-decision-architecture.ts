import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const part16Candidates = [
  path.join(root, "docs", "E150", "Part16_Anlassraum_Model.md"),
  path.join(root, "docs", "E150", "Part16_Digitale_Entscheidungsarchitektur.md"),
];
const docxPath = path.join(
  root,
  "apps",
  "web",
  "public",
  "docs",
  "DecisionArchitecture_v2_0.docx",
);
const contentPath = path.join(
  root,
  "apps",
  "web",
  "src",
  "content",
  "referenzarchitektur",
  "referenzarchitektur_v2_0.ts",
);

function fail(message: string): never {
  console.error(`[decision-architecture] ${message}`);
  process.exit(1);
}

function ensureFile(filePath: string, label: string) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} fehlt: ${filePath}`);
  }
}

function resolveExistingFile(filePaths: string[], label: string): string {
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) return filePath;
  }
  fail(`${label} fehlt: ${filePaths.join(" | ")}`);
}

function readText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    fail(`Kann Datei nicht lesen: ${filePath}`);
  }
}

function mustMatch(content: string, pattern: RegExp, label: string) {
  if (!pattern.test(content)) {
    fail(`Token fehlt (${label}).`);
  }
}

function mustInclude(content: string, token: string, label?: string) {
  if (!content.includes(token)) {
    fail(`Token fehlt (${label ?? token}).`);
  }
}

const part16Path = resolveExistingFile(part16Candidates, "Part16");
ensureFile(docxPath, "DecisionArchitecture_v2_0.docx");
ensureFile(contentPath, "referenzarchitektur_v2_0.ts");

const part16 = readText(part16Path);

if (/turn\d+search\d+/i.test(part16)) {
  fail("Platzhalter turn<d>search<d> im Part16 entdeckt.");
}

// Required tokens in Part16
const requiredPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "Schlüsselwörter oder Abstract", pattern: /(Schlüsselwörter|Abstract)/i },
  { label: "Forschungsfrage F1", pattern: /\bF1\b/ },
  { label: "Forschungsfrage F2", pattern: /\bF2\b/ },
  { label: "Forschungsfrage F3", pattern: /\bF3\b/ },
  { label: "Abgrenzung", pattern: /Abgrenzung/i },
  { label: "Input", pattern: /Input/i },
  { label: "Output", pattern: /Output/i },
  { label: "Throughput", pattern: /Throughput/i },
  { label: "Rechenschaft", pattern: /Rechenschaft/i },
  { label: "Accountability", pattern: /Accountability/i },
  { label: "Behauptungen", pattern: /Behauptungen/i },
  { label: "Quellen", pattern: /Quellen/i },
  { label: "Prüffragen", pattern: /Prüffragen/i },
  { label: "Handlungsoptionen", pattern: /Handlungsoptionen/i },
  { label: "Auswirkungen", pattern: /Auswirkungen/i },
  { label: "Normative Mindestanforderungen", pattern: /Normative Mindestanforderungen/i },
  { label: "unbestätigt", pattern: /unbestätigt/i },
  { label: "teilbestätigt", pattern: /teilbestätigt/i },
  { label: "bestätigt", pattern: /bestätigt/i },
  { label: "widerlegt", pattern: /widerlegt/i },
  { label: "Dossier-Reifegrad", pattern: /Dossier-Reifegrad/i },
  { label: "entscheidungsreif", pattern: /entscheidungsreif/i },
  { label: "Pfad A", pattern: /Pfad\s*A/i },
  { label: "Pfad B", pattern: /Pfad\s*B/i },
  { label: "Pfad C", pattern: /Pfad\s*C/i },
  { label: "Ombud", pattern: /Ombud/i },
  { label: "RACI", pattern: /RACI/i },
  { label: "Auditierbarkeit", pattern: /Auditierbarkeit/i },
  { label: "Versionierung", pattern: /Versionierung/i },
  { label: "Nachweisführung", pattern: /Nachweisführung/i },
  { label: "Provenienz", pattern: /Provenienz/i },
  { label: "W3C", pattern: /W3C/i },
  { label: "PROV", pattern: /PROV/i },
  { label: "Kosten- und Nutzenlogik", pattern: /Kosten- und Nutzenlogik/i },
  { label: "Pilotkonzept", pattern: /Pilotkonzept/i },
  { label: "12 Wochen", pattern: /12\s*Wochen/i },
  { label: "5–10 Themen", pattern: /5\s*[–-]\s*10\s*Themen/i },
  { label: "Methodik", pattern: /Methodik/i },
  { label: "Gestaltungsforschung", pattern: /Gestaltungsforschung/i },
  { label: "Design Science", pattern: /Design Science/i },
  { label: "DFG", pattern: /DFG/i },
  { label: "Risiken", pattern: /Risiken/i },
  { label: "Schutzmechanismen", pattern: /Schutzmechanismen/i },
  { label: "Publikations- und Referenzstrategie", pattern: /Publikations- und Referenzstrategie/i },
  { label: "Zitiervorschlag", pattern: /Zitiervorschlag/i },
];

requiredPatterns.forEach(({ label, pattern }) => mustMatch(part16, pattern, label));

const contentRaw = readText(contentPath);

mustInclude(contentRaw, "/docs/DecisionArchitecture_v2_0.docx", "Download-Link DOCX");

const tocStart = contentRaw.indexOf("toc:");
const tocEnd = contentRaw.indexOf("faqShort", tocStart);
if (tocStart < 0 || tocEnd < 0) {
  fail("toc-Block in referenzarchitektur_v2_0.ts nicht gefunden.");
}
const tocBlock = contentRaw.slice(tocStart, tocEnd);
const tocIds = Array.from(tocBlock.matchAll(/id:\s*\"([^\"]+)\"/g)).map((m) => m[1]);

const expectedOrder = [
  "ausgangslage",
  "begriffe-rahmen",
  "fuenf-bausteine",
  "prozess-vom-beitrag-zum-mandat",
  "governance",
  "audit-versionierung-nachweis",
  "kosten-nutzen",
  "pilot-12-wochen",
  "methodik-evaluation",
  "risiken-schutz",
  "publikation-referenz",
  "downloads",
  "feedback",
];

if (tocIds.join(",") !== expectedOrder.join(",")) {
  fail(`toc Reihenfolge stimmt nicht. Erwartet: ${expectedOrder.join(", ")}`);
}

console.log("[decision-architecture] OK");
