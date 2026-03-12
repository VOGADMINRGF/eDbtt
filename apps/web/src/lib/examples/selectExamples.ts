import { ExampleItem } from "./types";
import { SEED_EXAMPLES } from "./seedExamples";

type Bucket = "WORLD" | "EU" | "NEIGHBORS" | "HOME_COUNTRY" | "HOME_REGION" | "HOME_LOCAL";

const DE_REGION_ALIAS: Record<string, string> = {
  bw: "BW",
  "baden-württemberg": "BW",
  "baden-wuerttemberg": "BW",
  by: "BY",
  bayern: "BY",
  bavaria: "BY",
  be: "BE",
  berlin: "BE",
  bb: "BB",
  brandenburg: "BB",
  hb: "HB",
  bremen: "HB",
  hh: "HH",
  hamburg: "HH",
  he: "HE",
  hessen: "HE",
  mv: "MV",
  "mecklenburg-vorpommern": "MV",
  ni: "NI",
  niedersachsen: "NI",
  nw: "NW",
  "nordrhein-westfalen": "NW",
  rp: "RP",
  "rheinland-pfalz": "RP",
  sl: "SL",
  saarland: "SL",
  sn: "SN",
  sachsen: "SN",
  st: "ST",
  "sachsen-anhalt": "ST",
  sh: "SH",
  "schleswig-holstein": "SH",
  th: "TH",
  thüringen: "TH",
  thueringen: "TH",
};

function stableHash(input: string): number {
  // tiny deterministic hash (good enough for stable shuffle)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleStable<T>(arr: T[], seedKey: string): T[] {
  const seed = stableHash(seedKey);
  const rand = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeRegion(country?: string, region?: string): string | undefined {
  const cc = (country || "").trim().toUpperCase();
  if (!region) return undefined;
  const raw = region.trim();
  if (!raw) return undefined;

  const upper = raw.toUpperCase();
  if (upper.includes("-")) {
    const parts = upper.split("-");
    if (parts.length === 2 && parts[0].length === 2 && parts[1].length >= 2) {
      return parts[1];
    }
  }

  if (cc === "DE") {
    const key = raw.trim().toLowerCase();
    return DE_REGION_ALIAS[key] || upper;
  }

  return upper;
}

export function selectExamples(params: {
  bucket: Bucket;
  country?: string;
  region?: string;
  neighbors?: string[];
  limit: number;
  seedKey: string; // e.g. `${country}-${region}-${YYYYMMDD}`
}): ExampleItem[] {
  const { bucket, country, region, neighbors = [], limit, seedKey } = params;

  const all = SEED_EXAMPLES;

  let pool: ExampleItem[] = [];

  if (bucket === "WORLD") {
    pool = all.filter((x) => x.scope === "WORLD");
  } else if (bucket === "EU") {
    pool = all.filter((x) => x.scope === "EU");
  } else if (bucket === "HOME_COUNTRY") {
    pool = all.filter((x) => x.scope === "COUNTRY" && x.country === country);
  } else if (bucket === "HOME_REGION") {
    const wantedRegion = normalizeRegion(country, region);
    pool = all.filter(
      (x) =>
        x.scope === "REGION" &&
        x.country === country &&
        normalizeRegion(country, x.region) === wantedRegion,
    );
    // fallback: keep regional surface (crest + regional framing) before country fallback
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "REGION" && x.country === country);
    }
    // last fallback: home country
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "COUNTRY" && x.country === country);
    }
  } else if (bucket === "HOME_LOCAL") {
    pool = all.filter((x) => x.scope === "REGION" && x.country === country);
    if (region) {
      const wantedRegion = normalizeRegion(country, region);
      pool = pool.filter((x) => normalizeRegion(country, x.region) === wantedRegion);
    }
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "REGION" && x.country === country);
    }
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "COUNTRY" && x.country === country);
    }
  } else if (bucket === "NEIGHBORS") {
    pool = all.filter((x) => x.scope === "COUNTRY" && x.country && neighbors.includes(x.country));
    // fallback: if we have nothing, use EU then WORLD
    if (pool.length === 0) pool = all.filter((x) => x.scope === "EU");
    if (pool.length === 0) pool = all.filter((x) => x.scope === "WORLD");
  }

  // Ensure we can fill: tile by repeating pool
  const shuffled = shuffleStable(pool, `${bucket}:${seedKey}`);
  if (shuffled.length === 0) return [];

  const out: ExampleItem[] = [];
  while (out.length < limit) {
    out.push(...shuffled);
  }
  return out.slice(0, limit);
}
