// apps/web/src/features/analyze/analyzeText.ts
import type { ExtractOutputV4 } from "./wrapper";
import { extractV4, findContradictions } from "./wrapper";
import { stanceFor, DEMAND_MARKER, EVENTUALITY_MARKER, claimWeight } from "./argumentation";

/** ===== Types für Report ===== */
export type ExpertId = "journalist" | "political_scientist" | "sociologist" | "geoscientist" | "critic";
export type ExpertAssessment = {
  expert: ExpertId;
  score: number;          // 0..1
  notes: string[];
  flags: string[];        // z.B. "no-evidence", "vague-timeframe"
};

export type Thesis = {
  thesisId: string;
  claimId: string;
  text: string;
  domain: string;
  topic?: string;
  policyInstrument?: string | null;
  stanceSummary: { pro: number; contra: number; neutral: number };
};

export type Argument = {
  argId: string;
  claimId: string;
  thesisId: string;
  text: string;
  stance: "Pro" | "Contra" | "Neutral";
  evidence: string[];
  confidence: number;
};

export type Eventuality = {
  groupId: string;
  optionId: string;
  text: string;
  normalized: string;
  linkedClaimId: string;
};

export type FactCheckStatus = "unverified" | "inconsistent" | "supported" | "needs_review";
export type ClaimFactCheck = {
  claimId: string;
  status: FactCheckStatus;
  hints: string[];  // was zu prüfen ist (z. B. §-Zitate, Prozent, Datum)
};

export type TrustScore = {
  claimId: string;
  score: number; // 0..1
  factors: string[];
};

export type AnalyzeReport = {
  meta: {
    language: "de";
    mainTopics: string[];       // Top-Domains (max 3)
    subTopics: string[];        // Top-Topics (max 5)
  };
  base: ExtractOutputV4;        // Roh-Claims
  theses: Thesis[];
  arguments: Argument[];
  eventualities: Eventuality[];
  expertAssessments: Record<string, ExpertAssessment[]>; // by claimId
  factCheck: ClaimFactCheck[];
  trust: TrustScore[];
  ballots: {
    primaryQuestion: string | null;
    options: string[];
    okToSplitEventualities: boolean;
    reason: string;
  };
};

/** ===== kleine Helfer ===== */
function byFreq<T extends string>(arr: T[], max = 5): T[] {
  const m = new Map<T, number>();
  for (const a of arr) m.set(a, (m.get(a) || 0) + 1);
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, max).map(([k])=>k);
}
function mkId(prefix: string, s: string) {
  let h = 2166136261 >>> 0;
  for (let i=0;i<s.length;i++) h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0;
  return `${prefix}_${h.toString(36)}`;
}
function normalizeOption(s: string) {
  return s.toLowerCase().replace(/\s+/g," ").trim();
}

