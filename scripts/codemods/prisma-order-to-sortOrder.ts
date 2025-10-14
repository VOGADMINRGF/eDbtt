import { API, FileInfo, JSCodeshift, ObjectExpression, Property } from "jscodeshift";

/**
 * Prisma rename codemod:
 * - orderBy: { order: 'asc'|'desc' }        -> orderBy: { sortOrder: 'asc'|'desc' }
 * - *.answerOption.(create|update|createMany|updateMany) data/create[..]:
 *     order: <expr>                          -> sortOrder: <expr>
 * - verschachtelt in contentItem.update({ data: { answerOptions: { create: [...] }}})
 */

function renamePropKey(j: JSCodeshift, obj: ObjectExpression, from: string, to: string) {
  obj.properties.forEach((p) => {
    if (p.type !== "Property") return;
    const key = p.key.type === "Identifier" ? p.key.name : p.key.type === "Literal" ? String(p.key.value) : null;
    if (key === from) {
      p.key = j.identifier(to);
    }
  });
}

function walkObjectRename(j: JSCodeshift, node: any, from: string, to: string) {
  // DFS durch Object/Array und Property-Nodes
  j(node)
    .find(j.ObjectExpression)
    .forEach(path => renamePropKey(j, path.value, from, to));
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // 1) orderBy: { order: 'asc'|'desc' } -> sortOrder
  root.find(j.ObjectExpression).forEach(path => {
    const obj = path.value;
    // Muster: { orderBy: { order: 'asc' } }
    const orderByProp = obj.properties.find(
      p => p.type === "Property" &&
        ((p.key.type === "Identifier" && p.key.name === "orderBy") ||
         (p.key.type === "Literal" && p.key.value === "orderBy"))
    ) as Property | undefined;

    if (!orderByProp) return;
    const val = orderByProp.value;
    if (val.type !== "ObjectExpression") return;

    const inner = val;
    const hasOrderProp = inner.properties.some(p =>
      p.type === "Property" &&
      ((p.key.type === "Identifier" && p.key.name === "order") ||
       (p.key.type === "Literal" && p.key.value === "order"))
    );
    if (hasOrderProp) {
      renamePropKey(j, inner, "order", "sortOrder");
      changed = true;
    }
  });

  // 2) prisma/tx.answerOption.<mutations>( { data: {...} } ) – order -> sortOrder
  const isAnswerOptionMember = (m: any) =>
    m && m.type === "MemberExpression" &&
    ((m.property.type === "Identifier" && m.property.name === "answerOption") ||
     (m.property.type === "Literal" && m.property.value === "answerOption"));

  const isMutationName = (prop: any) =>
    prop && prop.type === "Identifier" &&
    ["create", "update", "upsert", "createMany", "updateMany"].includes(prop.name);

  root.find(j.CallExpression).forEach(path => {
    const callee = path.value.callee;
    if (callee.type !== "MemberExpression") return;

    // Fälle: prisma.answerOption.create(...), tx.answerOption.update(...)
    const obj = callee.object;
    const prop = callee.property;

    let answerOptionHit = false;

    if (isMutationName(prop) && obj && obj.type === "MemberExpression" && isAnswerOptionMember(obj)) {
      answerOptionHit = true;
    }

    // Nested Fälle wie prisma.contentItem.update({ data: { answerOptions: { create: [...] }}})
    // behandeln wir separat weiter unten.
    if (!answerOptionHit) return;

    const [arg] = path.value.arguments;
    if (!arg || arg.type !== "ObjectExpression") return;

    // In data/create/createMany/update/updateMany alle Properties "order" -> "sortOrder"
    const dataProp = arg.properties.find(
      p => p.type === "Property" &&
        ((p.key.type === "Identifier" && p.key.name === "data") ||
         (p.key.type === "Literal" && p.key.value === "data"))
    ) as Property | undefined;

    if (dataProp && dataProp.value.type === "ObjectExpression") {
      walkObjectRename(j, dataProp.value, "order", "sortOrder");
      changed = true;
    }
  });

  // 3) Verschachtelte answerOptions: { data: { answerOptions: { create: [...] } } }
  root.find(j.ObjectExpression).forEach(path => {
    const obj = path.value;

    const answerOptionsProp = obj.properties.find(
      p => p.type === "Property" &&
        ((p.key.type === "Identifier" && p.key.name === "answerOptions") ||
         (p.key.type === "Literal" && p.key.value === "answerOptions"))
    ) as Property | undefined;

    if (!answerOptionsProp) return;

    const val = answerOptionsProp.value;
    if (val.type !== "ObjectExpression") return;

    // In create / createMany Arrays oder Objekt(en) Properties "order" -> "sortOrder" umbenennen
    const subProps = val.properties.filter(p => p.type === "Property") as Property[];
    for (const sp of subProps) {
      const k =
        sp.key.type === "Identifier" ? sp.key.name :
        sp.key.type === "Literal" ? String(sp.key.value) : null;
      if (!k || !["create", "createMany", "update", "updateMany"].includes(k)) continue;

      const v = sp.value;

      if (v.type === "ArrayExpression") {
        v.elements.forEach(el => {
          if (el && el.type === "ObjectExpression") {
            renamePropKey(j, el, "order", "sortOrder");
            changed = true;
          }
        });
      } else if (v.type === "ObjectExpression") {
        // create: { ... } oder createMany: { data: [...] }
        renamePropKey(j, v, "order", "sortOrder");
        // createMany: { data: [ {...} ] }
        const dataChild = v.properties.find(
          p => p.type === "Property" &&
            ((p.key.type === "Identifier" && p.key.name === "data") ||
             (p.key.type === "Literal" && p.key.value === "data"))
        ) as Property | undefined;

        if (dataChild) {
          const dv = dataChild.value;
          if (dv.type === "ArrayExpression") {
            dv.elements.forEach(el => {
              if (el && el.type === "ObjectExpression") {
                renamePropKey(j, el, "order", "sortOrder");
                changed = true;
              }
            });
          } else if (dv.type === "ObjectExpression") {
            renamePropKey(j, dv, "order", "sortOrder");
            changed = true;
          }
        }
      }
    }
  });

  return changed ? root.toSource({ quote: "double" }) : file.source;
}
