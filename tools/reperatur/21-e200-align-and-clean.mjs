// tools/reperatur/21-e200-align-and-clean.mjs
import fs from "fs";
import path from "path";
import { Project, SyntaxKind } from "ts-morph";

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");
const tsconfigWeb = path.join(webDir, "tsconfig.json");
const nextConfigTs = path.join(webDir, "next.config.ts");
const pkgRoot = path.join(repo, "package.json");

// ---------- A) apps/web/tsconfig.json: lokale @features-Overrides entfernen ----------
(function patchTsconfigWeb() {
  const json = JSON.parse(fs.readFileSync(tsconfigWeb, "utf8"));
  json.compilerOptions ||= {};
  json.compilerOptions.paths ||= {};

  // Entferne lokale Fehl-Overrides (wir wollen Root-Aliasse nutzen)
  delete json.compilerOptions.paths["@features"];
  delete json.compilerOptions.paths["@features/*"];

  // @core/* NICHT überschreiben – Root-Paths sind korrekt
  // @models/*, @ui/* lokal ok → unverändert lassen

  fs.writeFileSync(tsconfigWeb, JSON.stringify(json, null, 2));
  console.log("✓ tsconfig(web): @features-Overrides entfernt (nutzt jetzt Root-Aliasse)");
})();

// ---------- B) apps/web/next.config.ts: echte Webpack-Aliasse und transpilePackages ----------
(function patchNextConfig() {
  if (!fs.existsSync(nextConfigTs)) {
    console.warn("! next.config.ts fehlt – bitte anlegen, sonst kann Next die Aliasse nicht bundlen");
    return;
  }
  let s = fs.readFileSync(nextConfigTs, "utf8");

  const ensureTranspile = (src) => {
    if (/transpilePackages:\s*\[/.test(src)) return src.replace(
      /transpilePackages:\s*\[([^\]]*)\]/,
      (m, inner) => m.includes("@vog/ui") && m.includes("@vog/core") && m.includes("@vog/features")
        ? m
        : `transpilePackages: [${inner}${inner.trim() ? "," : ""} "@vog/ui", "@vog/core", "@vog/features"]`
    );
    // transpilePackages fehlt → hinzufügen
    return src.replace(
      /export default nextConfig;?/,
      `nextConfig.transpilePackages = ["@vog/ui","@vog/core","@vog/features"];\n\nexport default nextConfig;`
    );
  };

  const ensureWebpack = (src) => {
    if (/webpack\s*:\s*\(/.test(src)) {
      // Aliasse in bestehendem webpack() einhängen
      src = src.replace(/webpack\s*:\s*\(([^)]*)\)\s*=>\s*\{/, (m, params) => {
        return `webpack: (${params}) => {\n    const path = require("path");\n    config.resolve.alias ||= {};\n    const r = (p) => path.resolve(__dirname, p);\n    // ROOT-Aliasse auf echte Ordner\n    config.resolve.alias["@features"] = r("../../features");\n    config.resolve.alias["@core"] = r("../../core");\n`;
      });
      return src;
    }
    // webpack fehlt → hinzufügen
    return src.replace(
      /const nextConfig\s*=\s*\{([\s\S]*?)\};\s*export default nextConfig;?/,
      (m, inner) => `const nextConfig = {\n${inner}\n,webpack: (config) => {\n  const path = require("path");\n  config.resolve.alias ||= {};\n  const r = (p) => path.resolve(__dirname, p);\n  config.resolve.alias["@features"] = r("../../features");\n  config.resolve.alias["@core"] = r("../../core");\n  return config;\n}\n};\nexport default nextConfig;`
    );
  };

  s = ensureTranspile(s);
  s = ensureWebpack(s);
  fs.writeFileSync(nextConfigTs, s, "utf8");
  console.log("✓ next.config.ts: Aliasse & transpilePackages gesetzt");
})();

// ---------- C) Root package.json: E200-Gate ergänzen ----------
(function patchRootPackage() {
  const pkg = JSON.parse(fs.readFileSync(pkgRoot, "utf8"));
  pkg.scripts ||= {};
  pkg.scripts.typecheck = 'pnpm -w exec tsc --noEmit -p apps/web/tsconfig.json';
  pkg.scripts.lint = 'pnpm -w dlx eslint "apps/web/src/**/*.{ts,tsx}" --max-warnings=0';
  pkg.scripts.e200 = "pnpm run typecheck && pnpm run lint";
  fs.writeFileSync(pkgRoot, JSON.stringify(pkg, null, 2));
  console.log("✓ package.json(root): scripts {typecheck,lint,e200} gesetzt");
})();

// ---------- D) Code-Cleanup ohne _Option: ungenutzte Importe/Variablen entfernen ----------
(function removeUnusedWithTsMorph() {
  const project = new Project({
    tsConfigFilePath: tsconfigWeb
  });
  const globs = ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"];
  const files = project.addSourceFilesAtPaths(globs);

  let removed = 0;

  for (const sf of files) {
    // 1) ungenutzte Imports löschen
    const imports = sf.getImportDeclarations();
    for (const imp of imports) {
      const named = imp.getNamedImports();
      const defaultImp = imp.getDefaultImport();
      const namespaceImp = imp.getNamespaceImport();

      // Prüfe jede Import-Bindung
      let keep = false;
      if (defaultImp) {
        if (sf.getDescendantsOfKind(SyntaxKind.Identifier).some(id => id.getText() === defaultImp.getText())) keep = true;
      }
      if (namespaceImp) {
        if (sf.getDescendantsOfKind(SyntaxKind.Identifier).some(id => id.getText() === namespaceImp.getText())) keep = true;
      }
      const keepNamed = [];
      for (const ni of named) {
        const name = ni.getName();
        const used = sf.getDescendantsOfKind(SyntaxKind.Identifier).some(id => id.getText() === name);
        if (used) keepNamed.push(ni);
      }
      if (!defaultImp && !namespaceImp && keepNamed.length === 0) {
        imp.remove();
        removed++;
        continue;
      }
      if (keepNamed.length !== named.length) {
        // Entferne ungenutzte NamedImports
        for (const ni of named) {
          if (!keepNamed.includes(ni)) ni.remove();
        }
        removed++;
      }
    }

    // 2) file-scope const/let/var, die nicht referenziert sind → entfernen
    for (const vd of sf.getVariableDeclarations()) {
      const name = vd.getName();
      // Exportierte nicht anfassen
      if (vd.getVariableStatement()?.isExported()) continue;
      const refs = vd.findReferencesAsNodes();
      const refsInFile = refs.filter(r => r.getSourceFile() === sf);
      // 1 Referenz = Definition selbst → ungenutzt
      if (refsInFile.length <= 1) {
        vd.getVariableStatement()?.remove();
        removed++;
      }
    }

    // 3) Funktionsparameter "props" bei React-Komponenten entfernen, wenn ungenutzt
    for (const fn of sf.getFunctions()) {
      const params = fn.getParameters();
      if (params.length) {
        params.forEach(p => {
          const name = p.getName();
          const refs = p.findReferencesAsNodes().filter(r => r.getSourceFile() === sf);
          if (refs.length <= 1 && name === "props") {
            p.remove();
            removed++;
          }
        });
      }
    }
    for (const v of sf.getVariableDeclarations()) {
      // Arrow Functions mit props-Param
      const init = v.getInitializer();
      if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
        const fn = init;
        const params = fn.getParameters?.() ?? [];
        params.forEach(p => {
          const name = p.getName();
          const refs = p.findReferencesAsNodes().filter(r => r.getSourceFile() === sf);
          if (refs.length <= 1 && name === "props") {
            p.remove();
            removed++;
          }
        });
      }
    }
  }

  project.saveSync();
  console.log(`✓ Code-Cleanup: ${removed} ungenutzte Importe/Bindings entfernt (ohne _Option)`);
})();
