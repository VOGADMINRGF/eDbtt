export const CREATE_PRODUCT_MODE_VALUES = ["analyze", "media", "guided"] as const;
export type CreateProductMode = (typeof CREATE_PRODUCT_MODE_VALUES)[number];

export function parseCreateProductMode(raw: unknown): CreateProductMode | undefined {
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "analyze" || normalized === "analysis") return "analyze";
  if (normalized === "media" || normalized === "bericht" || normalized === "companion") return "media";
  if (normalized === "guided" || normalized === "dossier" || normalized === "guide") return "guided";
  return undefined;
}
