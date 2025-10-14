//features/utils ai/youEntities.ts
import type { Citation } from './youClient';

export type EntityExtractOptions = {
  mode: 'lite' | 'llm';
  topicHint?: string;
};

export type ExtractedEntity = {
  name: string;
  type: 'PERSON' | 'ORG' | 'COMPANY' | 'GOV' | 'NGO' | 'MEDIA' | 'OTHER';
  mentions?: number;
  urls?: string[];
};

const DOMAIN_HINTS: Record<string, ExtractedEntity['type']> = {
  'ec.europa.eu': 'GOV',
  'bundestag.de': 'GOV',
  'bmwk.de': 'GOV',
  'bmf.gv.at': 'GOV',
  'who.int': 'GOV',
  'un.org': 'GOV',
  'oecd.org': 'GOV',
  'imf.org': 'GOV',
  'worldbank.org': 'GOV',
  'reuters.com': 'MEDIA',
  'apnews.com': 'MEDIA',
  'bbc.com': 'MEDIA',
  'ft.com': 'MEDIA',
  'bloomberg.com': 'MEDIA',
  'faz.net': 'MEDIA',
  'sueddeutsche.de': 'MEDIA',
  'spiegel.de': 'MEDIA',
  'correctiv.org': 'NGO',
  'transparency.org': 'NGO',
};

function fromCitations(citations: Citation[]): ExtractedEntity[] {
  // sehr simple Heuristik: Domain → vermutete Organisation
  const map = new Map<string, ExtractedEntity>();
  for (const c of citations) {
    if (!c.domain) continue;
    const name = (c.domain || '').replace(/^www\./, '');
    const t =
      DOMAIN_HINTS[c.domain] ??
      (name.endsWith('.gov') ? 'GOV' : name.includes('ministry') ? 'GOV' : 'ORG');

    const prev = map.get(name);
    if (prev) {
      prev.mentions = (prev.mentions ?? 1) + 1;
      if (c.url) prev.urls = Array.from(new Set([...(prev.urls ?? []), c.url]));
    } else {
      map.set(name, {
        name,
        type: t,
        mentions: 1,
        urls: c.url ? [c.url] : [],
      });
    }
  }
  return Array.from(map.values());
}

// sehr einfache Named-Entity-Heuristik für Personen/Orgs im Text (nur Großbuchstaben-Folgen)
function scanTextHeuristics(text: string): ExtractedEntity[] {
  const results: ExtractedEntity[] = [];
  const seen = new Set<string>();
  const candidateRegex = /\b([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){0,3})\b/g; // einfache Proper-Noun-Kette
  let m;
  while ((m = candidateRegex.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length < 3) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    results.push({ name, type: 'OTHER', mentions: 1 });
  }
  return results.slice(0, 30); // kappen
}

// OPTIONAL: LLM‑gestützte Tiefe (nutzt deinen Router)
// Implementiere in deinem Projekt: @features/ai/router.llm() (GPT/Mistral/Claude)
// Hier nur ein Hook – falls nicht vorhanden, bleibt es bei lite.
async function llmExtract(text: string, topicHint?: string): Promise<ExtractedEntity[]> {
  if (!process.env.LLM_ROUTER_ENABLED) return [];
  try {
    const prompt = `
Extract key ACTORS (people, companies, NGOs, media, gov bodies) in the text.
Return JSON array with: name, type in [PERSON, COMPANY, ORG, NGO, MEDIA, GOV, OTHER].
Only include entities relevant to: ${topicHint ?? 'the main topic'}.
Text:
"""${text.slice(0, 6000)}"""
    `.trim();

    // Beispiel – passe an deinen Router an
    const resp = await fetch(process.env.LLM_ROUTER_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LLM_ROUTER_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini', // oder mistral-small etc.
        temperature: 0.1,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) return [];
    const data = await resp.json();
    const textOut = data?.choices?.[0]?.message?.content ?? '[]';
    const parsed = JSON.parse(textOut);
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

export async function extractEntities(
  text: string,
  citations: Citation[],
  opts: EntityExtractOptions
): Promise<ExtractedEntity[]> {
  const base = fromCitations(citations);
  const liteText = scanTextHeuristics(text);

  // Merge lite sets
  const map = new Map<string, ExtractedEntity>();
  for (const e of [...base, ...liteText]) {
    const key = e.name.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.mentions = (prev.mentions ?? 1) + (e.mentions ?? 1);
      prev.urls = Array.from(new Set([...(prev.urls ?? []), ...(e.urls ?? [])]));
      if (prev.type === 'OTHER' && e.type !== 'OTHER') prev.type = e.type;
    } else {
      map.set(key, { ...e });
    }
  }
  let merged = Array.from(map.values());

  if (opts.mode === 'llm') {
    const deep = await llmExtract(text, opts.topicHint);
    // Merge deep results
    for (const e of deep) {
      const key = e.name.toLowerCase();
      const prev = map.get(key);
      if (prev) {
        prev.type = prev.type === 'OTHER' ? e.type : prev.type;
        prev.mentions = Math.max(prev.mentions ?? 1, e.mentions ?? 1);
      } else {
        map.set(key, e);
      }
    }
    merged = Array.from(map.values());
  }

  // kleine Normalisierung
  return merged
    .map(e => ({ ...e, name: e.name.trim() }))
    .filter(e => e.name.length >= 3)
    .slice(0, 80);
}
