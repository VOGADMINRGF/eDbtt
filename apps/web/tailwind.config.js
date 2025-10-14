// apps/web/tailwind.config.js  (CommonJS)

const path = require("path");

// 1) Lade das UI-Theme stabil per RELATIVEM Pfad
//    (umgehst Paket-Resolution-Probleme wie "Cannot find module 'ui/theme.cjs'")
const uiTheme = require(path.resolve(__dirname, "../../packages/ui/theme.cjs.js"));
const { colors: uiColors = {} } = uiTheme;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // UI-Package scannen (Komponenten/Utilities dort)
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    // Falls du Shared-Features importierst:
    "../../features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 2) UI-Colors + deine Zusatzfarben MERGEN (statt zu überschreiben)
      colors: {
        ...uiColors,
        coral: "#FF6F61",
        turquoise: "#00B3A6",
        indigo: "#4B0082",
      },
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
