import { API, FileInfo, JSCodeshift } from "jscodeshift";

const IMPORT_SRC = "@/lib/http/typedCookies";
const IMPORTS = ["getCookie", "getHeader"];

function ensureImport(j: JSCodeshift, root: any) {
  const existing = root.find(j.ImportDeclaration, { source: { value: IMPORT_SRC } });
  if (existing.size() > 0) {
    existing.forEach((p: any) => {
      const node = p.value;
      const names = new Set(node.specifiers?.map((s: any) => (s as any).imported?.name));
      IMPORTS.forEach((name) => {
        if (!names.has(name)) node.specifiers!.push(j.importSpecifier(j.identifier(name)));
      });
    });
    return;
  }
  const newImport = j.importDeclaration(
    IMPORTS.map((n) => j.importSpecifier(j.identifier(n))),
    j.literal(IMPORT_SRC)
  );
  root.get().value.program.body.unshift(newImport);
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const cookiesCalls = root.find(j.CallExpression, {
    callee: { type: "MemberExpression", object: { type: "CallExpression", callee: { name: "cookies" } }, property: { name: "get" } },
  });

  const headersCalls = root.find(j.CallExpression, {
    callee: { type: "MemberExpression", object: { type: "CallExpression", callee: { name: "headers" } }, property: { name: "get" } },
  });

  if (cookiesCalls.size() === 0 && headersCalls.size() === 0) return file.source;

  cookiesCalls.replaceWith((p) => {
    const arg = p.value.arguments[0] ?? j.literal("");
    return j.awaitExpression(j.callExpression(j.identifier("getCookie"), [arg]));
  });

  headersCalls.replaceWith((p) => {
    const arg = p.value.arguments[0] ?? j.literal("");
    return j.awaitExpression(j.callExpression(j.identifier("getHeader"), [arg]));
  });

  ensureImport(j, root);

  return root.toSource({ quote: "double", reuseWhitespace: false });
}
