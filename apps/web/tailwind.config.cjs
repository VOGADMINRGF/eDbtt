import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",                       // App selbst
    "../../features/**/*.{ts,tsx}",              // eure Features
    "../../packages/ui/src/**/*.{ts,tsx}",       // UI-Paket (Header/Footer etc.)
  ],
  theme: {
    extend: {
      colors: {
        brand: { from: "#00E6D1", to: "#2196F3" },
      },
      borderRadius: { '2xl': '1rem' }
    },
  },
  plugins: [],
} satisfies Config;
