export const colors = {
  coral: "#FF6F61",
  turquoise: "#00B3A6",
  indigo: "#4B0082",
  background: "#ffffff",
  foreground: "#1A1A1A",
  darkBg: "#121212",
  darkFg: "#f2f2f2",
  gray: "#E5E7EB",
  positive: "#0cb13b",
  warning: "#E5B300",
  negative: "#ea3c3c"
} as const;

export const spacing = {
  none: "0px",
  xs: "5px",
  sm: "12px",
  md: "20px",
  lg: "26px",
  xl: "36px",
  "2xl": "48px"
} as const;

export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "16px",
  xl: "28px",
  full: "9999px"
} as const;

export const fontSizes = {
  xs: "0.75rem",
  sm: "0.9rem",
  base: "1rem",
  lg: "1.25rem",
  xl: "1.65rem",
  "2xl": "2.25rem",
  "3xl": "2.8rem"
} as const;

export const fonts = {
  sans: "'Geist Sans', system-ui, sans-serif",
  mono: "'Geist Mono', monospace"
} as const;

export const shadow = {
  card: "0 6px 40px 0 rgba(36,50,93,0.09)",
  button: "0 2px 8px 0 rgba(0,179,166,0.09)"
} as const;

export const zIndex = { modal: 1000, dropdown: 500 } as const;
export const transitions = { default: "all 0.18s cubic-bezier(.4,0,.2,1)" } as const;
export const radius = borderRadius;

export const theme = {
  colors, spacing, borderRadius, radius, fontSizes, fonts, shadow, zIndex, transitions
} as const;
export type Theme = typeof theme;
export default theme;
