// Farbtypen
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

export interface BadgeColor {
  bg: string;
  text: string;
  ring: string;
}

// zentrale Palette
export const badgeColors: Record<BadgeTone, BadgeColor> = {
  neutral: { bg: "bg-gray-100", text: "text-gray-800", ring: "ring-gray-200" },
  brand:   { bg: "bg-brand/10", text: "text-brand-600", ring: "ring-brand-200" },
  success: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  warning: { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-200" },
  danger:  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
};

export default badgeColors;
