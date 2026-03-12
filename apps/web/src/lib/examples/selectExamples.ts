import { ExampleItem } from "./types";
import { SEED_EXAMPLES } from "./seedExamples";

type Bucket = "WORLD" | "EU" | "NEIGHBORS" | "HOME_COUNTRY" | "HOME_REGION" | "HOME_LOCAL";

const DE_REGION_ALIASES: Record<string, string> = {
  bw: "BW",
  "baden-württemberg": "BW",
  "baden-wuerttemberg": "BW",
  bayern: "BY",
  by: "BY",
  berlin: "BE",
  be: "BE",
  brandenburg: "BB",
  bb: "BB",
  bremen: "HB",
  hb: "HB",
  hamburg: "HH",
  hh: "HH",
  hessen: "HE",
  he: "HE",
  "mecklenburg-vorpommern": "MV",
  mv: "MV",
  niedersachsen: "NI",
  ni: "NI",
  "nordrhein-westfalen": "NW",
  nrw: "NW",
  nw: "NW",
  "rheinland-pfalz": "RP",
  rp: "RP",
  saarland: "SL",
  sl: "SL",
  sachsen: "SN",
  sn: "SN",
  "sachsen-anhalt": "ST",
  st: "ST",
  "schleswig-holstein": "SH",
  sh: "SH",
  "thüringen": "TH",
  "thueringen": "TH",
  th: "TH",
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

function normalizeRegion(country: string | undefined, region: string | undefined) {
  const value = (region ?? "").trim();
  if (!value) return undefined;
  if ((country ?? "").toUpperCase() !== "DE") return value.toUpperCase();
  return DE_REGION_ALIASES[value.toLowerCase()] ?? value.toUpperCase();
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
  const normalizedRegion = normalizeRegion(country, region);

  const all = SEED_EXAMPLES;

  let pool: ExampleItem[] = [];

  if (bucket === "WORLD") {
    pool = all.filter((x) => x.scope === "WORLD");
  } else if (bucket === "EU") {
    pool = all.filter((x) => x.scope === "EU");
  } else if (bucket === "HOME_COUNTRY") {
    pool = all.filter((x) => x.scope === "COUNTRY" && x.country === country);
  } else if (bucket === "HOME_REGION") {
    pool = all.filter(
      (x) =>
        x.scope === "REGION" &&
        x.country === country &&
        normalizeRegion(country, x.region) === normalizedRegion,
    );
    // fallback: keep regional cards if exact region has no seed
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "REGION" && x.country === country);
    }
    // final fallback to country-level cards
    if (pool.length === 0) {
      pool = all.filter((x) => x.scope === "COUNTRY" && x.country === country);
    }
  } else if (bucket === "HOME_LOCAL") {
    pool = all.filter((x) => x.scope === "REGION" && x.country === country);
    if (normalizedRegion) {
      pool = pool.filter((x) => normalizeRegion(country, x.region) === normalizedRegion);
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
