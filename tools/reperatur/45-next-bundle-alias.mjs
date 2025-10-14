import fs from "fs";
import path from "path";

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");
const tsconfigPath = path.join(webDir, "tsconfig.json");
const nextConfigPath = path.join(webDir, "next.config.ts");
const themePath = path.join(webDir, "src", "ui", "theme.ts");

// --- tsconfig.json: paths ergänzen ---
function patchTsconfig() {
  if (!fs.existsSync(tsconfigPath)) {
    console.error("❌ tsconfig.json not found:", tsconfigPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(tsconfigPath, "utf8");
  let json;
  try { json = JSON.parse(raw); } catch {
    console.error("❌ tsconfig.json is not valid JSON");
    process.exit(1);
  }
  json.compilerOptions ||= {};
  json.compilerOptions.baseUrl ||= ".";
  json.compilerOptions.paths ||= {};

  const paths = json.compilerOptions.paths;
  // keep existing, just ensure these:
  paths["@/*"] ||= ["src/*"];
  paths["@lib/*"] ||= ["src/lib/*"];
  paths["@ui/*"] ||= ["src/ui/*"];
  paths["@core/*"] ||= ["src/core/*"]; // optional, harmless wenn Ordner fehlt

  fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log("✓ patched tsconfig paths");
}

// --- next.config.ts: Aliases + externalDir ---
function patchNextConfig() {
  const tpl = `import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  // Ergänze Pakete hier, wenn du mal ein Workspace-Package (node_modules-Namespace) transpilen willst:
  // transpilePackages: ["@vog/features"],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@ui": path.resolve(__dirname, "src/ui"),
      "@core": path.resolve(__dirname, "src/core"),
    };
    return config;
  },
};

export default nextConfig;
`;

  if (!fs.existsSync(nextConfigPath)) {
    fs.writeFileSync(nextConfigPath, tpl, "utf8");
    console.log("✓ wrote next.config.ts (new)");
    return;
  }

  // naive Merge: wenn schon aliases drin sind, wir ersetzen die Datei komplett (einfach & sicher)
  const backup = fs.readFileSync(nextConfigPath, "utf8");
  fs.writeFileSync(nextConfigPath + ".bak", backup, "utf8");
  fs.writeFileSync(nextConfigPath, tpl, "utf8");
  console.log("✓ next.config.ts replaced (backup created: next.config.ts.bak)");
}

// --- theme stub (falls fehlt) ---
function ensureThemeStub() {
  if (fs.existsSync(themePath)) {
    console.log("• theme.ts exists");
    return;
  }
  const dir = path.dirname(themePath);
  fs.mkdirSync(dir, { recursive: true });
  const stub = `// apps/web/src/ui/theme.ts (stub)
// Falls ihr ein zentrales Designsystem habt, kann das hier re-exportiert werden.
// Dieser Stub deckt die häufigsten Zugriffe ab, bis das echte Theme geliefert wird.

export const colors = {
  primary: "#0ea5e9",
  secondary: "#64748b",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#0f172a",
  muted: "#6b7280",
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24,
};

export const radii = { sm: 6, md: 12, lg: 16 };

export const theme = { colors, spacing, radii };
export default theme;
`;
  fs.writeFileSync(themePath, stub, "utf8");
  console.log("✓ created stub: src/ui/theme.ts");
}

patchTsconfig();
patchNextConfig();
ensureThemeStub();
console.log("→ Done. Now run: pnpm run build:web");
