// features/utils/ai/youClient.ts
import 'server-only';
import axios, { AxiosError } from 'axios';
import { extractEntities } from './youEntities'; // <- neu

const BASE_URL = 'https://chat-api.you.com';
const YOU_API_KEY = process.env.YOU_API_KEY ?? '';

if (!YOU_API_KEY) console.warn('[youClient] Missing env: YOU_API_KEY');

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'X-API-Key': YOU_API_KEY },
});

export type Citation = { title?: string; url?: string; domain?: string };
export type ExtractedEntity = {
  name: string;
  type: 'PERSON' | 'ORG' | 'COMPANY' | 'GOV' | 'NGO' | 'MEDIA' | 'OTHER';
  mentions?: number;
  urls?: string[];
};

type YouResponse = {
  answer?: string;
  data?: any;
  citations?: Array<{ title?: string; url?: string }>;
  sources?: Array<{ title?: string; url?: string }>;
};

export type YouQueryOptions = {
  instructions?: string;
  locale?: string;
  maxRetries?: number;
  // NEW: investigative toggles
  extractEntities?: boolean;            // leichtgewichtig (Heuristik) + optional LLM
  extractEntitiesMode?: 'lite' | 'llm'; // 'lite' default (kostenarm), 'llm' für tief
  topicHint?: string;                   // optionaler Themen-Hinweis für höhere Präzision
};

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

function toDomain(url?: string) {
  try {
    if (!url) return undefined;
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch { return undefined; }
}

function dedupCitations(items: Array<{ title?: string; url?: string }> = []): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const it of items) {
    const key = (it.url || it.title || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it, domain: toDomain(it.url) });
  }
  // Zusatz: Domain-Dedup (versch. URLs derselben Quelle → nur 1–2 lassen)
  const byDomain = new Map<string, Citation[]>();
  for (const c of out) {
    if (!c.domain) continue;
    const arr = byDomain.get(c.domain) ?? [];
    arr.push(c);
    byDomain.set(c.domain, arr);
  }
  const capped: Citation[] = [];
  const DOMAIN_CAP = 2; // pro Domain max. 2 Zitate
  for (const c of out) {
    if (!c.domain) { capped.push(c); continue; }
    const arr = byDomain.get(c.domain)!;
    if (arr.length <= DOMAIN_CAP) {
      // alle behalten
      if (!capped.includes(c)) capped.push(c);
    } else {
      // nur die ersten 2
      const firstTwo = arr.slice(0, DOMAIN_CAP);
      if (firstTwo.includes(c) && !capped.includes(c)) capped.push(c);
    }
  }
  return capped;
}

function normalizeYouResponse(raw: any) {
  const text =
    raw?.answer ??
    raw?.data?.answer ??
    raw?.summary ??
    raw?.result ??
    (typeof raw === 'string' ? raw : JSON.stringify(raw));

  const rawCitations =
    raw?.citations ??
    raw?.sources ??
    raw?.data?.citations ??
    [];

  const citations = dedupCitations(rawCitations);
  return { text: String(text), citations, raw };
}

async function callARI(query: string, opts: YouQueryOptions): Promise<YouResponse> {
  const params: Record<string, any> = { query };
  if (opts.instructions) params.instructions = opts.instructions;
  if (opts.locale) params.locale = opts.locale;
  const { data } = await http.get('/ari', { params });
  return data;
}
async function callSmart(query: string, opts: YouQueryOptions): Promise<YouResponse> {
  const params: Record<string, any> = { query };
  if (opts.instructions) params.instructions = opts.instructions;
  if (opts.locale) params.locale = opts.locale;
  const { data } = await http.get('/smart', { params });
  return data;
}
async function callSearch(query: string, opts: YouQueryOptions): Promise<YouResponse> {
  const params: Record<string, any> = { query };
  if (opts.locale) params.locale = opts.locale;
  const { data } = await http.get('/search', { params });
  return data;
}

export async function youQuery(
  query: string,
  options: YouQueryOptions = {}
): Promise<{
  text: string;
  citations: Citation[];
  entities?: ExtractedEntity[];
  raw: any;
}> {
  const maxRetries = options.maxRetries ?? 1;

  // 1) ARI
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await callARI(query, options);
      const norm = normalizeYouResponse(res);
      // Entities optional
      if (options.extractEntities) {
        const ents = await extractEntities(norm.text, norm.citations, {
          mode: options.extractEntitiesMode ?? 'lite',
          topicHint: options.topicHint
        });
        return { ...norm, entities: ents };
      }
      return norm;
    } catch (e) {
      const err = e as AxiosError;
      const status = err.response?.status;
      if (status === 403 || status === 404) break; // nicht freigeschaltet
      if (attempt < maxRetries) await wait(250 * (attempt + 1));
      else console.warn('[youClient] ARI failed. Fallback.', status, err.message);
    }
  }

  // 2) Smart
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await callSmart(query, options);
      const norm = normalizeYouResponse(res);
      if (options.extractEntities) {
        const ents = await extractEntities(norm.text, norm.citations, {
          mode: options.extractEntitiesMode ?? 'lite',
          topicHint: options.topicHint
        });
        return { ...norm, entities: ents };
      }
      return norm;
    } catch (e) {
      const err = e as AxiosError;
      if (attempt < maxRetries) await wait(250 * (attempt + 1));
      else console.warn('[youClient] Smart failed. Fallback.', err.response?.status, err.message);
    }
  }

  // 3) Search
  const res = await callSearch(query, options);
  const norm = normalizeYouResponse(res);
  if (options.extractEntities) {
    const ents = await extractEntities(norm.text, norm.citations, {
      mode: options.extractEntitiesMode ?? 'lite',
      topicHint: options.topicHint
    });
    return { ...norm, entities: ents };
  }
  return norm;
}
