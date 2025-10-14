import badgeColors, { type BadgeTone, type BadgeColor } from "./badgeColors";

// Helper, der aus der Map liest
export function getBadgeColor(tone: BadgeTone = "neutral"): BadgeColor {
  return badgeColors[tone] ?? badgeColors.neutral;
}

export type { BadgeTone, BadgeColor };
export { badgeColors };          // optionaler Re-Export der Map
export default getBadgeColor;     // default ist die Funktion
