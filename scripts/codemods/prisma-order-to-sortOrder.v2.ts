import { API, FileInfo, JSCodeshift, ObjectExpression, Property } from "jscodeshift";

/**
 * Prisma rename:
 * - orderBy: { order: 'asc'|'desc' }         -> { sortOrder: 'asc'|'desc' }
 * - orderBy: [{ order: 'asc' }]              -> [{ sortOrder: 'asc' }]
 * - in AnswerOption/answerOptions Mutationen (create/update/createMany/updateMany/upsert):
 *     order: <expr>                          -> sortOrder: <expr>
 * - verschachtelte answerOptions: { create: [...] }, { data: [...] } etc.
 */

function isPropKey(p: any, name: string) {
  if (p.type !== "Property") return false;
  if (p.key.type === "Identifier") return p.key.name === name;
  if (p.key.type === "Literal") return String(p.key.value) === name;
  return false;
}

function renameKey(obj: ObjectExpression, from: string, to: string) {
  obj.properties.forEach((p) => {
    if (p.type !== "Property") return;
    if (p.key.type === "Identifier" && p.key.name === from) p.key.name = to;
    else if (p.key.type === "Literal" && String(p.key.value) === from) p.key = { type: "Identifier", name: to } as any;
  });
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // 1) orderBy: { order: 'asc' } -> sortOrder
  root.find(j.ObjectExpression).forEach(path => {
    const obj = path.value;
    const orderByProp = obj.properties.find((p) => isPropKey(p, "orderBy")) as Property | undefined;
    if (!orderByProp) return;

    const v = orderByProp.value;
    // a) Objekt-Form
    if (v.type === "ObjectExpression") {
      const hasOrder = v.properties.some((p) => isPropKey(p, "order"));
      if (hasOrder) {
        renameKey(v, "order", "sortOrder");
        changed = true;
      }
    }
    // b) Array-Form
    if (v.type === "ArrayExpression") {
      v.elements?.forEach((el) => {
        if (el && el.type === "ObjectExpression") {
          const hasOrder = el.properties.some((p) => isPropKey(p, "order"));
          if (hasOrder) {
            renameKey(el, "order", "sortOrder");
            changed = true;
          }
        }
      });
    }
  });

  // 2) Direkt-Aufrufe auf answerOption.* Mutations
  const isAnswerOptionMember = (m: any) =>
    m &&
    m.type === "MemberExpression" &&
    ((m.property.type === "Identifier" && m.property.name === "answerOption") ||
      (m.property.type === "Literal" && m.property.value === "answerOption"));

  const isMutation = (prop: any) =>
    prop?.type === "Identifier" &&
    ["create", "update", "upsert", "createMany", "updateMany"].includes(prop.name);

  root.find(j.CallExpression).forEach((p) => {
    const callee = p.value.callee;
    if (callee.type !== "MemberExpression") return;

    // prisma.answerOption.create(...), tx.answerOption.update(...)
    if (isMutation(callee.property) && callee.object?.type === "MemberExpression" && isAnswerOptionMember(callee.object)) {
      const [arg] = p.value.arguments;
      if (!arg || arg.type !== "ObjectExpression") return;

      const dataProp = arg.properties.find((pp) => isPropKey(pp, "data")) as Property | undefined;
      if (dataProp && dataProp.value.type === "ObjectExpression") {
        // Rename in data (flach + verschachtelt)
        j(dataProp.value)
          .find(j.ObjectExpression)
          .forEach((oo) => {
            const hasOrder = oo.value.properties.some((qq) => isPropKey(qq, "order"));
            if (hasOrder) {
              renameKey(oo.value, "order", "sortOrder");
              changed = true;
            }
          });
      }
    }
  });

  // 3) Verschachtelte answerOptions in contentItem.update({ data: { answerOptions: { create: [...] }}})
  root.find(j.ObjectExpression).forEach((path2) => {
    const obj = path2.value;
    const ans = obj.properties.find((p) => isPropKey(p, "answerOptions")) as Property | undefined;
    if (!ans || ans.value.type !== "ObjectExpression") return;

    ans.value.properties.forEach((sub) => {
      if (sub.type !== "Property") return;
      const key =
        sub.key.type === "Identifier" ? sub.key.name : sub.key.type === "Literal" ? String(sub.key.value) : "";
      if (!["create", "createMany", "update", "updateMany", "upsert"].includes(key)) return;

      const v = sub.value;
      const touchObj = (oo: ObjectExpression) => {
        const hasOrder = oo.properties.some((pp) => isPropKey(pp, "order"));
        if (hasOrder) {
          renameKey(oo, "order", "sortOrder");
          changed = true;
        }
      };

      if (v.type === "ArrayExpression") {
        v.elements?.forEach((el) => el && el.type === "ObjectExpression" && touchObj(el));
      } else if (v.type === "ObjectExpression") {
        touchObj(v);
        const dataChild = v.properties.find((pp) => isPropKey(pp, "data")) as Property | undefined;
        if (dataChild && dataChild.value.type === "ArrayExpression") {
          dataChild.value.elements?.forEach((el) => el && el.type === "ObjectExpression" && touchObj(el));
        } else if (dataChild && dataChild.value.type === "ObjectExpression") {
          touchObj(dataChild.value);
        }
      }
    });
  });

  return changed ? root.toSource({ quote: "double" }) : file.source;
}