/** ===== 1) Thesen auswählen ===== */
function selectTheses(base: ExtractOutputV4): Thesis[] {
  const clusters = new Map<string, typeof base.claims>();
  for (const c of base.claims) {
    const topic = c.categorySubs?.[0] ?? "";
    const key = `${c.categoryMain}::${topic}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(c);
  }

  const theses: Thesis[] = [];
  for (const [key, list] of clusters) {
    const [domain, topic] = key.split("::");
    const sorted = [...list].sort((a,b) =>
      claimWeight(b.claimType ?? null, b.text.length) - claimWeight(a.claimType ?? null, a.text.length)
    );
    const pick = sorted.find(c => /Forderung|Prognose|Fakt/i.test(c.claimType || "")) ?? sorted[0];
    if (!pick) continue;

    theses.push({
      thesisId: mkId("th", pick.id + "::" + key),
      claimId: pick.id,
      text: pick.text,
      domain,
      topic: topic || undefined,
      policyInstrument: pick.policyInstrument ?? null,
      stanceSummary: { pro: 0, contra: 0, neutral: 0 },
    });
  }
  const domOrder = byFreq(base.claims.map(c => c.categoryMain), 3);
  return theses.sort((a,b)=> domOrder.indexOf(a.domain) - domOrder.indexOf(b.domain)).slice(0, 3);
}

/** ===== 2) Argumente den Thesen zuordnen ===== */
function mapArguments(base: ExtractOutputV4, theses: Thesis[]): Argument[] {
  const out: Argument[] = [];
  for (const th of theses) {
    for (const c of base.claims) {
      const sameDomain = c.categoryMain === th.domain;
      const sameTopic = !th.topic || c.categorySubs?.includes(th.topic);
      if (!sameDomain || !sameTopic) continue;
      if (c.id === th.claimId) continue;

      const stance = stanceFor(c.text);
      out.push({
        argId: mkId("arg", th.thesisId + "::" + c.id),
        claimId: c.id,
        thesisId: th.thesisId,
        text: c.text,
        stance,
        evidence: c.evidence ?? [],
        confidence: Math.max(0.4, (c.confidence ?? 0.6) - (stance === "Neutral" ? 0.05 : 0))
      });
    }
  }
  return out;
}

/** ===== 3) Eventualitäten erkennen ===== */
function extractEventualities(base: ExtractOutputV4): Eventuality[] {
  const evts: Eventuality[] = [];
  for (const c of base.claims) {
    if (!EVENTUALITY_MARKER.test(c.text)) continue;
    const parts = c.text.split(/\b(oder|alternativ|variante)\b/i).map(s=>s.trim()).filter(Boolean);
    const options = parts.length > 1 ? parts : [c.text];
    const groupId = mkId("optg", c.id);
    for (const opt of options.slice(0, 5)) {
      const norm = normalizeOption(opt);
      const optionId = mkId("opt", groupId + "::" + norm);
      if (!evts.some(e => e.groupId===groupId && e.normalized===norm)) {
        evts.push({ groupId, optionId, text: opt, normalized: norm, linkedClaimId: c.id });
      }
    }
  }
  return evts;
}

/** ===== 4) Virtuelle Expert*innen (heuristisch, offline) ===== */
function evalJournalist(c: ExtractOutputV4["claims"][number]): ExpertAssessment {
  const notes: string[] = [];
  let score = 0.55;
  if (c.evidence?.length) { score += Math.min(0.2, c.evidence.length * 0.04); }
  else { notes.push("Keine Evidenz-Snippets erkannt"); }
  if (c.text.length <= 140) score += 0.05; else notes.push("Sehr lang (>140)");
  if (c.claimType === "Fakt") score += 0.05;
  if (!c.policyInstrument && /Forderung/.test(c.claimType || "")) notes.push("Instrument nicht benannt");
  return { expert: "journalist", score: Math.max(0, Math.min(1, score)), notes, flags: notes.map(n=>n.toLowerCase().replace(/\s+/g,"-")) };
}
function evalPoliticalScientist(c: ExtractOutputV4["claims"][number]): ExpertAssessment {
  const notes: string[] = [];
  let score = 0.55;
  if (c.policyInstrument) score += 0.1; else notes.push("Kein Policy-Instrument");
  if (c.ballotDimension) score += 0.05;
  if (c.categorySubs?.length) score += 0.05;
  if (/Organisation\/Prozess|Gesetz\/Regel/.test(c.ballotDimension || "")) score += 0.05;
  return { expert: "political_scientist", score: Math.min(1, score), notes, flags: notes.map(n=>n.toLowerCase().replace(/\s+/g,"-")) };
}
function evalSociologist(c: ExtractOutputV4["claims"][number]): ExpertAssessment {
  const notes: string[] = [];
  let score = 0.5;
  if (c.targets?.length) score += 0.1; else notes.push("Betroffenengruppen fehlen");
  if (/Teilhabe|Gleichstellung|Kindergrundsicherung|Obdachlosigkeit/i.test(c.text)) score += 0.05;
  return { expert: "sociologist", score: Math.min(1, score), notes, flags: notes.map(n=>n.toLowerCase().replace(/\s+/g,"-")) };
}
function evalGeoscientist(c: ExtractOutputV4["claims"][number]): ExpertAssessment {
  const notes: string[] = [];
  let score = 0.5;
  if (/(Klimaanpassung|Wärmeplanung|Erneuerbare|Biodiversität|Lärmschutz|Smart City)/i.test(c.text)) score += 0.1;
  if (c.region) score += 0.05; else notes.push("Kein Raumbezug (ok, wenn nicht relevant)");
  return { expert: "geoscientist", score: Math.min(1, score), notes, flags: notes.map(n=>n.toLowerCase().replace(/\s+/g,"-")) };
}
function evalCritic(c: ExtractOutputV4["claims"][number]): ExpertAssessment {
  const notes: string[] = [];
  let score = 0.5;
  if (c.text.length > 170) { score -= 0.05; notes.push("Sehr nah an 180 Zeichen"); }
  if (!/(ist|hat|erhöht|senkt|verbietet|erlaubt|führt zu|fordert)/i.test(c.text)) { score -= 0.1; notes.push("Verb fehlt/unklar"); }
  if (!c.evidence?.length) score -= 0.05;
  return { expert: "critic", score: Math.max(0, score), notes, flags: notes.map(n=>n.toLowerCase().replace(/\s+/g,"-")) };
}
function assessByExperts(base: ExtractOutputV4): Record<string, ExpertAssessment[]> {
  const out: Record<string, ExpertAssessment[]> = {};
  for (const c of base.claims) {
    out[c.id] = [
      evalJournalist(c),
      evalPoliticalScientist(c),
      evalSociologist(c),
      evalGeoscientist(c),
      evalCritic(c),
    ];
  }
  return out;
}

/** ===== 5) Fact-Check Hooks (nur Vorbereitung, keine Websuche hier) ===== */
function planFactCheck(base: ExtractOutputV4): ClaimFactCheck[] {
  const res: ClaimFactCheck[] = [];
  for (const c of base.claims) {
    const hints = [...(c.evidence || [])];
    if (/§/.test(c.text) && !hints.some(h => h.includes("§"))) hints.push("§-Angabe präzisieren");
    if (/\b\d{1,3}\s?%\b/.test(c.text) && !hints.some(h => /%/.test(h))) hints.push("Prozentangabe verifizieren");
    const status: FactCheckStatus =
      (c.claimType === "Fakt" && hints.length >= 1) ? "needs_review" : "unverified";
    res.push({ claimId: c.id, status, hints });
  }
  return res;
}

/** ===== 6) Trust-Score pro Claim ===== */
function computeTrustScores(
  base: ExtractOutputV4,
  expert: Record<string, ExpertAssessment[]>,
  contradictions: Array<[string,string]>
): TrustScore[] {
  const scores: TrustScore[] = [];
  const contraSet = new Set(contradictions.flat());

  for (const c of base.claims) {
    const ass = expert[c.id] || [];
    const avg = ass.reduce((s,a)=>s+a.score, 0) / (ass.length || 1);

    const factors: string[] = [];
    let score = 0.5 * avg;

    if (c.evidence?.length) { score += Math.min(0.2, c.evidence.length * 0.04); factors.push("evidence"); }
    if (c.claimType === "Fakt") { score += 0.05; factors.push("type:fakt"); }
    if (c.policyInstrument) { score += 0.03; factors.push("instrument"); }
    if (c.text.length <= 140) { score += 0.02; factors.push("concise"); }
    if (contraSet.has(c.text)) { score -= 0.08; factors.push("contradiction-risk"); }

    score = Math.max(0, Math.min(1, score));
    scores.push({ claimId: c.id, score, factors });
  }
  return scores;
}

/** ===== 7) Frage vorschlagen + Sinncheck Eventualitäten ===== */
function proposePrimaryQuestion(theses: Thesis[]): string | null {
  if (!theses.length) return null;
  const t = theses[0].text;
  const m = t.match(/.*\b(soll|muss)\b(.+)/i);
  if (m) return `Soll${m[2].trim().replace(/\.*$/, "")}?`;
  return `Unterstützen Sie folgende Maßnahme: ${t.replace(/\.*$/, "")}?`;
}
function senseCheck(evts: Eventuality[]): { ok: boolean; reason: string } {
  if (!evts.length) return { ok: true, reason: "Keine Eventualitäten erkannt." };
  const groups = new Map<string, number>();
  for (const e of evts) groups.set(e.groupId, (groups.get(e.groupId) || 0) + 1);
  const multi = [...groups.values()].some(n => n >= 2);
  return multi
    ? { ok: true, reason: "Mindestens eine Gruppe enthält ≥2 unterscheidbare Optionen." }
    : { ok: false, reason: "Nur eine Option → getrennte Abstimmung würde Doppelungen erzeugen." };
}

/** ===== Hauptfunktion: vollständiger Analyse-Report ===== */
export function analyzeTextToReport(text: string): AnalyzeReport {
  const base = extractV4(text);

  const mainTopics = byFreq(base.claims.map(c => c.categoryMain), 3);
  const subTopics = byFreq(base.claims.flatMap(c => c.categorySubs || []), 5);

  const theses = selectTheses(base);
  const args = mapArguments(base, theses);
  const evts = extractEventualities(base);

  // Stance-Zusammenfassung
  const stanceIdx = new Map<string, { pro: number; contra: number; neutral: number }>();
  for (const th of theses) stanceIdx.set(th.thesisId, { pro: 0, contra: 0, neutral: 0 });
  for (const a of args) {
    const row = stanceIdx.get(a.thesisId)!;
    if (a.stance === "Pro") row.pro++;
    else if (a.stance === "Contra") row.contra++;
    else row.neutral++;
  }
  for (const th of theses) th.stanceSummary = stanceIdx.get(th.thesisId)!;

  // Expertenbewertungen
  const expertAssessments = assessByExperts(base);

  // Widersprüche global
  const contradictions = findContradictions(base.claims.map(c => ({ text: c.text, categoryMain: c.categoryMain })));

  // Fact-Check-Plan & Trust-Score
  const factCheck = planFactCheck(base);
  const trust = computeTrustScores(base, expertAssessments, contradictions);

  // Abstimmungsfrage
  const primaryQuestion = proposePrimaryQuestion(theses);
  const sc = senseCheck(evts);

  return {
    meta: { language: "de", mainTopics, subTopics },
    base,
    theses,
    arguments: args,
    eventualities: evts,
    expertAssessments,
    factCheck,
    trust,
    ballots: {
      primaryQuestion,
      options: evts.map(e => e.text),
      okToSplitEventualities: sc.ok,
      reason: sc.reason,
    },
  };
}
