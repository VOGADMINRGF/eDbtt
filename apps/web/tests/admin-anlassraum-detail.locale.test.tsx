import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/context/LocaleContext";
import type { SupportedLocale } from "@/config/locales";
import { getOperatorSystemTexts } from "@/features/i18n/operatorSystemTexts";
import AdminAnlassraumDetailPage, {
  type AnlassraumDetailResponse,
} from "@/app/admin/feeds/anlassraum/[id]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "65f000000000000000000111" }),
}));

const LOCALES: SupportedLocale[] = ["de", "en", "es", "fr", "zh"];

const DETAIL_FIXTURE: AnlassraumDetailResponse = {
  ok: true,
  item: {
    id: "65f000000000000000000111",
    title: "Anlassraum Innenstadt",
    status: "draft",
    sourceMode: "manual",
    relevanceScore: 87,
    scope: "regional",
    decisionScope: "regional",
    originType: "public_source",
    ownerType: "editorial",
    topicKey: "verkehr",
    clusterKey: "mobilitaet",
    dossierId: null,
  },
  sources: [{ title: "Amtliche Mitteilung", url: "https://example.org/source/1" }],
  structure: { key: "value" },
  outputs: [],
  publishGate: {
    ok: false,
    reasons: ["missing_primary_sources"],
    sourceCount: 1,
    requiredSourceCount: 2,
    evidence: {},
  },
};

function renderWithLocale(locale: SupportedLocale) {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <AdminAnlassraumDetailPage initialDataForTest={DETAIL_FIXTURE} />
    </LocaleProvider>,
  );
}

function escapeForHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

describe("admin anlassraum detail locale surface", () => {
  it.each(LOCALES)("renders localized loaded-state texts in %s", (locale) => {
    const text = getOperatorSystemTexts(locale).anlassraumDetail;
    const html = renderWithLocale(locale);

    expect(html).toContain("Anlassraum Innenstadt");
    expect(html).toContain(escapeForHtml(text.linkToCreate));
    expect(html).toContain(escapeForHtml(text.linkToDraftQueue));
    expect(html).toContain(escapeForHtml(text.workspaceContext));
    expect(html).toContain(escapeForHtml(text.outputTransitions));
    expect(html).toContain(escapeForHtml(text.colOutputType));
    expect(html).toContain(escapeForHtml(text.actionCurate));
    expect(html).toContain(escapeForHtml(text.originLabel));
  });
});
