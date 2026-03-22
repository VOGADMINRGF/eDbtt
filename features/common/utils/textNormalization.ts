const UMLAUT_MAP: Record<string, string> = {
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

function normalizeUmlauts(value: string): string {
  return value.replace(/[ÄÖÜäöüß]/g, (char) => UMLAUT_MAP[char] ?? char);
}

export function normalizeGermanAscii(value: string): string {
  return normalizeUmlauts(String(value || ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeGermanSearchText(value: string): string {
  return normalizeGermanAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeGermanSlug(
  value: string,
  options?: {
    maxLength?: number;
    fallback?: string;
    separator?: "-" | "_";
  },
): string {
  const separator = options?.separator ?? "-";
  const maxLength = Math.max(1, Math.floor(options?.maxLength ?? 64));
  const fallback = String(options?.fallback ?? "");

  const slug = normalizeGermanAscii(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}+`, "g"), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, "g"), "")
    .slice(0, maxLength);

  return slug || fallback;
}
