// features/factcheck/trust/registry.ts
export const DOMAIN_BASE_TRUST: Record<string, number> = {
    "who.int": 0.95,
    "ec.europa.eu": 0.9,
    "bundestag.de": 0.9,
    "reuters.com": 0.82,
    "nytimes.com": 0.78,
    // default → 0.6
  };
  
  export function baseTrust(domain: string): number {
    const d = domain.toLowerCase();
    return DOMAIN_BASE_TRUST[d] ?? 0.6;
  }
  