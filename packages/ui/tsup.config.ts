// packages/ui/tsup.config.ts
import { defineConfig } from "tsup";
export default defineConfig({
  entry: {
    index: "src/index.ts",
    theme: "src/theme.ts",
    "design/badgeColor": "src/design/badgeColor.ts",
    "design/Button": "src/design/Button.tsx",
    "design/Badge": "src/design/Badge.tsx",
    "design/Modal": "src/design/Modal.tsx",
    "design/ModalConfirm": "src/design/ModalConfirm.tsx",
    "design/Spinner": "src/design/Spinner.tsx",
    "design/Toast": "src/design/Toast.tsx",
    "design/LoadingOverlay": "src/design/LoadingOverlay.tsx",
    "design/Card": "src/design/Card.tsx",
    "design/Input": "src/design/Input.tsx",
    "design/Separator": "src/design/Separator.tsx",
    "design/Avatar": "src/design/Avatar.tsx",
    "design/AvatarImage": "src/design/AvatarImage.tsx",
    "design/AvatarFallback": "src/design/AvatarFallback.tsx",
    "layout/Header": "src/layout/Header.tsx",
    "layout/Footer": "src/layout/Footer.tsx"
  },
  outDir: "dist",
  format: ["esm", "cjs"],
  target: "es2020",
  dts: false,
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
  banner: { js: '"use client";' },
  external: ["react", "react-dom", "next", /^next\//, /^react-icons(\/.*)?$/],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".js" : ".mjs" })
});
