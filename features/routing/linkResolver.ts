// features/routing/linkResolver.ts
export function appHref(kind: "stream"|"report"|"statement", slugOrId: string) {
    switch (kind) {
      case "stream":    return { pathname: "/streams/[slug]", query: { slug: slugOrId } };
      case "report":    return { pathname: "/reports/[id]",  query: { id: slugOrId } };
      case "statement": return { pathname: "/s/[id]",        query: { id: slugOrId } };
    }
  }
  