// features/factcheck/trust/score.ts
import type { Evidence } from "../types";
import { baseTrust } from "./registry";

function recencyBoost(iso?: string) {
  if (!iso) return 1;
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days < 30) return 1.05;
  if (days < 180) return 1.02;
  if (days > 1460) return 0.95; // >4y
  return 1.0;
}

function diversityBoost(domains: string[]) {
  const uniq = new Set(domains.map(d => d.toLowerCase())).size;
  return Math.min(1.0 + uniq * 0.02, 1.12);
}

export function computeTrustScore(evidences: Evidence[]): number {
  if (!evidences.length) return 0;
  const per = evidences.map(ev => {
    const base = ev.trustHint ?? baseTrust(ev.source.domain);
    return base * recencyBoost(ev.source.publishedAt);
  });
  const avg = per.reduce((a, b) => a + b, 0) / per.length;
  const div = diversityBoost(evidences.map(e => e.source.domain));
  return Math.max(0, Math.min(1, avg * div));
}
