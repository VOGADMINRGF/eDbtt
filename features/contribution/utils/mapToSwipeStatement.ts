// features/contribution/utils/mapToSwipeStatement.ts
import crypto from "crypto";
import Ajv from "ajv";
import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "apps/web/scripts/data/statementSchema.json");
const statementSchema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(statementSchema);

type ProviderLink = { url: string; type: "Quelle"|"Info"|"Medien" };
type ProviderMedia = { filename: string; type: string; mimeType: string; previewUrl?: string };
type ProviderResult = {
  provider?: string; model?: string; originalLanguage?: string;
  statements: { text: string; tags?: string[] }[];
  alternatives?: { text: string; type: "community"|"redaktion"|"ki" }[];
  facts?: string[]; topics?: string[]; level?: "kommunal"|"regional"|"national"|"eu"|"global";
  context?: string; links?: ProviderLink[]; media?: ProviderMedia[];
  translations?: { de?: string; en?: string };
  ariMeta?: { trustScore?: number; laymanExplanation?: string };
};

function idOf(text: string, region?: string) {
  return crypto.createHash("sha256").update(`${text}|${region||""}`).digest("hex").slice(0, 12);
}

function buildRegionScope(user?: { region?: string; iso?: string; name?: string }) {
  if (!user?.region && !user?.name) {
    return [{ name: "Global", type: "global" }];
  }
  return [{
    name: user.name || user.region!, iso: user.iso || "", type: "region",
  }];
}

function impactLogicFrom(alts?: { text:string; type:string }[]) {
  const base = (alts || []).slice(0, 3).map(a => ({
    type: a.type,
    description: { einfach: a.text, eloquent: a.text }
  }));
  return base.length ? base : [{
    type: "ki",
    description: { einfach: "Auswirkungen werden noch erhoben.", eloquent: "Die Wirkungslogik wird nach Redaktionsprüfung ergänzt." }
  }];
}

function alternativesFrom(alts?: { text:string; type:string }[]) {
  return (alts || []).map(a => ({
    text: a.text, type: a.type, impact: a.text,
    votes: { agree: 0, neutral: 0, disagree: 0 }
  }));
}

export function mapToSwipeStatements(
  p: ProviderResult,
  user?: { id?: string; locale?: string; region?: string; iso?: string; name?: string }
) {
  const now = new Date().toISOString();
  const regionScope = buildRegionScope(user);
  const lang = user?.locale || "de";

  return (p.statements || []).map((s) => {
    const id = idOf(s.text, regionScope?.[0]?.name);
    const base: any = {
      id,
      title: s.text.replace(/\?*$/, "?"),
      statement: s.text.slice(0, 280),
      plainStatement: s.text,
      shortText: s.text.slice(0, 120),
      category: (p.topics && p.topics[0]) || "Sonstiges",
      tags: s.tags || [],
      confidence: 0.6,
      context: p.context || "",
      cluster: (p.topics || []).join(", "),
      sources: (p.links || []).filter(l => l.type !== "Medien").map(l => l.url),
      votingRule: {},
      reviewLog: [],
      trustScore: p.ariMeta?.trustScore ?? 0,
      badge: "",
      graphEdges: [],
      impactScore: 0,
      ethicScore: 0,
      policyFit: false,
      solidarityScore: 0,
      communityIndex: 0,
      laymanExplanation: p.ariMeta?.laymanExplanation || "",
      provenance: [{ provider: p.provider || "gpt", model: p.model || "", at: now }],
      language: lang,
      originalLanguage: p.originalLanguage || lang,
      translations: { de: p.translations?.de || s.text, en: p.translations?.en || "" },
      regionScope,
      imageUrl: "",
      media: (p.media || []).map(m => m.previewUrl || m.filename),
      publishedAt: now, createdAt: now, updatedAt: now,
      createdBy: user?.id || "",
      votes: { agree: 0, neutral: 0, disagree: 0, requiredMajority: 0.5 },
      impactLogic: impactLogicFrom(p.alternatives),
      myImpact: "",
      alternatives: alternativesFrom(p.alternatives),
      eventualities: [],
      arguments: { pro: [], contra: [] },
      summary: { einfach: p.translations?.de || s.text, eloquent: p.translations?.de || s.text },
      recommendation: { einfach: "", eloquent: "" },
      facts: (p.facts || []).map((txt, i) => ({
        text: txt,
        source: p.links?.[i]?.url ? { name: "", url: p.links[i].url, trustScore: 0 } : undefined
      })),
      voices: [], regionalVoices: [],
      localJournalism: {}, editorialSummary: {},
      reviewStatus: "pending", reviewedBy: [], redaktionFreigabe: false,
      topComments: [], relatedStatements: [], relatedReports: [],
      reportAvailable: false,
      visibility: "public", status: "draft", importance: "normal",
      accessibilityStatus: "unknown", barrierescore: 0, moderationStatus: "unreviewed",
      aiAnnotations: { toxicity: 0, sentiment: "neutral", subjectAreas: p.topics || [] },
      semanticLinks: {}, customFields: {},
      historyLog: [{ action: "created", by: "system", at: now }],
      userActions: []
    };

    if (!validate(base)) {
      const msg = ajv.errorsText(validate.errors, { separator: " | " });
      throw new Error(`SwipeStatement Schema-Fehler (${id}): ${msg}`);
    }
    return base;
  });
}
