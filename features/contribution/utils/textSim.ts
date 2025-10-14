// simple normalized Levenshtein ratio (oder nutze z. B. string-similarity)
export function similarity(a: string, b: string) {
    if (!a || !b) return 0;
    const la = a.length, lb = b.length;
    const max = Math.max(la, lb);
    // Quick heuristic: Jaccard auf Wort-Set
    const sa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
    const sb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
    const inter = [...sa].filter(x => sb.has(x)).length;
    const union = new Set([...sa, ...sb]).size;
    return union ? inter / union : 0;
  }
  