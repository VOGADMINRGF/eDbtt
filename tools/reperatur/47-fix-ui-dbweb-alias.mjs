import fs from "fs";
import path from "path";

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");
const tsconfigPath = path.join(webDir, "tsconfig.json");
const nextConfigPath = path.join(webDir, "next.config.ts");
const webUiTheme = path.join(webDir, "src", "ui", "theme.ts");

// ---- tsconfig.json: Pfade setzen ----
(function patchTsconfig(){
  const raw = fs.readFileSync(tsconfigPath, "utf8");
  const json = JSON.parse(raw);
  json.compilerOptions ||= {};
  json.compilerOptions.baseUrl ||= ".";
  json.compilerOptions.paths ||= {};

  const p = json.compilerOptions.paths;
  p["@/*"]        = ["src/*"];
  p["@lib/*"]     = ["src/lib/*"];
  p["@features/*"]= ["../../features/*"];
  p["@core/*"]    = ["../../core/*"];

  // UI: auf echtes features/ui zeigen
  p["@ui/*"]      = ["../../features/ui/*"];
  // bare import "@ui" → index.ts
  p["@ui"]        = ["../../features/ui/index.ts"];

  // Prisma Web-Client (packages/db-web)
  p["@db-web"]    = ["../../packages/db-web/src"];

  fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log("✓ tsconfig paths: @ui, @ui/*, @db-web gesetzt");
})();

// ---- next.config.ts: Aliasse + externalDir ----
(function patchNext(){
  const tpl = `import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@":        path.resolve(__dirname, "src"),
      "@lib":     path.resolve(__dirname, "src/lib"),
      "@features":path.resolve(__dirname, "../../features"),
      "@core":    path.resolve(__dirname, "../../core"),

      // UI: Ordner + exakter Index-Match für bare "@ui"
      "@ui":      path.resolve(__dirname, "../../features/ui"),
      "@ui$":     path.resolve(__dirname, "../../features/ui/index.ts"),

      // Prisma Web-Client
      "@db-web":  path.resolve(__dirname, "../../packages/db-web/src"),
    };
    return config;
  },
};

export default nextConfig;
`;
  if (fs.existsSync(nextConfigPath)) {
    fs.writeFileSync(nextConfigPath + ".bak", fs.readFileSync(nextConfigPath, "utf8"));
  }
  fs.writeFileSync(nextConfigPath, tpl, "utf8");
  console.log("✓ next.config.ts: Aliasse @ui / @ui$ / @db-web gesetzt");
})();

// ---- alten Web-Stub entfernen, falls vorhanden ----
(function dropStub(){
  if (fs.existsSync(webUiTheme)) {
    try { fs.rmSync(webUiTheme, { force: true }); } catch {}
    console.log("✓ entfernt: apps/web/src/ui/theme.ts (nutze echtes features/ui)");
  }
})();
