import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, fill: _fill, onError: _onError, priority: _priority, ...rest } = props;
    return <img alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: any }) => <>{children}</>,
  motion: {
    div: (props: Record<string, unknown>) => {
      const {
        animate: _animate,
        children,
        exit: _exit,
        initial: _initial,
        onAnimationComplete: _onAnimationComplete,
        transition: _transition,
        variants: _variants,
        ...rest
      } = props;

      return <div {...rest}>{children}</div>;
    },
  },
  useReducedMotion: () => false,
}));

import RundenManualCreatePage from "@/app/runden/new/page";
import AnlassraumOptionEditor from "@/app/runden/new/AnlassraumOptionEditor";
import AnlassraumVisibilitySettings from "@/app/runden/new/AnlassraumVisibilitySettings";

describe("/runden/new manual create contract", () => {
  it("renders the guided manual setup sequence with one prominent Voxy guide and inline markers", () => {
    const html = renderToStaticMarkup(<RundenManualCreatePage />);

    expect(html).toContain("Bereite deinen");
    expect(html).toContain("Anlassraum");
    expect(html).toContain("Schritt für Schritt");
    expect(html).toContain("Schritt 1");
    expect(html).toContain("Rahmen");
    expect(html).toContain("Schritt 2");
    expect(html).toContain("Optionen");
    expect(html).toContain("Schritt 3");
    expect(html).toContain("Sichtbarkeit");
    expect(html).toContain("Schritt 4");
    expect(html).toContain("Unterstützung &amp; Start");
    expect(html).toContain("Ohne KI speichern");
    expect(html).toContain("Mit KI in /create weiter");
    expect(html).toContain("Öffentlich nach Review einreichen");
    expect(html).toContain('data-manual-anlassraum-stepper="true"');

    expect(html).toContain('data-voxy-appearance="panel"');
    expect(html).toContain('data-manual-anlassraum-voxy-step="rahmen"');
    expect(html).toContain('data-manual-anlassraum-voxy-step="optionen"');
    expect(html).toContain('data-manual-anlassraum-voxy-step="sichtbarkeit"');
    expect(html).toContain('data-manual-anlassraum-voxy-step="unterstuetzung"');
    expect((html.match(/data-voxy-guide=/g) ?? []).length).toBe(1);
    expect(html).toContain("Ich führe dich Schritt für Schritt durch den Entwurf.");
    expect(html).toContain("Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.");
    expect(html).toContain("Feste Optionen geben Kontrolle. Community-Vorschläge machen den Raum offener.");
    expect(html).toContain("Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.");
    expect(html).toContain("KI, Graph und Dossier bleiben optional. Nichts startet automatisch.");
    expect(html).toContain("KI, Graph und Dossier bleiben optionale Hilfe. Nichts davon startet automatisch.");
    expect(html).not.toContain("Du bist im Überblick. Quellen und Prüfung findest du im Prüfmodus.");
  });

  it("keeps default UI free of dev jargon", () => {
    const html = renderToStaticMarkup(<RundenManualCreatePage />).toLowerCase();
    const banned = [
      "entitlement",
      "operator",
      "source of truth",
      "handoff",
      "pipeline",
      "provider",
      "runreceipt",
      "auto-attach",
      "silent merge",
      "anlassraum-id",
    ];

    for (const word of banned) {
      expect(html).not.toContain(word);
    }
  });

  it("shows community options and visibility as steerable controlled choices", () => {
    const optionsHtml = renderToStaticMarkup(
      <AnlassraumOptionEditor
        communityOptionsMode="open_unverified"
        configuredOptionCount={2}
        onAddOption={() => undefined}
        onCommunityOptionsModeChange={() => undefined}
        onOptionChange={() => undefined}
        onRemoveOption={() => undefined}
        options={["Option A", "Option B"]}
      />,
    );
    const visibilityHtml = renderToStaticMarkup(
      <AnlassraumVisibilitySettings
        onScopeChange={() => undefined}
        onVisibilityChange={() => undefined}
        scope="organization_internal"
        visibility="public_after_review"
      />,
    );

    expect(optionsHtml).toContain("Community-Vorschläge");
    expect(optionsHtml).toContain("Vorschläge offen sammeln");
    expect(optionsHtml).toContain('aria-pressed="true"');
    expect(visibilityHtml).toContain("Nur intern sichtbar");
    expect(visibilityHtml).toContain("Öffentlich nach Prüfung");
    expect((visibilityHtml.match(/aria-pressed="true"/g) ?? []).length).toBe(2);
  });

  it("keeps new manual create surfaces token-based without dark-only utility classes", () => {
    const sources = [
      "src/app/runden/new/AnlassraumSetupForm.tsx",
      "src/app/runden/new/AnlassraumOptionEditor.tsx",
      "src/app/runden/new/AnlassraumVisibilitySettings.tsx",
      "src/app/runden/new/AnlassraumSupportSettings.tsx",
      "src/app/runden/new/AnlassraumPrePublishCheck.tsx",
      "src/components/voxy/VoxyGuide.tsx",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

    for (const source of sources) {
      expect(source).not.toContain("dark:");
      expect(source).not.toContain("bg-slate-");
      expect(source).not.toContain("text-slate-");
      expect(source).not.toContain("border-slate-");
    }

    expect(sources[0]).toContain("rgb(var(--card))");
    expect(sources[0]).toContain("rgb(var(--bg))");
    expect(sources[0]).toContain("rgb(var(--fg))");
    expect(sources[0]).toContain("rgb(var(--muted))");
    expect(sources[0]).toContain("rgb(var(--border))");
  });

  it("keeps the round start draft status compact and draft-only", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/runden/new/AnlassraumSetupForm.tsx"), "utf8");

    expect(source).toContain("AnlassraumStartDraftPanel");
    expect(source).toContain("Runde aus deinem Entwurf vorbereiten");
    expect(source).toContain("Optionen ergänzen");
    expect(source).toContain("Entwurf verwerfen");
    expect(source).not.toContain("autoPublish");
    expect(source).not.toContain("DeepSearch");
  });
});
