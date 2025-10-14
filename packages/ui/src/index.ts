export { default as Header } from "./layout/Header";
export { default as Footer } from "./layout/Footer";
export { default as Button } from "./design/Button";
export { default as Badge } from "./design/Badge";
export { default as Modal } from "./design/Modal";

// KORREKT: named + default Re-Exports
export { default as getBadgeColor, getBadgeColor as badgeColor } from "./design/badgeColor";
export { badgeColors } from "./design/badgeColor";
export type { BadgeTone, BadgeColor } from "./design/badgeColor";
