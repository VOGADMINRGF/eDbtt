import fs from "fs";
import path from "path";

const repo = process.cwd();
const web = path.join(repo, "apps", "web");

// helper
const rd = p => fs.readFileSync(p, "utf8");
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log("✓ write", path.relative(repo, p)); };
const ex = p => fs.existsSync(p);

// 1) useRouteGuardClient.ts — komplett auf saubere Wrapper-Variante setzen
{
  const p = path.join(web, "src", "hooks", "useRouteGuardClient.ts");
  if (ex(p)) {
    const s = `import useRouteGuard from "@features/auth/hooks/useRouteGuard";

// Fallback-Typen (bis die echten in @features stabil sind)
export type AccessRule = any;
export type UserLike = any;

export const DEFAULT_RULES: AccessRule[] = [];

type Options = {
  user?: UserLike;
  rules?: AccessRule[];
};

export default function useRouteGuardClient(opts: Options = {}) {
  return (useRouteGuard as any)(opts);
}
`;
    wr(p, s);
  } else {
    console.error("not found:", p);
  }
}

// 2) aiProviders.ts — Typen in Aufrufen -> Casts; falsch eingestreute "meta: any" etc. entfernen
{
  const p = path.join(web, "src", "utils", "aiProviders.ts");
  if (ex(p)) {
    let s = rd(p);

    // Aufruf-Parameter: "foo(bar: any, baz: any)" -> "foo(bar as any, baz as any)"
    s = s.replace(/extractMetadata\(\s*input\s*:\s*any\s*,\s*userContext\s*:\s*any\s*\)/g,
                  "extractMetadata(input as any, userContext as any)");

    // Objektliteral in Aufrufen: "{ gptData, ariData, meta }: any" -> "{ gptData, ariData, meta } as any"
    s = s.replace(/runContextualization\(\s*\{\s*gptData\s*,\s*ariData\s*,\s*meta\s*\}\s*:\s*any\s*\)/g,
                  "runContextualization({ gptData, ariData, meta } as any)");
    s = s.replace(/runMetaLayer\(\s*\{\s*gptData\s*,\s*ariData\s*,\s*meta\s*\}\s*:\s*any\s*\)/g,
                  "runMetaLayer({ gptData, ariData, meta } as any)");

    // Entferne irrtümlich eingefügte Property-Typannotationen in Objekten
    s = s.replace(/\bmeta:\s*any\s*,/g, "meta,");
    s = s.replace(/\bgptData:\s*any\s*,/g, "gptData,");
    s = s.replace(/\bariData:\s*any\s*,/g, "ariData,");
    s = s.replace(/\bmetaResult:\s*any\s*,/g, "metaResult,");
    s = s.replace(/\bcontext:\s*any\s*,/g, "context,");

    // "provenance: meta: any" -> "provenance: (meta as any)"
    s = s.replace(/provenance:\s*meta\s*:\s*any/g, "provenance: (meta as any)");

    wr(p, s);
  } else {
    console.error("not found:", p);
  }
}

console.log("→ Jetzt: pnpm run e200");
