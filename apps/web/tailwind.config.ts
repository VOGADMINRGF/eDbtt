import type { Config } from "tailwindcss";
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../features/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: { brand: { from: "#00E6D1", to: "#2196F3" } },
      borderRadius: { "2xl": "1rem" },
    },
  },
} satisfies Config;
