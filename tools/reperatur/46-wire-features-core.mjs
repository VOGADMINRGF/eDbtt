import fs from "fs";
import path from "path";

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");
const tsconfigPath = path.join(webDir, "tsconfig.json");
const nextConfigPath = path.join(webDir, "next.config.ts");
const webUiDir = path.join(webDir, "src", "ui");
const webUiTheme = path.join(webUiDir, "theme.ts");

// tsconfig paths → echte Monorepo-Pfade
(function patchTsconfig(){
  const raw = fs.readFileSync(tsconfigPath, "utf8");
  const json = JSON.parse(raw);
  json.compilerOptions ||= {};
  json.compilerOptions.baseUrl ||= ".";
  json.compilerOptions.paths ||= {};

  json.compilerOptions.paths["@/*"] = ["src/*"];
  json.compilerOptions.paths["@lib/*"] = ["src/lib/*"];
  json.compilerOptions.paths["@features/*"] = ["../../features/*"];
  json.compilerOptions.paths["@core/*"] = ["../../core/*"];
  json.compilerOptions.paths["@ui/*"] = ["../../features/ui/src/*"];

  fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log("✓ tsconfig paths verdrahtet (@features, @core, @ui)");
})();

// next.config.ts → Webpack-Aliasse + externalDir
(function patchNext(){
  const tpl = `import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@features": path.resolve(__dirname, "../../features"),
      "@core": path.resolve(__dirname, "../../core"),
      "@ui": path.resolve(__dirname, "../../features/ui/src"),
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
  console.log("✓ next.config.ts gesetzt (backup angelegt, falls vorhanden)");
})();

// evtl. früheren Stub entfernen (keine Platzhalter)
(function dropStub(){
  if (fs.existsSync(webUiTheme)) {
    try { fs.rmSync(webUiTheme, { force: true }); } catch {}
    try { fs.rmdirSync(webUiDir); } catch {}
    console.log("✓ apps/web/src/ui/theme.ts entfernt (nutze @ui aus features/ui/src)");
  }
})();
