import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    theme: "src/theme.ts",
    "design/badgeColor": "src/design/badgeColor.ts",
    "design/Button": "src/design/Button.tsx",
    "design/Badge": "src/design/Badge.tsx",
    "design/Modal": "src/design/Modal.tsx",
    "layout/Header": "src/layout/Header.tsx",
    "layout/Footer": "src/layout/Footer.tsx"
  },
  outDir: "dist",
  format: ["esm", "cjs"],
  target: "es2020",
  dts: false,                 // .d.ts macht euer "tsc -p tsconfig.build.json"
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
  banner: { js: '"use client";' },
  external: [
    "react",
    "react-dom",
    "next",
    "next/link",
    "next/navigation",
    /^next\//,
    /^@context\//,
    /^react-icons(\/.*)?$/   // ⬅︎ react-icons (und Subpfade) NICHT bundlen
  ],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".js" : ".mjs" })
});
